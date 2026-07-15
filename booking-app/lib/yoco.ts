/**
 * Yoco Online Checkout (hosted payment page).
 * Secret key stays server-side only. Public key is for client display / future SDK use.
 */

const YOCO_CHECKOUT_URL = 'https://payments.yoco.com/api/checkouts'

export type YocoCheckoutResult = {
  id: string
  redirectUrl: string
  amount: number
  currency: string
  status?: string
}

export async function createYocoCheckout(opts: {
  amountCents: number
  bookingId: string
  clientName?: string
  clientEmail?: string
  tourName?: string
}): Promise<YocoCheckoutResult> {
  const secretKey = process.env.YOCO_SECRET_KEY
  if (!secretKey) {
    throw new Error('YOCO_SECRET_KEY is not configured')
  }

  const site = (
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:5173'
  ).replace(/\/$/, '')
  const amount = Math.round(Number(opts.amountCents))
  if (!Number.isFinite(amount) || amount < 100) {
    throw new Error('Amount must be at least 100 cents (R1)')
  }

  const res = await fetch(YOCO_CHECKOUT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
      'Idempotency-Key': `booking-${opts.bookingId}-${amount}`,
    },
    body: JSON.stringify({
      amount,
      currency: 'ZAR',
      successUrl: `${site}/thank-you?payment=success&booking_id=${opts.bookingId}`,
      cancelUrl: `${site}/book?cancelled=1&booking_id=${opts.bookingId}`,
      failureUrl: `${site}/thank-you?payment=failure&booking_id=${opts.bookingId}`,
      metadata: {
        booking_id: opts.bookingId,
        clientName: opts.clientName || '',
        clientEmail: opts.clientEmail || '',
        tourName: opts.tourName || '',
      },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      data?.message || data?.error || data?.detail || JSON.stringify(data) || 'Yoco error'
    throw new Error(`Yoco checkout failed (${res.status}): ${msg}`)
  }

  if (!data.redirectUrl || !data.id) {
    throw new Error('Invalid Yoco checkout response (missing redirectUrl)')
  }

  return {
    id: data.id,
    redirectUrl: data.redirectUrl,
    amount: data.amount ?? amount,
    currency: data.currency ?? 'ZAR',
    status: data.status,
  }
}

/** Default tour prices in ZAR cents (server authority). */
export const TOUR_PRICES_CENTS: Record<string, number> = {
  city: 150000,
  peninsula: 280000,
  sunset: 180000,
  winelands: 400000,
  // UUID seeds from schema
  '22222222-2222-2222-2222-222222222201': 150000,
  '22222222-2222-2222-2222-222222222202': 280000,
  '22222222-2222-2222-2222-222222222203': 400000,
  '22222222-2222-2222-2222-222222222204': 180000,
}

export function resolveTourAmountCents(
  tourIdOrSlug: string,
  clientAmount?: number
): number {
  const fromMap = TOUR_PRICES_CENTS[tourIdOrSlug]
  if (fromMap) return fromMap
  const n = Number(clientAmount)
  if (Number.isFinite(n) && n >= 100) return Math.round(n)
  return 150000 // fallback City Tour price
}
