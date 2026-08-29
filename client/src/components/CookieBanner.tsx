import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const STORAGE_KEY = 'cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const { pathname } = useLocation()
  const hideFab = pathname === '/book' || pathname.startsWith('/book/')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

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
      role="dialog"
      aria-label="Cookie notice"
      className={`fixed z-60 left-3 right-3 md:left-auto md:right-6 md:max-w-sm ${
        hideFab
          ? 'top-[4.75rem] md:top-auto md:bottom-[max(1.25rem,env(safe-area-inset-bottom))]'
          : 'top-[4.75rem] md:top-auto md:bottom-[calc(5.25rem+env(safe-area-inset-bottom))]'
      }`}
    >
      <div className="rounded-2xl border border-brand-cream-dark bg-brand-cream shadow-lg p-4 flex flex-col gap-3">
        <p className="text-sm text-brand-green/90 leading-relaxed">
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
          className="self-start min-h-11 px-5 rounded-xl bg-brand-green text-brand-cream font-semibold hover:opacity-95"
        >
          Accept
        </button>
      </div>
    </div>
  )
}
