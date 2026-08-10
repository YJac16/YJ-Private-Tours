/**
 * Auth-aware API helpers (Bearer JWT / mock tokens).
 */

const API = import.meta.env.VITE_BOOKING_API_URL || '/api'

async function json<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(
      res.ok
        ? 'Invalid response from booking server.'
        : `API error (${res.status}). Got: ${text.slice(0, 80)}`
    )
  }
  if (!res.ok) {
    throw new Error(
      (data.error as string) || (data.message as string) || 'Request failed'
    )
  }
  return data as T
}

export function authHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }
}

export type AccountBooking = {
  id: string
  booking_date: string
  start_time: string
  status: string
  trip_status?: string
  payment_status?: string
  client_name: string
  client_email: string
  client_phone: string | null
  notes: string | null
  driver_id?: string
  vehicle_id?: string | null
  booking_reference?: string | null
  grand_total_cents?: number | null
  final_price_cents?: number | null
  pickup_address?: string | null
  special_requests?: string | null
  guest_count?: number
  passenger_count?: number
  cancel_reason?: string | null
  cancelled_at?: string | null
  cancelled_by?: string | null
  refund_status?: string | null
  refund_amount_cents?: number | null
  refunded_at?: string | null
  refund_eligible?: boolean
  reschedule_requested_at?: string | null
  reschedule_note?: string | null
  tour?: { id: string; name: string; slug: string | null } | null
  vehicle?: { id: string; name: string; slug: string | null } | null
  driver?: { id: string; name: string; full_name?: string | null } | null
}

export type BookingHistoryRow = {
  id: string
  from_status: string | null
  to_status: string
  changed_by: string | null
  reason: string | null
  meta?: Record<string, unknown> | null
  created_at: string
}

export type DriverProfile = {
  id: string
  name: string
  full_name: string | null
  is_active: boolean
  photo_url: string | null
  languages: string[] | null
  years_experience: number | null
  bio: string | null
  user_id: string | null
  rating_avg?: number | null
  rating_count?: number
}

export type DriverScheduleBooking = {
  id: string
  booking_date: string
  start_time: string
  status: string
  trip_status?: string
  payment_status?: string
  guest_count?: number
  adult_count?: number
  child_count?: number
  passenger_count?: number
  grand_total_cents?: number
  final_price_cents?: number
  driver_earnings_cents?: number | null
  pickup_address?: string | null
  special_requests?: string | null
  booking_reference?: string | null
  client_name: string
  client_email: string
  client_phone: string | null
  notes: string | null
  driver_id: string
  tour: { id: string; name: string; slug: string | null } | null
  vehicle: { id: string; name: string; slug: string | null } | null
}

export type DriverUnavailable = {
  id: string
  driver_id: string
  unavailable_date: string
  start_time: string | null
  reason: string | null
}

export async function fetchAccountBookings(
  token: string,
  status?: 'upcoming' | 'past' | 'cancelled' | ''
) {
  const q = status ? `?status=${encodeURIComponent(status)}` : ''
  return json<{ bookings: AccountBooking[] }>(
    await fetch(`${API}/account-bookings${q}`, {
      headers: authHeaders(token),
    })
  )
}

export async function fetchAccountBookingDetail(token: string, bookingId: string) {
  return json<{ booking: AccountBooking; history: BookingHistoryRow[] }>(
    await fetch(
      `${API}/account-bookings?id=${encodeURIComponent(bookingId)}`,
      {
        headers: authHeaders(token),
      }
    )
  )
}

export async function cancelAccountBooking(
  token: string,
  bookingId: string,
  opts?: { reason?: string; requestRefund?: boolean }
) {
  return json<{
    ok: boolean
    booking_id: string
    status: string
    refund_status: string
    refund_amount_cents: number | null
    refund_eligible: boolean
    already_cancelled: boolean
    message: string
  }>(
    await fetch(`${API}/account-bookings`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        action: 'cancel',
        booking_id: bookingId,
        reason: opts?.reason || null,
        request_refund: opts?.requestRefund !== false,
      }),
    })
  )
}

export async function requestAccountReschedule(
  token: string,
  bookingId: string,
  note: string
) {
  return json<{ ok: boolean; booking_id: string; message: string }>(
    await fetch(`${API}/account-bookings`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        action: 'request_reschedule',
        booking_id: bookingId,
        note,
      }),
    })
  )
}

export async function retryAccountPayment(token: string, bookingId: string) {
  return json<{
    ok: boolean
    booking_id: string
    checkout_url: string
    checkout_id: string
    amount_cents: number
    booking_reference: string | null
  }>(
    await fetch(`${API}/account-bookings`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        action: 'retry_payment',
        booking_id: bookingId,
      }),
    })
  )
}

