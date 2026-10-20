/**
 * Cookie dock offset helper for /book mobile sticky bar.
 * Run: npx tsx scripts/book-cookie-dock-offset-unit.ts
 */
import assert from 'node:assert/strict'
import {
  cookieDockBottomOffsetPx,
  MOBILE_FIXED_ABOVE_COOKIE_BOTTOM_CLASS,
} from '../client/src/lib/cookieDockOffset.ts'
import {
  BOOK_MOBILE_BAR_HEIGHT_VAR,
  BOOK_MOBILE_MAIN_PADDING_CLASS,
} from '../client/src/lib/bookStickyBar.ts'

assert.equal(cookieDockBottomOffsetPx(0), 0)
assert.equal(cookieDockBottomOffsetPx(48.1), 49)
assert.equal(cookieDockBottomOffsetPx(52), 52)

assert.ok(
  MOBILE_FIXED_ABOVE_COOKIE_BOTTOM_CLASS.includes('--cookie-dock-height'),
  'sticky bar must use cookie dock CSS variable'
)

assert.ok(
  BOOK_MOBILE_MAIN_PADDING_CLASS.includes(BOOK_MOBILE_BAR_HEIGHT_VAR),
  'main padding must use measured sticky bar height CSS variable'
)

console.log('book-cookie-dock-offset-unit: ok')
