/**
 * Unit checks: default vehicle (Corolla) + shared “From” pricing.
 * Run: npx tsx scripts/pricing-corolla-from-unit.ts
 */
import assert from 'node:assert/strict'
import {
  calculatePrice,
  defaultVehicleForGuests,
  DEFAULT_STANDARD_VEHICLE_SLUG,
  formatZar,
  startingFromCents,
  type PricingTour,
  type PricingVehicle,
} from '../client/src/lib/pricing'

const vehicles: PricingVehicle[] = [
  {
    id: 'v-xl6',
    slug: 'suzuki',
    name: 'Suzuki XL6',
    capacity_min: 1,
    capacity_max: 5,
    vehicle_price_cents: 320_000,
    is_luxury: false,
  },
  {
    id: 'v-corolla',
    slug: 'corolla',
    name: 'Toyota Corolla Cross GR Sport',
    capacity_min: 1,
    capacity_max: 3,
    vehicle_price_cents: 250_000,
    is_luxury: false,
  },
  {
    id: 'v-mercedes',
    slug: 'mercedes',
    name: 'Mercedes-Benz GLC 220 Coupe',
    capacity_min: 1,
    capacity_max: 3,
    vehicle_price_cents: 450_000,
    is_luxury: true,
  },
]

const city: PricingTour = {
  id: 't-city',
  slug: 'city',
  price_per_person_cents: 40_000,
}
const winelands: PricingTour = {
  id: 't-winelands',
  slug: 'winelands',
  price_per_person_cents: 80_000,
}
const hermanus: PricingTour = {
  id: 't-hermanus',
  slug: 'hermanus',
  price_per_person_cents: 340_000,
}

const corolla = vehicles.find((v) => v.slug === DEFAULT_STANDARD_VEHICLE_SLUG)!
const xl6 = vehicles.find((v) => v.slug === 'suzuki')!

assert.equal(defaultVehicleForGuests(vehicles, 1)?.slug, 'corolla')
assert.equal(defaultVehicleForGuests(vehicles, 2)?.slug, 'corolla')
assert.equal(defaultVehicleForGuests(vehicles, 4)?.slug, 'suzuki')

assert.equal(startingFromCents(city, vehicles, 1), 290_000)
assert.equal(
  calculatePrice(city, corolla, 1, 0).grand_total_cents,
  startingFromCents(city, vehicles, 1)
)

assert.equal(calculatePrice(city, xl6, 1, 0).grand_total_cents, 360_000)
assert.equal(calculatePrice(city, corolla, 2, 0).grand_total_cents, 330_000)
assert.equal(startingFromCents(winelands, vehicles, 1), 330_000)
assert.equal(startingFromCents(hermanus, vehicles, 1), 590_000)
assert.equal(calculatePrice(hermanus, corolla, 2, 0).grand_total_cents, 930_000)

assert.equal(formatZar(290_000), 'R2,900')
assert.equal(formatZar(1_000_000), 'R10,000')
assert.equal(
  calculatePrice(city, corolla, 1, 0).grand_total_cents,
  290_000,
  'calculatePrice cents unchanged after formatZar update'
)

console.log('pricing-corolla-from-unit: ok')
