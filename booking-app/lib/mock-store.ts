/**
 * In-memory booking store for local testing when Supabase is unreachable
 * or BOOKING_MOCK=1 is set.
 */

export type MockDriver = { id: string; name: string; is_active: boolean }
export type MockVehicle = {
  id: string
  name: string
  description: string | null
  slug: string | null
}
export type MockTour = {
  id: string
  name: string
  description: string | null
  slug: string | null
}
export type MockSlot = {
  id: string
  start_time: string
  label: string
  sort_order: number
  is_active: boolean
}
export type MockBooking = {
  id: string
  driver_id: string
  tour_id: string
  vehicle_id: string
  booking_date: string
  start_time: string
  status: 'pending' | 'paid' | 'cancelled'
  client_name: string
  client_email: string
  client_phone: string | null
  notes: string | null
  created_at: string
}
export type MockUnavailable = {
  id: string
  driver_id: string
  unavailable_date: string
  start_time: string | null
  reason: string | null
}

const drivers: MockDriver[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Yaseen',
    is_active: true,
  },
]

const tours: MockTour[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'City Tour',
    description: 'Cape Town city and surrounds',
    slug: 'city',
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'Cape Point',
    description: 'Cape Peninsula and Cape Point',
    slug: 'peninsula',
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    name: 'Winelands Tour',
    description: 'Stellenbosch / Franschhoek winelands',
    slug: 'winelands',
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'Ocean Sunset',
    description: 'Atlantic seaboard sunset experience',
    slug: 'sunset',
  },
]

const vehicles: MockVehicle[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    name: 'Suzuki XL6',
    description: 'Spacious comfort for families',
    slug: 'suzuki',
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    name: 'Mercedes Benz GLC 250 Coupe',
    description: 'Premium luxury experience',
    slug: 'mercedes',
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    name: 'Toyota Corolla Cross GR Sport',
    description: 'Sporty comfort with a personal touch',
    slug: 'corolla',
  },
]

const timeSlots: MockSlot[] = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    start_time: '08:00',
    label: 'Morning — 08:00',
    sort_order: 1,
    is_active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    start_time: '12:30',
    label: 'Afternoon — 12:30',
    sort_order: 2,
    is_active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444403',
    start_time: '16:30',
    label: 'Sunset — 16:30',
    sort_order: 3,
    is_active: true,
  },
]

export type MockPayment = {
  id: string
  booking_id: string
  amount_cents: number
  external_id: string | null
  status: 'pending' | 'paid' | 'failed'
  paid_at: string | null
}

const bookings: MockBooking[] = []
const unavailable: MockUnavailable[] = []
const payments: MockPayment[] = []
const blockedDates = new Set<string>()

export function useMockStore() {
  if (process.env.BOOKING_MOCK === '1' || process.env.BOOKING_MOCK === 'true') {
    return true
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key || url.includes('your-project')) {
    return true
  }
  return false
}

function normalizeTime(t: string) {
  return t.slice(0, 5)
}

function minBookableDate(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 2)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function uuid() {
  return crypto.randomUUID()
}

