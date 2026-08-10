import type { SupabaseClient } from '@supabase/supabase-js'
import {
  drainEmailOutbox,
  enqueueNotification,
  type OutboxAudience,
} from './email-outbox'

export type BookingEmailDetails = {
  bookingId: string
  status: 'pending' | 'paid' | 'cancelled'
  bookingDate: string
  startTime: string
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  tourName?: string | null
  tourSlug?: string | null
  vehicleName?: string | null
  driverName?: string | null
  notes?: string | null
  amountCents?: number | null
  /** Extra line for reschedule / assign context */
  changeNote?: string | null
}

export type BookingNotifyKind =
  | 'created'
  | 'paid'
  | 'cancelled'
  | 'rescheduled'
  | 'assigned'
  | 'reminder'

/** @deprecated use BookingNotifyKind */
export type DriverNotifyKind = BookingNotifyKind

function escapeHtml(text: string) {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return String(text).replace(/[&<>"']/g, (c) => map[c] || c)
}

function formatMoney(cents?: number | null) {
  if (cents == null || !Number.isFinite(cents)) return '—'
  return `R${(cents / 100).toLocaleString('en-ZA')}`
}

function siteUrl() {
  return (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
}

function driverTitle(kind: BookingNotifyKind): string {
  switch (kind) {
    case 'paid':
      return 'Booking paid & confirmed'
    case 'cancelled':
      return 'Booking cancelled'
    case 'rescheduled':
      return 'Booking rescheduled'
    case 'assigned':
      return 'Booking assigned to you'
    case 'reminder':
      return 'Reminder: tour tomorrow'
    default:
      return 'New booking request (awaiting payment / confirmation)'
  }
}

function guestTitle(kind: BookingNotifyKind): string {
  switch (kind) {
    case 'paid':
      return 'Your booking is confirmed'
    case 'cancelled':
      return 'Your booking was cancelled'
    case 'rescheduled':
      return 'Your booking was updated'
    case 'assigned':
      return 'Your booking details were updated'
    case 'reminder':
      return 'Reminder: your tour is tomorrow'
    default:
      return 'We received your booking — complete payment to confirm'
  }
}

function subjectPrefix(kind: BookingNotifyKind, audience: OutboxAudience): string {
  if (audience === 'guest') {
    switch (kind) {
      case 'paid':
        return '✅ Confirmed'
      case 'cancelled':
        return '🚫 Cancelled'
      case 'rescheduled':
      case 'assigned':
        return '📅 Updated'
      case 'reminder':
        return '⏰ Reminder'
      default:
        return '📩 Booking received'
    }
  }
  switch (kind) {
    case 'paid':
      return '✅ Paid'
    case 'cancelled':
      return '🚫 Cancelled'
    case 'rescheduled':
      return '📅 Rescheduled'
    case 'assigned':
      return '👤 Assigned'
    case 'reminder':
      return '⏰ Reminder'
    default:
      return '📩 New'
  }
}

function isHermanusTour(details: BookingEmailDetails) {
  const slug = (details.tourSlug || '').toLowerCase()
  const name = (details.tourName || '').toLowerCase()
  return slug === 'hermanus' || name.includes('hermanus')
}

function hermanusGuestNotes(): string[] {
  return [
    'Your Hermanus Whale Experience includes private transport, qualified guiding and the land-based Hermanus experience.',
    'Please note: the whale-watching boat experience is not included. If you would like to enquire about a boat tour, KhayrCape can assist with an enquiry to an external operator, subject to availability, weather and sea conditions.',
  ]
}

function sharedLines(details: BookingEmailDetails) {
  return [
    `Ref: ${details.bookingId}`,
    `Status: ${details.status}`,
    `Date: ${details.bookingDate}`,
    `Time: ${String(details.startTime).slice(0, 5)}`,
    `Tour: ${details.tourName || '—'}`,
    `Vehicle: ${details.vehicleName || '—'}`,
    `Driver: ${details.driverName || '—'}`,
    `Guest: ${details.clientName}`,
    `Email: ${details.clientEmail}`,
    `Phone: ${details.clientPhone || '—'}`,
    `Amount: ${formatMoney(details.amountCents)}`,
    `Notes: ${details.notes || '—'}`,
  ]
}

function sharedHtml(details: BookingEmailDetails) {
  const changeHtml = details.changeNote
    ? `<p><strong>Change:</strong> ${escapeHtml(details.changeNote)}</p>`
    : ''
  const hermanusHtml = isHermanusTour(details)
    ? `<p><strong>Important:</strong> Whale-watching boat experience is not included. Your booking covers private transport, qualified guiding and the land-based Hermanus experience only.</p>`
    : ''
  return `
    <p><strong>Ref:</strong> ${escapeHtml(details.bookingId)}</p>
    <p><strong>Status:</strong> ${escapeHtml(details.status)}</p>
    <p><strong>Date:</strong> ${escapeHtml(details.bookingDate)}</p>
    <p><strong>Time:</strong> ${escapeHtml(String(details.startTime).slice(0, 5))}</p>
    <p><strong>Tour:</strong> ${escapeHtml(details.tourName || '—')}</p>
    <p><strong>Vehicle:</strong> ${escapeHtml(details.vehicleName || '—')}</p>
    <p><strong>Driver:</strong> ${escapeHtml(details.driverName || '—')}</p>
    <p><strong>Guest:</strong> ${escapeHtml(details.clientName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(details.clientEmail)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(details.clientPhone || '—')}</p>
    <p><strong>Amount:</strong> ${escapeHtml(formatMoney(details.amountCents))}</p>
    <p><strong>Notes:</strong> ${escapeHtml(details.notes || '—')}</p>
    ${hermanusHtml}
    ${changeHtml}
  `
}

/** Pure email builder — unit-testable without network. */
export function buildDriverBookingEmail(
  details: BookingEmailDetails,
  kind: BookingNotifyKind
) {
  const title = driverTitle(kind)
  const site = siteUrl()
  const lines = [title, '', ...sharedLines(details)]
  if (details.changeNote) lines.push(`Change: ${details.changeNote}`)
  lines.push('', `Manage schedule: ${site}/driver`)

  const html = `
    <h2>${escapeHtml(title)}</h2>
    ${sharedHtml(details)}
    <p><a href="${escapeHtml(site + '/driver')}">Open driver schedule</a></p>
  `

  return {
    subject: `${subjectPrefix(kind, 'driver')} booking — ${details.bookingDate} ${String(details.startTime).slice(0, 5)} — KhayrCape`,
    text: lines.join('\n'),
    html,
  }
}

/** Guest-facing templates (pending / paid / cancel / reschedule / reminder). */
export function buildGuestBookingEmail(
  details: BookingEmailDetails,
  kind: BookingNotifyKind
) {
  const title = guestTitle(kind)
  const site = siteUrl()
  const lines = [
    `Hi ${details.clientName},`,
    '',
    title,
    '',
    ...sharedLines(details),
  ]
  if (details.changeNote) lines.push(`Update: ${details.changeNote}`)

  if (isHermanusTour(details)) {
    lines.push('', ...hermanusGuestNotes())
  }

  if (kind === 'created') {
    lines.push(
      '',
      'Your private experience is held for 30 minutes while you complete payment.',
      'If payment is not completed in time, the hold expires and you can book again.'
    )
  } else if (kind === 'paid') {
    lines.push(
      '',
      'Payment received — your tour is confirmed. We look forward to hosting you.'
    )
  } else if (kind === 'cancelled') {
    lines.push(
      '',
      'If you paid and are eligible for a refund under our 24-hour policy, we will process it separately.'
    )
  } else if (kind === 'reminder') {
    lines.push(
      '',
      'Please be ready for pickup at the time above. Message us on WhatsApp if anything changes.'
    )
  }

  lines.push('', `Account & receipts: ${site}/account`, `Book again: ${site}/book`)

  const extraHtml =
    kind === 'created'
      ? `<p>Your private experience is held for <strong>30 minutes</strong> while you complete payment.</p>`
      : kind === 'paid'
        ? `<p>Payment received — your tour is confirmed. We look forward to hosting you.</p>`
        : kind === 'cancelled'
          ? `<p>If you paid and are eligible for a refund under our 24-hour policy, we will process it separately.</p>`
          : kind === 'reminder'
            ? `<p>Please be ready for pickup at the time above.</p>`
            : ''

  const html = `
    <h2>${escapeHtml(title)}</h2>
    <p>Hi ${escapeHtml(details.clientName)},</p>
    ${sharedHtml(details)}
    ${extraHtml}
    <p><a href="${escapeHtml(site + '/account')}">View your account</a> · <a href="${escapeHtml(site + '/book')}">Book again</a></p>
  `

  return {
    subject: `${subjectPrefix(kind, 'guest')} — ${details.bookingDate} ${String(details.startTime).slice(0, 5)} — KhayrCape`,
    text: lines.join('\n'),
    html,
  }
}

function audiencesFor(_kind: BookingNotifyKind): OutboxAudience[] {
  return ['driver', 'guest']
}

function dedupeKey(
  details: BookingEmailDetails,
  kind: BookingNotifyKind,
  audience: OutboxAudience
) {
  return `${details.bookingId}:${kind}:${audience}`
}

/**
 * Enqueue driver + guest notifications (deduped). Optionally drain immediately.
 */
export async function notifyBookingEvent(
  details: BookingEmailDetails,
  kind: BookingNotifyKind = 'created',
  opts?: { sb?: SupabaseClient | null; drain?: boolean }
): Promise<{ enqueued: number; sent?: number }> {
  const audiences = audiencesFor(kind)
  let enqueued = 0

  for (const audience of audiences) {
    const to =
      audience === 'driver'
        ? process.env.DRIVER_NOTIFY_EMAIL || 'yaseenjacobs@icloud.com'
        : details.clientEmail
    if (!to) continue

    const built =
      audience === 'guest'
        ? buildGuestBookingEmail(details, kind)
        : buildDriverBookingEmail(details, kind)

    const result = await enqueueNotification(
      {
        dedupeKey: dedupeKey(details, kind, audience),
        audience,
        kind,
        toEmail: to,
        subject: built.subject,
        bodyText: built.text,
        bodyHtml: built.html,
        payload: {
          bookingId: details.bookingId,
          status: details.status,
          kind,
          audience,
        },
      },
      opts?.sb
    )
    if (result.inserted) enqueued += 1
  }

  let sent: number | undefined
  if (opts?.drain !== false) {
    const drain = await drainEmailOutbox(opts?.sb)
    sent = drain.sent
  }

  return { enqueued, sent }
}

/**
 * Back-compat: enqueue driver+guest and attempt immediate drain.
 */
export async function notifyDriverBooking(
  details: BookingEmailDetails,
  kind: BookingNotifyKind = 'created',
  sb?: SupabaseClient | null
): Promise<{ sent: boolean; reason?: string; enqueued?: number }> {
  try {
    const result = await notifyBookingEvent(details, kind, { sb, drain: true })
    return {
      sent: (result.sent ?? 0) > 0 || result.enqueued > 0,
      enqueued: result.enqueued,
    }
  } catch (e) {
    console.error('[email] notify failed', e)
    return {
      sent: false,
      reason: e instanceof Error ? e.message : 'notify failed',
    }
  }
}

/** Map a booking-shaped row to email details. */
export function bookingRowToEmailDetails(row: {
  id: string
  status: string
  booking_date: string
  start_time: string
  client_name: string
  client_email: string
  client_phone?: string | null
  notes?: string | null
  grand_total_cents?: number | null
  final_price_cents?: number | null
  booking_reference?: string | null
  tour?: { name?: string | null; slug?: string | null } | null
  vehicle?: { name?: string | null } | null
  driver?: { name?: string | null; full_name?: string | null } | null
  tour_name_snapshot?: string | null
  vehicle_name_snapshot?: string | null
  driver_name_snapshot?: string | null
  changeNote?: string | null
}): BookingEmailDetails {
  const status =
    row.status === 'paid' || row.status === 'cancelled' || row.status === 'pending'
      ? row.status
      : 'pending'
  return {
    bookingId: row.booking_reference || row.id,
    status,
    bookingDate: row.booking_date,
    startTime: row.start_time,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    tourName: row.tour?.name || row.tour_name_snapshot,
    tourSlug: row.tour?.slug || null,
    vehicleName: row.vehicle?.name || row.vehicle_name_snapshot,
    driverName:
      row.driver?.full_name || row.driver?.name || row.driver_name_snapshot,
    notes: row.notes,
    amountCents: row.grand_total_cents ?? row.final_price_cents ?? null,
    changeNote: row.changeNote,
  }
}
