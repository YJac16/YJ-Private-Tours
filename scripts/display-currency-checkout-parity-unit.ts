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

const sampleRates: EcbRatesSnapshot = {
  fetchedAt: '2026-09-28T00:00:00.000Z',
  perEur: { EUR: 1, USD: 1.14, GBP: 0.86, ZAR: 18.5 },
}

function legacyInlineCreateBookingBody(
  input: Parameters<typeof buildCreateBookingRequestBody>[0]
) {
  return {
    booking_date: input.booking_date,
    start_time: input.start_time,
    driver_id: input.driver_id,
    tour_id: input.tour_id,
    vehicle_id: input.vehicle_id,
    adult_count: input.peopleCount,
    child_count: 0,
    client_name: input.name.trim(),
    client_email: input.email.trim(),
    client_phone: input.phone.trim(),
    client_country: input.country.trim() || undefined,
    pickup_address: input.pickupAddress.trim(),
    dietary_requirements: input.dietary.trim() || undefined,
    flight_number: input.flightNumber.trim() || undefined,
    special_requests: input.specialRequests.trim() || undefined,
    guest_consent_acknowledged: !input.accessToken
      ? input.guestConsentAck
      : undefined,
  }
}

async function main() {
  const catalog = mockDb.catalog()
  const tour = catalog.tours[0]
  const vehicle =
    catalog.vehicles.find((v) => v.slug === 'corolla') ?? catalog.vehicles[0]
  const driver = catalog.drivers[0]
  assert.ok(tour && vehicle && driver)

  const breakdown = calculatePrice(tour, vehicle, 3, 0)
  const builderInput = {
    booking_date: '2026-10-15',
    start_time: '08:00',
    driver_id: driver.id,
    tour_id: tour.id,
    vehicle_id: vehicle.id,
    peopleCount: 3,
    name: ' Parity Guest ',
    email: ' parity@test.khayrcape.com ',
    phone: ' +27000000000 ',
    country: ' ZA ',
    pickupAddress: ' Cape Town ',
    dietary: ' none ',
    flightNumber: ' SA123 ',
    specialRequests: ' window seat ',
    accessToken: null as string | null,
    guestConsentAck: true,
  }

  const builtBody = buildCreateBookingRequestBody(builderInput)
  assert.deepEqual(builtBody, legacyInlineCreateBookingBody(builderInput))

  const yocoHttpBody = buildYocoCheckoutHttpBody({
    amountCents: breakdown.grand_total_cents,
    bookingId: 'booking-parity-1',
    bookingReference: 'KC-PARITY',
    clientName: builtBody.client_name,
    clientEmail: builtBody.client_email,
    tourName: tour.name,
    siteBase: SITE,
  })

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

    const createBookingBody = buildCreateBookingRequestBody(builderInput)
    const yocoBody = buildYocoCheckoutHttpBody({
      amountCents: breakdown.grand_total_cents,
      bookingId: 'booking-parity-1',
      bookingReference: 'KC-PARITY',
      clientName: createBookingBody.client_name,
      clientEmail: createBookingBody.client_email,
      tourName: tour.name,
      siteBase: SITE,
    })

    const payload = JSON.stringify({
      createBookingBody,
      yocoCheckoutHttpBody: yocoBody,
    })
    assert.equal(payload, baseline, `payload must not depend on ${code}`)

    const approx = formatApproxLine(
      breakdown.grand_total_cents,
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
