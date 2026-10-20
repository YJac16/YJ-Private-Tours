/**
 * vercel.json redirect rules for admin, www, and legacy /tour paths.
 * Run: npx tsx scripts/vercel-redirects-unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LEGACY_TOUR_SLUGS } from '../client/src/lib/tourSlugs.ts'

const vercel = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'vercel.json'),
    'utf8'
  )
) as {
  redirects?: Array<{
    source: string
    destination: string
    permanent?: boolean
    has?: Array<{ type: string; value: string }>
  }>
  rewrites?: Array<{ source: string; destination: string }>
}

const redirects = vercel.redirects ?? []

const www = redirects.find(
  (r) => r.has?.some((h) => h.value === 'www.khayrcapeexperiences.com')
)
assert.ok(www, 'www → apex redirect missing')
assert.equal(www?.permanent, true)
assert.ok(www?.destination.includes('khayrcapeexperiences.com'))

const admin = redirects.find((r) => r.source === '/admin')
assert.ok(admin, '/admin redirect missing')
assert.equal(admin?.destination, '/admin/pricing')

for (const [tourId, slug] of Object.entries(LEGACY_TOUR_SLUGS)) {
  const rule = redirects.find(
    (r) => r.source === `/tour/${tourId}` && r.destination === `/experience/${slug}`
  )
  assert.ok(rule, `missing /tour/${tourId} → /experience/${slug}`)
  assert.equal(rule?.permanent, true)
}

const catchAll = redirects.find((r) => r.source === '/tour/:tourId')
assert.ok(catchAll, 'catch-all /tour/:tourId redirect missing')
assert.equal(catchAll?.destination, '/experience/:tourId')
assert.equal(catchAll?.permanent, true)

const tourRewrite = vercel.rewrites?.find((r) => r.source.startsWith('/tour'))
assert.equal(tourRewrite, undefined, '/tour should not be rewritten to SPA')

console.log('vercel-redirects-unit: ok')
