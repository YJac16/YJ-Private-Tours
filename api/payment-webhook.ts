import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import {
  alertOps,
  markBookingPaidFromVerifiedPayment,
  markBookingRefundSucceeded,
} from '../booking-app/lib/booking-lifecycle'
import {
  extractWebhookAmountCents,
  extractWebhookBookingId,
  extractWebhookCheckoutId,
  extractWebhookCurrency,
  isPaymentSuccessEvent,
  isRefundSuccessEvent,
  verifyYocoWebhook,
} from '../booking-app/lib/yoco-webhook'
import { methodNotAllowed, readRawBody } from './_lib/http'

export const config = {
  api: {
    bodyParser: false,
  },
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    const rawBody = await readRawBody(req)
    const verified = verifyYocoWebhook(rawBody, req.headers as Record<string, string | string[] | undefined>)

    if (verified.ok === false) {
      console.error('[payment-webhook] verify failed', verified.error)
      return res.status(verified.status).json({ error: verified.error })
    }

    const { event, eventId, eventType } = verified

    const bookingId = extractWebhookBookingId(event)
    const amountCents = extractWebhookAmountCents(event)
    const currency = extractWebhookCurrency(event)
    const checkoutId = extractWebhookCheckoutId(event)

    if (isRefundSuccessEvent(eventType)) {
      if (!bookingId) {
        return res.status(200).json({
          ignored: true,
          type: eventType,
          event_id: eventId,
          reason: 'missing booking_id',
        })
      }
      if (useMockStore()) {
        mockDb.markRefundSucceeded(bookingId, amountCents)
        return res.status(200).json({
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
        return res.status(200).json({
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
        return res
          .status(refundResult.status)
          .json({ error: refundResult.error, event_id: eventId })
      }
      await sb.from('processed_webhook_events').upsert({
        event_id: eventId,
        booking_id: bookingId,
        event_type: eventType,
      })
      return res.status(200).json({
        success: true,
        refunded: true,
        already: refundResult.already,
        booking_id: bookingId,
        event_id: eventId,
      })
    }

    if (!isPaymentSuccessEvent(eventType)) {
      return res.status(200).json({ ignored: true, type: eventType, event_id: eventId })
    }

    if (!bookingId) {
      console.error('[payment-webhook] missing booking_id', eventId)
      return res.status(400).json({ error: 'Could not resolve booking_id from webhook' })
    }

    if (useMockStore()) {
      const booking = mockDb.getBooking(bookingId)
      if (!booking) return res.status(404).json({ error: 'Booking not found' })
      if (booking.status === 'paid') {
        return res.status(200).json({
          success: true,
          already_paid: true,
          booking_id: bookingId,
          event_id: eventId,
        })
      }
      const expected = booking.grand_total_cents ?? booking.final_price_cents
      if (amountCents != null && expected != null && amountCents !== expected) {
        return res.status(409).json({ error: 'Payment amount does not match booking total' })
      }
      mockDb.confirmPayment(bookingId)
      return res.status(200).json({
        success: true,
        booking_id: bookingId,
        event_id: eventId,
        already_paid: false,
      })
    }

    const sb = supabaseAdmin()

    // Event-level idempotency
    const { data: existingEvent } = await sb
      .from('processed_webhook_events')
      .select('event_id, booking_id')
      .eq('event_id', eventId)
      .maybeSingle()

    if (existingEvent) {
      return res.status(200).json({
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
      return res.status(result.status).json({ error: result.error, event_id: eventId })
    }

    await sb.from('processed_webhook_events').upsert({
      event_id: eventId,
      booking_id: result.booking_id,
      event_type: eventType,
    })

    return res.status(200).json({
      success: true,
      booking_id: result.booking_id,
      booking_reference: result.booking_reference,
      already_paid: result.already_paid,
      event_id: eventId,
    })
  } catch (e: unknown) {
    console.error('[payment-webhook]', e)
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Webhook processing failed',
    })
  }
}
