import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  cacheControlForFxRates,
  ECB_DAILY_URL,
  parseEcbDailyXml,
  type EcbRatesSnapshot,
} from '../booking-app/lib/display-currency-fx'
import { methodNotAllowed } from './_lib/http'

let lastGoodRates: EcbRatesSnapshot | null = null

async function loadRates(): Promise<EcbRatesSnapshot | null> {
  try {
    const res = await fetch(ECB_DAILY_URL, {
      headers: { Accept: 'application/xml,text/xml,*/*' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return lastGoodRates
    const xml = await res.text()
    const parsed = parseEcbDailyXml(xml)
    if (parsed) {
      lastGoodRates = parsed
      return parsed
    }
    return lastGoodRates
  } catch {
    return lastGoodRates
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const rates = await loadRates()
  res.setHeader('Cache-Control', cacheControlForFxRates(rates))
  return res.status(200).json({
    ok: Boolean(rates),
    rates,
  })
}

export function __resetFxRatesCacheForTests(): void {
  lastGoodRates = null
}

export function __seedFxRatesCacheForTests(snapshot: EcbRatesSnapshot): void {
  lastGoodRates = snapshot
}
