import crypto from 'crypto'

const MAX_BODY_BYTES = 1_048_576
const DEFAULT_TOLERANCE_SECONDS = 180

export type YocoWebhookVerifyResult = {
  ok: true
  event: Record<string, unknown>
  eventId: string
  eventType: string
  rawBody: string
} | {
  ok: false
  status: number
  error: string
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase())
  if (!key) return ''
  const v = headers[key]
  return Array.isArray(v) ? String(v[0] || '') : String(v || '')
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Verify Yoco Checkout webhooks (Standard Webhooks / Yoco docs).
 * Uses raw body bytes exactly as received.
 */
export function verifyYocoWebhook(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  opts?: { secret?: string; toleranceSeconds?: number; nowSeconds?: number }
): YocoWebhookVerifyResult {
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Webhook body too large' }
  }

  const secret = opts?.secret || process.env.YOCO_WEBHOOK_SECRET || ''
  if (!secret) {
    return {
      ok: false,
      status: 500,
      error: 'YOCO_WEBHOOK_SECRET is not configured',
    }
  }
  if (!secret.startsWith('whsec_')) {
    return {
      ok: false,
      status: 500,
      error: 'YOCO_WEBHOOK_SECRET must start with whsec_',
    }
  }

  const webhookId = headerValue(headers, 'webhook-id')
  const webhookTimestamp = headerValue(headers, 'webhook-timestamp')
  const webhookSignature = headerValue(headers, 'webhook-signature')

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return {
      ok: false,
      status: 401,
      error: 'Missing webhook signature headers',
    }
  }

  if (!/^\d+$/.test(webhookTimestamp)) {
    return { ok: false, status: 401, error: 'Invalid webhook-timestamp' }
  }

  const tolerance = opts?.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS
  const now = opts?.nowSeconds ?? Math.floor(Date.now() / 1000)
  const ts = Number(webhookTimestamp)
  if (Math.abs(now - ts) > tolerance) {
    return { ok: false, status: 401, error: 'Webhook timestamp outside tolerance' }
  }

  let secretBytes: Buffer
  try {
    secretBytes = Buffer.from(secret.slice('whsec_'.length), 'base64')
    if (!secretBytes.length) throw new Error('empty secret')
  } catch {
    return { ok: false, status: 500, error: 'Invalid YOCO_WEBHOOK_SECRET encoding' }
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent, 'utf8')
    .digest('base64')

  const candidates = webhookSignature
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf(',')
      if (idx <= 0) return null
      const version = part.slice(0, idx)
      const sig = part.slice(idx + 1)
      if (version !== 'v1' || !sig) return null
      return sig
    })
    .filter((s): s is string => Boolean(s))

  if (!candidates.length) {
    return { ok: false, status: 401, error: 'No v1 webhook signature present' }
  }

  const matched = candidates.some((sig) => {
    try {
      return timingSafeEqualString(expected, sig)
    } catch {
      return false
    }
  })

  if (!matched) {
    return { ok: false, status: 401, error: 'Invalid webhook signature' }
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON body' }
  }

  const eventId = typeof event.id === 'string' ? event.id : ''
  const eventType = typeof event.type === 'string' ? event.type : ''
  if (!eventId || !eventType) {
    return { ok: false, status: 400, error: 'Webhook missing id or type' }
  }

  return { ok: true, event, eventId, eventType, rawBody }
}

export function extractWebhookBookingId(body: Record<string, unknown>): string | null {
  if (typeof body.booking_id === 'string' && body.booking_id) return body.booking_id

  const payload = body.payload as Record<string, unknown> | undefined
  const metadata =
    (body.metadata as Record<string, unknown> | undefined) ||
    (payload?.metadata as Record<string, unknown> | undefined) ||
    ((payload?.data as Record<string, unknown> | undefined)?.metadata as
      | Record<string, unknown>
      | undefined)

  if (metadata && typeof metadata.booking_id === 'string' && metadata.booking_id) {
    return metadata.booking_id
  }

  if (payload && typeof payload.booking_id === 'string' && payload.booking_id) {
    return payload.booking_id
  }

  return null
}

export function extractWebhookAmountCents(body: Record<string, unknown>): number | null {
  const payload = body.payload as Record<string, unknown> | undefined
  const candidates = [
    body.amount_cents,
    body.amount,
    payload?.amount,
    payload?.amountInCents,
    (payload?.payment as Record<string, unknown> | undefined)?.amount,
  ]
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return Math.round(c)
    if (typeof c === 'string' && c.trim() && Number.isFinite(Number(c))) {
      return Math.round(Number(c))
    }
  }
  return null
}

export function extractWebhookCurrency(body: Record<string, unknown>): string | null {
  const payload = body.payload as Record<string, unknown> | undefined
  const c =
    body.currency ||
    payload?.currency ||
    (payload?.payment as Record<string, unknown> | undefined)?.currency
  return typeof c === 'string' && c ? c.toUpperCase() : null
}

export function extractWebhookCheckoutId(body: Record<string, unknown>): string | null {
  const payload = body.payload as Record<string, unknown> | undefined
  if (typeof body.id === 'string' && body.id.startsWith('ch_')) return body.id
  if (payload && typeof payload.id === 'string') return payload.id
  if (typeof body.checkout_id === 'string') return body.checkout_id
  return null
}

export function isPaymentSuccessEvent(eventType: string): boolean {
  return /payment\.succeeded|checkout\.(completed|success)|payment\.success/i.test(
    eventType
  )
}

export function isRefundSuccessEvent(eventType: string): boolean {
  return /refund\.succeeded|refund\.success/i.test(eventType)
}
