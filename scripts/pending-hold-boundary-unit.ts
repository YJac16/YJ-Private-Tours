/**
 * Pending hold boundary: 29:59 blocks, 30:00+ free + sweep expires.
 * Run: npx tsx scripts/pending-hold-boundary-unit.ts
 */
import assert from 'node:assert/strict'
import {
  bookingOccupiesSlot,
  pendingHoldExpiredForSweep,
  pendingHoldStillActive,
} from '../booking-app/lib/booking-lifecycle.ts'
import { mockDb } from '../booking-app/lib/mock-store.ts'

process.env.BOOKING_MOCK = '1'

const NOW = Date.parse('2026-06-15T12:00:00.000Z')

function isoAtAgeSeconds(ageSec: number): string {
  return new Date(NOW - ageSec * 1000).toISOString()
}

function main() {
  const at29m59s = isoAtAgeSeconds(30 * 60 - 1)
  const at30m00s = isoAtAgeSeconds(30 * 60)
  const at30m01s = isoAtAgeSeconds(30 * 60 + 1)

  assert.equal(pendingHoldStillActive(at29m59s, NOW), true)
  assert.equal(pendingHoldExpiredForSweep(at29m59s, NOW), false)
  assert.equal(
    bookingOccupiesSlot({ status: 'pending', created_at: at29m59s }, NOW),
    true
  )

  assert.equal(pendingHoldStillActive(at30m00s, NOW), false)
  assert.equal(pendingHoldExpiredForSweep(at30m00s, NOW), true)
  assert.equal(
    bookingOccupiesSlot({ status: 'pending', created_at: at30m00s }, NOW),
    false
  )

  assert.equal(pendingHoldStillActive(at30m01s, NOW), false)
  assert.equal(pendingHoldExpiredForSweep(at30m01s, NOW), true)
  assert.equal(
    bookingOccupiesSlot({ status: 'pending', created_at: at30m01s }, NOW),
    false
  )

  const catalog = mockDb.catalog()
  const driver = mockDb.listAllDrivers()[0]
  const tour = catalog.tours[0]
  const vehicle = catalog.vehicles[0]
  assert.ok(driver && tour && vehicle)

  const farDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)

  const booking = mockDb.createBooking({
    driver_id: driver.id,
    tour_id: tour.id,
    vehicle_id: vehicle.id,
    booking_date: farDate,
    start_time: '11:00',
    client_name: 'Hold Boundary',
    client_email: 'hold@test.khayrcape.com',
    guest_count: 1,
    adult_count: 1,
    child_count: 0,
    passenger_count: 1,
    vehicle_price_cents: 100000,
    price_per_person_cents: 10000,
    passenger_total_cents: 10000,
    grand_total_cents: 110000,
    final_price_cents: 110000,
    booking_reference: 'KC-HOLD-BOUNDARY',
  })

  mockDb.setBookingCreatedAtForTest(booking.id, at29m59s)
  mockDb.expireStalePendingBookings(NOW)
  assert.equal(
    mockDb.listBookings().find((b) => b.id === booking.id)?.status,
    'pending',
    '29:59 must not be expired by sweep'
  )

  mockDb.setBookingCreatedAtForTest(booking.id, at30m00s)
  mockDb.expireStalePendingBookings(NOW)
  assert.equal(
    mockDb.listBookings().find((b) => b.id === booking.id)?.status,
    'expired',
    '30:00 must be expired by sweep'
  )

  console.log('pending-hold-boundary-unit: ok')
}

main()
