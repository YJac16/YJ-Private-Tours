import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiMenu, HiX } from 'react-icons/hi'
import { useAuth } from '../lib/auth'

const navLinks = [
  { hash: 'tours', label: 'Tours' },
  { hash: 'drivers', label: 'Drivers' },
  { hash: 'fleet', label: 'Fleet' },
  { hash: 'gallery', label: 'Gallery' },
  { hash: 'about', label: 'About' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { user, role, profile, signOut, loading } = useAuth()

  const goHome = () => {
    setMobileOpen(false)
    navigate({ pathname: '/', hash: '' })
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const accountHref =
    role === 'admin'
      ? '/admin/pricing'
      : role === 'driver'
        ? '/driver'
        : '/account'

  const displayName =
    profile?.full_name || profile?.email || user?.email || 'Account'

  const AuthLinks = ({ mobile = false }: { mobile?: boolean }) => {
    if (loading) return null
    if (!user) {
      return (
        <>
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className={
              mobile
                ? 'py-3 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 font-medium min-h-11 flex items-center'
                : 'px-3 py-2 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg text-sm font-medium'
            }
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            onClick={() => setMobileOpen(false)}
            className={
              mobile
                ? 'py-3 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 font-medium min-h-11 flex items-center'
                : 'px-3 py-2 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg text-sm font-medium'
            }
          >
            Sign up
          </Link>
        </>
      )
    }

    if (mobile) {
      return (
        <>
          <Link
            to={accountHref}
            onClick={() => setMobileOpen(false)}
            className="py-3 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 font-medium min-h-11 flex items-center"
          >
            {role === 'admin'
              ? 'Admin'
              : role === 'driver'
                ? 'Driver hub'
                : 'My account'}
          </Link>
          {role === 'admin' && (
            <Link
              to="/account"
              onClick={() => setMobileOpen(false)}
              className="py-3 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 font-medium min-h-11 flex items-center"
            >
              Client account
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              setMobileOpen(false)
              await signOut()
              navigate('/')
            }}
            className="py-3 text-left text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 font-medium min-h-11"
          >
            Sign out
          </button>
        </>
      )
    }

    return (
      <div className="relative ml-1">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="px-3 py-2 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg text-sm font-medium max-w-40 truncate"
        >
          {displayName}
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-48 rounded-xl border border-brand-cream-dark bg-brand-cream shadow-lg py-1 z-50">
            <Link
              to={accountHref}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm text-brand-green hover:bg-brand-cream-dark/40"
            >
              {role === 'admin'
                ? 'Admin portal'
                : role === 'driver'
                  ? 'Driver hub'
                  : 'My account'}
            </Link>
            {role === 'admin' && (
              <Link
                to="/account"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm text-brand-green hover:bg-brand-cream-dark/40"
              >
                Client account
              </Link>
            )}
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false)
                await signOut()
                navigate('/')
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-brand-green hover:bg-brand-cream-dark/40"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-brand-cream/95 backdrop-blur border-b border-brand-cream-dark shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16 md:h-18">
        <button
          type="button"
          onClick={goHome}
          className="flex items-center shrink-0"
          aria-label="KhayrCape Experiences home"
        >
          <img
            src="/logo vector.png"
            alt="KhayrCape Experiences"
            className="h-10 md:h-11 w-auto object-contain"
          />
        </button>

        <nav className="hidden md:flex items-center gap-1 ml-auto">
          {navLinks.map((link) => (
            <Link
              key={link.hash}
              to={`/#${link.hash}`}
              className="px-3 py-2 text-brand-green hover:text-brand-green-dark hover:bg-brand-cream-dark/50 rounded-lg text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 px-3 py-2 ml-1 bg-brand-green hover:bg-brand-green-dark text-brand-cream rounded-lg text-sm font-semibold transition-colors"
          >
            Book
          </Link>
          <AuthLinks />
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden p-2 rounded-lg text-brand-green hover:bg-brand-cream-dark/50 min-h-11 min-w-11 flex items-center justify-center"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <HiX className="text-2xl" /> : <HiMenu className="text-2xl" />}
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-out ${
          mobileOpen ? 'max-h-128 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="px-4 pb-4 pt-2 bg-brand-cream border-t border-brand-cream-dark flex flex-col gap-1">
          <button
            type="button"
            onClick={goHome}
            className="py-3 text-left text-brand-green font-medium border-b border-brand-cream-dark"
          >
            Home
          </button>
          {navLinks.map((link) => (
            <Link
              key={link.hash}
              to={`/#${link.hash}`}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 font-medium min-h-11 flex items-center"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/book"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center justify-center gap-2 py-3.5 mt-1 bg-brand-green text-brand-cream font-semibold rounded-lg min-h-12"
          >
            Book a tour
          </Link>
          <AuthLinks mobile />
        </nav>
      </div>
    </header>
  )
}
