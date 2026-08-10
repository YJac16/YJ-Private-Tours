import type { SupabaseClient } from '@supabase/supabase-js'
import { bookingRowToEmailDetails, notifyDriverBooking } from './notify'

export const PENDING_HOLD_MINUTES = 30

type BookingPaidRow = {
  id: string
  status: string
  booking_date: string
  start_time: string
  client_name: string
  client_email: string
  client_phone: string | null
  notes: string | null
  grand_total_cents: number | null
  final_price_cents: number | null
  yoco_payment_reference: string | null
  booking_reference: string | null
  tour?: { name?: string } | null
  vehicle?: { name?: string } | null
  driver?: { name?: string; full_name?: string } | null
  payments?: Array<{
    id: string
    status: string
    amount_cents: number
    currency: string
    external_id: string | null
  }> | null
}

export async function expireStalePendingBookings(
  sb: SupabaseClient
): Promise<number> {
  const { data, error } = await sb.rpc('expire_stale_pending_bookings')
  if (error) {
    // Fallback if migration not yet applied: expire via update
    const cutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000).toISOString()
    const { data: rows, error: upErr } = await sb
      .from('bookings')
      .update({
        status: 'expired',
        payment_status: 'cancelled',
        trip_status: 'cancelled',
      })
      .eq('status', 'pending')
      .lt('created_at', cutoff)
      .select('id')
    if (upErr) {
      console.error('[expire] failed', error.message, upErr.message)
      return 0
    }
    const ids = (rows ?? []).map((r) => r.id)
    if (ids.length) {
      await sb
        .from('payments')
        .update({ status: 'failed' })
        .in('booking_id', ids)
        .eq('status', 'pending')
    }
    return ids.length
  }
  return typeof data === 'number' ? data : Number(data) || 0
}

export function expectedBookingAmountCents(booking: {
  grand_total_cents?: number | null
  final_price_cents?: number | null
  payments?: Array<{ amount_cents?: number }> | null
}): number {
  if (booking.grand_total_cents != null && Number.isFinite(booking.grand_total_cents)) {
    return Math.round(Number(booking.grand_total_cents))
  }
  if (booking.final_price_cents != null && Number.isFinite(booking.final_price_cents)) {
    return Math.round(Number(booking.final_price_cents))
  }
  const pay = booking.payments?.[0]?.amount_cents
  return pay != null ? Math.round(Number(pay)) : 0
}

export type MarkPaidResult =
  | {
      ok: true
      already_paid: boolean
      booking_id: string
      booking_reference: string | null
      notified: boolean
    }
  | { ok: false; status: number; error: string; alert?: string }

/**
 * Mark booking paid only after verified payment details.
 * Idempotent: already-paid returns success without re-notifying.
 */
