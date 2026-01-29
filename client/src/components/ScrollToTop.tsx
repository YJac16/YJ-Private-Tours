import { useState, useEffect } from 'react'
import { HiOutlineArrowUp } from 'react-icons/hi'

const SCROLL_THRESHOLD = 300

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-24 right-4 md:bottom-24 md:right-6 z-50 p-4 rounded-full bg-brand-green hover:bg-brand-green-dark text-white shadow-xl border-2 border-white/90 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
      aria-label="Scroll to top"
    >
      <HiOutlineArrowUp className="text-2xl" />
    </button>
  )
}
