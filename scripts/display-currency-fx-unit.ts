/**
 * FX maths, ECB parse, rounding, and client approx fallback behaviour.
 */
import assert from 'node:assert/strict'
import {
  approximateDisplayAmount,
  convertZarMajorToDisplay,
  formatApproxLine,
  parseEcbDailyXml,
  roundToNearestFive,
} from '../booking-app/lib/display-currency-fx.ts'
import type { EcbRatesSnapshot } from '../booking-app/lib/display-currency-fx.ts'

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-09-01" xmlns="http://www.ecb.int/vocabulary/2002-09-01/eurofxref">
  <Cube>
    <Cube time="2026-09-26">
      <Cube currency="USD" rate="1.08"/>
      <Cube currency="GBP" rate="0.85"/>
      <Cube currency="ZAR" rate="20.50"/>
    </Cube>
  </Cube>
</gesmes:Envelope>`

function main() {
  assert.equal(roundToNearestFive(178), 180)
  assert.equal(roundToNearestFive(156), 155)
  assert.equal(roundToNearestFive(152.5), 155, 'half ties round up via Math.round')
  assert.equal(roundToNearestFive(0), 0)
  assert.equal(roundToNearestFive(2), 0)

  const rates = parseEcbDailyXml(SAMPLE_XML, '2026-09-26T00:00:00.000Z')
  assert.ok(rates?.perEur.USD === 1.08)
  assert.ok(rates?.perEur.ZAR === 20.5)

  const snapshot = rates as EcbRatesSnapshot
  const zarMajor = 2900
  const usd = convertZarMajorToDisplay(zarMajor, 'USD', snapshot)
  assert.ok(usd != null)
  const expectedUsd = (1.08 / 20.5) * zarMajor
  assert.ok(Math.abs(usd - expectedUsd) < 0.0001)

  assert.equal(formatApproxLine(290_000, 'ZAR', snapshot), null)
  assert.equal(formatApproxLine(290_000, 'USD', null), null)
  assert.equal(formatApproxLine(290_000, 'USD', snapshot)?.startsWith('≈ USD'), true)

  assert.equal(
    approximateDisplayAmount(290_000, 'USD', snapshot),
    roundToNearestFive(expectedUsd)
  )

  assert.equal(parseEcbDailyXml('<bad>'), null)
  assert.equal(formatApproxLine(100_000, 'EUR', null), null)

  console.log('display-currency-fx-unit: ok')
}

main()