export async function markBookingPaidFromVerifiedPayment(
  sb: SupabaseClient,
  opts: {
    bookingId: string
    amountCents: number | null
    currency: string | null
    checkoutId: string | null
    eventId?: string | null
    requireAmountMatch?: boolean
  }
): Promise<MarkPaidResult> {
  const { data: booking, error } = await sb
    .from('bookings')
    .select(
      `
      id, status, booking_date, start_time, client_name, client_email, client_phone, notes,
      grand_total_cents, final_price_cents, yoco_payment_reference, booking_reference,
      tour:tours(name),
      vehicle:vehicles(name),
      driver:drivers(name, full_name),
      payments(id, status, amount_cents, currency, external_id)
    `
    )
    .eq('id', opts.bookingId)
    .maybeSingle()

  if (error || !booking) {
    return { ok: false, status: 404, error: 'Booking not found' }
  }

  const row = booking as unknown as BookingPaidRow

  if (row.status === 'paid') {
    return {
      ok: true,
      already_paid: true,
      booking_id: row.id,
      booking_reference: row.booking_reference,
      notified: false,
    }
  }

  if (row.status === 'cancelled' || row.status === 'expired') {
    return {
      ok: false,
      status: 400,
      error: `Booking cannot be marked paid (status=${row.status})`,
      alert: `Payment webhook for non-payable booking ${row.id} status=${row.status}`,
    }
  }

  if (row.status !== 'pending') {
    return {
      ok: false,
      status: 400,
      error: `Booking cannot be marked paid (status=${row.status})`,
    }
  }

  const expected = expectedBookingAmountCents(row)
  const requireAmount = opts.requireAmountMatch !== false

  if (requireAmount) {
    if (opts.amountCents == null || !Number.isFinite(opts.amountCents)) {
      return {
        ok: false,
        status: 400,
        error: 'Payment amount missing from webhook',
        alert: `Missing amount for booking ${row.id}`,
      }
    }
    if (Math.round(opts.amountCents) !== expected) {
      const msg = `Amount mismatch booking=${row.id} expected=${expected} got=${opts.amountCents}`
      console.error('[payment]', msg)
      return {
        ok: false,
        status: 409,
        error: 'Payment amount does not match booking total',
        alert: msg,
      }
    }
  }

  if (opts.currency && opts.currency.toUpperCase() !== 'ZAR') {
    const msg = `Currency mismatch booking=${row.id} currency=${opts.currency}`
    console.error('[payment]', msg)
    return {
      ok: false,
      status: 409,
      error: 'Payment currency must be ZAR',
      alert: msg,
    }
  }

  const storedCheckout =
    row.yoco_payment_reference ||
    row.payments?.find((p) => p.external_id)?.external_id ||
    null

  if (opts.checkoutId && storedCheckout && opts.checkoutId !== storedCheckout) {
    // Allow payment id vs checkout id differences if booking_id metadata matches;
    // only reject when both look like checkout ids and differ.
    if (opts.checkoutId.startsWith('ch_') && storedCheckout.startsWith('ch_')) {
      const msg = `Checkout mismatch booking=${row.id} stored=${storedCheckout} got=${opts.checkoutId}`
      console.error('[payment]', msg)
      return {
        ok: false,
        status: 409,
        error: 'Payment checkout does not match booking',
        alert: msg,
      }
    }
  }

  const { error: updateError } = await sb
    .from('bookings')
    .update({
      status: 'paid',
      payment_status: 'paid',
    })
    .eq('id', row.id)
    .eq('status', 'pending')

  if (updateError) {
    // Race: unique slot or concurrent paid
    if (/already reserved|already booked|duplicate|unique/i.test(updateError.message)) {
      return {
        ok: false,
        status: 409,
        error: updateError.message,
        alert: `Paid update conflict for ${row.id}: ${updateError.message}`,
      }
    }
    return { ok: false, status: 500, error: updateError.message }
  }

  // Confirm row actually became paid (lost race → already paid by other worker)
  const { data: after } = await sb
    .from('bookings')
    .select('status')
    .eq('id', row.id)
    .maybeSingle()

  if (after?.status !== 'paid') {
    return {
      ok: false,
      status: 409,
      error: 'Booking was not pending at confirmation time',
    }
  }

  const paymentUpdate: Record<string, unknown> = {
    status: 'paid',
    paid_at: new Date().toISOString(),
  }
  if (opts.checkoutId) paymentUpdate.external_id = opts.checkoutId

  await sb
    .from('payments')
    .update(paymentUpdate)
    .eq('booking_id', row.id)
    .eq('status', 'pending')

  void notifyDriverBooking(
    bookingRowToEmailDetails({
      ...row,
      status: 'paid',
    }),
    'paid',
    sb
  )

  return {
    ok: true,
    already_paid: false,
    booking_id: row.id,
    booking_reference: row.booking_reference,
    notified: true,
  }
}

export async function alertOps(message: string, sb?: SupabaseClient | null) {
  console.error('[ops-alert]', message)
  try {
    const { enqueueNotification, drainEmailOutbox } = await import('./email-outbox')
    const to = process.env.DRIVER_NOTIFY_EMAIL || 'yaseenjacobs@icloud.com'
    const dedupeKey = `ops:alert:${Date.now()}:${message.slice(0, 40)}`
    await enqueueNotification(
      {
        dedupeKey,
        audience: 'ops',
        kind: 'payment_alert',
        toEmail: to,
        subject: '[KhayrCape] Payment verification alert',
        bodyText: message,
        bodyHtml: `<pre>${message.replace(/[<>&]/g, (c) =>
          c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'
        )}</pre>`,
        payload: { message },
      },
      sb
    )
    await drainEmailOutbox(sb)
  } catch (e) {
    console.error('[ops-alert] enqueue failed', e)
  }
}

export const CANCEL_REFUND_HOURS = 24

export type CancelActor = 'client' | 'driver' | 'admin' | 'system'

export function tourStartsAt(bookingDate: string, startTime: string): Date {
  const t = String(startTime || '00:00').slice(0, 8)
  const iso = `${bookingDate}T${t.length === 5 ? `${t}:00` : t}`
  return new Date(iso)
}

