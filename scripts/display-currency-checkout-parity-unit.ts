/**
 * Display currency must not alter real booking or Yoco HTTP payloads.
 */
import assert from 'node:assert/strict'
import { calculatePrice } from '../booking-app/lib/pricing.ts'
import { mockDb } from '../booking-app/lib/mock-store.ts'
import { buildCreateBookingRequestBody } from '../booking-app/lib/book-create-request.ts'
import { buildYocoCheckoutHttpBody } from '../booking-app/lib/yoco.ts'
import {
  formatApproxLine,
  type EcbRatesSnapshot,
} from '../booking-app/lib/display-currency-fx.ts'
import { DISPLAY_CURRENCY_STORAGE_KEY } from '../client/src/lib/displayCurrency/constants.ts'
import { resolveDisplayCurrencyPreference } from '../client/src/lib/displayCurrency/resolveDisplayCurrency.ts'

process.env.BOOKING_MOCK = '1'

const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'ZAR'] as const
const SITE = 'https://preview.test'

/** Hard-coded POST /api/book body (City, 2 guests, mock catalog IDs) — not from builder. */
const EXPECTED_CREATE_BOOKING_BODY = {
  booking_date: '2026-10-15',
  start_time: '08:00',
  driver_id: '11111111-1111-1111-1111-111111111111',
  tour_id: '22222222-2222-2222-2222-222222222201',
  vehicle_id: '33333333-3333-3333-3333-333333333303',
  adult_count: 2,
  child_count: 0,
  client_name: 'Parity Guest',
  client_email: 'parity@test.khayrcape.com',
  client_phone: '+27000000000',
  client_country: 'ZA',
  pickup_address: 'Cape Town',
  dietary_requirements: undefined,
  flight_number: undefined,
  special_requests: undefined,
  guest_consent_acknowledged: true,
}

const sampleRates: EcbRatesSnapshot = {
  fetchedAt: '2026-09-28T00:00:00.000Z',
  perEur: { EUR: 1, USD: 1.14, GBP: 0.86, ZAR: 18.5 },
}

async function main() {
  const catalog = mockDb.catalog()
  const tour = catalog.tours.find((t) => t.slug === 'city')
  const vehicle = catalog.vehicles.find((v) => v.slug === 'corolla')
  const driver = catalog.drivers[0]
  assert.ok(tour && vehicle && driver)

  const breakdown = calculatePrice(tour, vehicle, 2, 0)
  assert.equal(breakdown.grand_total_cents, 330_000, 'City + 2 guests + Corolla = ZAR 3,300')

  const builderInput = {
    booking_date: '2026-10-15',
    start_time: '08:00',
    driver_id: driver.id,
    tour_id: tour.id,
    vehicle_id: vehicle.id,
    peopleCount: 2,
    name: ' Parity Guest ',
    email: ' parity@test.khayrcape.com ',
    phone: ' +27000000000 ',
    country: ' ZA ',
    pickupAddress: ' Cape Town ',
    dietary: '',
    flightNumber: '',
    specialRequests: '',
    accessToken: null as string | null,
    guestConsentAck: true,
  }

  const builtBody = buildCreateBookingRequestBody(builderInput)
  assert.deepEqual(builtBody, EXPECTED_CREATE_BOOKING_BODY)

  const yocoHttpBody = buildYocoCheckoutHttpBody({
    amountCents: breakdown.grand_total_cents,
    bookingId: 'booking-parity-city-2',
    bookingReference: 'KC-PARITY-CITY2',
    clientName: builtBody.client_name,
    clientEmail: builtBody.client_email,
    tourName: tour.name,
    siteBase: SITE,
  })

  assert.equal(yocoHttpBody.amount, 330_000)
  assert.equal(yocoHttpBody.currency, 'ZAR')

  const baseline = JSON.stringify({
    createBookingBody: builtBody,
    yocoCheckoutHttpBody: yocoHttpBody,
  })

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

  const approxByCurrency: string[] = []

  for (const code of DISPLAY_CURRENCIES) {
    store.set(DISPLAY_CURRENCY_STORAGE_KEY, code)
    assert.equal(resolveDisplayCurrencyPreference(['en-US']), code)

    const pricingBreakdown = calculatePrice(tour, vehicle, 2, 0)
    const createBookingBody = buildCreateBookingRequestBody(builderInput)
    const yocoBody = buildYocoCheckoutHttpBody({
      amountCents: pricingBreakdown.grand_total_cents,
      bookingId: 'booking-parity-city-2',
      bookingReference: 'KC-PARITY-CITY2',
      clientName: createBookingBody.client_name,
      clientEmail: createBookingBody.client_email,
      tourName: tour.name,
      siteBase: SITE,
    })

    assert.equal(yocoBody.amount, 330_000)
    assert.equal(yocoBody.currency, 'ZAR')
    assert.deepEqual(createBookingBody, EXPECTED_CREATE_BOOKING_BODY)

    const payload = JSON.stringify({
      createBookingBody,
      yocoCheckoutHttpBody: yocoBody,
    })
    assert.equal(payload, baseline, `payload must not depend on ${code}`)

    const approx = formatApproxLine(
      pricingBreakdown.grand_total_cents,
      code,
      sampleRates
    )
    approxByCurrency.push(approx ?? 'null')
  }

  assert.notEqual(
    new Set(approxByCurrency.filter((a) => a !== 'null')).size,
    0,
    'display currency state should change approx lines for non-ZAR'
  )

  ;(globalThis as { localStorage?: Storage }).localStorage = original

  console.log('display-currency-checkout-parity-unit: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
