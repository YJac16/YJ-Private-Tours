import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scroll to element with id matching location hash when navigating to /#section */
export default function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [pathname, hash])

  return null
}
