/**
 * Pure Display Currency FX helpers (server + client safe). No React.
 */

export const ECB_DAILY_URL =
  'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'

export const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'ZAR'] as const
export type DisplayCurrencyCode = (typeof DISPLAY_CURRENCIES)[number]

export type EcbRatesSnapshot = {
  fetchedAt: string
  perEur: Record<string, number>
}

export function parseEcbDailyXml(
  xml: string,
  fetchedAt = new Date().toISOString()
): EcbRatesSnapshot | null {
  if (!xml || !xml.includes('Cube')) return null
  const perEur: Record<string, number> = { EUR: 1 }
  const re = /currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const code = m[1]
    const rate = Number(m[2])
    if (code && Number.isFinite(rate) && rate > 0) {
      perEur[code] = rate
    }
  }
  if (!perEur.ZAR || perEur.ZAR <= 0) return null
  return { fetchedAt, perEur }
}

export function isValidEcbRatesSnapshot(value: unknown): value is EcbRatesSnapshot {
  if (!value || typeof value !== 'object') return false
  const perEur = (value as EcbRatesSnapshot).perEur
  if (!perEur || typeof perEur !== 'object') return false
  const zar = Number(perEur.ZAR)
  if (!Number.isFinite(zar) || zar <= 0) return false
  for (const v of Object.values(perEur)) {
    const n = Number(v)
    if (!Number.isFinite(n) || n <= 0) return false
  }
  return typeof (value as EcbRatesSnapshot).fetchedAt === 'string'
}

/** Parse GET /api/fx-rates JSON; invalid → null (ZAR-only UI). Never throws. */
export function parseFxRatesApiBody(body: unknown): EcbRatesSnapshot | null {
  try {
    if (!body || typeof body !== 'object') return null
    const rates = (body as { rates?: unknown }).rates
    if (rates == null) return null
    if (!isValidEcbRatesSnapshot(rates)) return null
    return rates
  } catch {
    return null
  }
}

export type FxRatesLoadSource = 'fresh' | 'last-good' | 'none'

export type FxRatesLoadResult = {
  rates: EcbRatesSnapshot | null
  source: FxRatesLoadSource
}

export function cacheControlForFxSource(source: FxRatesLoadSource): string {
  if (source === 'fresh') {
    return 'public, s-maxage=86400, stale-while-revalidate=86400'
  }
  return 'public, s-maxage=300, stale-while-revalidate=60'
}

/** @deprecated use cacheControlForFxSource */
export function cacheControlForFxRates(rates: EcbRatesSnapshot | null): string {
  return cacheControlForFxSource(rates ? 'fresh' : 'none')
}

/** Round to nearest 5; halves round up (152.5 → 155). */
export function roundToNearestFive(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n <= 0) return 0
  return Math.round(n / 5) * 5
}

export function convertZarMajorToDisplay(
  zarMajor: number,
  target: DisplayCurrencyCode,
  rates: EcbRatesSnapshot
): number | null {
  if (target === 'ZAR') return zarMajor
  const zarPerEur = rates.perEur.ZAR
  const targetPerEur = rates.perEur[target]
  if (!zarPerEur || !targetPerEur || zarPerEur <= 0 || targetPerEur <= 0) {
    return null
  }
  return (zarMajor * targetPerEur) / zarPerEur
}

export function approximateDisplayAmount(
  zarCents: number,
  target: DisplayCurrencyCode,
  rates: EcbRatesSnapshot | null
): number | null {
  if (target === 'ZAR' || !rates) return null
  const converted = convertZarMajorToDisplay(zarCents / 100, target, rates)
  if (converted == null || !Number.isFinite(converted)) return null
  return roundToNearestFive(converted)
}

export function formatApproxLine(
  zarCents: number,
  target: DisplayCurrencyCode,
  rates: EcbRatesSnapshot | null
): string | null {
  if (target === 'ZAR' || !rates) return null
  const amt = approximateDisplayAmount(zarCents, target, rates)
  if (amt == null) return null
  return `≈ ${target} ${amt.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function fxRatesAvailable(rates: EcbRatesSnapshot | null): boolean {
  return Boolean(
    rates?.perEur?.ZAR &&
      rates.perEur.ZAR > 0 &&
      DISPLAY_CURRENCIES.some(
        (c) => c !== 'ZAR' && rates!.perEur[c] && rates!.perEur[c]! > 0
      )
  )
}

export function shouldShowFxDisclaimer(
  currency: DisplayCurrencyCode,
  rates: EcbRatesSnapshot | null
): boolean {
  if (currency === 'ZAR' || !rates) return false
  const targetPerEur = rates.perEur[currency]
  return Boolean(rates.perEur.ZAR && targetPerEur && targetPerEur > 0)
}
