import { DISPLAY_CURRENCY_STORAGE_KEY } from './constants'
import { defaultDisplayCurrencyFromLocales } from './localeDefault'
import type { DisplayCurrencyCode } from './types'
import { readStoredDisplayCurrency } from './storage'

/** Stored manual choice beats locale detection (same as /book provider init). */
export function resolveDisplayCurrencyPreference(
  languages: readonly string[] | null | undefined
): DisplayCurrencyCode {
  return (
    readStoredDisplayCurrency() ??
    defaultDisplayCurrencyFromLocales(languages)
  )
}

export { DISPLAY_CURRENCY_STORAGE_KEY }
