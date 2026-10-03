/**
 * Phase 6 unit tests: guest/driver templates, outbox dedupe + drain.
 * Run: npx tsx scripts/phase6-email-unit.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  backoffMinutes,
  bookingFromAddress,
  DEFAULT_EMAIL_FROM,
  drainEmailOutbox,
  enqueueNotification,
  listOutboxMemory,
  parseMailbox,
  resetOutboxMemoryForTests,
} from '../booking-app/lib/email-outbox'
import {
  buildDriverBookingEmail,
  buildGuestBookingEmail,
  notifyBookingEvent,
  type BookingEmailDetails,
} from '../booking-app/lib/notify'

process.env.BOOKING_MOCK = '1'
delete process.env.RESEND_API_KEY

let passed = 0
let failed = 0

function check(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn()
      console.log(`PASS ${name}`)
      passed += 1
    } catch (e) {
      console.error(`FAIL ${name}`)
      console.error(e)
      failed += 1
    }
  })()
}

const sample: BookingEmailDetails = {
  bookingId: 'KC-TEST-001',
  status: 'pending',
  bookingDate: '2026-08-20',
  startTime: '09:00',
  clientName: 'Ada Guest',
  clientEmail: 'ada@test.khayrcape.com',
  clientPhone: '+27000000000',
  tourName: 'City Experience',
  vehicleName: 'Suzuki',
  driverName: 'Yaseen',
  amountCents: 250000,
}

async function main() {
  await check('guest created template mentions 30 min hold', () => {
    const mail = buildGuestBookingEmail(sample, 'created')
    assert.match(mail.subject, /Booking received/i)
    assert.match(mail.text, /30 minutes/i)
    assert.match(mail.html, /Ada Guest/)
  })

  await check('guest paid template confirms payment', () => {
    const mail = buildGuestBookingEmail({ ...sample, status: 'paid' }, 'paid')
    assert.match(mail.subject, /Confirmed/i)
    assert.match(mail.text, /confirmed/i)
  })

  await check('driver paid template still driver-facing', () => {
    const mail = buildDriverBookingEmail({ ...sample, status: 'paid' }, 'paid')
    assert.match(mail.subject, /Paid/i)
    assert.match(mail.text, /Manage schedule/)
  })

  await check('backoff doubles then caps', () => {
    assert.equal(backoffMinutes(1), 1)
    assert.equal(backoffMinutes(2), 2)
    assert.equal(backoffMinutes(3), 4)
    assert.equal(backoffMinutes(10), 60)
  })

  await check('outbox dedupe on same key', async () => {
    resetOutboxMemoryForTests()
    const a = await enqueueNotification({
      dedupeKey: 'KC-TEST-001:paid:guest',
      audience: 'guest',
      kind: 'paid',
      toEmail: 'ada@test.khayrcape.com',
      subject: 'A',
      bodyText: 'body',
    })
    const b = await enqueueNotification({
      dedupeKey: 'KC-TEST-001:paid:guest',
      audience: 'guest',
      kind: 'paid',
      toEmail: 'ada@test.khayrcape.com',
      subject: 'B',
      bodyText: 'body',
    })
    assert.equal(a.inserted, true)
    assert.equal(b.inserted, false)
    assert.equal(listOutboxMemory().length, 1)
  })

  await check('notifyBookingEvent enqueues driver+guest and mock-drains', async () => {
    resetOutboxMemoryForTests()
    const result = await notifyBookingEvent(sample, 'created', { drain: true })
    assert.equal(result.enqueued, 2)
    const rows = listOutboxMemory()
    assert.equal(rows.length, 2)
    assert.ok(rows.every((r) => r.status === 'sent'))
    assert.ok(rows.some((r) => r.audience === 'guest'))
    assert.ok(rows.some((r) => r.audience === 'driver'))
  })

  await check('duplicate notify does not re-enqueue', async () => {
    resetOutboxMemoryForTests()
    await notifyBookingEvent(sample, 'paid', { drain: false })
    const second = await notifyBookingEvent(sample, 'paid', { drain: false })
    assert.equal(second.enqueued, 0)
    assert.equal(listOutboxMemory().length, 2)
  })

  await check('from address defaults to the verified site domain', () => {
    delete process.env.EMAIL_FROM
    assert.equal(
      DEFAULT_EMAIL_FROM,
      'KhayrCape Experiences <bookings@khayrcapeexperiences.com>'
    )
    assert.equal(
      bookingFromAddress(),
      'KhayrCape Experiences <bookings@khayrcapeexperiences.com>'
    )
    assert.deepEqual(parseMailbox('Ops <ops@khayrcapeexperiences.com>'), {
      name: 'Ops',
      email: 'ops@khayrcapeexperiences.com',
    })
  })

  await check('sender is Resend and does not call MailerSend', () => {
    const src = readFileSync(
      new URL('../booking-app/lib/email-outbox.ts', import.meta.url),
      'utf8'
    )
    assert.match(src, /api\.resend\.com\/emails/)
    assert.match(src, /Idempotency-Key/)
    assert.equal(src.toLowerCase().includes('mailersend'), false)
    assert.equal(src.includes('api.brevo.com'), false)
  })

  await check('missing Resend key stays pending instead of marking sent', async () => {
    const prev = {
      BOOKING_MOCK: process.env.BOOKING_MOCK,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      VERCEL_ENV: process.env.VERCEL_ENV,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
    }
    process.env.BOOKING_MOCK = '0'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    delete process.env.VERCEL_ENV
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    try {
      resetOutboxMemoryForTests()
      await enqueueNotification({
        dedupeKey: 'ops:no-key',
        audience: 'ops',
        kind: 'payment_alert',
        toEmail: 'ops@test.khayrcape.com',
        subject: 'alert',
        bodyText: 'needs a key',
      })
      const drain = await drainEmailOutbox(null)
      assert.equal(drain.processed, 1)
      assert.equal(drain.sent, 0)
      assert.equal(drain.failed, 1)
      const row = listOutboxMemory()[0]
      assert.equal(row.status, 'pending')
      assert.equal(row.attempts, 0)
      assert.match(row.last_error || '', /RESEND_API_KEY not set/)
    } finally {
      process.env.BOOKING_MOCK = prev.BOOKING_MOCK
      if (prev.NEXT_PUBLIC_SUPABASE_URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
      else process.env.NEXT_PUBLIC_SUPABASE_URL = prev.NEXT_PUBLIC_SUPABASE_URL
      if (prev.SUPABASE_SERVICE_ROLE_KEY === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prev.SUPABASE_SERVICE_ROLE_KEY
      if (prev.VERCEL_ENV === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = prev.VERCEL_ENV
      if (prev.RESEND_API_KEY === undefined) delete process.env.RESEND_API_KEY
      else process.env.RESEND_API_KEY = prev.RESEND_API_KEY
      if (prev.EMAIL_FROM === undefined) delete process.env.EMAIL_FROM
      else process.env.EMAIL_FROM = prev.EMAIL_FROM
    }
  })

  await check('drainEmailOutbox processes pending', async () => {
    resetOutboxMemoryForTests()
    await enqueueNotification({
      dedupeKey: 'ops:x',
      audience: 'ops',
      kind: 'payment_alert',
      toEmail: 'ops@test.khayrcape.com',
      subject: 'alert',
      bodyText: 'fail check',
    })
    const drain = await drainEmailOutbox(null)
    assert.equal(drain.processed, 1)
    assert.equal(drain.sent, 1)
    assert.equal(listOutboxMemory()[0].status, 'sent')
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main()
