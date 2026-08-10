/**
 * Phase 3 unit tests: admin trip mutate, conflicts, customers, cancel.
 * Run: npx tsx scripts/phase3-admin-unit.ts
 */
import assert from 'node:assert/strict'
import { mockDb } from '../booking-app/lib/mock-store'
import { isRefundEligible } from '../booking-app/lib/booking-lifecycle'

let passed = 0
let failed = 0

function check(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
    passed += 1
  } catch (e) {
    console.error(`FAIL ${name}`)
    console.error(e)
    failed += 1
  }
}

const farDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10)
const otherDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10)

function seedPaid(overrides: Partial<{ booking_date: string; start_time: string; email: string }> = {}) {
  const drivers = mockDb.listAllDrivers()
  const catalog = mockDb.catalog()
  const driver = drivers[0]
  const tour = catalog.tours[0]
  const vehicle = catalog.vehicles[0]
  assert.ok(driver && tour && vehicle)
  const b = mockDb.createBooking({
    driver_id: driver.id,
    tour_id: tour.id,
    vehicle_id: vehicle.id,
    booking_date: overrides.booking_date || farDate,
    start_time: overrides.start_time || '11:00',
    client_name: 'Admin Guest',
    client_email: overrides.email || `admin-guest-${Date.now()}@test.khayrcape.com`,
    client_phone: '+27000000000',
    guest_count: 2,
    adult_count: 2,
    child_count: 0,
    passenger_count: 2,
    vehicle_price_cents: 0,
    price_per_person_cents: 75000,
    passenger_total_cents: 150000,
    grand_total_cents: 150000,
    final_price_cents: 150000,
    booking_reference: `KC-P3-${Date.now()}`,
  })
  mockDb.updateBooking(b.id, { status: 'paid', trip_status: 'scheduled' })
  return mockDb.getBooking(b.id)!
}

check('admin update trip_status writes history', () => {
  const b = seedPaid({ start_time: '09:00' })
  mockDb.adminUpdateBooking(b.id, { trip_status: 'completed' })
  const hist = mockDb.listBookingHistory(b.id)
  assert.ok(hist.some((h) => h.to_status === 'completed'))
  assert.equal(mockDb.getBooking(b.id)?.trip_status, 'completed')
})

check('admin reschedule success', () => {
  const b = seedPaid({ start_time: '10:00' })
  mockDb.adminUpdateBooking(b.id, {
    booking_date: otherDate,
    start_time: '14:00',
  })
  const updated = mockDb.getBooking(b.id)!
  assert.equal(updated.booking_date, otherDate)
  assert.equal(updated.start_time, '14:00')
})

check('admin reschedule driver conflict → error', () => {
  const a = seedPaid({ start_time: '15:00', booking_date: farDate })
  const b = seedPaid({ start_time: '16:00', booking_date: farDate })
  assert.throws(
    () =>
      mockDb.adminUpdateBooking(b.id, {
        booking_date: a.booking_date,
        start_time: a.start_time,
        driver_id: a.driver_id,
      }),
    /conflict/i
  )
})

check('admin cancel paid ≥24h → refund pending', () => {
  const b = seedPaid({ start_time: '12:00' })
  assert.equal(isRefundEligible(b.booking_date, b.start_time), true)
  const result = mockDb.cancelAccountBooking({
    bookingId: b.id,
    actor: 'admin',
    reason: 'Admin cancel',
    requestRefund: true,
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.refund_status, 'pending')
    assert.equal(mockDb.getBooking(b.id)?.cancelled_by, 'admin')
  }
})

check('listCustomers aggregates by email', () => {
  const email = `cust-${Date.now()}@test.khayrcape.com`
  seedPaid({ email, start_time: '08:00' })
  seedPaid({ email, start_time: '08:30', booking_date: otherDate })
  const customers = mockDb.listCustomers()
  const row = customers.find((c) => c.email === email)
  assert.ok(row)
  assert.ok((row?.trip_count || 0) >= 2)
})

check('cannot update cancelled booking', () => {
  const b = seedPaid({ start_time: '17:00' })
  mockDb.cancelAccountBooking({
    bookingId: b.id,
    actor: 'admin',
    reason: 'done',
  })
  assert.throws(
    () => mockDb.adminUpdateBooking(b.id, { trip_status: 'completed' }),
    /cancelled/i
  )
})

console.log(`\nPhase 3: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
