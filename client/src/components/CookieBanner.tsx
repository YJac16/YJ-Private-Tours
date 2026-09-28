import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'cookie_consent'

function syncCookieDockHeight(height: number) {
  document.documentElement.style.setProperty(
    '--cookie-dock-height',
    `${Math.max(0, Math.ceil(height))}px`
  )
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  useLayoutEffect(() => {
    if (!visible) {
      syncCookieDockHeight(0)
      return
    }

    const el = dockRef.current
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      syncCookieDockHeight(Math.max(el.offsetHeight, rect.height))
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
      syncCookieDockHeight(0)
    }
  }, [visible])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'essential')
    } catch {
      /* ignore quota / private mode */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      ref={dockRef}
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-0 inset-x-0 z-60"
    >
      {/* Mobile: slim bottom bar */}
      <div className="md:hidden border-t border-brand-cream-dark bg-brand-cream/98 backdrop-blur-sm px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 max-w-6xl mx-auto min-h-10">
          <p className="text-[11px] leading-tight text-brand-green/90 flex-1 min-w-0">
            Essential cookies only.{' '}
            <Link to="/cookies" className="underline font-semibold text-brand-green">
              Cookie Policy
            </Link>
            {' · '}
            <Link to="/privacy" className="underline font-semibold text-brand-green whitespace-nowrap">
              Privacy
            </Link>
          </p>
          <button
            type="button"
            onClick={accept}
            className="shrink-0 min-h-9 px-3 rounded-md bg-brand-green text-brand-cream text-xs font-semibold hover:opacity-95"
          >
            Accept
          </button>
        </div>
      </div>

      {/* Desktop: full banner */}
      <div className="hidden md:block p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto rounded-2xl border border-brand-cream-dark bg-brand-cream shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
          <p className="text-sm text-brand-green/90 flex-1 leading-relaxed">
            We use essential cookies and similar storage to keep you signed in and run bookings. See our{' '}
            <Link to="/cookies" className="underline font-semibold text-brand-green">
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline font-semibold text-brand-green">
              Privacy Policy
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={accept}
            className="shrink-0 min-h-12 px-5 rounded-lg bg-brand-green text-brand-cream font-semibold hover:opacity-95"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
