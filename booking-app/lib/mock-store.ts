/**
 * In-memory booking store for local testing when Supabase is unreachable
 * or BOOKING_MOCK=1 is set.
 */

import { calculatePrice } from './pricing'

export type MockDriver = {
  id: string
  name: string
  full_name: string
  is_active: boolean
  photo_url: string | null
  languages: string[]
  years_experience: number
  bio: string | null
  rating_avg: number | null
  rating_count: number
}

export type MockVehicle = {
  id: string
  name: string
  description: string | null
  slug: string | null
  capacity_min: number
  capacity_max: number
  vehicle_price_cents: number
  vehicle_surcharge_cents: number
  luggage_capacity: number
  features: string[]
  image_url: string | null
  is_luxury: boolean
}

export type MockTour = {
  id: string
  name: string
  description: string | null
  slug: string | null
  duration_label: string | null
  included_items: string[]
  excluded_items: string[]
  image_url: string | null
  price_per_person_cents: number
  base_price_cents: number
  additional_guest_price_cents: number
  max_guests: number | null
  short_description?: string | null
  hero_tagline?: string | null
  detailed_description?: string | null
  hero_image_url?: string | null
  gallery_images?: string[] | null
  map_embed_url?: string | null
  seo_title?: string | null
  seo_description?: string | null
  seo_image?: string | null
  pricing_notes?: string | null
  perfect_for?: string[] | null
  good_to_know?: string[] | null
  experience_content?: {
    timeline?: Array<{
      title: string
      description: string
      duration?: string
      icon?: string
      image?: string
      lat?: number
      lng?: number
      arrival_time?: string
    }>
    faqs?: Array<{ question: string; answer: string }>
    display_name?: string
    short_description?: string
    hero_tagline?: string
    detailed_description?: string
    hero_image?: string
    gallery_images?: string[]
    included?: string[]
    excluded?: string[]
    perfect_for?: string[]
    good_to_know?: string[]
    map_embed_url?: string
    seo_title?: string
    seo_description?: string
    seo_image?: string
    pricing_notes?: string
    duration_label?: string
  } | null
  admin_meta?: Record<string, unknown> | null
}

export type MockQuote = {
  id: string
  quote_number: string
  status: string
  customer: Record<string, unknown>
  adults: number
  children: number
  tour_id: string | null
  vehicle_id: string | null
  travel_date: string | null
  pickup: string | null
  dropoff: string | null
  special_requests: string | null
  enquiry_source: string | null
  pricing_snapshot: Record<string, unknown> | null
  discount_cents: number
  additional_charges_cents: number
  grand_total_cents: number | null
  expires_at: string | null
  created_by: string | null
  booking_id: string | null
  pdf_url: string | null
  pdf_path: string | null
  notes: string | null
  line_items: unknown[]
  created_at: string
  updated_at: string
}

export type MockInvoice = {
  id: string
  invoice_number: string
  quote_id: string | null
  booking_id: string | null
  customer: Record<string, unknown>
  amount_cents: number
  payment_status: string
  yoco_reference: string | null
  travel_date: string | null
  pdf_url: string | null
  booking_reference: string | null
  created_at: string
}

export type MockDocumentCounter = {
  prefix: string
  next_value: number
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
  trip_status: string
  payment_status: string
  client_name: string
  client_email: string
  client_phone: string | null
  client_country: string | null
  pickup_address: string | null
  dietary_requirements: string | null
  flight_number: string | null
  special_requests: string | null
  notes: string | null
  guest_count: number
  adult_count: number
  child_count: number
  passenger_count: number
  vehicle_price_cents: number | null
  price_per_person_cents: number | null
  passenger_total_cents: number | null
  grand_total_cents: number | null
  final_price_cents: number | null
  booking_reference: string | null
  yoco_payment_reference: string | null
  driver_name_snapshot: string | null
  vehicle_name_snapshot: string | null
  tour_name_snapshot: string | null
  driver_earnings_cents: number | null
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
    full_name: 'Yaseen',
    is_active: true,
    photo_url: '/driver-yaseen.JPG',
    languages: ['English', 'Afrikaans'],
    years_experience: 8,
    bio: 'Local Cape Town guide specialising in private, flexible tours designed around your time, interests, and pace.',
    rating_avg: 5,
    rating_count: 0,
  },
]

