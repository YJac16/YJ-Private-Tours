import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

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
      className="fixed bottom-0 inset-x-0 z-60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
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
  )
}
