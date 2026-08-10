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
  bookingReference?: string
  clientName?: string
  clientEmail?: string
  tourName?: string
  /** Override default key — use a unique suffix when retrying after an expired checkout. */
  idempotencyKey?: string
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

  const refQ = opts.bookingReference
    ? `&ref=${encodeURIComponent(opts.bookingReference)}`
    : ''

  const res = await fetch(YOCO_CHECKOUT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
      'Idempotency-Key':
        opts.idempotencyKey || `booking-${opts.bookingId}-${amount}`,
    },
    body: JSON.stringify({
      amount,
      currency: 'ZAR',
      successUrl: `${site}/thank-you?payment=success&booking_id=${opts.bookingId}${refQ}`,
      cancelUrl: `${site}/book?cancelled=1&booking_id=${opts.bookingId}${refQ}`,
      failureUrl: `${site}/thank-you?payment=failure&booking_id=${opts.bookingId}${refQ}`,
      metadata: {
        booking_id: opts.bookingId,
        booking_reference: opts.bookingReference || '',
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

/**
 * Refund a completed Yoco checkout (full or partial).
 * Note: Yoco test keys often reject refunds — live keys required for real refunds.
 */
export async function createYocoRefund(opts: {
  checkoutId: string
  amountCents?: number | null
  idempotencyKey: string
}): Promise<{ ok: true; status: number; data: Record<string, unknown> } | { ok: false; status: number; error: string }> {
  const secretKey = process.env.YOCO_SECRET_KEY
  if (!secretKey) {
    return { ok: false, status: 500, error: 'YOCO_SECRET_KEY is not configured' }
  }
  const checkoutId = String(opts.checkoutId || '').trim()
  if (!checkoutId) {
    return { ok: false, status: 400, error: 'Missing checkout id for refund' }
  }

  const body: Record<string, unknown> = {}
  if (opts.amountCents != null && Number.isFinite(opts.amountCents)) {
    body.amount = Math.round(Number(opts.amountCents))
  }

  const res = await fetch(
    `${YOCO_CHECKOUT_URL}/${encodeURIComponent(checkoutId)}/refund`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
        'Idempotency-Key': opts.idempotencyKey,
      },
      body: JSON.stringify(body),
    }
  )
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok && res.status !== 202) {
    const msg =
      (data?.message as string) ||
      (data?.error as string) ||
      (data?.detail as string) ||
      JSON.stringify(data) ||
      'Yoco refund failed'
    return { ok: false, status: res.status, error: msg }
  }
  return { ok: true, status: res.status, data }
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
