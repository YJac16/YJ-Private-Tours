import { useLayoutEffect, type RefObject } from 'react'
import { syncBookMobileBarHeight } from '../lib/bookStickyBar'

export function useBookMobileBarHeight(
  ref: RefObject<HTMLElement | null>,
  active: boolean
) {
  useLayoutEffect(() => {
    if (!active) {
      syncBookMobileBarHeight(0)
      return
    }

    const el = ref.current
    if (!el) {
      syncBookMobileBarHeight(0)
      return
    }

    const measure = () => {
      const rect = el.getBoundingClientRect()
      syncBookMobileBarHeight(Math.max(el.offsetHeight, rect.height))
    }

    measure()
    const raf = requestAnimationFrame(measure)

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', measure)
      syncBookMobileBarHeight(0)
    }
  }, [ref, active])
}
