/**
 * Phase 6 unit tests: guest/driver templates, outbox dedupe + drain.
 * Run: npx tsx scripts/phase6-email-unit.ts
 */
import assert from 'node:assert/strict'
import {
  backoffMinutes,
  drainEmailOutbox,
  enqueueNotification,
  listOutboxMemory,
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
process.env.MAILERSEND_API_KEY = 'test-mailersend-key'
process.env.EMAIL_FROM =
  'KhayrCape Experiences <hello.khayrcapeexperiences@gmail.com>'

const mailerCalls: Array<{ url: string; body: Record<string, unknown> }> = []
let mailerSeq = 0

globalThis.fetch = async (input: string | URL, init?: { body?: string }) => {
  mailerSeq += 1
  const url = String(input)
  const body = init?.body
    ? (JSON.parse(String(init.body)) as Record<string, unknown>)
    : {}
  mailerCalls.push({ url, body })
  return new Response('', {
    status: 202,
    headers: { 'x-message-id': `ms-msg-${mailerSeq}` },
  })
}

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

  await check('notifyBookingEvent enqueues driver+guest and MailerSend marks them sent', async () => {
    resetOutboxMemoryForTests()
    mailerCalls.length = 0
    const result = await notifyBookingEvent(sample, 'created', { drain: true })
    assert.equal(result.enqueued, 2)
    const rows = listOutboxMemory()
    assert.equal(rows.length, 2)
    assert.ok(rows.every((r) => r.status === 'sent'))
    assert.ok(rows.some((r) => r.audience === 'guest' && r.provider_id?.startsWith('ms-msg-')))
    assert.ok(rows.some((r) => r.audience === 'driver' && r.provider_id?.startsWith('ms-msg-')))
    assert.equal(mailerCalls.length, 2)
    assert.ok(mailerCalls.every((call) => call.url === 'https://api.mailersend.com/v1/email'))
    assert.ok(
      mailerCalls.every((call) => {
        const from = call.body.from as { email?: string; name?: string }
        return (
          from.email === 'hello.khayrcapeexperiences@gmail.com' &&
          from.name === 'KhayrCape Experiences'
        )
      })
    )
    assert.ok(!mailerCalls.some((call) => call.url.includes('resend.com')))
  })

  await check('duplicate notify does not re-enqueue', async () => {
    resetOutboxMemoryForTests()
    await notifyBookingEvent(sample, 'paid', { drain: false })
    const second = await notifyBookingEvent(sample, 'paid', { drain: false })
    assert.equal(second.enqueued, 0)
    assert.equal(listOutboxMemory().length, 2)
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
    assert.ok(listOutboxMemory()[0].provider_id?.startsWith('ms-msg-'))
  })

  await check('missing MailerSend key leaves the row pending', async () => {
    resetOutboxMemoryForTests()
    delete process.env.MAILERSEND_API_KEY
    const before = mailerCalls.length
    await enqueueNotification({
      dedupeKey: 'ops:no-key',
      audience: 'guest',
      kind: 'created',
      toEmail: 'ada@test.khayrcape.com',
      subject: 'hold',
      bodyText: 'not sent',
    })
    const drain = await drainEmailOutbox(null)
    assert.equal(drain.sent, 0)
    assert.equal(drain.failed, 1)
    const row = listOutboxMemory()[0]
    assert.equal(row.status, 'pending')
    assert.match(row.last_error || '', /MAILERSEND_API_KEY not set/)
    assert.equal(mailerCalls.length, before)
    process.env.MAILERSEND_API_KEY = 'test-mailersend-key'
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main()
