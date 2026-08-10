import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { RequireAuth } from '../components/RequireAuth'
import { useAuth } from '../lib/auth'
import {
  cancelAccountBooking,
  fetchAccountBookingDetail,
  requestAccountReschedule,
  retryAccountPayment,
  type AccountBooking,
  type BookingHistoryRow,
} from '../lib/authApi'
import { formatZar } from '../lib/pricing'

function DetailInner() {
  const { bookingId = '' } = useParams()
  const { accessToken } = useAuth()
  const [booking, setBooking] = useState<AccountBooking | null>(null)
  const [history, setHistory] = useState<BookingHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [rescheduleNote, setRescheduleNote] = useState('')

  const reload = async () => {
    if (!accessToken || !bookingId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAccountBookingDetail(accessToken, bookingId)
      setBooking(data.booking)
      setHistory(data.history || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, bookingId])

  const onCancel = async () => {
    if (!accessToken || !booking) return
    const ok = window.confirm(
      booking.refund_eligible
        ? 'Cancel this booking and request a full refund?'
        : 'Cancel this booking? Refunds are not available within 24 hours of the tour.'
    )
    if (!ok) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const res = await cancelAccountBooking(accessToken, booking.id, {
        requestRefund: true,
      })
      setInfo(res.message)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed')
    } finally {
      setBusy(false)
    }
  }

  const onReschedule = async (e: FormEvent) => {
    e.preventDefault()
    if (!accessToken || !booking) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const res = await requestAccountReschedule(
        accessToken,
        booking.id,
        rescheduleNote.trim()
      )
      setInfo(res.message)
      setRescheduleNote('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reschedule request failed')
    } finally {
      setBusy(false)
    }
  }

  const onRetryPayment = async () => {
    if (!accessToken || !booking) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const res = await retryAccountPayment(accessToken, booking.id)
      if (res.checkout_url) {
        window.location.href = res.checkout_url
        return
      }
      setError('Checkout URL missing from payment retry')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment retry failed')
    } finally {
      setBusy(false)
    }
  }

  const canAct =
    booking && (booking.status === 'pending' || booking.status === 'paid')
  const canRetryPayment = booking?.status === 'pending'
  const canViewReceipt = booking?.status === 'paid'

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-8 sm:py-12 pb-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link to="/account" className="text-sm text-brand-green underline">
            ← Back to account
          </Link>
          <h1 className="text-2xl font-bold text-brand-green">Booking detail</h1>

          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-brand-green bg-brand-cream border border-brand-cream-dark rounded-xl px-3 py-2">
              {info}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-brand-green/70">Loading…</p>
          ) : !booking ? (
            <p className="text-sm text-brand-green/70">Booking not found.</p>
          ) : (
            <>
              <section className="bg-brand-cream border border-brand-cream-dark rounded-2xl p-5 space-y-2 shadow-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold text-brand-green text-lg">
                    {booking.booking_date} ·{' '}
                    {String(booking.start_time).slice(0, 5)}
                  </p>
                  <span className="text-xs uppercase font-bold text-brand-green/70">
                    {booking.status}
                  </span>
                </div>
                {booking.booking_reference && (
                  <p className="text-sm font-mono text-brand-green/70">
                    {booking.booking_reference}
                  </p>
                )}
                <p className="text-brand-green/90">
                  {booking.tour?.name ?? 'Tour'}
                  {booking.vehicle?.name ? ` · ${booking.vehicle.name}` : ''}
                  {booking.driver?.full_name || booking.driver?.name
                    ? ` · ${booking.driver.full_name || booking.driver.name}`
                    : ''}
                </p>
                {(booking.grand_total_cents ?? booking.final_price_cents) !=
                  null && (
                  <p className="text-brand-green font-semibold">
                    {formatZar(
                      booking.grand_total_cents ?? booking.final_price_cents ?? 0
                    )}
                  </p>
                )}
                {booking.pickup_address && (
                  <p className="text-sm text-brand-green/80">
                    Pickup: {booking.pickup_address}
                  </p>
                )}
                {(booking.special_requests || booking.notes) && (
                  <p className="text-sm italic text-brand-green/70">
                    {booking.special_requests || booking.notes}
                  </p>
                )}
                {booking.refund_status && booking.refund_status !== 'none' && (
                  <p className="text-sm text-brand-green/80">
                    Refund: {booking.refund_status}
                    {booking.refund_amount_cents != null
                      ? ` · ${formatZar(booking.refund_amount_cents)}`
                      : ''}
                  </p>
                )}
                {booking.reschedule_requested_at && (
                  <p className="text-sm text-amber-900">
                    Reschedule requested
                    {booking.reschedule_note
                      ? `: ${booking.reschedule_note}`
                      : ''}
                  </p>
                )}
                {canViewReceipt && (
                  <Link
                    to={`/account/bookings/${booking.id}/receipt`}
                    className="inline-flex mt-2 text-sm font-semibold text-brand-green underline"
                  >
                    View receipt
                  </Link>
                )}
              </section>

              {canRetryPayment && (
                <section className="bg-brand-cream border border-brand-cream-dark rounded-2xl p-5 space-y-3 shadow-sm">
                  <h2 className="text-lg font-bold text-brand-green">
                    Complete payment
                  </h2>
                  <p className="text-sm text-brand-green/80">
                    This booking is still unpaid. Complete checkout before the
                    30-minute hold expires.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onRetryPayment()}
                    className="min-h-12 px-5 rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
                  >
                    {busy ? 'Opening checkout…' : 'Pay now'}
                  </button>
                </section>
              )}

              {canAct && (
                <section className="bg-brand-cream border border-brand-cream-dark rounded-2xl p-5 space-y-4 shadow-sm">
                  <h2 className="text-lg font-bold text-brand-green">Actions</h2>
                  <p className="text-sm text-brand-green/80">
                    {booking.refund_eligible
                      ? 'Cancel at least 24 hours before the tour for a full refund.'
                      : 'Within 24 hours of the tour, cancellation is non-refundable.'}
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onCancel()}
                    className="min-h-12 px-5 rounded-xl border border-red-300 text-red-900 font-semibold disabled:opacity-50"
                  >
                    Cancel booking
                  </button>

                  <form onSubmit={onReschedule} className="space-y-2 pt-2 border-t border-brand-cream-dark">
                    <label className="block text-sm text-brand-green">
                      Request reschedule (subject to availability)
                      <textarea
                        value={rescheduleNote}
                        onChange={(e) => setRescheduleNote(e.target.value)}
                        rows={3}
                        required
                        className="mt-1 w-full rounded-xl border border-brand-cream-dark px-3 py-2"
                        placeholder="Preferred new date/time…"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={busy || !rescheduleNote.trim()}
                      className="min-h-12 px-5 rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
                    >
                      Submit reschedule request
                    </button>
                  </form>
                </section>
              )}

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-brand-green">History</h2>
                {history.length === 0 ? (
                  <p className="text-sm text-brand-green/70">No history yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {history.map((h) => (
                      <li
                        key={h.id}
                        className="text-sm bg-brand-cream border border-brand-cream-dark rounded-xl px-3 py-2"
                      >
                        <span className="font-medium text-brand-green">
                          {h.from_status || '—'} → {h.to_status}
                        </span>
                        {h.reason ? ` · ${h.reason}` : ''}
                        <span className="block text-xs text-brand-green/60">
                          {new Date(h.created_at).toLocaleString()} ·{' '}
                          {h.changed_by || 'system'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function AccountBookingDetailPage() {
  return (
    <RequireAuth roles={['client', 'admin']}>
      <DetailInner />
    </RequireAuth>
  )
}
