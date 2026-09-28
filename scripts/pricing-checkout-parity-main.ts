/**
 * Prove checkout totals unchanged vs main for explicit vehicle choices.
 * Run: npx tsx scripts/pricing-checkout-parity-main.ts
 */
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const MAIN_REF = '0065fa245578bc443b5ca43732e4561330285aea'

const require = createRequire(import.meta.url)

type Tour = {
  id: string
  slug: string
  price_per_person_cents: number
}
type Vehicle = {
  id: string
  slug: string
  name: string
  capacity_min: number
  capacity_max: number
  vehicle_price_cents: number
  is_luxury: boolean
}

const tours: Tour[] = [
  { id: 't-city', slug: 'city', price_per_person_cents: 40_000 },
  { id: 't-winelands', slug: 'winelands', price_per_person_cents: 80_000 },
  { id: 't-hermanus', slug: 'hermanus', price_per_person_cents: 340_000 },
]

const vehicles: Vehicle[] = [
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
    id: 'v-xl6',
    slug: 'suzuki',
    name: 'Suzuki XL6',
    capacity_min: 1,
    capacity_max: 5,
    vehicle_price_cents: 320_000,
    is_luxury: false,
  },
]

const corolla = vehicles.find((v) => v.slug === 'corolla')!
const xl6 = vehicles.find((v) => v.slug === 'suzuki')!

function loadPricingModule(ref: 'head' | 'main') {
  if (ref === 'head') {
    return require(path.join(root, 'booking-app/lib/pricing.ts')) as typeof import('../booking-app/lib/pricing')
  }
  const src = execSync(`git show ${MAIN_REF}:booking-app/lib/pricing.ts`, {
    cwd: root,
    encoding: 'utf8',
  })
  const tmpDir = path.join(root, '.tmp-pricing-main')
  execSync(`mkdir -p "${tmpDir}"`, { cwd: root })
  const fs = require('node:fs') as typeof import('node:fs')
  fs.writeFileSync(path.join(tmpDir, 'pricing-main.ts'), src)
  return require(path.join(tmpDir, 'pricing-main.ts')) as typeof import('../booking-app/lib/pricing')
}

function formatFrom(cents: number): string {
  const rands = Math.round(cents / 100)
  return `From R${rands.toLocaleString('en-ZA')}`
}

function main() {
  const head = loadPricingModule('head')
  const mainMod = loadPricingModule('main')

  const headFloors = require(path.join(
    root,
    'client/src/data/catalogFloors.ts'
  )) as typeof import('../client/src/data/catalogFloors')

  const mainFloorsSrc = execSync(
    `git show ${MAIN_REF}:client/src/data/catalogFloors.ts`,
    { cwd: root, encoding: 'utf8' }
  )
  const mainFloorsMatch = mainFloorsSrc.match(
    /export const FLOOR_VEHICLES[^[]*\[([\s\S]*?)\]\s*\n\nexport const FLOOR_TOURS/
  )
  assert.ok(mainFloorsMatch, 'parse main FLOOR_VEHICLES')

  const rows: Array<{
    tour: string
    vehicle: string
    guests: number
    mainTotal: number
    prTotal: number
    mainFrom: string
    prFrom: string
  }> = []

  for (const tour of tours) {
    for (const [vehicleLabel, vehicle] of [
      ['Corolla Cross', corolla],
      ['XL6', xl6],
    ] as const) {
      for (const guests of [1, 2]) {
        const mainTotal = mainMod.calculatePrice(
          tour,
          vehicle,
          guests,
          0
        ).grand_total_cents
        const prTotal = head.calculatePrice(tour, vehicle, guests, 0)
          .grand_total_cents
        assert.equal(
          prTotal,
          mainTotal,
          `${tour.slug} ${vehicleLabel} ${guests}g`
        )

        const mainFromCents = mainMod.startingFromCents(
          tour,
          vehicles,
          1
        )
        const prFromCents = head.startingFromCents(tour, vehicles, 1)
        rows.push({
          tour: tour.slug,
          vehicle: vehicleLabel,
          guests,
          mainTotal,
          prTotal,
          mainFrom: formatFrom(mainFromCents),
          prFrom: formatFrom(prFromCents),
        })
      }
    }
  }

  const prFromDisplay = (slug: string) =>
    headFloors.floorFromPriceShort(slug) ||
    formatFrom(
      head.startingFromCents(
        headFloors.getFloorTour(slug)!,
        headFloors.FLOOR_VEHICLES,
        1
      )
    )

  const mainFromForSlug = (slug: string) => {
    const t = tours.find((x) => x.slug === slug)!
    return formatFrom(mainMod.startingFromCents(t, vehicles, 1))
  }

  console.log(
    '| tour | vehicle | guests | main total | PR total | delta | From (main) | From (PR) |'
  )
  console.log('| --- | --- | ---: | ---: | ---: | ---: | --- | --- |')
  for (const r of rows) {
    const delta = r.prTotal - r.mainTotal
    const fromMain = mainFromForSlug(r.tour)
    const fromPr = prFromDisplay(r.tour)
    console.log(
      `| ${r.tour} | ${r.vehicle} | ${r.guests} | ${r.mainTotal} | ${r.prTotal} | ${delta} | ${fromMain} | ${fromPr} |`
    )
  }

  console.log('pricing-checkout-parity-main: ok (all deltas 0)')
}

main()
