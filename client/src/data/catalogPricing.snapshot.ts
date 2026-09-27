/**
 * Fallback catalog pricing when build-time Supabase fetch is unavailable.
 * Values match mock-store / live defaults (Mar 2026). Used only if refresh script cannot reach Supabase.
 */
import type { PricingTour, PricingVehicle } from '../lib/pricing'

export const CATALOG_PRICING_SNAPSHOT_FALLBACK = {
  tours: [
    { id: 'snap-city', slug: 'city', price_per_person_cents: 40_000, max_guests: 5 },
    { id: 'snap-peninsula', slug: 'peninsula', price_per_person_cents: 90_000, max_guests: 5 },
    { id: 'snap-winelands', slug: 'winelands', price_per_person_cents: 80_000, max_guests: 5 },
    { id: 'snap-sunset', slug: 'sunset', price_per_person_cents: 50_000, max_guests: 5 },
    { id: 'snap-hermanus', slug: 'hermanus', price_per_person_cents: 340_000, max_guests: 5 },
  ] satisfies PricingTour[],
  vehicles: [
    {
      id: 'snap-corolla',
      slug: 'corolla',
      name: 'Toyota Corolla Cross GR Sport',
      capacity_min: 1,
      capacity_max: 3,
      vehicle_price_cents: 250_000,
      is_luxury: false,
    },
    {
      id: 'snap-suzuki',
      slug: 'suzuki',
      name: 'Suzuki XL6',
      capacity_min: 1,
      capacity_max: 5,
      vehicle_price_cents: 320_000,
      is_luxury: false,
    },
    {
      id: 'snap-mercedes',
      slug: 'mercedes',
      name: 'Mercedes-Benz GLC 220 Coupe',
      capacity_min: 1,
      capacity_max: 3,
      vehicle_price_cents: 450_000,
      is_luxury: true,
    },
  ] satisfies PricingVehicle[],
} as const
