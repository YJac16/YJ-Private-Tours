/**
 * Client helpers for the booking API (proxied via Vite to booking-app in dev).
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
        : `Booking API error (${res.status}). Is the API deployed? Got: ${text.slice(0, 80)}`
    )
  }
  if (!res.ok) {
    throw new Error(
      (data.error as string) || (data.message as string) || 'Request failed'
    )
  }
  return data as T
}

export type Driver = { id: string; name: string; is_active: boolean }
export type Vehicle = { id: string; name: string; description: string | null; slug: string | null }
export type Tour = {
  id: string
  name: string
  description: string | null
  slug: string | null
  price_cents?: number
}

export type Slot = {
  id: string
  start_time: string
  label: string
  available: boolean
  reason: string | null
}

export async function fetchCatalog() {
  return json<{ drivers: Driver[]; vehicles: Vehicle[]; tours: Tour[] }>(
    await fetch(`${API}/catalog`)
  )
}

export async function fetchSlots(date: string, driverId: string) {
  const q = new URLSearchParams({ date, driver_id: driverId })
  return json<{ slots: Slot[]; reason?: string }>(
    await fetch(`${API}/slots?${q}`)
  )
}

export type BookPayload = {
  booking_date: string
  start_time: string
  driver_id: string
  tour_id: string
  vehicle_id: string
  client_name: string
  client_email: string
  client_phone?: string
  notes?: string
  amount_cents?: number
}

export async function createBooking(payload: BookPayload) {
  return json<{
    success: boolean
    booking_id: string
    payment?: boolean
    checkout_url?: string
    checkout_id?: string
    amount_cents?: number
    message?: string
    warning?: string
  }>(
    await fetch(`${API}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  )
}

export async function confirmPayment(bookingId: string) {
  return json<{ success: boolean; booking_id: string; status?: string }>(
    await fetch(`${API}/payment-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    })
  )
}

function driverHeaders(pin: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-driver-pin': pin,
  }
}

export async function driverFetchSchedule(pin: string, driverId?: string) {
  const q = new URLSearchParams()
  if (driverId) q.set('driver_id', driverId)
  const today = new Date().toISOString().slice(0, 10)
  q.set('from', today)
  return json<{
    bookings: Array<{
      id: string
      booking_date: string
      start_time: string
      status: string
      client_name: string
      client_email: string
      client_phone: string | null
      notes: string | null
      driver_id: string
      tour: { id: string; name: string; slug: string | null } | null
      vehicle: { id: string; name: string; slug: string | null } | null
    }>
    unavailable: Array<{
      id: string
      driver_id: string
      unavailable_date: string
      start_time: string | null
      reason: string | null
    }>
  }>(await fetch(`${API}/driver?${q}`, { headers: driverHeaders(pin) }))
}

export async function driverUpdateBooking(
  pin: string,
  updates: {
    booking_id: string
    booking_date?: string
    start_time?: string
    status?: string
    notes?: string
  }
) {
  return json(
    await fetch(`${API}/driver`, {
      method: 'PATCH',
      headers: driverHeaders(pin),
      body: JSON.stringify({ ...updates, pin }),
    })
  )
}

export async function driverBlockSlot(
  pin: string,
  payload: {
    driver_id: string
    unavailable_date: string
    start_time?: string | null
    reason?: string
  }
) {
  return json(
    await fetch(`${API}/driver`, {
      method: 'POST',
      headers: driverHeaders(pin),
      body: JSON.stringify({ ...payload, pin }),
    })
  )
}

export async function driverUnblock(pin: string, id: string) {
  return json(
    await fetch(`${API}/driver?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: driverHeaders(pin),
    })
  )
}

/** Minimum bookable date (today + 2 local calendar days) as YYYY-MM-DD */
export function minBookableDate(noticeDays = 2): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + noticeDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