export type AccountReceipt = {
  receipt_number: string
  issued_at: string
  booking_id: string
  booking_reference: string | null
  booking_date: string
  start_time: string
  client_name: string
  client_email: string
  tour_name: string | null
  vehicle_name: string | null
  driver_name: string | null
  amount_cents: number
  currency: string
  payment_status: string
  yoco_reference: string | null
  paid_at: string | null
  business_name?: string
  template: {
    header: string
    footer: string
    terms: string
  }
}

export async function fetchAccountReceipt(token: string, bookingId: string) {
  return json<{ ok: boolean; receipt: AccountReceipt }>(
    await fetch(`${API}/account-bookings`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        action: 'receipt',
        booking_id: bookingId,
      }),
    })
  )
}

export async function fetchDriverMe(
  token: string,
  opts?: { driverId?: string; from?: string; to?: string }
) {
  const q = new URLSearchParams()
  if (opts?.driverId) q.set('driver_id', opts.driverId)
  const today = new Date().toISOString().slice(0, 10)
  q.set('from', opts?.from || today)
  if (opts?.to) q.set('to', opts.to)
  const qs = q.toString()
  return json<{
    driver: DriverProfile
    bookings: DriverScheduleBooking[]
    unavailable: DriverUnavailable[]
  }>(
    await fetch(`${API}/driver?${qs}`, {
      headers: authHeaders(token),
    })
  )
}

export async function updateDriverProfile(
  token: string,
  patch: {
    full_name?: string
    photo_url?: string | null
    languages?: string[] | string
    bio?: string | null
    years_experience?: number
    driver_id?: string
  }
) {
  return json<{ success: boolean; driver: DriverProfile }>(
    await fetch(`${API}/driver`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ action: 'update_profile', ...patch }),
    })
  )
}

export async function driverUpdateBookingAuth(
  token: string,
  updates: {
    booking_id: string
    booking_date?: string
    start_time?: string
    status?: string
    trip_status?: string
    notes?: string
  }
) {
  return json(
    await fetch(`${API}/driver`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    })
  )
}

export async function driverBlockSlotAuth(
  token: string,
  payload: {
    unavailable_date: string
    start_time?: string | null
    reason?: string
    driver_id?: string
  }
) {
  return json(
    await fetch(`${API}/driver`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
  )
}

export async function driverUnblockAuth(token: string, id: string) {
  return json(
    await fetch(`${API}/driver?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    })
  )
}

export async function adminListDrivers(token: string) {
  return json<{ drivers: DriverProfile[] }>(
    await fetch(`${API}/admin-drivers`, {
      headers: authHeaders(token),
    })
  )
}

export async function adminCreateDriver(
  token: string,
  body: Record<string, unknown>
) {
  return json<{ success: boolean; driver: DriverProfile }>(
    await fetch(`${API}/admin-drivers`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    })
  )
}

export async function adminUpdateDriver(
  token: string,
  body: Record<string, unknown>
) {
  return json<{ success: boolean; driver: DriverProfile }>(
    await fetch(`${API}/admin-drivers`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    })
  )
}

export type AdminTripFilters = {
  q?: string
  status?: string
  trip_status?: string
  driver_id?: string
  from?: string
  to?: string
}

export type AdminCustomer = {
  email: string
  name: string
  phone: string | null
  trip_count: number
  last_booking_date: string | null
  last_status: string | null
  last_reference: string | null
}

export async function adminListTrips(
  token: string,
  filters?: AdminTripFilters
) {
  const q = new URLSearchParams()
  if (filters?.q) q.set('q', filters.q)
  if (filters?.status) q.set('status', filters.status)
  if (filters?.trip_status) q.set('trip_status', filters.trip_status)
  if (filters?.driver_id) q.set('driver_id', filters.driver_id)
  if (filters?.from) q.set('from', filters.from)
  if (filters?.to) q.set('to', filters.to)
  const qs = q.toString()
  return json<{ bookings: AccountBooking[] }>(
    await fetch(`${API}/admin-trips${qs ? `?${qs}` : ''}`, {
      headers: authHeaders(token),
    })
  )
}

export async function adminListCustomers(token: string) {
  return json<{ customers: AdminCustomer[] }>(
    await fetch(`${API}/admin-trips?resource=customers`, {
      headers: authHeaders(token),
    })
  )
}

export async function adminUpdateTrip(
  token: string,
  body: Record<string, unknown>
) {
  return json<{
    success: boolean
    booking: AccountBooking
    cancel?: {
      refund_status: string
      refund_eligible: boolean
      message: string
    }
  }>(
    await fetch(`${API}/admin-trips`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    })
  )
}
