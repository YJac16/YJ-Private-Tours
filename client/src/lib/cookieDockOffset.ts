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
