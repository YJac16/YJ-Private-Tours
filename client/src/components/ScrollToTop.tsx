import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { HiOutlineArrowUp } from 'react-icons/hi'

const SCROLL_THRESHOLD = 300

const HIDE_ON = [
  '/book',
  '/thank-you',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
]

export default function ScrollToTop() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)
  const hidden = HIDE_ON.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  useEffect(() => {
    if (hidden) {
      setVisible(false)
      return
    }
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [hidden])

  if (hidden || !visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-4 md:bottom-24 md:right-6 z-40 p-4 rounded-full bg-brand-green hover:bg-brand-green-dark text-white shadow-xl border-2 border-brand-cream/90 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
      aria-label="Scroll to top"
    >
      <HiOutlineArrowUp className="text-2xl" />
    </button>
  )
}
