/**
 * Unit checks for seasonal visibility + Hermanus starting-from pricing.
 * Run: npx tsx scripts/phase7-hermanus-unit.ts
 */
import assert from 'node:assert/strict'
import {
  isDateInSeason,
  isTourPubliclyVisible,
  WHALE_SEASON,
} from '../client/src/lib/seasonalVisibility'
import {
  startingFromCents,
  type PricingTour,
  type PricingVehicle,
} from '../client/src/lib/pricing'

function d(iso: string) {
  return new Date(`${iso}T12:00:00+02:00`)
}

const hermanus = {
  slug: 'hermanus',
  admin_meta: {
    status: 'active',
    season: {
      start: { m: 6, d: 1 },
      end: { m: 10, d: 31 },
      tz: 'Africa/Johannesburg',
    },
  },
}

assert.equal(isDateInSeason(d('2026-05-31'), WHALE_SEASON), false)
assert.equal(isDateInSeason(d('2026-06-01'), WHALE_SEASON), true)
assert.equal(isDateInSeason(d('2026-10-31'), WHALE_SEASON), true)
assert.equal(isDateInSeason(d('2026-11-01'), WHALE_SEASON), false)
assert.equal(isDateInSeason(d('2027-01-01'), WHALE_SEASON), false)
assert.equal(isDateInSeason(d('2027-05-31'), WHALE_SEASON), false)
assert.equal(isDateInSeason(d('2027-06-01'), WHALE_SEASON), true)
assert.equal(isDateInSeason('2026-08-15', WHALE_SEASON), true)
assert.equal(isDateInSeason('2026-12-01', WHALE_SEASON), false)

assert.equal(isTourPubliclyVisible(hermanus, d('2026-08-10')), true)
assert.equal(isTourPubliclyVisible(hermanus, d('2026-11-02')), false)
assert.equal(
  isTourPubliclyVisible(hermanus, d('2026-08-10'), {
    travelDate: '2026-11-15',
  }),
  false
)
assert.equal(
  isTourPubliclyVisible(hermanus, d('2026-08-10'), {
    travelDate: '2026-07-01',
  }),
  true
)

const tour: PricingTour = {
  id: 't1',
  slug: 'hermanus',
  price_per_person_cents: 340000,
}
const vehicles: PricingVehicle[] = [
  {
    id: 'v1',
    slug: 'corolla',
    name: 'Toyota Corolla Cross GR Sport',
    capacity_min: 1,
    capacity_max: 3,
    vehicle_price_cents: 250000,
    is_luxury: false,
  },
  {
    id: 'v2',
    slug: 'suzuki',
    name: 'Suzuki XL6',
    capacity_min: 1,
    capacity_max: 5,
    vehicle_price_cents: 320000,
    is_luxury: false,
  },
  {
    id: 'v3',
    slug: 'mercedes',
    name: 'Mercedes-Benz GLC 220 Coupe',
    capacity_min: 1,
    capacity_max: 3,
    vehicle_price_cents: 450000,
    is_luxury: true,
  },
]

assert.equal(startingFromCents(tour, vehicles, 1), 590000)
assert.equal(startingFromCents(tour, vehicles, 3), 250000 + 340000 * 3)

console.log('phase7-hermanus-unit: OK')
