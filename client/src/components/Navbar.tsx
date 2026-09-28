import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiMenu, HiOutlineMap, HiX } from 'react-icons/hi'
import { FaCalendarCheck, FaRoute } from 'react-icons/fa'
import { useAuth } from '../lib/auth'
import { PRIMARY_SITE_NAV } from '../seo/primaryNav'

const mobileNavIcons = {
  Experiences: HiOutlineMap,
  'Custom Tours': FaRoute,
  Book: FaCalendarCheck,
} as const

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

  const closeMobile = () => setMobileOpen(false)

  const AuthLinks = ({ mobile = false }: { mobile?: boolean }) => {
    if (loading) return null
    if (!user) {
      return (
        <Link
          to="/login"
          onClick={closeMobile}
          className={
            mobile
              ? 'py-3 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 min-h-11 font-medium flex items-center'
              : 'px-3 py-2 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg text-sm font-medium'
          }
        >
          Sign in
        </Link>
      )
    }

    if (mobile) {
      return (
        <>
          <Link
            to={accountHref}
            onClick={closeMobile}
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
              onClick={closeMobile}
              className="py-3 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 font-medium min-h-11 flex items-center"
            >
              Client account
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              closeMobile()
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

  const mobileMenuNav = PRIMARY_SITE_NAV.filter((item) => item.label !== 'Book')

  return (
    <header className="sticky top-0 z-50 bg-brand-cream/95 backdrop-blur border-b border-brand-cream-dark shadow-sm">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center gap-2 h-16 md:h-18">
        <button
          type="button"
          onClick={goHome}
          className="flex items-center shrink-0"
          aria-label="KhayrCape Experiences home"
        >
          <img
            src="/logo-vector-no-background.png"
            alt="KhayrCape Experiences"
            className="h-9 md:h-11 w-auto object-contain"
          />
        </button>

        <div className="flex-1 min-w-0 md:hidden" aria-hidden />

        <Link
          to="/book"
          className="md:hidden shrink-0 inline-flex items-center justify-center px-4 py-2 min-h-11 rounded-lg text-brand-cream bg-brand-green hover:bg-brand-green-dark text-sm font-semibold transition-colors"
        >
          Book
        </Link>

        <nav
          className="hidden md:flex md:flex-initial md:items-center md:gap-1 md:ml-auto"
          aria-label="Primary"
        >
          {PRIMARY_SITE_NAV.map((item) => {
            const isBook = item.label === 'Book'
            return (
              <Link
                key={item.href}
                to={item.href}
                className={
                  isBook
                    ? 'inline-flex items-center px-3 py-2 text-brand-cream bg-brand-green hover:bg-brand-green-dark rounded-lg text-sm font-semibold transition-colors md:ml-1'
                    : 'inline-flex items-center px-3 py-2 text-brand-green hover:bg-brand-cream-dark/40 hover:text-brand-green-dark rounded-lg text-sm font-medium transition-colors'
                }
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:block shrink-0">
          <AuthLinks />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden shrink-0 p-2 rounded-lg text-brand-green hover:bg-brand-cream-dark/50 min-h-11 min-w-11 flex items-center justify-center"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-primary-nav"
        >
          {mobileOpen ? <HiX className="text-2xl" /> : <HiMenu className="text-2xl" />}
        </button>
      </div>

      <div
        id="mobile-primary-nav"
        className={`md:hidden overflow-hidden transition-all duration-200 ease-out ${
          mobileOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav
          className="px-4 pb-4 pt-2 bg-brand-cream border-t border-brand-cream-dark flex flex-col gap-1"
          aria-label="Primary mobile"
        >
          <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-brand-green/55">
            Explore
          </p>
          {mobileMenuNav.map((item) => {
            const Icon = mobileNavIcons[item.label]
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeMobile}
                className="py-3 text-brand-green hover:bg-brand-cream-dark/50 rounded-lg px-2 min-h-11 font-medium flex items-center gap-2"
              >
                <Icon className="text-lg shrink-0" aria-hidden />
                {item.label}
              </Link>
            )
          })}
          <p className="px-2 pt-3 text-[11px] font-semibold uppercase tracking-wide text-brand-green/55">
            Account
          </p>
          <AuthLinks mobile />
        </nav>
      </div>
    </header>
  )
}