const tours: MockTour[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'City Tour',
    description: 'Cape Town city and surrounds — Bo-Kaap, viewpoints, and cultural highlights.',
    slug: 'city',
    duration_label: '3–4 hours',
    included_items: ['Private guide', 'Hotel pickup & drop-off', 'Bottled water'],
    excluded_items: ['Entrance fees', 'Meals', 'Gratuities'],
    image_url: '/bo-kaap.jpg',
    price_per_person_cents: 40000,
    base_price_cents: 150000,
    additional_guest_price_cents: 40000,
    max_guests: 5,
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'Cape Point',
    description: 'Cape Peninsula and Cape Point — Chapman’s Peak, penguins, and dramatic cliffs.',
    slug: 'peninsula',
    duration_label: 'Full day (approx. 7–8 hours)',
    included_items: ['Private guide', 'Hotel pickup & drop-off', 'Bottled water', 'Scenic coastal drive'],
    excluded_items: ['Cape Point entrance fees', 'Penguin colony tickets', 'Meals', 'Gratuities'],
    image_url: '/cape-point.jpg',
    price_per_person_cents: 90000,
    base_price_cents: 590000,
    additional_guest_price_cents: 90000,
    max_guests: 5,
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    name: 'Winelands Tour',
    description: 'Stellenbosch / Franschhoek winelands with halal-friendly stops.',
    slug: 'winelands',
    duration_label: '5–6 hours',
    included_items: ['Private guide', 'Hotel pickup & drop-off', 'Bottled water', 'Halal-friendly stops'],
    excluded_items: ['Wine tastings', 'Meals', 'Gratuities'],
    image_url: '/winelands.jpg',
    price_per_person_cents: 80000,
    base_price_cents: 400000,
    additional_guest_price_cents: 80000,
    max_guests: 5,
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'Ocean Sunset',
    description: 'Atlantic seaboard sunset experience — Camps Bay and golden-hour viewpoints.',
    slug: 'sunset',
    duration_label: '2–3 hours',
    included_items: ['Private guide', 'Hotel pickup & drop-off', 'Bottled water'],
    excluded_items: ['Meals', 'Gratuities'],
    image_url: '/campsbay.JPG',
    price_per_person_cents: 50000,
    base_price_cents: 180000,
    additional_guest_price_cents: 50000,
    max_guests: 5,
  },
]

