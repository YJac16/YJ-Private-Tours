/**
 * Pricing engine — Grand Total = Vehicle Price + (Price Per Person × Passenger Count)
 * Keep in sync with client/src/lib/pricing.ts
 */

export type PricingTour = {
  id: string
  slug: string | null
  price_per_person_cents: number
  max_guests?: number | null
  /** @deprecated kept for catalog display fallbacks */
  base_price_cents?: number
  additional_guest_price_cents?: number
}

export type PricingVehicle = {
  id: string
  slug: string | null
  name: string
  capacity_min: number
  capacity_max: number
  vehicle_price_cents: number
  is_luxury: boolean
  /** @deprecated alias — prefer vehicle_price_cents */
  vehicle_surcharge_cents?: number
}

export type BookingSettings = {
  max_guests_default: number
  allow_larger_groups: boolean
}

export type PriceBreakdown = {
  adult_count: number
  child_count: number
  passenger_count: number
  vehicle_price_cents: number
  price_per_person_cents: number
  passenger_total_cents: number
  grand_total_cents: number
  /** Alias for API/payment compatibility */
  final_price_cents: number
}

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  max_guests_default: 5,
  allow_larger_groups: false,
}

export function parseBookingSettings(
  raw: { max_guests_default?: number; allow_larger_groups?: boolean } | null
): BookingSettings {
  if (!raw) return DEFAULT_BOOKING_SETTINGS
  return {
    max_guests_default: Number(raw.max_guests_default) || 5,
    allow_larger_groups: Boolean(raw.allow_larger_groups),
  }
}

export function maxGuestsForTour(
  tour: PricingTour,
  settings: BookingSettings
): number {
  if (settings.allow_larger_groups && tour.max_guests != null) {
    return tour.max_guests
  }
  if (tour.max_guests != null && tour.max_guests < settings.max_guests_default) {
    return tour.max_guests
  }
  return settings.max_guests_default
}

export function vehicleFitsGuests(
  vehicle: PricingVehicle,
  passengerCount: number
): boolean {
  return (
    passengerCount >= vehicle.capacity_min &&
    passengerCount <= vehicle.capacity_max
  )
}

export function vehiclesForGuestCount(
  vehicles: PricingVehicle[],
  passengerCount: number
): PricingVehicle[] {
  return vehicles.filter((v) => vehicleFitsGuests(v, passengerCount))
}

/** Default standard vehicle by capacity (luxury never auto-selected). */
export function defaultVehicleForGuests(
  vehicles: PricingVehicle[],
  passengerCount: number
): PricingVehicle | null {
  const standard = vehicles.filter(
    (v) => !v.is_luxury && vehicleFitsGuests(v, passengerCount)
  )
  if (!standard.length) return null
  if (passengerCount <= 3) {
    return [...standard].sort((a, b) => a.capacity_max - b.capacity_max)[0]
  }
  return [...standard].sort((a, b) => b.capacity_min - a.capacity_min)[0]
}

export function resolveVehiclePrice(vehicle: PricingVehicle): number {
  if (vehicle.vehicle_price_cents != null && vehicle.vehicle_price_cents > 0) {
    return vehicle.vehicle_price_cents
  }
  return Number(vehicle.vehicle_surcharge_cents) || 0
}

export function resolvePricePerPerson(tour: PricingTour): number {
  if (tour.price_per_person_cents != null) {
    return tour.price_per_person_cents
  }
  return (
    Number(tour.additional_guest_price_cents) ||
    Number(tour.base_price_cents) ||
    0
  )
}

/**
 * Grand Total = Vehicle Price + (Price Per Person × Passenger Count)
 */
export function calculatePrice(
  tour: PricingTour,
  vehicle: PricingVehicle,
  adultCount: number,
  childCount = 0
): PriceBreakdown {
  const adults = Math.max(0, Math.round(adultCount))
  const children = Math.max(0, Math.round(childCount))
  const passenger_count = adults + children
  const vehicle_price_cents = resolveVehiclePrice(vehicle)
  const price_per_person_cents = resolvePricePerPerson(tour)
  const passenger_total_cents = passenger_count * price_per_person_cents
  const grand_total_cents = vehicle_price_cents + passenger_total_cents

  return {
    adult_count: adults,
    child_count: children,
    passenger_count,
    vehicle_price_cents,
    price_per_person_cents,
    passenger_total_cents,
    grand_total_cents,
    final_price_cents: grand_total_cents,
  }
}

export function validateBookingGuests(
  adultCount: number,
  childCount: number,
  tour: PricingTour,
  vehicle: PricingVehicle,
  settings: BookingSettings
): string | null {
  const adults = Math.round(adultCount)
  const children = Math.round(childCount)
  if (!Number.isInteger(adults) || adults < 1) {
    return 'At least 1 adult is required.'
  }
  if (!Number.isInteger(children) || children < 0) {
    return 'Child count cannot be negative.'
  }
  const passengerCount = adults + children
  const max = maxGuestsForTour(tour, settings)
  if (passengerCount > max) {
    return settings.allow_larger_groups
      ? `This tour allows up to ${max} guests.`
      : 'Maximum 5 guests per booking. Contact us for larger groups.'
  }
  if (!vehicleFitsGuests(vehicle, passengerCount)) {
    return `${vehicle.name} fits ${vehicle.capacity_min}–${vehicle.capacity_max} passengers. Please choose another vehicle or adjust guest count.`
  }
  return null
}

export function formatZar(cents: number): string {
  return `R${(cents / 100).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

export function formatTourFromPrice(tour: PricingTour, vehiclePriceCents = 0): string {
  const ppp = resolvePricePerPerson(tour)
  const from = vehiclePriceCents + ppp
  return `From ${formatZar(from)}`
}

export function formatTourPaxRate(tour: PricingTour): string {
  return `${formatZar(resolvePricePerPerson(tour))} per person`
}

export function formatTourPriceLine(tour: PricingTour, vehiclePriceCents = 0): string {
  return `${formatTourFromPrice(tour, vehiclePriceCents)} · ${formatTourPaxRate(tour)}`
}

export function generateBookingReference(): string {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase()
  const day = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  return `KC-${day}-${part}`
}
