/**
 * Malformed /api/fx-rates JSON must yield ZAR-only (null rates), never throw.
 */
import assert from 'node:assert/strict'
import {
  parseFxRatesApiBody,
  shouldShowFxDisclaimer,
} from '../booking-app/lib/display-currency-fx.ts'

function main() {
  assert.equal(parseFxRatesApiBody(null), null)
  assert.equal(parseFxRatesApiBody({ rates: {} }), null)
  assert.equal(parseFxRatesApiBody({ rates: { perEur: { USD: 1 } } }), null)
  assert.equal(parseFxRatesApiBody({ ok: true }), null)
  assert.equal(
    parseFxRatesApiBody({
      rates: { fetchedAt: 'x', perEur: { EUR: 1, ZAR: 20, USD: 1.1 } },
    })?.perEur.USD,
    1.1
  )
  assert.equal(shouldShowFxDisclaimer('USD', null), false)
  assert.equal(
    shouldShowFxDisclaimer(
      'USD',
      parseFxRatesApiBody({
        rates: { fetchedAt: 'x', perEur: { EUR: 1, ZAR: 20, USD: 1.1 } },
      })
    ),
    true
  )
  console.log('display-currency-fx-response-unit: ok')
}

main()
