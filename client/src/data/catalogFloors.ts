/**
 * Catalog floor prices for prerender / no-JS “From” lines.
 * Populated at build time from Supabase (see scripts/refresh-catalog-pricing.ts).
 */
import type { PricingTour, PricingVehicle } from '../lib/pricing'
import {
  formatFromOneGuest,
  formatZarComma,
  startingFromCents,
} from '../lib/pricing'
import { BUILD_CATALOG_PRICING } from './catalogPricing.generated'

export { CATALOG_PRICING_SNAPSHOT_FALLBACK } from './catalogPricing.snapshot'

export const FLOOR_VEHICLES: PricingVehicle[] = BUILD_CATALOG_PRICING.vehicles.map(
  (v) => ({ ...v })
)

export const FLOOR_TOURS: PricingTour[] = BUILD_CATALOG_PRICING.tours.map((t) => ({
  ...t,
  slug: t.slug,
}))

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
  return formatFromOneGuest(siteLowestFromCents())
}

export function catalogPricingBuildSource(): string {
  return BUILD_CATALOG_PRICING.source
}

/** Build-time “From R…” line for experience defaults (1 guest, default vehicle). */
export function floorFromPriceShort(slug: string): string {
  const tour = getFloorTour(slug)
  if (!tour) return ''
  return `From ${formatZarComma(startingFromCents(tour, FLOOR_VEHICLES, 1))}`
}
