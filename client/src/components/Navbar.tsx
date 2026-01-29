import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiMenu, HiX } from 'react-icons/hi'

const navLinks = [
  { href: '#tours', label: 'Tours' },
  { href: '#drivers', label: 'Drivers' },
  { href: '#fleet', label: 'Fleet' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#about', label: 'About' },
  { href: '#enquiry', label: 'Enquiry' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-brand-cream/95 backdrop-blur border-b border-brand-cream-dark shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16 md:h-18">
        {/* KhayrCape Experiences Logo — links to home */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center shrink-0"
          aria-label="KhayrCape Experiences home"
        >
          <img
            src="/KhayrCape%20Experiences%20Logo.png"
            alt="KhayrCape Experiences"
            className="h-10 md:h-11 w-auto object-contain max-w-[180px] md:max-w-[200px]"
          />
        </Link>

        {/* Desktop nav — tabs on the right */}
        <nav className="hidden md:flex items-center gap-1 ml-auto">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-brand-green hover:text-brand-green-dark hover:bg-brand-cream-dark/50 rounded-lg text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden p-2 rounded-lg text-brand-green hover:bg-brand-cream-dark/50"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <HiX className="text-2xl" /> : <HiMenu className="text-2xl" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-out ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="px-4 pb-4 pt-2 bg-brand-cream border-t border-brand-cream-dark flex flex-col gap-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="py-3 text-brand-green font-medium border-b border-brand-cream-dark"
          >
            Home
          </Link>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 font-medium"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
