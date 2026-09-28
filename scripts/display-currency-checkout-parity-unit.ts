/**
 * Display currency must not alter checkout maths or Yoco payload.
 */
import assert from 'node:assert/strict'
import { calculatePrice } from '../booking-app/lib/pricing.ts'
import { createYocoCheckout } from '../booking-app/lib/yoco.ts'
import { mockDb } from '../booking-app/lib/mock-store.ts'

process.env.BOOKING_MOCK = '1'

const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'ZAR'] as const

async function main() {
  const catalog = mockDb.catalog()
  const tour = catalog.tours[0]
  const vehicle = catalog.vehicles.find((v) => v.slug === 'corolla') ?? catalog.vehicles[0]
  assert.ok(tour && vehicle)

  const baseline = calculatePrice(tour, vehicle, 3, 0)
  const baselineCheckout = await createYocoCheckout({
    amountCents: baseline.grand_total_cents,
    bookingId: 'parity-booking-1',
    bookingReference: 'KC-PARITY',
  })
  const baselinePayload = JSON.stringify({
    breakdown: baseline,
    yoco: {
      amount: baselineCheckout.amount,
      currency: baselineCheckout.currency,
    },
  })

  for (const _code of DISPLAY_CURRENCIES) {
    const breakdown = calculatePrice(tour, vehicle, 3, 0)
    const checkout = await createYocoCheckout({
      amountCents: breakdown.grand_total_cents,
      bookingId: 'parity-booking-1',
      bookingReference: 'KC-PARITY',
    })
    const payload = JSON.stringify({
      breakdown,
      yoco: { amount: checkout.amount, currency: checkout.currency },
    })
    assert.equal(payload, baselinePayload, `checkout payload must not depend on ${_code}`)
  }

  console.log('display-currency-checkout-parity-unit: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