/** Full refund when cancel is ≥24h before tour start (Terms §3). */
export function isRefundEligible(
  bookingDate: string,
  startTime: string,
  now = new Date()
): boolean {
  const start = tourStartsAt(bookingDate, startTime)
  if (Number.isNaN(start.getTime())) return false
  return start.getTime() - now.getTime() >= CANCEL_REFUND_HOURS * 60 * 60 * 1000
}

async function appendBookingHistory(
  sb: SupabaseClient,
  opts: {
    bookingId: string
    fromStatus: string | null
    toStatus: string
    changedBy: string
    reason?: string | null
    meta?: Record<string, unknown>
  }
) {
  await sb.from('booking_status_history').insert({
    booking_id: opts.bookingId,
    from_status: opts.fromStatus,
    to_status: opts.toStatus,
    changed_by: opts.changedBy,
    reason: opts.reason ?? null,
    meta: opts.meta ?? null,
  })
}

export type CancelBookingResult =
  | {
      ok: true
      booking_id: string
      status: string
      refund_status: string
      refund_amount_cents: number | null
      refund_eligible: boolean
      already_cancelled: boolean
      message: string
    }
  | { ok: false; status: number; error: string }

/**
 * Cancel a booking and optionally initiate a Yoco refund (paid + ≥24h).
 * Pending/unpaid cancels free the slot immediately (no payment move).
 */
export async function cancelBooking(
  sb: SupabaseClient,
  opts: {
    bookingId: string
    actor: CancelActor
    reason?: string | null
    requestRefund?: boolean
    /** When true, attempt Yoco refund if eligible (default true for client). */
    initiateRefund?: boolean
  }
): Promise<CancelBookingResult> {
  const { createYocoRefund } = await import('./yoco')

  const { data: booking, error } = await sb
    .from('bookings')
    .select(
      `
      id, status, booking_date, start_time, payment_status,
      client_name, client_email, client_phone, notes, booking_reference,
      grand_total_cents, final_price_cents, yoco_payment_reference,
      cancel_reason, cancelled_at, cancelled_by, refund_status, refund_amount_cents,
      tour:tours(name), vehicle:vehicles(name),
      driver:drivers(name, full_name),
      payments(id, status, amount_cents, external_id)
    `
    )
    .eq('id', opts.bookingId)
    .maybeSingle()

  if (error || !booking) {
    return { ok: false, status: 404, error: 'Booking not found' }
  }

  const row = booking as {
    id: string
    status: string
    booking_date: string
    start_time: string
    payment_status: string | null
    client_name: string
    client_email: string
    client_phone: string | null
    notes: string | null
    booking_reference: string | null
    grand_total_cents: number | null
    final_price_cents: number | null
    yoco_payment_reference: string | null
    cancel_reason: string | null
    cancelled_at: string | null
    cancelled_by: string | null
    refund_status: string | null
    refund_amount_cents: number | null
    tour?: { name?: string } | null
    vehicle?: { name?: string } | null
    driver?: { name?: string; full_name?: string } | null
    payments?: Array<{
      id: string
      status: string
      amount_cents: number
      external_id: string | null
    }> | null
  }

  if (row.status === 'cancelled' || row.status === 'expired') {
    return {
      ok: true,
      booking_id: row.id,
      status: row.status,
      refund_status: row.refund_status || 'none',
      refund_amount_cents: row.refund_amount_cents,
      refund_eligible: false,
      already_cancelled: true,
      message:
        row.status === 'expired'
          ? 'Booking already expired'
          : 'Booking already cancelled',
    }
  }

  if (row.status !== 'pending' && row.status !== 'paid') {
    return {
      ok: false,
      status: 400,
      error: `Cannot cancel booking in status ${row.status}`,
    }
  }

  const amount = expectedBookingAmountCents(row)
  const eligible =
    row.status === 'paid' &&
    isRefundEligible(row.booking_date, row.start_time)
  const wantRefund = opts.initiateRefund !== false && opts.requestRefund !== false
  const shouldRefund = row.status === 'paid' && eligible && wantRefund

  let refundStatus = 'none'
  let refundAmount: number | null = null
  let refundExternalId: string | null = null
  let refundedAt: string | null = null
  let message = 'Booking cancelled'

  if (row.status === 'paid') {
    if (!eligible) {
      refundStatus = 'ineligible'
      message =
        'Booking cancelled. Cancellations within 24 hours of the tour are not refundable.'
    } else if (shouldRefund) {
      const checkoutId =
        row.yoco_payment_reference ||
        row.payments?.find((p) => p.external_id)?.external_id ||
        null
      if (!checkoutId) {
        return {
          ok: false,
          status: 409,
          error: 'Cannot refund: missing Yoco checkout reference',
        }
      }
      const refund = await createYocoRefund({
        checkoutId,
        amountCents: amount,
        idempotencyKey: `refund-${row.id}-${amount}`,
      })
      if (!refund.ok) {
        // Test-mode keys often reject refunds — still cancel, mark failed for ops follow-up
        console.error('[cancel] yoco refund failed', refund.error)
        refundStatus = 'failed'
        message = `Booking cancelled but refund failed: ${refund.error}`
        void alertOps(
          `Refund failed for booking ${row.id}: ${refund.error}`
        )
      } else {
        refundStatus = 'pending'
        refundAmount = amount
        refundExternalId =
          (refund.data.refundId as string) ||
          (refund.data.id as string) ||
          checkoutId
        message =
          'Booking cancelled. Full refund has been requested and will confirm shortly.'
      }
    } else {
      refundStatus = 'none'
      message = 'Booking cancelled without refund'
    }
  } else {
    // pending unpaid — free slot, fail pending payment
    refundStatus = 'none'
    message = 'Pending booking cancelled; slot released'
  }

  const nowIso = new Date().toISOString()
  const { error: upErr } = await sb
    .from('bookings')
    .update({
      status: 'cancelled',
      payment_status: shouldRefund && refundStatus === 'pending' ? 'refund_pending' : 'cancelled',
      trip_status: 'cancelled',
      cancel_reason: opts.reason || null,
      cancelled_at: nowIso,
      cancelled_by: opts.actor,
      refund_status: refundStatus,
      refund_amount_cents: refundAmount,
      refund_external_id: refundExternalId,
      refunded_at: refundedAt,
    })
    .eq('id', row.id)
    .in('status', ['pending', 'paid'])

  if (upErr) {
    return { ok: false, status: 500, error: upErr.message }
  }

  if (row.status === 'pending') {
    await sb
      .from('payments')
      .update({ status: 'failed' })
      .eq('booking_id', row.id)
      .eq('status', 'pending')
  }

  await appendBookingHistory(sb, {
    bookingId: row.id,
    fromStatus: row.status,
    toStatus: 'cancelled',
    changedBy: opts.actor,
    reason: opts.reason || null,
    meta: {
      refund_status: refundStatus,
      refund_amount_cents: refundAmount,
      refund_eligible: eligible,
    },
  })

  void notifyDriverBooking(
    bookingRowToEmailDetails({
      ...row,
      status: 'cancelled',
      changeNote: `Cancelled by ${opts.actor}${opts.reason ? `: ${opts.reason}` : ''}`,
    }),
    'cancelled',
    sb
  )

  return {
    ok: true,
    booking_id: row.id,
    status: 'cancelled',
    refund_status: refundStatus,
    refund_amount_cents: refundAmount,
    refund_eligible: eligible,
    already_cancelled: false,
    message,
  }
}

