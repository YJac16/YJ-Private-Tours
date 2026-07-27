import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { RequireAuth } from '../components/RequireAuth'
import { useAuth } from '../lib/auth'
import {
  fetchAccountBookings,
  type AccountBooking,
} from '../lib/authApi'
import { formatZar } from '../lib/pricing'

function AccountInner() {
  const {
    profile,
    accessToken,
    updateProfile,
    signOut,
    role,
    emailConfirmed,
    resendEmailConfirmation,
    user,
  } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [email, setEmail] = useState(profile?.email || user?.email || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [note, setNote] = useState('')
  const [bookings, setBookings] = useState<AccountBooking[]>([])
  const [saving, setSaving] = useState(false)
  const [resending, setResending] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setEmail(profile?.email || user?.email || '')
    setPhone(profile?.phone || '')
  }, [profile, user])

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    ;(async () => {
      setLoadingBookings(true)
      try {
        const data = await fetchAccountBookings(accessToken)
        if (!cancelled) setBookings(data.bookings)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load bookings')
        }
      } finally {
        if (!cancelled) setLoadingBookings(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken])

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    setInfo(null)
    try {
      const result = await updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      })
      if (result.emailChangePending) {
        setInfo(
          'Check your inbox to confirm the new email address. Your login email updates after you click the link.'
        )
      } else {
        setSaved(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const onResend = async () => {
    setResending(true)
    setError(null)
    setInfo(null)
    try {
      await resendEmailConfirmation(email.trim() || user?.email || undefined)
      setInfo('Confirmation email sent. Check your inbox (and spam folder).')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not resend confirmation email'
      )
    } finally {
      setResending(false)
    }
  }

  const bookHref = note.trim()
    ? `/book?note=${encodeURIComponent(note.trim())}`
    : '/book'

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-8 sm:py-12 pb-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-brand-green">My account</h1>
              <p className="text-sm text-brand-green/80">
                {role === 'admin'
                  ? 'Admin viewing client account'
                  : 'Manage your profile and bookings'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-sm text-brand-green underline min-h-11"
            >
              Sign out
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-sm text-green-900 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              Profile saved.
            </p>
          )}
          {info && (
            <p className="text-sm text-brand-green bg-brand-cream border border-brand-cream-dark rounded-xl px-3 py-2">
              {info}
            </p>
          )}

          <form
            onSubmit={onSave}
            className="bg-brand-cream border border-brand-cream-dark rounded-2xl p-5 space-y-4 shadow-sm"
          >
            <h2 className="text-lg font-bold text-brand-green">Profile</h2>
            <label className="block text-sm text-brand-green">
              Full name
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full min-h-12 rounded-xl border border-brand-cream-dark px-3"
                required
              />
            </label>
            <div className="space-y-2">
              <label className="block text-sm text-brand-green">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full min-h-12 rounded-xl border border-brand-cream-dark px-3"
                  required
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {emailConfirmed ? (
                  <span className="text-green-800 font-medium">Verified</span>
                ) : (
                  <>
                    <span className="text-amber-900 font-medium">Unverified</span>
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={resending}
                      className="underline text-brand-green min-h-11 disabled:opacity-50"
                    >
                      {resending ? 'Sending…' : 'Resend confirmation'}
                    </button>
                  </>
                )}
              </div>
            </div>
            <label className="block text-sm text-brand-green">
              Phone
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full min-h-12 rounded-xl border border-brand-cream-dark px-3"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="min-h-12 px-5 rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>

          <section className="bg-brand-cream border border-brand-cream-dark rounded-2xl p-5 space-y-3 shadow-sm">
            <h2 className="text-lg font-bold text-brand-green">Book a tour</h2>
            <p className="text-sm text-brand-green/80">
              Add a note for your trip, then continue to booking — we will
              prefill your details.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Special requests, hotel name, accessibility needs…"
              className="w-full rounded-xl border border-brand-cream-dark px-3 py-2 text-brand-green"
            />
            <Link
              to={bookHref}
              className="inline-flex items-center justify-center min-h-12 px-5 rounded-xl bg-brand-gold text-brand-green font-semibold"
            >
              Continue to book
            </Link>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-green">My bookings</h2>
            {loadingBookings ? (
              <p className="text-sm text-brand-green/70">Loading…</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-brand-green/70">
                No bookings yet.{' '}
                <Link to="/book" className="underline">
                  Book your first tour
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {bookings.map((b) => {
                  const total = b.grand_total_cents ?? b.final_price_cents
                  return (
                    <li
                      key={b.id}
                      className="bg-brand-cream border border-brand-cream-dark rounded-2xl p-4 space-y-1 shadow-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-semibold text-brand-green">
                          {b.booking_date} · {String(b.start_time).slice(0, 5)}
                        </p>
                        <span className="text-xs uppercase font-bold text-brand-green/70">
                          {b.status}
                        </span>
                      </div>
                      {b.booking_reference && (
                        <p className="text-xs font-mono text-brand-green/60">
                          {b.booking_reference}
                        </p>
                      )}
                      <p className="text-sm text-brand-green/85">
                        {b.tour?.name ?? 'Tour'}
                        {b.vehicle?.name ? ` · ${b.vehicle.name}` : ''}
                        {total != null ? ` · ${formatZar(total)}` : ''}
                      </p>
                      {(b.special_requests || b.notes) && (
                        <p className="text-sm italic text-brand-green/70">
                          {b.special_requests || b.notes}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function AccountPage() {
  return (
    <RequireAuth roles={['client', 'admin']}>
      <AccountInner />
    </RequireAuth>
  )
}
