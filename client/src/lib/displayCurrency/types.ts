export const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'ZAR'] as const
export type DisplayCurrencyCode = (typeof DISPLAY_CURRENCIES)[number]

export type EcbRatesSnapshot = {
  fetchedAt: string
  /** Units of currency per 1 EUR */
  perEur: Record<string, number>
}

export type DisplayCurrencyRatesResponse = {
  ok: boolean
  rates: EcbRatesSnapshot | null
  stale?: boolean
}
