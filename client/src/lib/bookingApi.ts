/**
 * Client helpers for the booking API (proxied via Vite to booking-app in dev).
 */

import type { BookingSettings, PriceBreakdown } from './pricing'

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

export type Driver = {
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

export type Vehicle = {
  id: string
  name: string
  description: string | null
  slug: string | null
  capacity_min: number
  capacity_max: number
  vehicle_price_cents: number
  vehicle_surcharge_cents?: number
  luggage_capacity: number
  features: string[]
  image_url: string | null
  is_luxury: boolean
}

export type Tour = {
  id: string
  name: string
  description: string | null
  slug: string | null
  duration_label: string | null
  included_items: string[]
  excluded_items: string[]
  image_url: string | null
  price_per_person_cents: number
  base_price_cents?: number
  additional_guest_price_cents?: number
  max_guests: number | null
  /** Rich experience page fields (optional; client merges with defaults) */
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
      arrival_time?: string
      lat?: number
      lng?: number
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
  admin_meta?: {
    weekend_price_cents?: number
    holiday_price_cents?: number
    peak_price_cents?: number
    additional_hour_price_cents?: number
    min_guests?: number
    display_order?: number
    status?: 'active' | 'draft' | 'hidden'
    recommended_vehicle_id?: string | null
  } | null
}

export type Slot = {
  id: string
  start_time: string
  label: string
  available: boolean
  reason: string | null
}

export type Catalog = {
  drivers: Driver[]
  vehicles: Vehicle[]
  tours: Tour[]
  settings: BookingSettings
  blocked_dates: string[]
  yoco_public_key?: string | null
}

export async function fetchCatalog() {
  return json<Catalog>(await fetch(`${API}/catalog`))
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
  adult_count: number
  child_count: number
  client_name: string
  client_email: string
  client_phone?: string
  client_country?: string
  pickup_address?: string
  dietary_requirements?: string
  flight_number?: string
  special_requests?: string
  notes?: string
}

export async function createBooking(
  payload: BookPayload,
  accessToken?: string | null
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  return json<{
    success: boolean
    booking_id: string
    booking_reference?: string
    payment?: boolean
    checkout_url?: string
    checkout_id?: string
    amount_cents?: number
    pricing?: PriceBreakdown
    message?: string
    warning?: string
  }>(
    await fetch(`${API}/book`, {
      method: 'POST',
      headers,
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

function pinHeaders(pin: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  // JWT / mock tokens use Bearer; legacy PIN still sent as header
  if (pin.startsWith('mock.') || pin.includes('.') || pin.length > 24) {
    headers.Authorization = `Bearer ${pin}`
  } else {
    headers['x-driver-pin'] = pin
  }
  return headers
}

export async function fetchAdminPricing(pin: string) {
  return json<{
    tours: Tour[]
    vehicles: Vehicle[]
    settings: BookingSettings
  }>(await fetch(`${API}/admin-pricing`, { headers: pinHeaders(pin) }))
}

export async function saveAdminPricing(
  pin: string,
  payload: {
    tours?: Array<{
      id: string
      price_per_person_cents?: number
      base_price_cents?: number
      additional_guest_price_cents?: number
      max_guests?: number | null
      duration_label?: string | null
      description?: string | null
      short_description?: string | null
      hero_tagline?: string | null
      detailed_description?: string | null
      hero_image_url?: string | null
      image_url?: string | null
      gallery_images?: string[] | null
      included_items?: string[]
      excluded_items?: string[]
      perfect_for?: string[] | null
      good_to_know?: string[] | null
      map_embed_url?: string | null
      seo_title?: string | null
      seo_description?: string | null
      seo_image?: string | null
      pricing_notes?: string | null
      experience_content?: Tour['experience_content']
      admin_meta?: Tour['admin_meta']
    }>
    vehicles?: Array<{
      id: string
      capacity_min?: number
      capacity_max?: number
      vehicle_price_cents?: number
      vehicle_surcharge_cents?: number
      luggage_capacity?: number
      is_luxury?: boolean
    }>
    settings?: Partial<BookingSettings>
  }
) {
  return json<{
    success: boolean
    tours: Tour[]
    vehicles: Vehicle[]
    settings: BookingSettings
  }>(
    await fetch(`${API}/admin-pricing`, {
      method: 'PATCH',
      headers: pinHeaders(pin),
      body: JSON.stringify({ ...payload, pin }),
    })
  )
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
    }>
    unavailable: Array<{
      id: string
      driver_id: string
      unavailable_date: string
      start_time: string | null
      reason: string | null
    }>
  }>(await fetch(`${API}/driver?${q}`, { headers: pinHeaders(pin) }))
}

export async function driverUpdateBooking(
  pin: string,
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
      headers: pinHeaders(pin),
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
      headers: pinHeaders(pin),
      body: JSON.stringify({ ...payload, pin }),
    })
  )
}

export async function driverUnblock(pin: string, id: string) {
  return json(
    await fetch(`${API}/driver?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: pinHeaders(pin),
    })
  )
}

export type BusinessSettings = {
  company_name?: string
  logo_url?: string
  email?: string
  whatsapp?: string
  website?: string
  social?: { instagram?: string; facebook?: string }
  prefixes?: {
    quote?: string
    booking?: string
    invoice?: string
    receipt?: string
  }
  currency?: string
  vat_percent?: number
  business_hours?: string
  discounts?: Array<{
    id: string
    code: string
    type: 'percent' | 'fixed'
    value: number
    active: boolean
  }>
  pdf_templates?: Record<
    string,
    {
      header?: string
      footer?: string
      terms?: string
      logo_url?: string
      colours?: { cream?: string; green?: string; gold?: string }
    }
  >
}

export type AdminQuote = {
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
  pdf_path?: string | null
  notes: string | null
  line_items?: unknown[]
  created_at?: string
  updated_at?: string
}

export type AdminInvoice = {
  id: string
  invoice_number: string
  quote_id: string | null
  booking_id: string | null
  booking_reference?: string | null
  customer: Record<string, unknown>
  amount_cents: number
  payment_status: string
  yoco_reference: string | null
  travel_date: string | null
  pdf_url: string | null
  created_at?: string
}

export async function fetchAdminBusiness(
  pin: string,
  resource: 'quotes' | 'invoices' | 'settings' | 'reports' | 'counters'
) {
  return json<Record<string, unknown>>(
    await fetch(`${API}/admin-business?resource=${resource}`, {
      headers: pinHeaders(pin),
    })
  )
}

export async function postAdminBusiness(
  pin: string,
  body: Record<string, unknown>
) {
  return json<Record<string, unknown>>(
    await fetch(`${API}/admin-business`, {
      method: 'POST',
      headers: pinHeaders(pin),
      body: JSON.stringify({ ...body, pin }),
    })
  )
}

export async function patchAdminBusiness(
  pin: string,
  body: Record<string, unknown>
) {
  return json<Record<string, unknown>>(
    await fetch(`${API}/admin-business`, {
      method: 'PATCH',
      headers: pinHeaders(pin),
      body: JSON.stringify({ ...body, pin }),
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

export function isBookableDate(dateStr: string, noticeDays = 2): boolean {
  if (!dateStr) return false
  return dateStr >= minBookableDate(noticeDays)
}
