/**
 * Phase 5 unit tests: payment retry, receipts.
 * Run: npx tsx scripts/phase5-client-unit.ts
 */
import assert from 'node:assert/strict'
import { mockDb } from '../booking-app/lib/mock-store'
import { createYocoCheckout } from '../booking-app/lib/yoco'

let passed = 0
let failed = 0

function check(name: string, fn: () => void | Promise<void>) {
  const run = async () => {
    try {
      await fn()
      console.log(`PASS ${name}`)
      passed += 1
    } catch (e) {
      console.error(`FAIL ${name}`)
      console.error(e)
      failed += 1
    }
  }
  return run()
}

const farDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10)

let seedN = 0

function seedPending(email = `guest-${Date.now()}@test.khayrcape.com`) {
  seedN += 1
  const hour = 10 + (seedN % 8)
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
    booking_date: farDate,
    start_time: `${String(hour).padStart(2, '0')}:00`,
    client_name: 'Phase5 Guest',
    client_email: email,
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
    booking_reference: `KC-P5-${Date.now()}-${seedN}`,
  })
}

async function main() {
  await check('retry payment on pending returns checkout', () => {
    const b = seedPending()
    mockDb.recordPayment({
      booking_id: b.id,
      amount_cents: 150000,
      external_id: 'ch_old',
      status: 'pending',
    })
    const res = mockDb.retryPaymentCheckout(b.id)
    assert.equal(res.ok, true)
    if (!res.ok) return
    assert.ok(res.checkout_url)
    assert.ok(res.checkout_id.startsWith('ch_retry_'))
    assert.equal(res.amount_cents, 150000)
    const again = mockDb.getBooking(b.id)
    assert.equal(again?.yoco_payment_reference, res.checkout_id)
  })

  await check('retry payment rejects paid booking', () => {
    const b = seedPending()
    mockDb.confirmPayment(b.id)
    const res = mockDb.retryPaymentCheckout(b.id)
    assert.equal(res.ok, false)
    if (res.ok) return
    assert.equal(res.status, 400)
  })

  await check('receipt available after paid', () => {
    const b = seedPending()
    mockDb.recordPayment({
      booking_id: b.id,
      amount_cents: 150000,
      external_id: 'ch_paid',
      status: 'pending',
    })
    mockDb.confirmPayment(b.id)
    const res = mockDb.getReceipt(b.id)
    assert.equal(res.ok, true)
    if (!res.ok) return
    assert.ok(res.receipt.receipt_number.startsWith('KCE-R'))
    assert.equal(res.receipt.amount_cents, 150000)
    assert.equal(res.receipt.client_name, 'Phase5 Guest')
  })

  await check('receipt rejected for pending', () => {
    const b = seedPending()
    const res = mockDb.getReceipt(b.id)
    assert.equal(res.ok, false)
    if (res.ok) return
    assert.equal(res.status, 400)
  })

  await check('createYocoCheckout accepts idempotencyKey option', async () => {
    assert.equal(typeof createYocoCheckout, 'function')
    const prev = process.env.YOCO_SECRET_KEY
    delete process.env.YOCO_SECRET_KEY
    await assert.rejects(
      () =>
        createYocoCheckout({
          amountCents: 150000,
          bookingId: 'test',
          idempotencyKey: 'booking-retry-test-1',
        }),
      /YOCO_SECRET_KEY/
    )
    if (prev) process.env.YOCO_SECRET_KEY = prev
  })

  console.log(`\nPhase 5: ${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

void main()
