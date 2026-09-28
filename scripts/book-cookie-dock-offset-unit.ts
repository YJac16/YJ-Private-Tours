/**
 * Cookie dock offset helper for /book mobile sticky bar.
 * Run: npx tsx scripts/book-cookie-dock-offset-unit.ts
 */
import assert from 'node:assert/strict'
import {
  cookieDockBottomOffsetPx,
  MOBILE_FIXED_ABOVE_COOKIE_BOTTOM_CLASS,
} from '../client/src/lib/cookieDockOffset.ts'

assert.equal(cookieDockBottomOffsetPx(0), 0)
assert.equal(cookieDockBottomOffsetPx(48.1), 49)
assert.equal(cookieDockBottomOffsetPx(52), 52)

assert.ok(
  MOBILE_FIXED_ABOVE_COOKIE_BOTTOM_CLASS.includes('--cookie-dock-height'),
  'sticky bar must use cookie dock CSS variable'
)

console.log('book-cookie-dock-offset-unit: ok')
