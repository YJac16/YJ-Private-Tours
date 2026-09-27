/**
 * End-to-end-style booking flow (mock store + mock Yoco, no production).
 * Run: npx tsx scripts/booking-flow-integration.ts
 */
import assert from 'node:assert/strict'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import bookHandler from '../api/book.ts'
import slotsHandler from '../api/slots.ts'
import accountHandler from '../api/account-bookings.ts'
import adminTrips from '../api/admin-trips.ts'
import { mockDb } from '../booking-app/lib/mock-store.ts'
import { calculatePrice } from '../booking-app/lib/pricing.ts'
import { PENDING_HOLD_MINUTES } from '../booking-app/lib/booking-lifecycle.ts'

process.env.BOOKING_MOCK = '1'

function mockToken(role: string, id: string, email: string) {
  return `mock.${role}.${id}.${encodeURIComponent(email)}`
}

function minBookableDate(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 2)
  return d.toISOString().slice(0, 10)
}

async function invoke(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown>,
  opts: {
    method: string
    query?: Record<string, string>
    body?: Record<string, unknown>
    token?: string
  }
) {
  let status = 200
  let payload: Record<string, unknown> = {}
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (opts.token) headers.authorization = `Bearer ${opts.token}`

  const req = {
    method: opts.method,
    query: opts.query || {},
    headers,
    body: opts.body,
    url: '/api/test',
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
  const clientId = 'flow-client-001'
  const clientEmail = 'flow-client@test.khayrcape.com'
  const clientToken = mockToken('client', clientId, clientEmail)
  const adminToken = mockToken('admin', 'flow-admin-1', 'admin@test.khayrcape.com')

  const catalog = mockDb.catalog()
  const driver = catalog.drivers[0]
  const tour = catalog.tours[0]
  const vehicle = catalog.vehicles[0]
  assert.ok(driver && tour && vehicle)

  const booking_date = minBookableDate()
  const slotsRes = await invoke(slotsHandler, {
    method: 'GET',
    query: {
      date: booking_date,
      driver_id: driver.id,
      vehicle_id: vehicle.id,
    },
  })
  assert.equal(slotsRes.status, 200)
  const slots = slotsRes.payload.slots as Array<{
    start_time: string
    available: boolean
  }>
  const slot = slots.find((s) => s.available)
  assert.ok(slot, 'need an available slot')

  const breakdown = calculatePrice(tour, vehicle, 2, 0)

  const bookRes = await invoke(bookHandler, {
    method: 'POST',
    token: clientToken,
    body: {
      booking_date,
      start_time: slot.start_time,
      driver_id: driver.id,
      tour_id: tour.id,
      vehicle_id: vehicle.id,
      client_name: 'Flow Test',
      client_email: clientEmail,
      client_phone: '+27000000099',
      adult_count: 2,
      child_count: 0,
    },
  })
  assert.equal(bookRes.status, 200, JSON.stringify(bookRes.payload))
  assert.equal(bookRes.payload.amount_cents, breakdown.grand_total_cents)
  assert.ok(bookRes.payload.checkout_url)
  assert.equal(bookRes.payload.mock, true)
  const bookingId = String(bookRes.payload.booking_id)

  const accountRes = await invoke(accountHandler, {
    method: 'GET',
    token: clientToken,
  })
  assert.equal(accountRes.status, 200)
  const accountList = accountRes.payload.bookings as Array<{ id: string }>
  assert.ok(accountList.some((b) => b.id === bookingId))

  const adminRes = await invoke(adminTrips, {
    method: 'GET',
    token: adminToken,
  })
  assert.equal(adminRes.status, 200)
  const adminList = adminRes.payload.bookings as Array<{ id: string }>
  assert.ok(adminList.some((b) => b.id === bookingId))

  const blocked = await invoke(slotsHandler, {
    method: 'GET',
    query: {
      date: booking_date,
      driver_id: driver.id,
      vehicle_id: vehicle.id,
    },
  })
  const blockedSlot = (blocked.payload.slots as Array<{ start_time: string; available: boolean }>).find(
    (s) => s.start_time === slot.start_time
  )
  assert.ok(blockedSlot && !blockedSlot.available, 'fresh pending should block slot')

  const staleIso = new Date(
    Date.now() - (PENDING_HOLD_MINUTES + 1) * 60 * 1000
  ).toISOString()
  mockDb.setBookingCreatedAtForTest(bookingId, staleIso)

  const afterHold = await invoke(slotsHandler, {
    method: 'GET',
    query: {
      date: booking_date,
      driver_id: driver.id,
      vehicle_id: vehicle.id,
    },
  })
  const freed = (afterHold.payload.slots as Array<{ start_time: string; available: boolean }>).find(
    (s) => s.start_time === slot.start_time
  )
  assert.ok(freed?.available, 'stale pending must not block availability')

  mockDb.expireStalePendingBookings()
  const all = mockDb.listBookings()
  const row = all.find((b) => b.id === bookingId)
  assert.equal(row?.status, 'expired')

  console.log('booking-flow-integration: ok')
}

void main().catch((e) => {
  console.error(e)
  process.exit(1)
})
