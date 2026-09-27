/**
 * Production guard: mock store and fake checkout never run on VERCEL_ENV=production.
 * Run: npx tsx scripts/mock-store-production-guard-unit.ts
 */
import assert from 'node:assert/strict'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  BOOKING_BACKEND_NOT_CONFIGURED,
  useMockStore,
} from '../booking-app/lib/mock-store.ts'
import { createYocoCheckout } from '../booking-app/lib/yoco.ts'
import bookHandler from '../api/book.ts'

const ENV_KEYS = [
  'VERCEL_ENV',
  'BOOKING_MOCK',
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'YOCO_SECRET_KEY',
] as const

function snapshotEnv(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const k of ENV_KEYS) out[k] = process.env[k]
  return out
}

function restoreEnv(snap: Record<string, string | undefined>) {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k]
    else process.env[k] = snap[k]
  }
}

function clearSupabaseEnv() {
  delete process.env.SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
}

async function invokeBookPost() {
  let status = 200
  let payload: Record<string, unknown> = {}
  const req = {
    method: 'POST',
    query: {},
    headers: { 'content-type': 'application/json' },
    body: {
      booking_date: '2099-01-15',
      start_time: '09:00',
      driver_id: 'd1',
      tour_id: 't1',
      vehicle_id: 'v1',
      client_name: 'Prod Guard',
      client_email: 'guard@test.khayrcape.com',
      adult_count: 2,
      guest_consent_acknowledged: true,
    },
    url: '/api/book',
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

  await bookHandler(req, res)
  return { status, payload }
}

async function main() {
  const base = snapshotEnv()

  try {
    process.env.VERCEL_ENV = 'production'
    delete process.env.BOOKING_MOCK
    clearSupabaseEnv()

    assert.throws(() => useMockStore(), (e: unknown) => {
      assert.ok(e instanceof Error)
      assert.equal(e.message, BOOKING_BACKEND_NOT_CONFIGURED)
      return true
    })

    await assert.rejects(
      () =>
        createYocoCheckout({
          amountCents: 10000,
          bookingId: 'prod-guard-booking',
        }),
      (e: unknown) => {
        assert.ok(e instanceof Error)
        assert.equal(e.message, BOOKING_BACKEND_NOT_CONFIGURED)
        return true
      }
    )

    const bookRes = await invokeBookPost()
    assert.equal(bookRes.status, 500, JSON.stringify(bookRes.payload))
    assert.equal(bookRes.payload.error, BOOKING_BACKEND_NOT_CONFIGURED)
    assert.ok(!bookRes.payload.checkout_url)
    assert.ok(!bookRes.payload.redirectUrl)

    process.env.BOOKING_MOCK = '1'
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    assert.equal(useMockStore(), false, 'BOOKING_MOCK must not enable mock in production')

    restoreEnv(base)
    delete process.env.VERCEL_ENV
    delete process.env.BOOKING_MOCK
    clearSupabaseEnv()
    assert.equal(useMockStore(), true, 'non-production missing env should use mock')

    process.env.BOOKING_MOCK = '1'
    assert.equal(useMockStore(), true, 'dev with BOOKING_MOCK stays on mock')

    console.log('mock-store-production-guard-unit: ok')
  } finally {
    restoreEnv(base)
  }
}

void main().catch((e) => {
  console.error(e)
  process.exit(1)
})
