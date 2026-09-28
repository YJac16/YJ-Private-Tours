/**
 * Public crawler/marketing copy uses From ZAR; admin/receipts stay R; JSON-LD numerics unchanged.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { renderRouteBody } from '../client/src/seo/prerender/renderRouteBody.tsx'
import { buildLocalBusinessJsonLd, buildTouristTripJsonLd } from '../client/src/seo/routes.ts'
import { siteLowestFromLabel } from '../client/src/data/catalogFloors.ts'
import { EXPERIENCE_DEFAULTS } from '../client/src/data/experienceDefaults.ts'
import { FLOOR_VEHICLES, getFloorTour } from '../client/src/data/catalogFloors.ts'
import { formatZar, startingFromCents } from '../client/src/lib/pricing.ts'
import { tourSummaryLines } from '../client/src/seo/prerender/renderRouteBody.tsx'

const require = createRequire(import.meta.url)
const React = require('../client/node_modules/react')
const FROM_R_DIGIT = /From R[\d,]/

/** tsx + classic JSX in some prerender components expect React in scope */
;(globalThis as typeof globalThis & { React: typeof React }).React = React

function assertPublicZarHtml(label: string, html: string) {
  assert.match(html, /From ZAR [\d,]+/, `${label} should include From ZAR …`)
  assert.ok(!FROM_R_DIGIT.test(html), `${label} must not include From R… public price`)
}

function main() {
  assertPublicZarHtml('/', renderRouteBody('/'))
  assertPublicZarHtml('/book', renderRouteBody('/book'))
  assertPublicZarHtml('/experience/city', renderRouteBody('/experience/city'))

  const floor = siteLowestFromLabel()
  assert.match(floor, /^From ZAR [\d,]+ /)
  assert.ok(!FROM_R_DIGIT.test(floor))

  execSync('npx tsx scripts/generate-llms-txt.ts', { stdio: 'pipe' })
  const llms = fs.readFileSync(
    path.join(process.cwd(), 'client/dist/llms.txt'),
    'utf8'
  )
  assert.match(llms, /From ZAR/)
  assert.ok(!/R2,900/.test(llms), 'llms should not use R2,900-style public floor')
  assert.ok(!FROM_R_DIGIT.test(llms))

  const lowest = siteLowestFromLabel()
  const ld = buildLocalBusinessJsonLd()
  assert.equal(ld.priceRange, lowest)
  assert.match(String(ld.priceRange), /^From ZAR/)
  assert.ok(!FROM_R_DIGIT.test(String(ld.priceRange)))

  const expectedPrices: Record<string, string> = {
    city: '2900',
    winelands: '3300',
    hermanus: '5900',
  }
  for (const [slug, price] of Object.entries(expectedPrices)) {
    const tour = getFloorTour(slug)
    assert.ok(tour)
    const fromCents = startingFromCents(tour, FLOOR_VEHICLES, 1)
    const trip = buildTouristTripJsonLd(slug, EXPERIENCE_DEFAULTS[slug], fromCents)
    const offers = trip.offers as { priceCurrency?: string; price?: string }
    assert.equal(offers.priceCurrency, 'ZAR')
    assert.equal(offers.price, price)
  }

  assert.equal(formatZar(290_000), 'R2,900')

  for (const line of tourSummaryLines()) {
    assert.match(line, /From ZAR/)
    assert.ok(!FROM_R_DIGIT.test(line))
  }

  console.log('display-currency-public-zar-wording-unit: ok')
}

main()
