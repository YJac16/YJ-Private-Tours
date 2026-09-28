import type { DisplayCurrencyCode, EcbRatesSnapshot } from './types'

/** Round to nearest 5; halves round up (152.5 → 155). */
export function roundToNearestFive(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n <= 0) return 0
  return Math.round(n / 5) * 5
}

/** ZAR major units → target major units using ECB per-EUR cross rates. */
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
  const zarToTarget = targetPerEur / zarPerEur
  return zarMajor * zarToTarget
}

export function approximateDisplayAmount(
  zarCents: number,
  target: DisplayCurrencyCode,
  rates: EcbRatesSnapshot | null
): number | null {
  if (target === 'ZAR' || !rates) return null
  const zarMajor = zarCents / 100
  const converted = convertZarMajorToDisplay(zarMajor, target, rates)
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
  const formatted = amt.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return `≈ ${target} ${formatted}`
}
