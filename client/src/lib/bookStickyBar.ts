/**
 * Mobile /book sticky Continue bar height (ResizeObserver → CSS variable).
 */

export const BOOK_MOBILE_BAR_HEIGHT_VAR = '--book-mobile-bar-height'

export function syncBookMobileBarHeight(heightPx: number) {
  document.documentElement.style.setProperty(
    BOOK_MOBILE_BAR_HEIGHT_VAR,
    `${Math.max(0, Math.ceil(heightPx))}px`
  )
}

/** Main content padding above cookie dock + measured sticky bar (mobile). */
export const BOOK_MOBILE_MAIN_PADDING_CLASS =
  'max-lg:pb-[calc(var(--cookie-dock-height,0px)+var(--book-mobile-bar-height,4.75rem)+env(safe-area-inset-bottom,0px))]'
