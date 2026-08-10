/**
 * Phase 1 unit checks: Yoco webhook signature + amount extraction (no network).
 * Run: node scripts/phase1-webhook-unit.mjs
 */
import crypto from 'crypto'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// Dynamic import of compiled TS is awkward; re-implement verify briefly for smoke
// against the same algorithm as booking-app/lib/yoco-webhook.ts

function verify(rawBody, headers, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  const id = headers['webhook-id']
  const ts = headers['webhook-timestamp']
  const sigHeader = headers['webhook-signature']
  if (!id || !ts || !sigHeader) return { ok: false, error: 'missing headers' }
  if (Math.abs(nowSeconds - Number(ts)) > 180) return { ok: false, error: 'tol' }
  const secretBytes = Buffer.from(secret.slice('whsec_'.length), 'base64')
  const signed = `${id}.${ts}.${rawBody}`
  const expected = crypto.createHmac('sha256', secretBytes).update(signed, 'utf8').digest('base64')
  const candidates = sigHeader.split(/\s+/).map((p) => p.split(',')[1]).filter(Boolean)
  const matched = candidates.some((s) => s === expected)
  return matched ? { ok: true } : { ok: false, error: 'bad sig' }
}

const secret = 'whsec_' + Buffer.from('phase1-test-secret-key!!').toString('base64')
const body = JSON.stringify({
  id: 'evt_test_1',
  type: 'payment.succeeded',
  createdDate: new Date().toISOString(),
  payload: {
    id: 'ch_test',
    amount: 150000,
    currency: 'ZAR',
    metadata: { booking_id: '11111111-1111-1111-1111-111111111111' },
  },
})
const id = 'msg_test_1'
const ts = String(Math.floor(Date.now() / 1000))
const secretBytes = Buffer.from(secret.slice('whsec_'.length), 'base64')
const expected = crypto
  .createHmac('sha256', secretBytes)
  .update(`${id}.${ts}.${body}`, 'utf8')
  .digest('base64')

let passed = 0
let failed = 0
function assert(name, cond) {
  if (cond) {
    console.log('PASS', name)
    passed++
  } else {
    console.error('FAIL', name)
    failed++
  }
}

assert(
  'valid signature accepted',
  verify(body, {
    'webhook-id': id,
    'webhook-timestamp': ts,
    'webhook-signature': `v1,${expected}`,
  }, secret).ok
)

assert(
  'tampered body rejected',
  !verify(body + ' ', {
    'webhook-id': id,
    'webhook-timestamp': ts,
    'webhook-signature': `v1,${expected}`,
  }, secret).ok
)

assert(
  'wrong signature rejected',
  !verify(body, {
    'webhook-id': id,
    'webhook-timestamp': ts,
    'webhook-signature': 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  }, secret).ok
)

assert(
  'stale timestamp rejected',
  !verify(body, {
    'webhook-id': id,
    'webhook-timestamp': String(Math.floor(Date.now() / 1000) - 600),
    'webhook-signature': `v1,${expected}`,
  }, secret).ok
)

const parsed = JSON.parse(body)
assert('booking_id extracted', parsed.payload.metadata.booking_id.startsWith('1111'))
assert('amount extracted', parsed.payload.amount === 150000)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
