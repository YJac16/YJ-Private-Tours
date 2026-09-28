import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  cacheControlForFxSource,
  ECB_DAILY_URL,
  parseEcbDailyXml,
  type EcbRatesSnapshot,
  type FxRatesLoadResult,
  type FxRatesLoadSource,
} from '../booking-app/lib/display-currency-fx'
import { methodNotAllowed } from './_lib/http'

let lastGoodRates: EcbRatesSnapshot | null = null

export async function loadFxRatesForHandler(): Promise<FxRatesLoadResult> {
  try {
    const res = await fetch(ECB_DAILY_URL, {
      headers: { Accept: 'application/xml,text/xml,*/*' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) {
      return lastGoodRates
        ? { rates: lastGoodRates, source: 'last-good' }
        : { rates: null, source: 'none' }
    }
    const xml = await res.text()
    const parsed = parseEcbDailyXml(xml)
    if (parsed) {
      lastGoodRates = parsed
      return { rates: parsed, source: 'fresh' }
    }
    return lastGoodRates
      ? { rates: lastGoodRates, source: 'last-good' }
      : { rates: null, source: 'none' }
  } catch {
    return lastGoodRates
      ? { rates: lastGoodRates, source: 'last-good' }
      : { rates: null, source: 'none' }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const { rates, source } = await loadFxRatesForHandler()
  res.setHeader('Cache-Control', cacheControlForFxSource(source))
  return res.status(200).json({
    ok: Boolean(rates),
    rates,
    source,
  })
}

export function __resetFxRatesCacheForTests(): void {
  lastGoodRates = null
}

export function __seedFxRatesCacheForTests(snapshot: EcbRatesSnapshot): void {
  lastGoodRates = snapshot
}

export type { FxRatesLoadSource }
