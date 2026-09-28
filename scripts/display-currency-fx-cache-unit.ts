/**
 * FX cache headers: fresh 86400, last-good after failure 300, none 300.
 */
import assert from 'node:assert/strict'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cacheControlForFxSource } from '../booking-app/lib/display-currency-fx.ts'
import handler, {
  __resetFxRatesCacheForTests,
  __seedFxRatesCacheForTests,
} from '../api/fx-rates.ts'

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Cube><Cube time="2026-09-28"><Cube currency="USD" rate="1.08"/><Cube currency="ZAR" rate="20.50"/></Cube></Cube>`

async function invoke() {
  let cacheControl = ''
  const req = { method: 'GET', query: {}, headers: {}, url: '/api/fx-rates' } as VercelRequest
  const res = {
    status() {
      return this
    },
    setHeader(name: string, value: string) {
      if (name.toLowerCase() === 'cache-control') cacheControl = value
      return this
    },
    json() {
      return this
    },
  } as VercelResponse
  await handler(req, res)
  return cacheControl
}

async function main() {
  assert.ok(cacheControlForFxSource('fresh').includes('s-maxage=86400'))
  assert.ok(!cacheControlForFxSource('fresh').includes('s-maxage=300'))
  assert.ok(cacheControlForFxSource('last-good').includes('s-maxage=300'))
  assert.ok(!cacheControlForFxSource('last-good').includes('s-maxage=86400'))
  assert.ok(cacheControlForFxSource('none').includes('s-maxage=300'))

  const originalFetch = globalThis.fetch
  __resetFxRatesCacheForTests()

  globalThis.fetch = async () =>
    ({
      ok: true,
      status: 200,
      text: async () => SAMPLE_XML,
    }) as Response
  const freshCache = await invoke()
  assert.ok(freshCache.includes('s-maxage=86400'))

  __seedFxRatesCacheForTests({
    fetchedAt: '2026-01-01',
    perEur: { EUR: 1, USD: 1.1, ZAR: 20 },
  })
  globalThis.fetch = async () => {
    throw new Error('ecb down')
  }
  const staleCache = await invoke()
  assert.ok(staleCache.includes('s-maxage=300'))
  assert.ok(!staleCache.includes('s-maxage=86400'))

  __resetFxRatesCacheForTests()
  const noneCache = await invoke()
  assert.ok(noneCache.includes('s-maxage=300'))

  globalThis.fetch = originalFetch
  __resetFxRatesCacheForTests()

  console.log('display-currency-fx-cache-unit: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
