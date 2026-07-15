import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Hashes that open the Tours / Drivers / Fleet tabs section */
const TAB_SECTION_HASHES = new Set(['tours', 'drivers', 'fleet'])

/** Scroll to element with id matching location hash when navigating to /#section */
export default function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      if (pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    const id = hash.slice(1)
    const targetId = TAB_SECTION_HASHES.has(id) ? 'tours-drivers-fleet' : id

    const scroll = () => {
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    // Wait a tick so tab panels / route content can mount
    const t = window.setTimeout(scroll, 50)
    return () => window.clearTimeout(t)
  }, [pathname, hash])

  return null
}
