/**
 * Mobile fixed UI sits above the slim cookie bar via --cookie-dock-height (see CookieBanner).
 */

/** Pixel offset for a fixed bottom element above the cookie dock (integer px). */
export function cookieDockBottomOffsetPx(cookieDockHeightPx: number): number {
  const n = Number(cookieDockHeightPx)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.ceil(n)
}

/** Tailwind arbitrary bottom class: uses live --cookie-dock-height from CookieBanner. */
export const MOBILE_FIXED_ABOVE_COOKIE_BOTTOM_CLASS =
  'bottom-[var(--cookie-dock-height,0px)]'

/** Fixed disclaimer sits directly above the mobile /book sticky bar (not inside it). */
export const MOBILE_BOOK_DISCLAIMER_ABOVE_STICKY_CLASS =
  'bottom-[calc(var(--cookie-dock-height,0px)+4.5rem)]'
