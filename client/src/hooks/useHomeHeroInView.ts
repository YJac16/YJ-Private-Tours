import { useEffect, useState } from 'react'

/**
 * True while #hero intersects the viewport (homepage hero overlap guard for mobile FABs).
 */
export function useHomeHeroInView(enabled: boolean): boolean {
  const [heroInView, setHeroInView] = useState(enabled)

  useEffect(() => {
    if (!enabled) {
      setHeroInView(false)
      return
    }
    setHeroInView(true)
    const hero = document.getElementById('hero')
    if (!hero) {
      setHeroInView(false)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroInView(entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [enabled])

  return heroInView
}

export function useIsBelowMdBreakpoint(): boolean {
  const [belowMd, setBelowMd] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 767px)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setBelowMd(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return belowMd
}
