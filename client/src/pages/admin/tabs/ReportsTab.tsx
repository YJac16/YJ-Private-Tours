import { useCallback, useEffect, useState } from 'react'
import { fetchAdminBusiness } from '../../../lib/bookingApi'
import { formatZar } from '../../../lib/pricing'
import { cardClass } from '../adminShared'

type Props = { pin: string }

type ReportsPayload = {
  bookings?: {
    count?: number
    revenue_cents?: number
    by_status?: Record<string, number>
  }
  quotes?: {
    count?: number
    by_status?: Record<string, number>
    conversion_rate?: number
  }
  aov_cents?: number
  popular_tours?: Array<{ id: string; count: number }>
  popular_vehicles?: Array<{ id: string; count: number }>
}

export default function ReportsTab({ pin }: Props) {
  const [reports, setReports] = useState<ReportsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminBusiness(pin, 'reports')
      setReports((data.reports as ReportsPayload) || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [pin])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <p className="text-sm text-brand-green/70">Loading reports…</p>
  }

  if (error) {
    return (
      <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {error}
      </p>
    )
  }

  const bookings = reports?.bookings || {}
  const quotes = reports?.quotes || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-brand-green">Reports</h2>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-brand-cream-dark px-3 py-2 text-sm text-brand-green"
        >
          Refresh
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-wide text-brand-gold">Bookings</p>
          <p className="text-2xl font-bold text-brand-green">
            {bookings.count ?? 0}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-wide text-brand-gold">Revenue</p>
          <p className="text-2xl font-bold text-brand-green">
            {formatZar(bookings.revenue_cents ?? 0)}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-wide text-brand-gold">AOV</p>
          <p className="text-2xl font-bold text-brand-green">
            {formatZar(reports?.aov_cents ?? 0)}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-wide text-brand-gold">
            Quote conversion
          </p>
          <p className="text-2xl font-bold text-brand-green">
            {Math.round((quotes.conversion_rate ?? 0) * 100)}%
          </p>
          <p className="text-xs text-brand-green/70">
            {quotes.count ?? 0} quotes total
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className={cardClass}>
          <h3 className="font-semibold text-brand-green">Bookings by status</h3>
          <ul className="text-sm space-y-1 text-brand-green/90">
            {Object.entries(bookings.by_status || {}).map(([status, count]) => (
              <li key={status} className="flex justify-between gap-2">
                <span className="capitalize">{status}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
            {!Object.keys(bookings.by_status || {}).length && (
              <li className="text-brand-green/60">No booking data.</li>
            )}
          </ul>
        </div>
        <div className={cardClass}>
          <h3 className="font-semibold text-brand-green">Quotes by status</h3>
          <ul className="text-sm space-y-1 text-brand-green/90">
            {Object.entries(quotes.by_status || {}).map(([status, count]) => (
              <li key={status} className="flex justify-between gap-2">
                <span className="capitalize">{status}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
            {!Object.keys(quotes.by_status || {}).length && (
              <li className="text-brand-green/60">No quote data.</li>
            )}
          </ul>
        </div>
        <div className={cardClass}>
          <h3 className="font-semibold text-brand-green">Popular tours</h3>
          <ul className="text-sm space-y-1 text-brand-green/90">
            {(reports?.popular_tours || []).map((t) => (
              <li key={t.id} className="flex justify-between gap-2">
                <span className="truncate font-mono text-xs">{t.id}</span>
                <span className="font-medium">{t.count}</span>
              </li>
            ))}
            {!(reports?.popular_tours || []).length && (
              <li className="text-brand-green/60">No data yet.</li>
            )}
          </ul>
        </div>
        <div className={cardClass}>
          <h3 className="font-semibold text-brand-green">Popular vehicles</h3>
          <ul className="text-sm space-y-1 text-brand-green/90">
            {(reports?.popular_vehicles || []).map((v) => (
              <li key={v.id} className="flex justify-between gap-2">
                <span className="truncate font-mono text-xs">{v.id}</span>
                <span className="font-medium">{v.count}</span>
              </li>
            ))}
            {!(reports?.popular_vehicles || []).length && (
              <li className="text-brand-green/60">No data yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