export const mockDb = {
  catalog() {
    return {
      drivers: drivers.filter((d) => d.is_active),
      vehicles,
      tours,
    }
  },

  slots(date: string, driverId: string) {
    if (date < minBookableDate()) {
      return {
        slots: [],
        reason: 'Bookings must be made at least 2 days in advance.',
      }
    }
    if (blockedDates.has(date)) {
      return { slots: [], reason: 'This date is unavailable.' }
    }
    const dayBlocked = unavailable.some(
      (u) =>
        u.driver_id === driverId &&
        u.unavailable_date === date &&
        u.start_time == null
    )
    if (dayBlocked) {
      return { slots: [], reason: 'Driver is unavailable on this date.' }
    }

    const blockedTimes = new Set(
      unavailable
        .filter(
          (u) =>
            u.driver_id === driverId &&
            u.unavailable_date === date &&
            u.start_time
        )
        .map((u) => normalizeTime(String(u.start_time)))
    )
    const bookedTimes = new Set(
      bookings
        .filter(
          (b) =>
            b.driver_id === driverId &&
            b.booking_date === date &&
            (b.status === 'paid' || b.status === 'pending')
        )
        .map((b) => normalizeTime(b.start_time))
    )

    return {
      slots: timeSlots
        .filter((s) => s.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((slot) => {
          const time = slot.start_time
          const available = !blockedTimes.has(time) && !bookedTimes.has(time)
          return {
            id: slot.id,
            start_time: time,
            label: slot.label,
            available,
            reason: !available
              ? blockedTimes.has(time)
                ? 'Driver blocked this slot'
                : 'Already booked'
              : null,
          }
        }),
    }
  },

  createBooking(input: {
    booking_date: string
    start_time: string
    driver_id: string
    tour_id: string
    vehicle_id: string
    client_name: string
    client_email: string
    client_phone?: string | null
    notes?: string | null
  }) {
    const time = normalizeTime(input.start_time)
    if (input.booking_date < minBookableDate()) {
      throw new Error('Bookings must be made at least 2 days in advance.')
    }
    if (blockedDates.has(input.booking_date)) {
      throw new Error('This date is blocked.')
    }
    const clash = bookings.find(
      (b) =>
        b.driver_id === input.driver_id &&
        b.booking_date === input.booking_date &&
        normalizeTime(b.start_time) === time &&
        (b.status === 'paid' || b.status === 'pending')
    )
    if (clash) throw new Error('This time slot is already booked.')

    const booking: MockBooking = {
      id: uuid(),
      driver_id: input.driver_id,
      tour_id: input.tour_id,
      vehicle_id: input.vehicle_id,
      booking_date: input.booking_date,
      start_time: time,
      status: 'pending',
      client_name: input.client_name,
      client_email: input.client_email,
      client_phone: input.client_phone || null,
      notes: input.notes || null,
      created_at: new Date().toISOString(),
    }
    bookings.push(booking)
    return booking
  },

  listBookings(driverId?: string | null, from?: string | null) {
    return bookings
      .filter((b) => (!driverId || b.driver_id === driverId) && (!from || b.booking_date >= from))
      .sort((a, b) =>
        a.booking_date === b.booking_date
          ? a.start_time.localeCompare(b.start_time)
          : a.booking_date.localeCompare(b.booking_date)
      )
      .map((b) => ({
        ...b,
        tour: tours.find((t) => t.id === b.tour_id) ?? null,
        vehicle: vehicles.find((v) => v.id === b.vehicle_id) ?? null,
      }))
  },

  updateBooking(
    id: string,
    updates: Partial<Pick<MockBooking, 'booking_date' | 'start_time' | 'status' | 'notes'>>
  ) {
    const b = bookings.find((x) => x.id === id)
    if (!b) throw new Error('Booking not found')
    if (updates.booking_date) b.booking_date = updates.booking_date
    if (updates.start_time) b.start_time = normalizeTime(updates.start_time)
    if (updates.status) b.status = updates.status
    if (updates.notes !== undefined) b.notes = updates.notes
    return b
  },

  block(input: {
    driver_id: string
    unavailable_date: string
    start_time?: string | null
    reason?: string | null
  }) {
    const row: MockUnavailable = {
      id: uuid(),
      driver_id: input.driver_id,
      unavailable_date: input.unavailable_date,
      start_time: input.start_time ? normalizeTime(input.start_time) : null,
      reason: input.reason || null,
    }
    unavailable.push(row)
    return row
  },

  unblock(id: string) {
    const i = unavailable.findIndex((u) => u.id === id)
    if (i >= 0) unavailable.splice(i, 1)
  },

  listUnavailable() {
    return [...unavailable]
  },

  recordPayment(input: {
    booking_id: string
    amount_cents: number
    external_id?: string | null
    status?: 'pending' | 'paid' | 'failed'
  }) {
    const existing = payments.find((p) => p.booking_id === input.booking_id)
    if (existing) {
      existing.amount_cents = input.amount_cents
      existing.external_id = input.external_id ?? existing.external_id
      if (input.status) existing.status = input.status
      return existing
    }
    const row: MockPayment = {
      id: uuid(),
      booking_id: input.booking_id,
      amount_cents: input.amount_cents,
      external_id: input.external_id ?? null,
      status: input.status ?? 'pending',
      paid_at: null,
    }
    payments.push(row)
    return row
  },

  confirmPayment(bookingId: string) {
    const b = bookings.find((x) => x.id === bookingId)
    if (!b) throw new Error('Booking not found')
    b.status = 'paid'
    const p = payments.find((x) => x.booking_id === bookingId)
    if (p) {
      p.status = 'paid'
      p.paid_at = new Date().toISOString()
    } else {
      payments.push({
        id: uuid(),
        booking_id: bookingId,
        amount_cents: 0,
        external_id: null,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
    }
    return { booking: b, payment: p }
  },

  getBooking(id: string) {
    return bookings.find((b) => b.id === id) ?? null
  },
}
