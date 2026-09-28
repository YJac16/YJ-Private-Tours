/**
 * FX API failure paths keep last-good rates; client approx hides without throwing.
 */
import assert from 'node:assert/strict'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  cacheControlForFxSource,
  shouldShowFxDisclaimer,
} from '../booking-app/lib/display-currency-fx.ts'
import handler, {
  __resetFxRatesCacheForTests,
  __seedFxRatesCacheForTests,
} from '../api/fx-rates.ts'
import { formatApproxLine } from '../booking-app/lib/display-currency-fx.ts'

async function invoke() {
  let status = 200
  let body: Record<string, unknown> = {}
  let cacheControl = ''
  const req = { method: 'GET', query: {}, headers: {}, url: '/api/fx-rates' } as VercelRequest
  const res = {
    status(code: number) {
      status = code
      return this
    },
    setHeader(name: string, value: string) {
      if (name.toLowerCase() === 'cache-control') cacheControl = value
      return this
    },
    json(payload: unknown) {
      body = (payload as Record<string, unknown>) || {}
      return this
    },
  } as VercelResponse
  await handler(req, res)
  return { status, body, cacheControl }
}

async function main() {
  __resetFxRatesCacheForTests()
  assert.equal(formatApproxLine(100_000, 'USD', null), null)
  assert.equal(shouldShowFxDisclaimer('USD', null), false)

  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new Error('network down')
  }
  const first = await invoke()
  assert.equal(first.status, 200)
  assert.equal(first.body.rates, null)
  assert.ok(first.cacheControl.includes('s-maxage=300'))
  assert.ok(!first.cacheControl.includes('s-maxage=86400'))
  assert.equal(shouldShowFxDisclaimer('USD', null), false)

  __seedFxRatesCacheForTests({
    fetchedAt: '2026-01-01',
    perEur: { EUR: 1, USD: 1.1, GBP: 0.9, ZAR: 20 },
  })

  globalThis.fetch = async () =>
    ({
      ok: false,
      status: 503,
      text: async () => '',
    }) as Response

  const second = await invoke()
  assert.ok(second.body.rates)
  assert.ok(second.cacheControl.includes('s-maxage=300'))
  assert.ok(!second.cacheControl.includes('s-maxage=86400'))
  assert.equal(
    formatApproxLine(100_000, 'USD', second.body.rates as never)?.startsWith('≈ USD'),
    true
  )
  assert.equal(shouldShowFxDisclaimer('USD', second.body.rates as never), true)

  assert.equal(cacheControlForFxSource('last-good').includes('s-maxage=300'), true)
  assert.equal(cacheControlForFxSource('fresh').includes('s-maxage=86400'), true)

  globalThis.fetch = originalFetch
  __resetFxRatesCacheForTests()

  console.log('display-currency-fx-failure-unit: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
