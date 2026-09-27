/**
 * Static catalog floor prices for first-paint / no-JS displays.
 * Mirrors booking-app/lib/mock-store.ts defaults — update when admin pricing changes materially.
 */
import type { PricingTour, PricingVehicle } from '../lib/pricing'
import { formatZar, startingFromCents } from '../lib/pricing'

export const FLOOR_VEHICLES: PricingVehicle[] = [
  {
    id: 'floor-suzuki',
    slug: 'suzuki',
    name: 'Suzuki XL6',
    capacity_min: 1,
    capacity_max: 5,
    vehicle_price_cents: 320_000,
    is_luxury: false,
  },
  {
    id: 'floor-corolla',
    slug: 'corolla',
    name: 'Toyota Corolla Cross GR Sport',
    capacity_min: 1,
    capacity_max: 3,
    vehicle_price_cents: 250_000,
    is_luxury: false,
  },
  {
    id: 'floor-mercedes',
    slug: 'mercedes',
    name: 'Mercedes-Benz GLC 220 Coupe',
    capacity_min: 1,
    capacity_max: 3,
    vehicle_price_cents: 450_000,
    is_luxury: true,
  },
]

export const FLOOR_TOURS: PricingTour[] = [
  {
    id: 'floor-city',
    slug: 'city',
    price_per_person_cents: 40_000,
    max_guests: 5,
  },
  {
    id: 'floor-peninsula',
    slug: 'peninsula',
    price_per_person_cents: 90_000,
    max_guests: 5,
  },
  {
    id: 'floor-winelands',
    slug: 'winelands',
    price_per_person_cents: 80_000,
    max_guests: 5,
  },
  {
    id: 'floor-sunset',
    slug: 'sunset',
    price_per_person_cents: 50_000,
    max_guests: 5,
  },
  {
    id: 'floor-hermanus',
    slug: 'hermanus',
    price_per_person_cents: 340_000,
    max_guests: 5,
  },
]

export function getFloorTour(slug: string): PricingTour | undefined {
  return FLOOR_TOURS.find((t) => t.slug === slug)
}

export function resolveTourPricing(
  slug: string,
  catalogTour?: PricingTour | null
): PricingTour | undefined {
  return catalogTour ?? getFloorTour(slug)
}

export function siteLowestFromCents(): number {
  let min = Number.POSITIVE_INFINITY
  for (const tour of FLOOR_TOURS) {
    const cents = startingFromCents(tour, FLOOR_VEHICLES, 1)
    if (cents < min) min = cents
  }
  return min
}

export function siteLowestFromLabel(): string {
  return `From ${formatZar(siteLowestFromCents())}`
}
