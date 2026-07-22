import { useCallback, useEffect, useState } from 'react'
import { adminListTrips, type AccountBooking } from '../../../lib/authApi'
import { formatZar } from '../../../lib/pricing'
import { cardClass } from '../adminShared'

type Props = { token: string }

export default function TripsTab({ token }: Props) {
  const [bookings, setBookings] = useState<AccountBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminListTrips(token)
      setBookings(data.bookings)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trips')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <p className="text-sm text-brand-green/70">Loading trips…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-brand-green">All trips</h2>
        <button
          type="button"
          onClick={() => load()}
          className="text-sm underline text-brand-green min-h-11"
        >
          Refresh
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {bookings.length === 0 ? (
        <p className="text-sm text-brand-green/70">No bookings yet.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => {
            const total = b.grand_total_cents ?? b.final_price_cents
            return (
              <li key={b.id} className={cardClass}>
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold text-brand-green">
                    {b.booking_date} · {String(b.start_time).slice(0, 5)}
                  </p>
                  <div className="flex gap-2 text-[10px] font-bold uppercase">
                    <span className="bg-brand-cream-dark/40 px-2 py-1 rounded text-brand-green">
                      {b.status}
                    </span>
                    {b.trip_status && (
                      <span className="bg-brand-cream-dark/40 px-2 py-1 rounded text-brand-green">
                        {b.trip_status}
                      </span>
                    )}
                  </div>
                </div>
                {b.booking_reference && (
                  <p className="text-xs font-mono text-brand-green/60">
                    {b.booking_reference}
                  </p>
                )}
                <p className="text-sm text-brand-green/90">
                  <strong>{b.client_name}</strong> · {b.client_email}
                  {b.client_phone ? ` · ${b.client_phone}` : ''}
                </p>
                <p className="text-sm text-brand-green/80">
                  {b.tour?.name ?? 'Tour'}
                  {b.vehicle?.name ? ` · ${b.vehicle.name}` : ''}
                  {b.driver
                    ? ` · ${b.driver.full_name || b.driver.name}`
                    : ''}
                  {total != null ? ` · ${formatZar(total)}` : ''}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
