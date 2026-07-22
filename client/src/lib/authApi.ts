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
  booking_reference?: string | null
  grand_total_cents?: number | null
  final_price_cents?: number | null
  pickup_address?: string | null
  special_requests?: string | null
  guest_count?: number
  passenger_count?: number
  tour?: { id: string; name: string; slug: string | null } | null
  vehicle?: { id: string; name: string; slug: string | null } | null
  driver?: { id: string; name: string; full_name?: string | null } | null
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

export async function fetchAccountBookings(token: string) {
  return json<{ bookings: AccountBooking[] }>(
    await fetch(`${API}/account-bookings`, {
      headers: authHeaders(token),
    })
  )
}

export async function fetchDriverMe(token: string, driverId?: string) {
  const q = new URLSearchParams()
  if (driverId) q.set('driver_id', driverId)
  const today = new Date().toISOString().slice(0, 10)
  q.set('from', today)
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

export async function adminListTrips(token: string) {
  return json<{ bookings: AccountBooking[] }>(
    await fetch(`${API}/admin-trips`, {
      headers: authHeaders(token),
    })
  )
}
