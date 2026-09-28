/**
 * Display currency must not alter checkout maths or Yoco payload.
 */
import assert from 'node:assert/strict'
import { calculatePrice } from '../booking-app/lib/pricing.ts'
import { mockDb } from '../booking-app/lib/mock-store.ts'
import { serializeBookFlowCheckoutPayload } from '../booking-app/lib/book-submit-snapshot.ts'
import { DISPLAY_CURRENCY_STORAGE_KEY } from '../client/src/lib/displayCurrency/constants.ts'

process.env.BOOKING_MOCK = '1'

const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'ZAR'] as const

async function main() {
  const catalog = mockDb.catalog()
  const tour = catalog.tours[0]
  const vehicle =
    catalog.vehicles.find((v) => v.slug === 'corolla') ?? catalog.vehicles[0]
  const driver = catalog.drivers[0]
  assert.ok(tour && vehicle && driver)

  const breakdown = calculatePrice(tour, vehicle, 3, 0)
  const postBody = {
    booking_date: '2026-10-15',
    start_time: '08:00',
    driver_id: driver.id,
    tour_id: tour.id,
    vehicle_id: vehicle.id,
    adult_count: 3,
    child_count: 0,
    client_name: 'Parity Guest',
    client_email: 'parity@test.khayrcape.com',
    client_phone: '+27000000000',
    pickup_address: 'Cape Town',
    guest_consent_acknowledged: true,
  }

  const baseline = serializeBookFlowCheckoutPayload(postBody, breakdown)

  const original = globalThis.localStorage
  const store = new Map<string, string>()
  ;(globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v)
    },
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  }

  for (const code of DISPLAY_CURRENCIES) {
    store.set(DISPLAY_CURRENCY_STORAGE_KEY, code)
    assert.equal(store.get(DISPLAY_CURRENCY_STORAGE_KEY), code)
    const payload = serializeBookFlowCheckoutPayload(
      postBody,
      calculatePrice(tour, vehicle, 3, 0)
    )
    assert.equal(
      payload,
      baseline,
      `checkout payload must not depend on display currency ${code}`
    )
  }

  ;(globalThis as { localStorage?: Storage }).localStorage = original

  console.log('display-currency-checkout-parity-unit: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
