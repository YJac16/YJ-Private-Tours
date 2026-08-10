import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { expireStalePendingBookings } from '../booking-app/lib/booking-lifecycle'
import { createYocoCheckout } from '../booking-app/lib/yoco'
import { methodNotAllowed, readJson } from './_lib/http'

/**
 * Payment status (thank-you) + guest payment retry (action=retry).
 * NEVER marks a booking as paid — Yoco webhook is the source of truth.
 */
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

function emailsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

async function handleGuestRetry(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  const body = await readJson(req)
  const bookingId = String(body.booking_id || '')
  const email = String(body.client_email || body.email || '')
  if (!bookingId || !email.trim()) {
    return res
      .status(400)
      .json({ error: 'booking_id and client_email are required' })
  }

  if (useMockStore()) {
    const booking = mockDb.getBooking(bookingId)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (!emailsMatch(booking.client_email || '', email)) {
      return res.status(403).json({ error: 'Email does not match this booking' })
    }
    const result = mockDb.retryPaymentCheckout(bookingId)
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error })
    }
    return res.status(200).json(result)
  }

  const sb = supabaseAdmin()
  await expireStalePendingBookings(sb)

  const { data: fresh, error } = await sb
    .from('bookings')
    .select(
      'id, status, grand_total_cents, final_price_cents, booking_reference, client_name, client_email, tour:tours(name)'
    )
    .eq('id', bookingId)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!fresh) return res.status(404).json({ error: 'Booking not found' })
  if (!emailsMatch(fresh.client_email || '', email)) {
    return res.status(403).json({ error: 'Email does not match this booking' })
  }
  if (fresh.status === 'paid') {
    return res.status(400).json({ error: 'Booking is already paid' })
  }
  if (fresh.status !== 'pending') {
    return res
      .status(400)
      .json({ error: `Cannot retry payment for status ${fresh.status}` })
  }

  const amount =
    Number(fresh.grand_total_cents) || Number(fresh.final_price_cents) || 0
  if (amount < 100) {
    return res
      .status(400)
      .json({ error: 'Booking amount is invalid for checkout' })
  }

  const nestedTour = fresh.tour as
    | { name?: string }
    | { name?: string }[]
    | null
  const tourName = Array.isArray(nestedTour)
    ? nestedTour[0]?.name
    : nestedTour?.name

  const attempt = Date.now()
  const checkout = await createYocoCheckout({
    amountCents: amount,
    bookingId: fresh.id,
    bookingReference: fresh.booking_reference || undefined,
    clientName: fresh.client_name || undefined,
    clientEmail: fresh.client_email || undefined,
    tourName,
    idempotencyKey: `guest-retry-${fresh.id}-${amount}-${attempt}`,
  })

  await sb
    .from('payments')
    .update({ external_id: checkout.id, status: 'pending' })
    .eq('booking_id', fresh.id)
    .eq('status', 'pending')

  const { data: existingPay } = await sb
    .from('payments')
    .select('id')
    .eq('booking_id', fresh.id)
    .limit(1)
    .maybeSingle()
  if (!existingPay) {
    await sb.from('payments').insert({
      booking_id: fresh.id,
      amount_cents: amount,
      currency: 'ZAR',
      status: 'pending',
      external_id: checkout.id,
    })
  }

  await sb
    .from('bookings')
    .update({
      yoco_payment_reference: checkout.id,
      payment_status: 'pending',
    })
    .eq('id', fresh.id)

  await sb.from('booking_status_history').insert({
    booking_id: fresh.id,
    from_status: 'pending',
    to_status: 'pending',
    changed_by: 'client',
    reason: 'payment_retry_guest',
    meta: { checkout_id: checkout.id },
  })

  return res.status(200).json({
    ok: true,
    booking_id: fresh.id,
    checkout_url: checkout.redirectUrl,
    checkout_id: checkout.id,
    amount_cents: amount,
    booking_reference: fresh.booking_reference || null,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action || '')
  const isRetry =
    action === 'retry' || String(req.url || '').includes('payment-retry')

  try {
    if (isRetry) return handleGuestRetry(req, res)

    if (req.method !== 'POST' && req.method !== 'GET') {
      return methodNotAllowed(res, ['GET', 'POST'])
    }

    const body =
      req.method === 'POST'
        ? await readJson(req)
        : ({} as Record<string, unknown>)
    const bookingId = String(body.booking_id || req.query.booking_id || '')
    if (!bookingId) {
      return res.status(400).json({ error: 'booking_id required' })
    }

    if (useMockStore()) {
      const booking = mockDb.getBooking(bookingId)
      if (!booking) return res.status(404).json({ error: 'Booking not found' })
      return res.status(200).json({
        success: true,
        booking_id: booking.id,
        booking_reference: booking.booking_reference ?? null,
        status: booking.status,
        payment_status: booking.payment_status ?? booking.status,
        paid: booking.status === 'paid',
        confirmed_via: 'status_only',
      })
    }

    const sb = supabaseAdmin()
    await expireStalePendingBookings(sb)

    const { data: booking, error } = await sb
      .from('bookings')
      .select(
        'id, status, payment_status, booking_reference, grand_total_cents, final_price_cents'
      )
      .eq('id', bookingId)
      .maybeSingle()

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    return res.status(200).json({
      success: true,
      booking_id: booking.id,
      booking_reference: booking.booking_reference ?? null,
      status: booking.status,
      payment_status: booking.payment_status ?? null,
      amount_cents:
        booking.grand_total_cents ?? booking.final_price_cents ?? null,
      paid: booking.status === 'paid',
      confirmed_via: 'status_only',
    })
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Payment endpoint failed',
    })
  }
}
