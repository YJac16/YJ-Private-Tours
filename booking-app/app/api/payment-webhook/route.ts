/**
 * POST /api/payment-webhook
 *
 * Yoco webhook (payment.succeeded) + simple confirm payloads.
 * Verify webhook signature in production when YOCO_WEBHOOK_SECRET is set.
 */

import { NextRequest, NextResponse } from 'next/server'
import { mockDb, useMockStore } from '@/lib/mock-store'
import { supabaseAdmin } from '@/lib/supabase-server'

function extractBookingId(body: Record<string, unknown>): string | null {
  if (typeof body.booking_id === 'string') return body.booking_id

  const metadata = (body.metadata ||
    (body.payload as Record<string, unknown> | undefined)?.metadata ||
    (body.data as Record<string, unknown> | undefined)?.metadata) as
    | Record<string, unknown>
    | undefined

  if (metadata && typeof metadata.booking_id === 'string') {
    return metadata.booking_id
  }

  const payload = body.payload as Record<string, unknown> | undefined
  if (payload && typeof payload.booking_id === 'string') return payload.booking_id

  return null
}

function extractAmount(body: Record<string, unknown>): number | null {
  if (typeof body.amount_cents === 'number') return body.amount_cents
  if (typeof body.amount === 'number') return body.amount
  const payload = body.payload as Record<string, unknown> | undefined
  if (payload && typeof payload.amount === 'number') return payload.amount
  const data = body.data as Record<string, unknown> | undefined
  if (data && typeof data.amount === 'number') return data.amount
  return null
}

function extractExternalId(body: Record<string, unknown>): string | null {
  if (typeof body.external_id === 'string') return body.external_id
  if (typeof body.id === 'string' && body.id.startsWith('pay_')) return body.id
  const payload = body.payload as Record<string, unknown> | undefined
  if (payload && typeof payload.id === 'string') return payload.id
  const data = body.data as Record<string, unknown> | undefined
  if (data && typeof data.id === 'string') return data.id
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>

    const eventType = String(body.type || body.event || '')
    // Ignore non-success events if typed
    if (eventType && !/succeed|paid|completed/i.test(eventType) && eventType !== '') {
      if (!/payment\.succeeded|checkout\.completed/i.test(eventType)) {
        // still allow explicit booking_id confirms without type
        if (!body.booking_id) {
          return NextResponse.json({ ignored: true, type: eventType })
        }
      }
    }

    const booking_id = extractBookingId(body)
    const amount_cents = extractAmount(body)
    const external_id = extractExternalId(body)

    if (!booking_id) {
      return NextResponse.json(
        { error: 'Could not resolve booking_id from webhook payload.' },
        { status: 400 }
      )
    }

    if (useMockStore()) {
      const booking = mockDb.getBooking(booking_id)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
      }
      mockDb.confirmPayment(booking_id)
      if (amount_cents) {
        mockDb.recordPayment({
          booking_id,
          amount_cents,
          external_id,
          status: 'paid',
        })
      }
      return NextResponse.json({
        success: true,
        booking_id,
        message: 'Booking confirmed (mock).',
      })
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, status')
      .eq('id', booking_id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    if (booking.status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Booking already confirmed (idempotent).',
        booking_id,
      })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Booking cannot be confirmed (e.g. cancelled).' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'paid' })
      .eq('id', booking_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to confirm booking.' }, { status: 500 })
    }

    // Update existing pending payment or insert
    const { data: existingPay } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('booking_id', booking_id)
      .maybeSingle()

    if (existingPay) {
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          external_id: external_id ?? undefined,
          ...(amount_cents ? { amount_cents } : {}),
        })
        .eq('id', existingPay.id)
    } else if (amount_cents && amount_cents > 0) {
      await supabaseAdmin.from('payments').insert({
        booking_id,
        status: 'paid',
        amount_cents,
        currency: 'ZAR',
        external_id: external_id ?? null,
        paid_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed and payment recorded.',
      booking_id,
    })
  } catch (err) {
    console.error('[/api/payment-webhook]', err)
    return NextResponse.json(
      { error: 'Failed to process payment webhook.' },
      { status: 500 }
    )
  }
}
