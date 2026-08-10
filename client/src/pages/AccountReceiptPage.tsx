import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { RequireAuth } from '../components/RequireAuth'
import { useAuth } from '../lib/auth'
import {
  fetchAccountReceipt,
  type AccountReceipt,
} from '../lib/authApi'
import { formatZar } from '../lib/pricing'

function ReceiptInner() {
  const { bookingId = '' } = useParams()
  const { accessToken } = useAuth()
  const [receipt, setReceipt] = useState<AccountReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken || !bookingId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAccountReceipt(accessToken, bookingId)
        if (!cancelled) setReceipt(data.receipt)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load receipt')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, bookingId])

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-8 sm:py-12 pb-20 print:bg-white print:py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <Link
              to={`/account/bookings/${bookingId}`}
              className="text-sm text-brand-green underline"
            >
              ← Back to booking
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!receipt}
              className="min-h-11 px-4 rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
            >
              Print / Save PDF
            </button>
          </div>

          <h1 className="text-2xl font-bold text-brand-green print:hidden">
            Receipt
          </h1>

          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-brand-green/70">Loading receipt…</p>
          ) : receipt ? (
            <article
              id="receipt-print"
              className="bg-brand-cream border border-brand-cream-dark rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm print:shadow-none print:border-0 print:rounded-none"
            >
              <p className="text-xs uppercase tracking-wide text-brand-gold font-semibold">
                {receipt.template.header ||
                  receipt.business_name ||
                  'KhayrCape Experiences'}
              </p>
              <h2 className="text-xl font-bold text-brand-green">
                {receipt.receipt_number}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-brand-green">
                <div>
                  <dt className="text-brand-green/60">Guest</dt>
                  <dd className="font-medium">{receipt.client_name}</dd>
                  <dd className="text-brand-green/80">{receipt.client_email}</dd>
                </div>
                <div>
                  <dt className="text-brand-green/60">Booking</dt>
                  <dd className="font-mono font-medium">
                    {receipt.booking_reference || receipt.booking_id.slice(0, 8)}
                  </dd>
                </div>
                <div>
                  <dt className="text-brand-green/60">Tour date</dt>
                  <dd>
                    {receipt.booking_date} ·{' '}
                    {String(receipt.start_time).slice(0, 5)}
                  </dd>
                </div>
                <div>
                  <dt className="text-brand-green/60">Paid</dt>
                  <dd>
                    {receipt.paid_at
                      ? new Date(receipt.paid_at).toLocaleString()
                      : new Date(receipt.issued_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-brand-green/60">Experience</dt>
                  <dd>{receipt.tour_name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-brand-green/60">Vehicle / guide</dt>
                  <dd>
                    {[receipt.vehicle_name, receipt.driver_name]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </dd>
                </div>
                {receipt.yoco_reference && (
                  <div className="sm:col-span-2">
                    <dt className="text-brand-green/60">Payment reference</dt>
                    <dd className="font-mono text-xs break-all">
                      {receipt.yoco_reference}
                    </dd>
                  </div>
                )}
              </dl>
              <p className="text-2xl font-bold text-brand-green pt-2 border-t border-brand-cream-dark">
                {formatZar(receipt.amount_cents)}{' '}
                <span className="text-sm font-medium text-brand-green/70">
                  {receipt.currency}
                </span>
              </p>
              <p className="text-sm capitalize text-brand-green/80">
                Status: {receipt.payment_status}
              </p>
              {receipt.template.terms && (
                <p className="text-xs text-brand-green/70 whitespace-pre-wrap">
                  {receipt.template.terms}
                </p>
              )}
              <p className="text-sm text-brand-green/80 pt-2">
                {receipt.template.footer}
              </p>
            </article>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function AccountReceiptPage() {
  return (
    <RequireAuth roles={['client', 'admin']}>
      <ReceiptInner />
    </RequireAuth>
  )
}
