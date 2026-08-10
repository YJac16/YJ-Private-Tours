import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminListCustomers,
  adminListTrips,
  type AdminCustomer,
  type AccountBooking,
} from '../../../lib/authApi'
import { cardClass, inputClass, labelClass } from '../adminShared'

type Props = { token: string }

export default function CustomersTab({ token }: Props) {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [trips, setTrips] = useState<AccountBooking[]>([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [consentInfo, setConsentInfo] = useState<{
    signed: boolean
    signedAt: string | null
    version: string | null
    fullName: string | null
    signature: string | null
    bodyHtml: string | null
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminListCustomers(token)
      setCustomers(data.customers)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return customers
    return customers.filter((c) =>
      [c.name, c.email, c.phone, c.last_reference]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    )
  }, [customers, q])

  const openCustomer = async (email: string) => {
    setSelectedEmail(email)
    setTripsLoading(true)
    setConsentInfo(null)
    try {
      const data = await adminListTrips(token, { q: email })
      setTrips(
        data.bookings.filter(
          (b) => b.client_email.toLowerCase() === email.toLowerCase()
        )
      )
      const consentRes = await fetch(
        `/api/account-consent?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const consentData = await consentRes.json().catch(() => ({}))
      if (consentRes.ok) {
        setConsentInfo({
          signed: Boolean(consentData.signed),
          signedAt: consentData.consent?.signed_at || null,
          version: consentData.form?.version || null,
          fullName: consentData.consent?.full_name || null,
          signature: consentData.consent?.signature_text || null,
          bodyHtml: consentData.form?.body_html || null,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customer trips')
    } finally {
      setTripsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-brand-green">Customers</h2>
        <button
          type="button"
          onClick={() => load()}
          className="text-sm underline text-brand-green min-h-11"
        >
          Refresh
        </button>
      </div>

      <label className={labelClass}>
        Search
        <input
          className={inputClass}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, email, phone…"
        />
      </label>

      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-brand-green/70">Loading customers…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-brand-green/70">No customers yet.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <li key={c.email}>
              <button
                type="button"
                onClick={() => openCustomer(c.email)}
                className={`${cardClass} w-full text-left ${
                  selectedEmail === c.email
                    ? 'border-brand-gold ring-1 ring-brand-gold/40'
                    : ''
                }`}
              >
                <p className="font-semibold text-brand-green">{c.name}</p>
                <p className="text-sm text-brand-green/80">
                  {c.email}
                  {c.phone ? ` · ${c.phone}` : ''}
                </p>
                <p className="text-xs text-brand-green/60">
                  {c.trip_count} trip{c.trip_count === 1 ? '' : 's'}
                  {c.last_booking_date ? ` · last ${c.last_booking_date}` : ''}
                  {c.last_status ? ` · ${c.last_status}` : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedEmail && (
        <div className={cardClass}>
          <h3 className="font-bold text-brand-green">Trips for {selectedEmail}</h3>
          {consentInfo && (
            <div className="text-sm text-brand-green/90 border border-brand-cream-dark rounded-lg px-3 py-2 bg-white space-y-1">
              <p className="font-semibold">Informed consent</p>
              {consentInfo.signed ? (
                <>
                  <p>
                    Signed
                    {consentInfo.signedAt
                      ? ` · ${new Date(consentInfo.signedAt).toLocaleString('en-ZA')}`
                      : ''}
                    {consentInfo.version ? ` · ${consentInfo.version}` : ''}
                  </p>
                  {consentInfo.fullName && (
                    <p>Name: {consentInfo.fullName}</p>
                  )}
                  {consentInfo.signature && (
                    <p>Signature: {consentInfo.signature}</p>
                  )}
                </>
              ) : (
                <p>Not signed for current consent version.</p>
              )}
            </div>
          )}
          {tripsLoading ? (
            <p className="text-sm text-brand-green/70">Loading…</p>
          ) : trips.length === 0 ? (
            <p className="text-sm text-brand-green/70">No trips found.</p>
          ) : (
            <ul className="space-y-2 text-sm text-brand-green">
              {trips.map((b) => (
                <li key={b.id}>
                  {b.booking_date} {String(b.start_time).slice(0, 5)} · {b.status}
                  {b.booking_reference ? ` · ${b.booking_reference}` : ''} ·{' '}
                  {b.tour?.name || 'Tour'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
