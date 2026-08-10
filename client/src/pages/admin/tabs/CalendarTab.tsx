import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminListTrips, type AccountBooking } from '../../../lib/authApi'
import { cardClass } from '../adminShared'

type Props = { token: string; onOpenTrips?: () => void }

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export default function CalendarTab({ token, onOpenTrips }: Props) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [bookings, setBookings] = useState<AccountBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth(year, month)).padStart(2, '0')}`

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminListTrips(token, { from, to })
      setBookings(
        data.bookings.filter(
          (b) => b.status === 'pending' || b.status === 'paid'
        )
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [token, from, to])

  useEffect(() => {
    load()
  }, [load])

  const byDate = useMemo(() => {
    const map = new Map<string, AccountBooking[]>()
    for (const b of bookings) {
      const list = map.get(b.booking_date) || []
      list.push(b)
      map.set(b.booking_date, list)
    }
    return map
  }, [bookings])

  const firstDow = new Date(year, month, 1).getDay()
  const totalDays = daysInMonth(year, month)
  const cells: Array<{ date: string | null; day: number | null }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ date: null, day: null })
  for (let d = 1; d <= totalDays; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date, day: d })
  }

  const dayTrips = selectedDay ? byDate.get(selectedDay) || [] : []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-brand-green">Fleet calendar</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="min-h-11 px-3 rounded-lg border border-brand-cream-dark text-brand-green"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            Prev
          </button>
          <p className="min-w-36 text-center font-semibold text-brand-green">
            {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            className="min-h-11 px-3 rounded-lg border border-brand-cream-dark text-brand-green"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            Next
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-brand-green/70">Loading calendar…</p>
      ) : (
        <div className={cardClass}>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-brand-green/70 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell.date) {
                return <div key={`e-${idx}`} className="min-h-16" />
              }
              const count = byDate.get(cell.date)?.length || 0
              const active = selectedDay === cell.date
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => setSelectedDay(cell.date)}
                  className={`min-h-16 rounded-lg border p-1 text-left transition ${
                    active
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'border-brand-cream-dark bg-white hover:border-brand-green/40'
                  }`}
                >
                  <span className="text-xs font-bold text-brand-green">
                    {cell.day}
                  </span>
                  {count > 0 && (
                    <p className="mt-1 text-[10px] font-semibold text-brand-green">
                      {count} trip{count === 1 ? '' : 's'}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-brand-green/60 mt-2">
            Showing pending + paid only · month {monthKey(cursor)}
          </p>
        </div>
      )}

      {selectedDay && (
        <div className={cardClass}>
          <h3 className="font-bold text-brand-green">{selectedDay}</h3>
          {dayTrips.length === 0 ? (
            <p className="text-sm text-brand-green/70">No active trips.</p>
          ) : (
            <ul className="space-y-2">
              {dayTrips.map((b) => (
                <li key={b.id} className="text-sm text-brand-green">
                  <strong>{String(b.start_time).slice(0, 5)}</strong> ·{' '}
                  {b.client_name} · {b.tour?.name || 'Tour'}
                  {b.driver
                    ? ` · ${b.driver.full_name || b.driver.name}`
                    : ''}
                  {b.booking_reference ? ` · ${b.booking_reference}` : ''}
                </li>
              ))}
            </ul>
          )}
          {onOpenTrips && (
            <button
              type="button"
              onClick={onOpenTrips}
              className="text-sm underline text-brand-green min-h-11"
            >
              Open Trips tab to edit
            </button>
          )}
        </div>
      )}
    </div>
  )
}
