/**
 * JSON-LD offer prices stay ZAR numerics; llms.txt generator still uses legacy R floor label.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { buildTouristTripJsonLd } from '../client/src/seo/routes.ts'
import { siteLowestFromLabel } from '../client/src/data/catalogFloors.ts'
import { EXPERIENCE_DEFAULTS } from '../client/src/data/experienceDefaults.ts'
import { FLOOR_VEHICLES, getFloorTour } from '../client/src/data/catalogFloors.ts'
import { startingFromCents } from '../client/src/lib/pricing.ts'

function main() {
  const expectedPrices: Record<string, string> = {
    city: '2900',
    winelands: '3300',
    hermanus: '5900',
  }

  for (const [slug, price] of Object.entries(expectedPrices)) {
    const tour = getFloorTour(slug)
    assert.ok(tour, slug)
    const fromCents = startingFromCents(tour, FLOOR_VEHICLES, 1)
    const ld = buildTouristTripJsonLd(
      slug,
      EXPERIENCE_DEFAULTS[slug],
      fromCents
    )
    const offers = ld.offers as { priceCurrency?: string; price?: string }
    assert.equal(offers.priceCurrency, 'ZAR')
    assert.equal(offers.price, price)
  }

  const label = siteLowestFromLabel()
  assert.match(label, /^From R[\d,]+ /, 'llms.txt floor line must stay legacy R format')

  const llmsScript = fs.readFileSync(
    path.join(process.cwd(), 'scripts/generate-llms-txt.ts'),
    'utf8'
  )
  assert.ok(llmsScript.includes('siteLowestFromLabel()'))

  console.log('display-currency-jsonld-llms-unit: ok')
}

main()
