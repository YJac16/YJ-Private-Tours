/**
 * Locale → default display currency mapping.
 */
import assert from 'node:assert/strict'
import { defaultDisplayCurrencyFromLocales } from '../client/src/lib/displayCurrency/localeDefault.ts'
import { DISPLAY_CURRENCY_STORAGE_KEY } from '../client/src/lib/displayCurrency/constants.ts'
import { readStoredDisplayCurrency } from '../client/src/lib/displayCurrency/storage.ts'

function main() {
  assert.equal(defaultDisplayCurrencyFromLocales(['en-US']), 'USD')
  assert.equal(defaultDisplayCurrencyFromLocales(['en-GB']), 'GBP')
  assert.equal(defaultDisplayCurrencyFromLocales(['de-DE']), 'EUR')
  assert.equal(defaultDisplayCurrencyFromLocales(['fr-FR']), 'EUR')
  assert.equal(defaultDisplayCurrencyFromLocales(['nl-NL']), 'EUR')
  assert.equal(defaultDisplayCurrencyFromLocales(['en-IE']), 'EUR')
  assert.equal(defaultDisplayCurrencyFromLocales(['en-ZA']), 'ZAR')
  assert.equal(defaultDisplayCurrencyFromLocales(['af-ZA']), 'ZAR')
  assert.equal(defaultDisplayCurrencyFromLocales(['en']), 'USD')
  assert.equal(defaultDisplayCurrencyFromLocales(['xx-XX']), 'USD')

  // Manual stored choice is read separately (simulated via localStorage stub)
  const original = globalThis.localStorage
  const store = new Map<string, string>()
  ;(globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v)
    },
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  }
  store.set(DISPLAY_CURRENCY_STORAGE_KEY, 'GBP')
  assert.equal(readStoredDisplayCurrency(), 'GBP')
  assert.equal(defaultDisplayCurrencyFromLocales(['en-US']), 'USD')
  ;(globalThis as { localStorage?: Storage }).localStorage = original

  console.log('display-currency-locale-unit: ok')
}

main()
