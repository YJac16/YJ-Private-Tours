/**
 * Phase 2 unit tests: cancel eligibility, mock cancel/refund/history.
 * Run: npx tsx scripts/phase2-cancel-unit.ts
 */
import assert from 'node:assert/strict'
import {
  isRefundEligible,
  tourStartsAt,
} from '../booking-app/lib/booking-lifecycle'
import { mockDb } from '../booking-app/lib/mock-store'
import { isRefundSuccessEvent } from '../booking-app/lib/yoco-webhook'

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
const soonDate = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10)

function seedPending(overrides: Partial<{
  booking_date: string
  start_time: string
  client_email: string
}> = {}) {
  const drivers = mockDb.listAllDrivers()
  const catalog = mockDb.catalog()
  const driver = drivers[0]
  const tour = catalog.tours[0]
  const vehicle = catalog.vehicles[0]
  assert.ok(driver && tour && vehicle)
  return mockDb.createBooking({
    driver_id: driver.id,
    tour_id: tour.id,
    vehicle_id: vehicle.id,
    booking_date: overrides.booking_date || farDate,
    start_time: overrides.start_time || '11:00',
    client_name: 'Test Guest',
    client_email: overrides.client_email || `guest-${Date.now()}@test.khayrcape.com`,
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
    booking_reference: `KC-TEST-${Date.now()}`,
  })
}

check('refund eligible ≥24h', () => {
  assert.equal(isRefundEligible(farDate, '09:00'), true)
})

check('refund ineligible <24h', () => {
  assert.equal(isRefundEligible(soonDate, '09:00'), false)
})

check('tourStartsAt parses', () => {
  const d = tourStartsAt('2030-01-15', '10:30')
  assert.ok(!Number.isNaN(d.getTime()))
})

check('refund success event match', () => {
  assert.equal(isRefundSuccessEvent('refund.succeeded'), true)
  assert.equal(isRefundSuccessEvent('payment.succeeded'), false)
})

check('pending cancel frees slot', () => {
  const created = seedPending({ start_time: '09:00' })
  const result = mockDb.cancelAccountBooking({
    bookingId: created.id,
    actor: 'client',
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.status, 'cancelled')
    assert.equal(result.refund_status, 'none')
  }
  const again = mockDb.createBooking({
    driver_id: created.driver_id,
    tour_id: created.tour_id,
    vehicle_id: created.vehicle_id,
    booking_date: created.booking_date,
    start_time: created.start_time,
    client_name: 'Second',
    client_email: 'second@test.khayrcape.com',
    guest_count: 1,
    adult_count: 1,
    child_count: 0,
    passenger_count: 1,
    vehicle_price_cents: 0,
    price_per_person_cents: 75000,
    passenger_total_cents: 75000,
    grand_total_cents: 75000,
    final_price_cents: 75000,
    booking_reference: `KC-TEST-REBOOK-${Date.now()}`,
  })
  assert.ok(again.id)
})

check('mock paid far cancel requests refund', () => {
  const created = seedPending({
    start_time: '12:00',
    client_email: 'paid-far@test.khayrcape.com',
  })
  mockDb.confirmPayment(created.id)
  const result = mockDb.cancelAccountBooking({
    bookingId: created.id,
    actor: 'client',
    requestRefund: true,
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.status, 'cancelled')
    assert.equal(result.refund_eligible, true)
    assert.equal(result.refund_status, 'pending')
  }
  const hist = mockDb.listBookingHistory(created.id)
  assert.ok(hist.length >= 1)
})

check('mock paid soon cancel ineligible', () => {
  const created = seedPending({
    start_time: '14:00',
    client_email: 'paid-soon@test.khayrcape.com',
  })
  mockDb.confirmPayment(created.id)
  // Move tour into <24h window (still allowed for cancel rules test)
  mockDb.updateBooking(created.id, {
    booking_date: soonDate,
    start_time: '15:00',
  })
  const result = mockDb.cancelAccountBooking({
    bookingId: created.id,
    actor: 'client',
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.refund_status, 'ineligible')
    assert.equal(result.refund_eligible, false)
  }
})

check('idempotent double cancel', () => {
  const created = seedPending({
    start_time: '16:00',
    client_email: 'twice@test.khayrcape.com',
  })
  const first = mockDb.cancelAccountBooking({
    bookingId: created.id,
    actor: 'client',
  })
  const second = mockDb.cancelAccountBooking({
    bookingId: created.id,
    actor: 'client',
  })
  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  if (second.ok) assert.equal(second.already_cancelled, true)
})

check('detail ownership helper', () => {
  const created = seedPending({
    start_time: '17:00',
    client_email: 'owner@test.khayrcape.com',
  })
  const detail = mockDb.getAccountBookingDetail(
    created.id,
    'user-does-not-own',
    'owner@test.khayrcape.com',
    false
  )
  assert.ok(detail)
  const denied = mockDb.getAccountBookingDetail(
    created.id,
    'user-does-not-own',
    'other@test.khayrcape.com',
    false
  )
  assert.equal(denied, null)
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
