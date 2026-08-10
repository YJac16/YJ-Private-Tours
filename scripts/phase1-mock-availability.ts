/**
 * Phase 1 mock availability + payment-confirm read-only checks.
 * Run from repo root: npx tsx scripts/phase1-mock-availability.ts
 */
import { mockDb } from '../booking-app/lib/mock-store'

let passed = 0
let failed = 0
function assert(name: string, cond: boolean) {
  if (cond) {
    console.log('PASS', name)
    passed++
  } else {
    console.error('FAIL', name)
    failed++
  }
}

const catalog = mockDb.catalog()
const driver = catalog.drivers[0]
const tour = catalog.tours[0]
const vehicle = catalog.vehicles[0]
const date = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 5)
  return d.toISOString().slice(0, 10)
})()

const base = {
  booking_date: date,
  start_time: '08:00',
  driver_id: driver.id,
  tour_id: tour.id,
  vehicle_id: vehicle.id,
  client_name: 'Test Guest',
  client_email: 'test@example.com',
  client_phone: null,
  client_user_id: null,
  adult_count: 2,
  child_count: 0,
  passenger_count: 2,
  guest_count: 2,
  vehicle_price_cents: 50000,
  price_per_person_cents: 40000,
  passenger_total_cents: 80000,
  grand_total_cents: 130000,
  final_price_cents: 130000,
  booking_reference: 'KC-TEST-AAAAAA',
}

const b1 = mockDb.createBooking({ ...base, booking_reference: 'KC-TEST-111111' })
assert('first pending booking created', b1.status === 'pending')

let threw = false
try {
  mockDb.createBooking({ ...base, booking_reference: 'KC-TEST-222222' })
} catch {
  threw = true
}
assert('second pending same driver/slot rejected', threw)

const otherVehicle = catalog.vehicles.find((v) => v.id !== vehicle.id) || catalog.vehicles[1]
threw = false
try {
  mockDb.createBooking({
    ...base,
    vehicle_id: otherVehicle.id,
    booking_reference: 'KC-TEST-333333',
  })
} catch {
  threw = true
}
assert('second pending same driver different vehicle still rejected', threw)

// Different driver, same vehicle should fail (global vehicle lock)
const otherDriver = catalog.drivers.find((d) => d.id !== driver.id) || catalog.drivers[0]
threw = false
try {
  mockDb.createBooking({
    ...base,
    driver_id: otherDriver.id,
    vehicle_id: vehicle.id,
    booking_reference: 'KC-TEST-444444',
    start_time: '08:00',
  })
} catch {
  threw = true
}
// If only one driver in mock, skip
if (otherDriver.id !== driver.id) {
  assert('same vehicle different driver rejected', threw)
} else {
  console.log('SKIP vehicle global clash (single mock driver)')
}

mockDb.confirmPayment(b1.id)
assert('confirmPayment marks paid', mockDb.getBooking(b1.id)?.status === 'paid')

const slots = mockDb.slots(date, driver.id, vehicle.id)
const morning = slots.slots.find((s) => s.start_time === '08:00')
assert('paid slot unavailable in slots API', morning?.available === false)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
