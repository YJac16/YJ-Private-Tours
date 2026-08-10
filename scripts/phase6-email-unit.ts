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
