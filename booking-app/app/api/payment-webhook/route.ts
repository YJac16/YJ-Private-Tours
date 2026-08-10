/**
 * POST /api/payment-webhook — Next twin of Vercel api/payment-webhook.ts
 * Prefer the Vercel handler in production.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '@/lib/mock-store'
import {
  alertOps,
  markBookingPaidFromVerifiedPayment,
  markBookingRefundSucceeded,
} from '@/lib/booking-lifecycle'
import {
  extractWebhookAmountCents,
  extractWebhookBookingId,
  extractWebhookCheckoutId,
  extractWebhookCurrency,
  isPaymentSuccessEvent,
  isRefundSuccessEvent,
  verifyYocoWebhook,
} from '@/lib/yoco-webhook'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => {
      headers[k] = v
    })

    const verified = verifyYocoWebhook(rawBody, headers)
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status })
    }

    const { event, eventId, eventType } = verified
    const bookingId = extractWebhookBookingId(event)
    const amountCents = extractWebhookAmountCents(event)
    const currency = extractWebhookCurrency(event)
    const checkoutId = extractWebhookCheckoutId(event)

    if (isRefundSuccessEvent(eventType)) {
      if (!bookingId) {
        return NextResponse.json({
          ignored: true,
          type: eventType,
          event_id: eventId,
        })
      }
      if (useMockStore()) {
        mockDb.markRefundSucceeded(bookingId, amountCents)
        return NextResponse.json({
          success: true,
          refunded: true,
          booking_id: bookingId,
          event_id: eventId,
        })
      }
      const sb = supabaseAdmin()
      const { data: existingEvent } = await sb
        .from('processed_webhook_events')
        .select('event_id')
        .eq('event_id', eventId)
        .maybeSingle()
      if (existingEvent) {
        return NextResponse.json({
          success: true,
          already_processed: true,
          event_id: eventId,
        })
      }
      const refundResult = await markBookingRefundSucceeded(sb, {
        bookingId,
        amountCents,
        refundId: checkoutId,
      })
      if (refundResult.ok === false) {
        return NextResponse.json(
          { error: refundResult.error, event_id: eventId },
          { status: refundResult.status }
        )
      }
      await sb.from('processed_webhook_events').upsert({
        event_id: eventId,
        booking_id: bookingId,
        event_type: eventType,
      })
      return NextResponse.json({
        success: true,
        refunded: true,
        already: refundResult.already,
        booking_id: bookingId,
        event_id: eventId,
      })
    }

    if (!isPaymentSuccessEvent(eventType)) {
      return NextResponse.json({ ignored: true, type: eventType, event_id: eventId })
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Could not resolve booking_id from webhook' },
        { status: 400 }
      )
    }

    if (useMockStore()) {
      const booking = mockDb.getBooking(bookingId)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      if (booking.status === 'paid') {
        return NextResponse.json({
          success: true,
          already_paid: true,
          booking_id: bookingId,
          event_id: eventId,
        })
      }
      const expected = booking.grand_total_cents ?? booking.final_price_cents
      if (amountCents != null && expected != null && amountCents !== expected) {
        return NextResponse.json(
          { error: 'Payment amount does not match booking total' },
          { status: 409 }
        )
      }
      mockDb.confirmPayment(bookingId)
      return NextResponse.json({
        success: true,
        booking_id: bookingId,
        event_id: eventId,
      })
    }

    const sb = supabaseAdmin()
    const { data: existingEvent } = await sb
      .from('processed_webhook_events')
      .select('event_id, booking_id')
      .eq('event_id', eventId)
      .maybeSingle()

    if (existingEvent) {
      return NextResponse.json({
        success: true,
        already_processed: true,
        booking_id: existingEvent.booking_id,
        event_id: eventId,
      })
    }

    const result = await markBookingPaidFromVerifiedPayment(sb, {
      bookingId,
      amountCents,
      currency,
      checkoutId,
      eventId,
      requireAmountMatch: true,
    })

    if (result.ok === false) {
      if (result.alert) void alertOps(result.alert)
      return NextResponse.json(
        { error: result.error, event_id: eventId },
        { status: result.status }
      )
    }

    await sb.from('processed_webhook_events').upsert({
      event_id: eventId,
      booking_id: result.booking_id,
      event_type: eventType,
    })

    return NextResponse.json({
      success: true,
      booking_id: result.booking_id,
      booking_reference: result.booking_reference,
      already_paid: result.already_paid,
      event_id: eventId,
    })
  } catch (err) {
    console.error('[/api/payment-webhook]', err)
    return NextResponse.json(
      { error: 'Failed to process payment webhook.' },
      { status: 500 }
    )
  }
}
