/**
 * Cron bearer check, consent HTML allowlist, guest-retry cap, public catalog meta.
 * Run: npx tsx scripts/security-hardening-unit.ts
 */
import assert from 'node:assert/strict'
import { bearerMatches } from '../booking-app/lib/cron-auth.ts'
import { publicTourAdminMeta } from '../booking-app/lib/seasonalVisibility.ts'
import {
  guestRetryAllowed,
  resetGuestRetryLimits,
} from '../api/_lib/guestRetryLimit.ts'
import {
  safeConsentHref,
  sanitizeConsentHtml,
} from '../client/src/lib/sanitizeHtml.ts'

const secret = 'cron-secret-value'

assert.equal(bearerMatches(undefined, secret), false)
assert.equal(bearerMatches('Bearer cron-secret-value', undefined), false)
assert.equal(bearerMatches('Bearer cron-secret-value', ''), false)
assert.equal(bearerMatches('Bearer wrong-secret-value', secret), false)
assert.equal(bearerMatches('bearer cron-secret-value', secret), false)
assert.equal(bearerMatches('Bearer cron-secret-value ', secret), false)
assert.equal(bearerMatches('Bearer cron-secret-value', secret), true)
assert.equal(bearerMatches('1', secret), false)

const dirty =
  '<p onclick="alert(1)">Hello <strong>there</strong></p>' +
  '<script>alert(1)</script>' +
  '<a href="javascript:alert(1)">bad</a>' +
  '<a href="https://khayrcapeexperiences.com/privacy">privacy</a>' +
  '<img src=x onerror=alert(1)>'
const clean = sanitizeConsentHtml(dirty)
assert.match(clean, /<p>Hello <strong>there<\/strong><\/p>/)
assert.doesNotMatch(clean, /script|onclick|onerror|javascript/i)
assert.match(
  clean,
  /<a href="https:\/\/khayrcapeexperiences.com\/privacy" rel="noopener noreferrer">privacy<\/a>/
)
assert.equal(safeConsentHref('//evil.example'), null)
assert.equal(safeConsentHref('/privacy'), '/privacy')

const meta = publicTourAdminMeta({
  status: 'active',
  season: { start: { m: 6, d: 1 } },
  weekend_price_cents: 999,
  holiday_price_cents: 1000,
})
assert.deepEqual(Object.keys(meta).sort(), ['season', 'status'])
assert.equal(meta.weekend_price_cents, undefined)

resetGuestRetryLimits()
for (let i = 0; i < 10; i += 1) {
  assert.equal(guestRetryAllowed('1.2.3.4:booking-1', 1_000 + i), true)
}
assert.equal(guestRetryAllowed('1.2.3.4:booking-1', 1_010), false)
assert.equal(guestRetryAllowed('1.2.3.4:booking-2', 1_010), true)

async function checkPublicCatalog() {
  process.env.BOOKING_MOCK = '1'
  const { default: catalogHandler } = await import('../api/catalog.ts')
  let catalogStatus = 0
  let catalogBody: {
    drivers?: Array<Record<string, unknown>>
    tours?: Array<Record<string, unknown>>
  } = {}
  await catalogHandler(
    { method: 'GET', query: {}, url: '/api/catalog' } as never,
    {
      status(code: number) {
        catalogStatus = code
        return this
      },
      json(body: typeof catalogBody) {
        catalogBody = body
        return this
      },
    } as never
  )
  assert.equal(catalogStatus, 200)
  assert.ok((catalogBody.drivers || []).length > 0)
  assert.ok((catalogBody.drivers || []).every((d) => !('user_id' in d)))
  for (const tour of catalogBody.tours || []) {
    const meta = (tour.admin_meta || {}) as Record<string, unknown>
    assert.deepEqual(
      Object.keys(meta).filter((k) => k !== 'season' && k !== 'status'),
      []
    )
  }
  const hermanus = (catalogBody.tours || []).find((t) => t.slug === 'hermanus')
  if (hermanus) {
    assert.ok((hermanus.admin_meta as Record<string, unknown>).season)
  }
}

checkPublicCatalog()
  .then(() => {
    console.log('security-hardening-unit: ok')
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
