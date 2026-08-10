import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { expireStalePendingBookings } from '../booking-app/lib/booking-lifecycle'
import { methodNotAllowed, readJson } from './_lib/http'

/**
 * Read-only payment/booking status for the thank-you page.
 * NEVER marks a booking as paid — Yoco webhook is the source of truth.
 */
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return methodNotAllowed(res, ['GET', 'POST'])
  }

  try {
    const body =
      req.method === 'POST'
        ? await readJson(req)
        : ({} as Record<string, unknown>)
    const bookingId = String(
      body.booking_id || req.query.booking_id || ''
    )
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
        // Explicit: this endpoint never confirms payment
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
      amount_cents: booking.grand_total_cents ?? booking.final_price_cents ?? null,
      paid: booking.status === 'paid',
      confirmed_via: 'status_only',
    })
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Status lookup failed',
    })
  }
}
