/**
 * Admin API handlers import and respond (mock store).
 * Run: npx tsx scripts/admin-api-handlers-unit.ts
 */
import assert from 'node:assert/strict'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import adminTrips from '../api/admin-trips.ts'

process.env.BOOKING_MOCK = '1'

function mockToken(role: string, id: string, email: string) {
  return `mock.${role}.${id}.${encodeURIComponent(email)}`
}

async function invokeAdmin(
  handler: typeof adminTrips,
  opts: { query?: Record<string, string>; method?: string }
) {
  let status = 200
  let payload: Record<string, unknown> = {}
  const req = {
    method: opts.method || 'GET',
    query: opts.query || {},
    headers: {
      authorization: `Bearer ${mockToken('admin', 'admin-test-1', 'admin@test.khayrcape.com')}`,
    },
    url: '/api/admin-trips',
  } as VercelRequest

  const res = {
    status(code: number) {
      status = code
      return this
    },
    json(body: unknown) {
      payload = (body as Record<string, unknown>) || {}
      return this
    },
  } as VercelResponse

  await handler(req, res)
  return { status, payload }
}

async function main() {
  const list = await invokeAdmin(adminTrips, {})
  assert.equal(list.status, 200, JSON.stringify(list.payload))
  assert.ok(Array.isArray(list.payload.bookings))

  const customers = await invokeAdmin(adminTrips, {
    query: { resource: 'customers' },
  })
  assert.equal(customers.status, 200)
  assert.ok(Array.isArray(customers.payload.customers))

  const calendar = await invokeAdmin(adminTrips, {
    query: {
      from: new Date().toISOString().slice(0, 10),
      to: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    },
  })
  assert.equal(calendar.status, 200)
  assert.ok(Array.isArray(calendar.payload.bookings))

  console.log('admin-api-handlers-unit: ok')
}

void main().catch((e) => {
  console.error(e)
  process.exit(1)
})
