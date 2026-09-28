import { DISPLAY_CURRENCY_STORAGE_KEY } from './constants'
import type { DisplayCurrencyCode } from './types'
import { DISPLAY_CURRENCIES } from './types'

export function readStoredDisplayCurrency(): DisplayCurrencyCode | null {
  try {
    const raw = localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY)
    if (!raw) return null
    const up = raw.toUpperCase()
    if ((DISPLAY_CURRENCIES as readonly string[]).includes(up)) {
      return up as DisplayCurrencyCode
    }
  } catch {
    /* private mode */
  }
  return null
}

export function writeStoredDisplayCurrency(code: DisplayCurrencyCode): void {
  try {
    localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, code)
  } catch {
    /* ignore */
  }
}