const vehicles: MockVehicle[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    name: 'Suzuki XL6',
    description: 'Spacious comfort for families',
    slug: 'suzuki',
    capacity_min: 1,
    capacity_max: 5,
    vehicle_price_cents: 320000,
    vehicle_surcharge_cents: 320000,
    luggage_capacity: 4,
    features: ['Air conditioning', 'Complimentary bottled water', 'Spacious for families', 'Extra luggage space'],
    image_url: '/Suzuki XL6.jpg',
    is_luxury: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    name: 'Mercedes Benz GLC 250 Coupe',
    description: 'Premium luxury experience',
    slug: 'mercedes',
    capacity_min: 1,
    capacity_max: 3,
    vehicle_price_cents: 450000,
    vehicle_surcharge_cents: 450000,
    luggage_capacity: 2,
    features: ['Premium leather interior', 'Air conditioning', 'Complimentary bottled water', 'Luxury experience'],
    image_url: '/Mercedes Benz.png',
    is_luxury: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    name: 'Toyota Corolla Cross GR Sport',
    description: 'Sporty comfort with a personal touch',
    slug: 'corolla',
    capacity_min: 1,
    capacity_max: 3,
    vehicle_price_cents: 250000,
    vehicle_surcharge_cents: 250000,
    luggage_capacity: 2,
    features: ['Air conditioning', 'Complimentary bottled water', 'Ideal for couples & small groups'],
    image_url: '/Toyota Corolla Cross.jpg',
    is_luxury: false,
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
const quotes: MockQuote[] = []
const invoices: MockInvoice[] = []
const blockedDates = new Set<string>()

const documentCounters: MockDocumentCounter[] = [
  { prefix: 'KCE-Q', next_value: 1 },
  { prefix: 'KCE-B', next_value: 1 },
  { prefix: 'KCE-INV', next_value: 1 },
  { prefix: 'KCE-R', next_value: 1 },
]

let bookingSettings = {
  max_guests_default: 5,
  allow_larger_groups: false,
}

let businessSettings: Record<string, unknown> = {
  company_name: 'Khayr Cape Experiences',
  logo_url: '',
  email: '',
  whatsapp: '',
  website: '',
  social: { instagram: '', facebook: '' },
  prefixes: {
    quote: 'KCE-Q',
    booking: 'KCE-B',
    invoice: 'KCE-INV',
    receipt: 'KCE-R',
  },
  currency: 'ZAR',
  vat_percent: 15,
  business_hours: '',
  discounts: [],
  pdf_templates: {
    quotation: {
      header: '',
      footer: '',
      terms: '',
      colours: { cream: '#F5F0E8', green: '#4D5B4A', gold: '#B08D57' },
    },
    invoice: {
      header: '',
      footer: '',
      terms: '',
      colours: { cream: '#F5F0E8', green: '#4D5B4A', gold: '#B08D57' },
    },
    receipt: {
      header: '',
      footer: '',
      terms: '',
      colours: { cream: '#F5F0E8', green: '#4D5B4A', gold: '#B08D57' },
    },
  },
}

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
      settings: { ...bookingSettings },
      blocked_dates: [...blockedDates],
    }
  },

  adminPricing() {
    return {
      tours: tours.map((t) => ({ ...t })),
      vehicles: vehicles.map((v) => ({ ...v })),
      settings: { ...bookingSettings },
    }
  },

  updateAdminPricing(body: Record<string, unknown>) {
    if (body.settings && typeof body.settings === 'object') {
      const s = body.settings as Record<string, unknown>
      bookingSettings = {
        max_guests_default: Number(s.max_guests_default) || 5,
        allow_larger_groups: Boolean(s.allow_larger_groups),
      }
    }
    const tourUpdates = body.tours as Array<Record<string, unknown>> | undefined
    if (Array.isArray(tourUpdates)) {
      for (const u of tourUpdates) {
        const t = tours.find((x) => x.id === u.id)
        if (!t) continue
        if (u.price_per_person_cents != null) {
          t.price_per_person_cents = Number(u.price_per_person_cents)
          t.additional_guest_price_cents = Number(u.price_per_person_cents)
        }
        if (u.base_price_cents != null) t.base_price_cents = Number(u.base_price_cents)
        if (u.additional_guest_price_cents != null) {
          t.additional_guest_price_cents = Number(u.additional_guest_price_cents)
          t.price_per_person_cents = Number(u.additional_guest_price_cents)
        }
        if (u.max_guests !== undefined) {
          t.max_guests = u.max_guests == null ? null : Number(u.max_guests)
        }
        if (u.duration_label !== undefined) {
          t.duration_label = u.duration_label == null ? null : String(u.duration_label)
        }
        if (u.description !== undefined) {
          t.description = u.description == null ? null : String(u.description)
        }
        if (u.short_description !== undefined) {
          t.short_description =
            u.short_description == null ? null : String(u.short_description)
        }
        if (u.hero_tagline !== undefined) {
          t.hero_tagline = u.hero_tagline == null ? null : String(u.hero_tagline)
        }
        if (u.detailed_description !== undefined) {
          t.detailed_description =
            u.detailed_description == null ? null : String(u.detailed_description)
        }
        if (u.hero_image_url !== undefined) {
          t.hero_image_url =
            u.hero_image_url == null ? null : String(u.hero_image_url)
        }
        if (u.image_url !== undefined) {
          t.image_url = u.image_url == null ? null : String(u.image_url)
        }
        if (u.map_embed_url !== undefined) {
          t.map_embed_url =
            u.map_embed_url == null ? null : String(u.map_embed_url)
        }
        if (u.seo_title !== undefined) {
          t.seo_title = u.seo_title == null ? null : String(u.seo_title)
        }
        if (u.seo_description !== undefined) {
          t.seo_description =
            u.seo_description == null ? null : String(u.seo_description)
        }
        if (u.seo_image !== undefined) {
          t.seo_image = u.seo_image == null ? null : String(u.seo_image)
        }
        if (u.pricing_notes !== undefined) {
          t.pricing_notes =
            u.pricing_notes == null ? null : String(u.pricing_notes)
        }
        if (u.gallery_images !== undefined) {
          t.gallery_images = Array.isArray(u.gallery_images)
            ? u.gallery_images.map((x) => String(x))
            : []
        }
        if (u.included_items !== undefined) {
          t.included_items = Array.isArray(u.included_items)
            ? u.included_items.map((x) => String(x))
            : []
        }
        if (u.excluded_items !== undefined) {
          t.excluded_items = Array.isArray(u.excluded_items)
            ? u.excluded_items.map((x) => String(x))
            : []
        }
        if (u.perfect_for !== undefined) {
          t.perfect_for = Array.isArray(u.perfect_for)
            ? u.perfect_for.map((x) => String(x))
            : []
        }
        if (u.good_to_know !== undefined) {
          t.good_to_know = Array.isArray(u.good_to_know)
            ? u.good_to_know.map((x) => String(x))
            : []
        }
        if (u.experience_content !== undefined) {
          t.experience_content =
            u.experience_content && typeof u.experience_content === 'object'
              ? (u.experience_content as MockTour['experience_content'])
              : null
        }
        if (u.admin_meta !== undefined) {
          t.admin_meta =
            u.admin_meta && typeof u.admin_meta === 'object'
              ? (u.admin_meta as Record<string, unknown>)
              : {}
        }
      }
    }
    const vehicleUpdates = body.vehicles as Array<Record<string, unknown>> | undefined
    if (Array.isArray(vehicleUpdates)) {
      for (const u of vehicleUpdates) {
        const v = vehicles.find((x) => x.id === u.id)
        if (!v) continue
        if (u.capacity_min != null) v.capacity_min = Number(u.capacity_min)
        if (u.capacity_max != null) v.capacity_max = Number(u.capacity_max)
        if (u.vehicle_price_cents != null) {
          v.vehicle_price_cents = Number(u.vehicle_price_cents)
          v.vehicle_surcharge_cents = Number(u.vehicle_price_cents)
        }
        if (u.vehicle_surcharge_cents != null) {
          v.vehicle_surcharge_cents = Number(u.vehicle_surcharge_cents)
          v.vehicle_price_cents = Number(u.vehicle_surcharge_cents)
        }
        if (u.luggage_capacity != null) v.luggage_capacity = Number(u.luggage_capacity)
        if (u.is_luxury !== undefined) v.is_luxury = Boolean(u.is_luxury)
      }
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
    client_country?: string | null
    pickup_address?: string | null
    dietary_requirements?: string | null
    flight_number?: string | null
    special_requests?: string | null
    notes?: string | null
    adult_count: number
    child_count: number
    passenger_count: number
    guest_count: number
    vehicle_price_cents: number
    price_per_person_cents: number
    passenger_total_cents: number
    grand_total_cents: number
    final_price_cents: number
    booking_reference: string
    driver_name_snapshot?: string | null
    vehicle_name_snapshot?: string | null
    tour_name_snapshot?: string | null
    yoco_payment_reference?: string | null
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
      trip_status: 'scheduled',
      payment_status: 'pending',
      client_name: input.client_name,
      client_email: input.client_email,
      client_phone: input.client_phone || null,
      client_country: input.client_country || null,
      pickup_address: input.pickup_address || null,
      dietary_requirements: input.dietary_requirements || null,
      flight_number: input.flight_number || null,
      special_requests: input.special_requests || null,
      notes: input.notes || input.special_requests || null,
      guest_count: input.guest_count,
      adult_count: input.adult_count,
      child_count: input.child_count,
      passenger_count: input.passenger_count,
      vehicle_price_cents: input.vehicle_price_cents,
      price_per_person_cents: input.price_per_person_cents,
      passenger_total_cents: input.passenger_total_cents,
      grand_total_cents: input.grand_total_cents,
      final_price_cents: input.final_price_cents,
      booking_reference: input.booking_reference,
      yoco_payment_reference: input.yoco_payment_reference || null,
      driver_name_snapshot: input.driver_name_snapshot || null,
      vehicle_name_snapshot: input.vehicle_name_snapshot || null,
      tour_name_snapshot: input.tour_name_snapshot || null,
      driver_earnings_cents: null,
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
        driver: drivers.find((d) => d.id === b.driver_id) ?? null,
      }))
  },

  updateBooking(
    id: string,
    updates: Partial<
      Pick<MockBooking, 'booking_date' | 'start_time' | 'status' | 'notes' | 'trip_status' | 'payment_status'>
    >
  ) {
    const b = bookings.find((x) => x.id === id)
    if (!b) throw new Error('Booking not found')
    if (updates.booking_date) b.booking_date = updates.booking_date
    if (updates.start_time) b.start_time = normalizeTime(updates.start_time)
    if (updates.status) {
      b.status = updates.status
      if (updates.status === 'paid') b.payment_status = 'paid'
      if (updates.status === 'cancelled') {
        b.payment_status = 'cancelled'
        b.trip_status = 'cancelled'
      }
    }
    if (updates.trip_status) b.trip_status = updates.trip_status
    if (updates.payment_status) b.payment_status = updates.payment_status
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
    b.payment_status = 'paid'
    const p = payments.find((x) => x.booking_id === bookingId)
    if (p) {
      p.status = 'paid'
      p.paid_at = new Date().toISOString()
      b.yoco_payment_reference = p.external_id
    } else {
      payments.push({
        id: uuid(),
        booking_id: bookingId,
        amount_cents: b.grand_total_cents || 0,
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

  listQuotes() {
    return quotes
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((q) => ({ ...q }))
  },

  createQuote(input: Record<string, unknown>) {
    const now = new Date().toISOString()
    const adults = Math.round(Number(input.adults) || 1)
    const children = Math.round(Number(input.children) || 0)
    const tourId = input.tour_id ? String(input.tour_id) : null
    const vehicleId = input.vehicle_id ? String(input.vehicle_id) : null

    let pricing_snapshot =
      input.pricing_snapshot && typeof input.pricing_snapshot === 'object'
        ? (input.pricing_snapshot as Record<string, unknown>)
        : null

    if (!pricing_snapshot && tourId && vehicleId) {
      const tour = tours.find((t) => t.id === tourId)
      const vehicle = vehicles.find((v) => v.id === vehicleId)
      if (tour && vehicle) {
        pricing_snapshot = {
          ...calculatePrice(tour, vehicle, adults, children),
        }
      }
    }

    const discount = Math.round(Number(input.discount_cents) || 0)
    const additional = Math.round(Number(input.additional_charges_cents) || 0)
    const snapTotal = Number(pricing_snapshot?.grand_total_cents) || 0
    const grand_total_cents =
      input.grand_total_cents != null
        ? Math.round(Number(input.grand_total_cents))
        : snapTotal - discount + additional

    const prefixes = businessSettings.prefixes as Record<string, string>
    const quote_number =
      input.quote_number != null
        ? String(input.quote_number)
        : this.nextDocumentNumber(prefixes?.quote || 'KCE-Q')

    const quote: MockQuote = {
      id: uuid(),
      quote_number,
      status: String(input.status || 'draft'),
      customer:
        input.customer && typeof input.customer === 'object'
          ? (input.customer as Record<string, unknown>)
          : {},
      adults,
      children,
      tour_id: tourId,
      vehicle_id: vehicleId,
      travel_date: input.travel_date != null ? String(input.travel_date) : null,
      pickup: input.pickup != null ? String(input.pickup) : null,
      dropoff: input.dropoff != null ? String(input.dropoff) : null,
      special_requests:
        input.special_requests != null ? String(input.special_requests) : null,
      enquiry_source:
        input.enquiry_source != null ? String(input.enquiry_source) : null,
      pricing_snapshot,
      discount_cents: discount,
      additional_charges_cents: additional,
      grand_total_cents,
      expires_at: input.expires_at != null ? String(input.expires_at) : null,
      created_by: input.created_by != null ? String(input.created_by) : null,
      booking_id: input.booking_id != null ? String(input.booking_id) : null,
      pdf_url: input.pdf_url != null ? String(input.pdf_url) : null,
      pdf_path: input.pdf_path != null ? String(input.pdf_path) : null,
      notes: input.notes != null ? String(input.notes) : null,
      line_items: Array.isArray(input.line_items) ? input.line_items : [],
      created_at: now,
      updated_at: now,
    }
    quotes.push(quote)
    return { ...quote }
  },

  updateQuote(id: string, input: Record<string, unknown>) {
    const q = quotes.find((x) => x.id === id)
    if (!q) throw new Error('Quote not found')

    const prevStatus = q.status
    if (input.customer && typeof input.customer === 'object') {
      q.customer = input.customer as Record<string, unknown>
    }
    if (input.adults != null) q.adults = Math.round(Number(input.adults))
    if (input.children != null) q.children = Math.round(Number(input.children))
    if (input.tour_id !== undefined) {
      q.tour_id = input.tour_id == null ? null : String(input.tour_id)
    }
    if (input.vehicle_id !== undefined) {
      q.vehicle_id = input.vehicle_id == null ? null : String(input.vehicle_id)
    }
    if (input.travel_date !== undefined) {
      q.travel_date = input.travel_date == null ? null : String(input.travel_date)
    }
    if (input.pickup !== undefined) {
      q.pickup = input.pickup == null ? null : String(input.pickup)
    }
    if (input.dropoff !== undefined) {
      q.dropoff = input.dropoff == null ? null : String(input.dropoff)
    }
    if (input.special_requests !== undefined) {
      q.special_requests =
        input.special_requests == null ? null : String(input.special_requests)
    }
    if (input.enquiry_source !== undefined) {
      q.enquiry_source =
        input.enquiry_source == null ? null : String(input.enquiry_source)
    }
    if (input.pricing_snapshot !== undefined) {
      q.pricing_snapshot =
        input.pricing_snapshot && typeof input.pricing_snapshot === 'object'
          ? (input.pricing_snapshot as Record<string, unknown>)
          : null
    }
    if (input.discount_cents != null) {
      q.discount_cents = Math.round(Number(input.discount_cents))
    }
    if (input.additional_charges_cents != null) {
      q.additional_charges_cents = Math.round(Number(input.additional_charges_cents))
    }
    if (input.grand_total_cents != null) {
      q.grand_total_cents = Math.round(Number(input.grand_total_cents))
    }
    if (input.expires_at !== undefined) {
      q.expires_at = input.expires_at == null ? null : String(input.expires_at)
    }
    if (input.pdf_url !== undefined) {
      q.pdf_url = input.pdf_url == null ? null : String(input.pdf_url)
    }
    if (input.pdf_path !== undefined) {
      q.pdf_path = input.pdf_path == null ? null : String(input.pdf_path)
    }
    if (input.notes !== undefined) {
      q.notes = input.notes == null ? null : String(input.notes)
    }
    if (input.line_items !== undefined) {
      q.line_items = Array.isArray(input.line_items) ? input.line_items : []
    }
    if (input.booking_id !== undefined) {
      q.booking_id = input.booking_id == null ? null : String(input.booking_id)
    }
    if (input.status != null) q.status = String(input.status)
    q.updated_at = new Date().toISOString()

    // status_note / changed_by accepted for API parity (history not persisted in mock)
    void input.status_note
    void input.changed_by
    void prevStatus

    return { ...q }
  },

  listInvoices() {
    return invoices
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((i) => ({ ...i }))
  },

  createInvoice(input: Record<string, unknown>) {
    const prefixes = businessSettings.prefixes as Record<string, string>
    const invoice_number =
      input.invoice_number != null
        ? String(input.invoice_number)
        : this.nextDocumentNumber(prefixes?.invoice || 'KCE-INV')

    const invoice: MockInvoice = {
      id: uuid(),
      invoice_number,
      quote_id: input.quote_id != null ? String(input.quote_id) : null,
      booking_id: input.booking_id != null ? String(input.booking_id) : null,
      customer:
        input.customer && typeof input.customer === 'object'
          ? (input.customer as Record<string, unknown>)
          : {},
      amount_cents: Math.round(Number(input.amount_cents) || 0),
      payment_status: String(input.payment_status || 'pending'),
      yoco_reference:
        input.yoco_reference != null ? String(input.yoco_reference) : null,
      travel_date: input.travel_date != null ? String(input.travel_date) : null,
      pdf_url: input.pdf_url != null ? String(input.pdf_url) : null,
      booking_reference:
        input.booking_reference != null ? String(input.booking_reference) : null,
      created_at: new Date().toISOString(),
    }
    invoices.push(invoice)
    return { ...invoice }
  },

  getBusinessSettings() {
    return { ...businessSettings }
  },

  updateBusinessSettings(patch: Record<string, unknown>) {
    const next =
      patch.settings && typeof patch.settings === 'object'
        ? (patch.settings as Record<string, unknown>)
        : Object.fromEntries(
            Object.entries(patch).filter(
              ([k]) => !['pin', 'resource', 'action', 'settings'].includes(k)
            )
          )
    businessSettings = { ...businessSettings, ...next }
    return { ...businessSettings }
  },

  listDocumentCounters() {
    return documentCounters.map((c) => ({ ...c }))
  },

  nextDocumentNumber(prefix: string) {
    let row = documentCounters.find((c) => c.prefix === prefix)
    if (!row) {
      row = { prefix, next_value: 1 }
      documentCounters.push(row)
    }
    const value = row.next_value
    row.next_value = value + 1
    return `${prefix}-${String(value).padStart(6, '0')}`
  },

  convertQuoteToBooking(
    quoteId: string,
    opts?: { driver_id?: string; start_time?: string }
  ) {
    const quote = quotes.find((q) => q.id === quoteId)
    if (!quote) throw new Error('Quote not found')
    if (quote.booking_id) throw new Error('Quote already converted')

    const customer = quote.customer || {}
    const client_name = String(
      customer.name || customer.full_name || customer.client_name || 'Guest'
    )
    const client_email = String(
      customer.email || customer.client_email || `${quote.quote_number}@quote.local`
    )
    const client_phone = customer.phone
      ? String(customer.phone)
      : customer.whatsapp
        ? String(customer.whatsapp)
        : null

    const prefixes = businessSettings.prefixes as Record<string, string>
    const booking_reference = this.nextDocumentNumber(prefixes?.booking || 'KCE-B')
    const driver_id =
      opts?.driver_id ||
      drivers[0]?.id ||
      '11111111-1111-1111-1111-111111111111'
    const start_time = normalizeTime(opts?.start_time || '08:00')
    const tour = quote.tour_id ? tours.find((t) => t.id === quote.tour_id) : null
    const vehicle = quote.vehicle_id
      ? vehicles.find((v) => v.id === quote.vehicle_id)
      : null
    const driver = drivers.find((d) => d.id === driver_id)
    const snap = quote.pricing_snapshot
    const grand =
      Number(quote.grand_total_cents) || Number(snap?.grand_total_cents) || 0

    const booking: MockBooking = {
      id: uuid(),
      driver_id,
      tour_id: quote.tour_id || tours[0].id,
      vehicle_id: quote.vehicle_id || vehicles[0].id,
      booking_date: quote.travel_date || new Date().toISOString().slice(0, 10),
      start_time,
      status: 'pending',
      trip_status: 'scheduled',
      payment_status: 'pending',
      client_name,
      client_email,
      client_phone,
      client_country: null,
      pickup_address: quote.pickup,
      dietary_requirements: null,
      flight_number: null,
      special_requests: quote.special_requests,
      notes: quote.notes,
      guest_count: quote.adults + quote.children,
      adult_count: quote.adults,
      child_count: quote.children,
      passenger_count: quote.adults + quote.children,
      vehicle_price_cents: Number(snap?.vehicle_price_cents) || 0,
      price_per_person_cents: Number(snap?.price_per_person_cents) || 0,
      passenger_total_cents: Number(snap?.passenger_total_cents) || 0,
      grand_total_cents: grand,
      final_price_cents: grand,
      booking_reference,
      yoco_payment_reference: null,
      driver_name_snapshot: driver?.full_name || driver?.name || null,
      vehicle_name_snapshot: vehicle?.name || null,
      tour_name_snapshot: tour?.name || null,
      driver_earnings_cents: null,
      created_at: new Date().toISOString(),
    }
    bookings.push(booking)

    const invoice = this.createInvoice({
      quote_id: quote.id,
      booking_id: booking.id,
      customer: quote.customer,
      amount_cents: grand,
      payment_status: 'pending',
      travel_date: quote.travel_date,
      booking_reference,
    })

    quote.booking_id = booking.id
    quote.status = 'awaiting_payment'
    quote.updated_at = new Date().toISOString()

    return { quote: { ...quote }, booking, invoice }
  },

  reports() {
    const byBookingStatus: Record<string, number> = {}
    let revenue = 0
    const tourCounts: Record<string, number> = {}
    const vehicleCounts: Record<string, number> = {}

    for (const b of bookings) {
      byBookingStatus[b.status] = (byBookingStatus[b.status] || 0) + 1
      if (b.status === 'paid') revenue += b.grand_total_cents || 0
      tourCounts[b.tour_id] = (tourCounts[b.tour_id] || 0) + 1
      vehicleCounts[b.vehicle_id] = (vehicleCounts[b.vehicle_id] || 0) + 1
    }

    const byQuoteStatus: Record<string, number> = {}
    let converted = 0
    for (const q of quotes) {
      byQuoteStatus[q.status] = (byQuoteStatus[q.status] || 0) + 1
      if (q.booking_id) converted += 1
    }

    const paidCount = byBookingStatus.paid || 0
    return {
      bookings: {
        count: bookings.length,
        revenue_cents: revenue,
        by_status: byBookingStatus,
      },
      quotes: {
        count: quotes.length,
        by_status: byQuoteStatus,
        conversion_rate: quotes.length ? converted / quotes.length : 0,
      },
      aov_cents: paidCount ? Math.round(revenue / paidCount) : 0,
      popular_tours: Object.entries(tourCounts)
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      popular_vehicles: Object.entries(vehicleCounts)
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    }
  },
}
