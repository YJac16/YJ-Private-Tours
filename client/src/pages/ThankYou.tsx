import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAuth } from '../lib/auth'
import { fetchPaymentStatus, retryGuestPayment } from '../lib/bookingApi'

export default function ThankYou() {
  const [searchParams] = useSearchParams()
  const { user, accessToken } = useAuth()
  const payment = searchParams.get('payment')
  const bookingId = searchParams.get('booking_id')
  const refFromUrl = searchParams.get('ref')
  const isPaymentSuccess = payment === 'success'
  const isPaymentFailure = payment === 'failure'
  const isCancelled = searchParams.get('cancelled') === '1'
  const needsRetry = isPaymentFailure || isCancelled
  const shouldPoll = Boolean(bookingId) && (isPaymentSuccess || !payment)
  const [checking, setChecking] = useState(shouldPoll)
  const [paid, setPaid] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [bookingReference, setBookingReference] = useState<string | null>(
    refFromUrl
  )
  const [retryEmail, setRetryEmail] = useState('')
  const [retryBusy, setRetryBusy] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  useEffect(() => {
    if (!shouldPoll || !bookingId) return
    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setInterval> | null = null

    const poll = async () => {
      try {
        const res = await fetchPaymentStatus(bookingId)
        if (cancelled) return true
        setStatus(res.status ?? null)
        if (res.booking_reference) setBookingReference(res.booking_reference)
        if (res.paid || res.status === 'paid') {
          setPaid(true)
          setChecking(false)
          return true
        }
      } catch {
        /* webhook may still be processing */
      }
      return false
    }

    void (async () => {
      const done = await poll()
      if (done || cancelled) return
      timer = setInterval(() => {
        void (async () => {
          attempts += 1
          const ok = await poll()
          if (ok || attempts >= 10 || cancelled) {
            if (timer) clearInterval(timer)
            if (!cancelled) setChecking(false)
          }
        })()
      }, 2000)
    })()

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [shouldPoll, bookingId])

  const displayRef =
    bookingReference || (bookingId ? `…${bookingId.slice(0, 8)}` : null)

  const onGuestRetry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingId || !retryEmail.trim()) return
    setRetryBusy(true)
    setRetryError(null)
    try {
      const res = await retryGuestPayment(bookingId, retryEmail.trim())
      if (res.checkout_url) {
        window.location.href = res.checkout_url
        return
      }
      setRetryError('Could not start checkout. Please try again.')
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Retry failed')
    } finally {
      setRetryBusy(false)
    }
  }

  const statusLabel = checking
    ? 'confirming…'
    : paid
      ? 'confirmed'
      : status === 'pending'
        ? 'awaiting payment'
        : status || null

  return (
    <>
      <Navbar />
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-brand-cream">
        <div className="max-w-md mx-auto text-center">
          {needsRetry && !paid ? (
            <HiOutlineXCircle className="text-6xl text-amber-500 mx-auto mb-6" />
          ) : (
            <HiOutlineCheckCircle className="text-6xl text-brand-green mx-auto mb-6" />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
            {isPaymentSuccess && (paid ? 'Payment successful' : 'Payment received')}
            {needsRetry && !paid && 'Payment could not be completed'}
            {!isPaymentSuccess && !needsRetry && 'Thank You'}
          </h1>
          <p className="text-brand-green/90 text-lg mb-4">
            {isPaymentSuccess &&
              paid &&
              'Your Yoco payment was successful. Your tour booking is confirmed.'}
            {isPaymentSuccess &&
              !paid &&
              checking &&
              'We’re confirming your payment. This usually takes a few seconds.'}
            {isPaymentSuccess &&
              !paid &&
              !checking &&
              'Your payment is being processed. You’ll receive confirmation shortly — keep your booking reference below.'}
            {needsRetry &&
              !paid &&
              'Complete payment below to keep your hold. Unpaid holds expire automatically within 30 minutes.'}
            {!isPaymentSuccess &&
              !needsRetry &&
              "Your enquiry has been received. We'll get back to you as soon as possible."}
          </p>
          {displayRef && (
            <p className="text-sm text-brand-green/80 mb-2">Booking reference</p>
          )}
          {displayRef && (
            <p className="text-lg text-brand-green mb-6 font-mono font-semibold tracking-wide">
              {displayRef}
              {statusLabel ? ` · ${statusLabel}` : ''}
            </p>
          )}

          <div className="flex flex-col gap-3 justify-center">
            {needsRetry && !paid && bookingId && user && accessToken && (
              <Link
                to={`/account/bookings/${bookingId}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-lg transition-colors min-h-12"
              >
                Complete payment in account
              </Link>
            )}

            {needsRetry && !paid && bookingId && !user && (
              <form
                onSubmit={onGuestRetry}
                className="text-left space-y-3 bg-white border border-brand-cream-dark rounded-xl p-4"
              >
                <p className="text-sm text-brand-green/85">
                  Enter the email used at checkout to open Yoco again — no account
                  needed.
                </p>
                <label className="block text-sm font-semibold text-brand-green">
                  Booking email
                  <input
                    type="email"
                    required
                    value={retryEmail}
                    onChange={(e) => setRetryEmail(e.target.value)}
                    className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3"
                    autoComplete="email"
                  />
                </label>
                {retryError && (
                  <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {retryError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={retryBusy}
                  className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-60"
                >
                  {retryBusy ? 'Opening Yoco…' : 'Complete payment'}
                </button>
                <p className="text-xs text-brand-green/70 text-center">
                  Have an account?{' '}
                  <Link
                    to={`/login?next=${encodeURIComponent(`/account/bookings/${bookingId}`)}`}
                    className="underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            )}

            {needsRetry && !paid && !bookingId && (
              <Link
                to="/book"
                className="inline-flex items-center justify-center px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-lg transition-colors min-h-12"
              >
                Try booking again
              </Link>
            )}

            {paid && bookingId && user && (
              <Link
                to={`/account/bookings/${bookingId}/receipt`}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-brand-green text-brand-green hover:bg-brand-cream-dark/40 font-medium rounded-lg transition-colors min-h-12"
              >
                View receipt
              </Link>
            )}

            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-brand-cream-dark bg-white text-brand-green font-medium rounded-lg transition-colors min-h-12"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