/** Apply refund.succeeded webhook — mark refund completed. */
export async function markBookingRefundSucceeded(
  sb: SupabaseClient,
  opts: {
    bookingId: string
    amountCents?: number | null
    refundId?: string | null
  }
): Promise<{ ok: true; already: boolean } | { ok: false; status: number; error: string }> {
  const { data: booking, error } = await sb
    .from('bookings')
    .select('id, status, refund_status, refund_amount_cents')
    .eq('id', opts.bookingId)
    .maybeSingle()

  if (error || !booking) {
    return { ok: false, status: 404, error: 'Booking not found' }
  }

  if (booking.refund_status === 'succeeded') {
    return { ok: true, already: true }
  }

  const nowIso = new Date().toISOString()
  await sb
    .from('bookings')
    .update({
      refund_status: 'succeeded',
      payment_status: 'refunded',
      refund_amount_cents:
        opts.amountCents ?? booking.refund_amount_cents ?? null,
      refund_external_id: opts.refundId || undefined,
      refunded_at: nowIso,
    })
    .eq('id', opts.bookingId)

  await appendBookingHistory(sb, {
    bookingId: opts.bookingId,
    fromStatus: booking.status,
    toStatus: booking.status,
    changedBy: 'system',
    reason: 'refund.succeeded',
    meta: { refund_id: opts.refundId, amount_cents: opts.amountCents },
  })

  return { ok: true, already: false }
}
