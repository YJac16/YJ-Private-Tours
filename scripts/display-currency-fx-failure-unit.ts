/**
 * FX API failure paths keep last-good rates; client approx hides without throwing.
 */
import assert from 'node:assert/strict'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler, {
  __resetFxRatesCacheForTests,
  __seedFxRatesCacheForTests,
} from '../api/fx-rates.ts'
import { formatApproxLine } from '../client/src/lib/displayCurrency/fxMath.ts'

async function invoke() {
  let status = 200
  let body: Record<string, unknown> = {}
  const req = { method: 'GET', query: {}, headers: {}, url: '/api/fx-rates' } as VercelRequest
  const res = {
    status(code: number) {
      status = code
      return this
    },
    setHeader() {
      return this
    },
    json(payload: unknown) {
      body = (payload as Record<string, unknown>) || {}
      return this
    },
  } as VercelResponse
  await handler(req, res)
  return { status, body }
}

async function main() {
  __resetFxRatesCacheForTests()
  assert.equal(formatApproxLine(100_000, 'USD', null), null)

  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new Error('network down')
  }
  const first = await invoke()
  assert.equal(first.status, 200)
  assert.equal(first.body.rates, null)
  assert.equal(formatApproxLine(100_000, 'USD', null), null)

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
  assert.equal(formatApproxLine(100_000, 'USD', second.body.rates as never)?.startsWith('≈ USD'), true)

  globalThis.fetch = originalFetch
  __resetFxRatesCacheForTests()

  console.log('display-currency-fx-failure-unit: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
