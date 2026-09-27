import type { SupabaseClient } from '@supabase/supabase-js'

export const ACCOUNT_BOOKING_SELECT = `
  id, booking_date, start_time, status, trip_status, payment_status,
  client_name, client_email, client_phone, notes, driver_id, client_user_id,
  guest_count, adult_count, child_count, passenger_count,
  grand_total_cents, final_price_cents,
  pickup_address, special_requests, booking_reference,
  cancel_reason, cancelled_at, cancelled_by,
  refund_status, refund_amount_cents, refunded_at, refund_external_id,
  reschedule_requested_at, reschedule_note, yoco_payment_reference,
  tour:tours(id, name, slug),
  vehicle:vehicles(id, name, slug),
  driver:drivers(id, name, full_name)
`

export function mergeBookingsById<T extends { id: string }>(
  ...lists: (T[] | null | undefined)[]
): T[] {
  const map = new Map<string, T>()
  for (const list of lists) {
    for (const row of list ?? []) {
      map.set(row.id, row)
    }
  }
  return [...map.values()]
}

/**
 * List bookings visible to a signed-in account holder.
 * Identity: auth.users.id via bookings.client_user_id, plus legacy rows matched by client_email.
 * Consent (client_consents) is not consulted — viewing history is independent of signing consent.
 */
export async function listAccountBookingsForUser(
  sb: SupabaseClient,
  userId: string,
  email: string | null,
  statusFilter?: '' | 'upcoming' | 'past' | 'cancelled'
) {
  const base = () =>
    sb
      .from('bookings')
      .select(ACCOUNT_BOOKING_SELECT)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false })

  const { data: byUserId, error: userErr } = await base().eq(
    'client_user_id',
    userId
  )
  if (userErr) throw userErr

  let byEmailRows: typeof byUserId = []
  const emailNorm = email?.trim().toLowerCase()
  if (emailNorm) {
    const { data, error: emailErr } = await base().ilike(
      'client_email',
      emailNorm
    )
    if (emailErr) throw emailErr
    byEmailRows = data ?? []
  }

  let bookings = mergeBookingsById(byUserId, byEmailRows)

  if (statusFilter === 'upcoming') {
    const today = new Date().toISOString().slice(0, 10)
    bookings = bookings.filter(
      (b) =>
        (b.status === 'pending' || b.status === 'paid') &&
        b.booking_date >= today
    )
  } else if (statusFilter === 'cancelled') {
    bookings = bookings.filter(
      (b) => b.status === 'cancelled' || b.status === 'expired'
    )
  } else if (statusFilter === 'past') {
    const today = new Date().toISOString().slice(0, 10)
    bookings = bookings.filter(
      (b) =>
        b.booking_date < today ||
        b.status === 'cancelled' ||
        b.status === 'expired'
    )
  }

  return bookings
}
