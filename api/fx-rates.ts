import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ECB_DAILY_URL } from '../client/src/lib/displayCurrency/constants'
import { parseEcbDailyXml } from '../client/src/lib/displayCurrency/ecbParse'
import type { EcbRatesSnapshot } from '../client/src/lib/displayCurrency/types'
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
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=86400'
  )
  return res.status(200).json({
    ok: Boolean(rates),
    rates,
  })
}

/** Test hook: reset in-memory fallback between unit tests. */
export function __resetFxRatesCacheForTests(): void {
  lastGoodRates = null
}

/** Test hook: seed last-good without network. */
export function __seedFxRatesCacheForTests(snapshot: EcbRatesSnapshot): void {
  lastGoodRates = snapshot
}
