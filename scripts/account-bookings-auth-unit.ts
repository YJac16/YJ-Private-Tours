/**
 * Regression: account-bookings auth + list (mock store, no production data).
 * Run: npx tsx scripts/account-bookings-auth-unit.ts
 */
import assert from 'node:assert/strict'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from '../api/account-bookings.ts'
import { mockDb } from '../booking-app/lib/mock-store.ts'

process.env.BOOKING_MOCK = '1'

function mockToken(role: string, id: string, email: string) {
  return `mock.${role}.${id}.${encodeURIComponent(email)}`
}

async function invoke(
  method: string,
  opts?: {
    query?: Record<string, string>
    token?: string
  }
) {
  const headers: Record<string, string> = {}
  if (opts?.token) {
    headers.authorization = `Bearer ${opts.token}`
  }
  let status = 200
  let payload: Record<string, unknown> = {}
  const req = {
    method,
    query: opts?.query || {},
    headers,
    url: '/api/account-bookings',
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
  const clientId = 'acct-test-client-001'
  const clientEmail = 'acct-client@test.khayrcape.com'
  const clientToken = mockToken('client', clientId, clientEmail)

  const catalog = mockDb.catalog()
  const driver = mockDb.listAllDrivers()[0]
  const tour = catalog.tours[0]
  const vehicle = catalog.vehicles[0]
  assert.ok(driver && tour && vehicle)

  const farDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)

  const seeded = mockDb.createBooking({
    driver_id: driver.id,
    tour_id: tour.id,
    vehicle_id: vehicle.id,
    booking_date: farDate,
    start_time: '09:00',
    client_name: 'Account Test Client',
    client_email: clientEmail,
    client_phone: '+27000000001',
    client_user_id: clientId,
    guest_count: 2,
    adult_count: 2,
    child_count: 0,
    passenger_count: 2,
    vehicle_price_cents: 250000,
    price_per_person_cents: 40000,
    passenger_total_cents: 80000,
    grand_total_cents: 330000,
    final_price_cents: 330000,
    booking_reference: 'KC-ACCT-TEST-1',
  })

  const listRes = await invoke('GET', { token: clientToken })
  assert.equal(listRes.status, 200, JSON.stringify(listRes.payload))
  const bookings = listRes.payload.bookings as Array<{ id: string }>
  assert.ok(Array.isArray(bookings))
  assert.ok(
    bookings.some((b) => b.id === seeded.id),
    'client should see own booking without consent signed'
  )

  const driverRes = await invoke('GET', {
    token: mockToken('driver', 'driver-u1', 'driver@test.khayrcape.com'),
  })
  assert.equal(driverRes.status, 403)

  const noAuth = await invoke('GET')
  assert.equal(noAuth.status, 401)

  console.log('account-bookings-auth-unit: ok')
}

void main().catch((e) => {
  console.error(e)
  process.exit(1)
})
