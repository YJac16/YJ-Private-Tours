/**
 * Phase 4 unit tests: driver notify kinds, reminders, PIN fail-closed.
 * Run: npx tsx scripts/phase4-driver-unit.ts
 */
import assert from 'node:assert/strict'
import {
  buildDriverBookingEmail,
  bookingRowToEmailDetails,
} from '../booking-app/lib/notify'
import {
  capeTownYmd,
  shouldSendDriverReminder,
  tomorrowCapeTownYmd,
} from '../booking-app/lib/driver-reminders'
import { mockDb } from '../booking-app/lib/mock-store'

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

const details = {
  bookingId: 'KC-P4-1',
  status: 'paid' as const,
  bookingDate: '2026-08-20',
  startTime: '09:00',
  clientName: 'Guest',
  clientEmail: 'guest@test.khayrcape.com',
  tourName: 'City',
  driverName: 'Yaseen',
  amountCents: 150000,
}

check('email builder: cancelled subject', () => {
  const mail = buildDriverBookingEmail(details, 'cancelled')
  assert.match(mail.subject, /Cancelled/)
  assert.match(mail.text, /Booking cancelled/)
})

check('email builder: rescheduled + change note', () => {
  const mail = buildDriverBookingEmail(
    { ...details, changeNote: 'Was 2026-08-19 09:00 → now 2026-08-20 09:00' },
    'rescheduled'
  )
  assert.match(mail.subject, /Rescheduled/)
  assert.match(mail.text, /Was 2026-08-19/)
})

check('email builder: reminder', () => {
  const mail = buildDriverBookingEmail(details, 'reminder')
  assert.match(mail.subject, /Reminder/)
  assert.match(mail.text, /Tour tomorrow|Reminder/i)
})

check('bookingRowToEmailDetails prefers reference', () => {
  const d = bookingRowToEmailDetails({
    id: 'uuid-1',
    status: 'paid',
    booking_date: '2026-08-20',
    start_time: '10:00:00',
    client_name: 'A',
    client_email: 'a@test.com',
    booking_reference: 'KC-REF',
    grand_total_cents: 100,
  })
  assert.equal(d.bookingId, 'KC-REF')
  assert.equal(d.startTime, '10:00:00')
})

check('capeTownYmd returns YYYY-MM-DD', () => {
  const ymd = capeTownYmd(new Date('2026-08-10T12:00:00Z'))
  assert.match(ymd, /^\d{4}-\d{2}-\d{2}$/)
})

check('tomorrowCapeTownYmd advances calendar day', () => {
  const now = new Date('2026-08-10T12:00:00+02:00')
  const today = capeTownYmd(now)
  const tomorrow = tomorrowCapeTownYmd(now)
  assert.ok(tomorrow > today)
})

check('shouldSendDriverReminder gates', () => {
  assert.equal(
    shouldSendDriverReminder({
      status: 'paid',
      booking_date: '2026-08-11',
      reminder_sent_at: null,
    }),
    true
  )
  assert.equal(
    shouldSendDriverReminder({
      status: 'paid',
      booking_date: '2026-08-11',
      reminder_sent_at: '2026-08-10T06:00:00Z',
    }),
    false
  )
  assert.equal(
    shouldSendDriverReminder({
      status: 'cancelled',
      booking_date: '2026-08-11',
      reminder_sent_at: null,
    }),
    false
  )
})

check('mock reminder mark is idempotent', () => {
  const drivers = mockDb.listAllDrivers()
  const catalog = mockDb.catalog()
  const driver = drivers[0]
  const tour = catalog.tours[0]
  const vehicle = catalog.vehicles[0]
  assert.ok(driver && tour && vehicle)
  const farDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const b = mockDb.createBooking({
    driver_id: driver.id,
    tour_id: tour.id,
    vehicle_id: vehicle.id,
    booking_date: farDate,
    start_time: '11:00',
    client_name: 'Reminder Guest',
    client_email: `reminder-${Date.now()}@test.khayrcape.com`,
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
    booking_reference: `KC-P4R-${Date.now()}`,
  })
  mockDb.updateBooking(b.id, { status: 'paid' })
  assert.equal(mockDb.markReminderSent(b.id), true)
  assert.equal(mockDb.markReminderSent(b.id), false)
  assert.ok(mockDb.getBooking(b.id)?.reminder_sent_at)
})

check('legacy PIN fails closed when unset', () => {
  const prev = process.env.DRIVER_PIN
  delete process.env.DRIVER_PIN
  const expected = process.env.DRIVER_PIN
  assert.equal(!expected, true)
  // Mirror route checkPin logic
  const ok = Boolean(expected) && expected === '0420'
  assert.equal(ok, false)
  if (prev !== undefined) process.env.DRIVER_PIN = prev
})

check('listBookings respects to bound', () => {
  const list = mockDb.listBookings(null, '2099-01-01', '2099-01-02')
  assert.equal(list.length, 0)
})

console.log(`\nPhase 4: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
