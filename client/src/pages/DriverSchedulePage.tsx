import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  driverBlockSlot,
  driverFetchSchedule,
  driverUnblock,
  driverUpdateBooking,
  fetchCatalog,
  type Driver,
} from '../lib/bookingApi'
import { formatZar } from '../lib/pricing'

const PIN_KEY = 'yj_driver_pin'

type BookingRow = Awaited<ReturnType<typeof driverFetchSchedule>>['bookings'][number]
type UnavailRow = Awaited<ReturnType<typeof driverFetchSchedule>>['unavailable'][number]
type TripFilter = 'today' | 'upcoming' | 'completed' | 'cancelled'

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function mapsUrl(address?: string | null) {
  if (!address) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

export default function DriverSchedulePage() {
  const [pin, setPin] = useState(() => sessionStorage.getItem(PIN_KEY) || '')
  const [pinInput, setPinInput] = useState('')
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [driverId, setDriverId] = useState('')
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [unavailable, setUnavailable] = useState<UnavailRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [blockDate, setBlockDate] = useState('')
  const [blockTime, setBlockTime] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [filter, setFilter] = useState<TripFilter>('upcoming')

  const unlock = (value: string) => {
    sessionStorage.setItem(PIN_KEY, value)
    setPin(value)
  }

  const load = async (activePin: string, activeDriver: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await driverFetchSchedule(activePin, activeDriver || undefined)
      // Only this driver's bookings
      setBookings(
        activeDriver
          ? data.bookings.filter((b) => b.driver_id === activeDriver)
          : data.bookings
      )
      setUnavailable(
        activeDriver
          ? data.unavailable.filter((u) => u.driver_id === activeDriver)
          : data.unavailable
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule')
      if (
        String(e).includes('Unauthorized') ||
        (e instanceof Error && e.message.includes('Unauthorized'))
      ) {
        sessionStorage.removeItem(PIN_KEY)
        setPin('')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!pin) return
    ;(async () => {
      try {
        const catalog = await fetchCatalog()
        setDrivers(catalog.drivers)
        if (!driverId && catalog.drivers[0]) {
          setDriverId(catalog.drivers[0].id)
        }
      } catch {
        /* catalog may fail separately */
      }
    })()
  }, [pin, driverId])

  useEffect(() => {
    if (pin && driverId) load(pin, driverId)
  }, [pin, driverId])

  const filtered = useMemo(() => {
    const today = todayYmd()
    return bookings.filter((b) => {
      const trip = b.trip_status || 'scheduled'
      if (filter === 'cancelled') {
        return b.status === 'cancelled' || trip === 'cancelled'
      }
      if (filter === 'completed') {
        return trip === 'completed'
      }
      if (filter === 'today') {
        return (
          b.booking_date === today &&
          b.status !== 'cancelled' &&
          trip !== 'cancelled' &&
          trip !== 'completed'
        )
      }
      // upcoming
      return (
        b.booking_date >= today &&
        b.status !== 'cancelled' &&
        trip !== 'cancelled' &&
        trip !== 'completed'
      )
    })
  }, [bookings, filter])

  if (!pin) {
    return (
      <>
        <Navbar />
        <main className="min-h-[70vh] bg-brand-cream-light px-4 py-12 flex items-center">
          <form
            className="max-w-sm mx-auto w-full space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (pinInput.trim()) unlock(pinInput.trim())
            }}
          >
            <h1 className="text-2xl font-bold text-brand-green text-center">
              Driver hub
            </h1>
            <p className="text-sm text-brand-green/85 text-center">
              Enter your driver PIN to view trips assigned to you.
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full min-h-[48px] rounded-xl border border-brand-cream-dark px-3"
              placeholder="PIN"
              autoFocus
            />
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-brand-green text-brand-cream font-semibold"
            >
              Unlock
            </button>
          </form>
        </main>
        <Footer />
      </>
    )
  }

  const filters: { id: TripFilter; label: string }[] = [
    { id: 'today', label: "Today's trips" },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-8 sm:py-12 pb-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-brand-green">Driver hub</h1>
            <button
              type="button"
              className="text-sm underline text-brand-green"
              onClick={() => {
                sessionStorage.removeItem(PIN_KEY)
                setPin('')
              }}
            >
              Lock
            </button>
          </div>

          {drivers.length > 1 && (
            <label className="block text-sm">
              <span className="font-semibold text-brand-green">Your profile</span>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="mt-1 w-full min-h-[48px] rounded-xl border border-brand-cream-dark bg-brand-cream px-3"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || d.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`min-h-[40px] px-3 rounded-lg text-sm font-semibold ${
                  filter === f.id
                    ? 'bg-brand-green text-brand-cream'
                    : 'bg-brand-cream border border-brand-cream-dark text-brand-green'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-brand-green">Trips</h2>
              <button
                type="button"
                onClick={() => load(pin, driverId)}
                className="text-sm underline text-brand-green min-h-[44px] px-2"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-brand-green/70">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-brand-green/70">No trips in this view.</p>
            ) : (
              <ul className="space-y-4">
                {filtered.map((b) => {
                  const pax =
                    b.passenger_count ??
                    b.guest_count ??
                    (b.adult_count || 0) + (b.child_count || 0)
                  const total = b.grand_total_cents ?? b.final_price_cents
                  const nav = mapsUrl(b.pickup_address)
                  const trip = b.trip_status || 'scheduled'
                  return (
                    <li
                      key={b.id}
                      className="bg-brand-cream border border-brand-cream-dark rounded-2xl p-4 space-y-2 shadow-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-semibold text-brand-green">
                          {b.booking_date} · {String(b.start_time).slice(0, 5)}
                        </p>
                        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wide">
                          <span className="text-brand-green/80 bg-brand-cream-dark/40 px-2 py-1 rounded">
                            {b.status}
                          </span>
                          <span className="text-brand-green/80 bg-brand-cream-dark/40 px-2 py-1 rounded">
                            Pay: {b.payment_status || b.status}
                          </span>
                          <span className="text-brand-green/80 bg-brand-cream-dark/40 px-2 py-1 rounded">
                            Trip: {trip}
                          </span>
                        </div>
                      </div>
                      {b.booking_reference && (
                        <p className="text-xs font-mono text-brand-green/60">
                          {b.booking_reference}
                        </p>
                      )}
                      <p className="text-sm text-brand-green/90">
                        <strong>{b.client_name}</strong>
                        <br />
                        {b.client_email}
                        {b.client_phone ? ` · ${b.client_phone}` : ''}
                      </p>
                      <p className="text-sm text-brand-green/80">
                        {b.tour?.name ?? 'Tour'} · {b.vehicle?.name ?? 'Vehicle'} ·{' '}
                        {pax} guest{pax === 1 ? '' : 's'}
                        {total != null ? ` · ${formatZar(total)}` : ''}
                      </p>
                      {b.driver_earnings_cents != null && (
                        <p className="text-xs text-brand-green/70">
                          Driver earnings: {formatZar(b.driver_earnings_cents)}{' '}
                          (future)
                        </p>
                      )}
                      {b.pickup_address && (
                        <p className="text-sm text-brand-green/80">
                          Pickup: {b.pickup_address}
                        </p>
                      )}
                      {(b.special_requests || b.notes) && (
                        <p className="text-sm italic text-brand-green/70">
                          {b.special_requests || b.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        {nav && (
                          <a
                            href={nav}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[44px] px-3 inline-flex items-center rounded-lg border border-brand-cream-dark text-sm font-semibold text-brand-green"
                          >
                            Navigate
                          </a>
                        )}
                        {trip === 'scheduled' && b.status !== 'cancelled' && (
                          <button
                            type="button"
                            className="min-h-[44px] px-3 rounded-lg bg-brand-green text-brand-cream text-sm font-semibold"
                            onClick={async () => {
                              await driverUpdateBooking(pin, {
                                booking_id: b.id,
                                trip_status: 'in_progress',
                              })
                              await load(pin, driverId)
                            }}
                          >
                            Start trip
                          </button>
                        )}
                        {trip === 'in_progress' && (
                          <button
                            type="button"
                            className="min-h-[44px] px-3 rounded-lg bg-brand-green text-brand-cream text-sm font-semibold"
                            onClick={async () => {
                              await driverUpdateBooking(pin, {
                                booking_id: b.id,
                                trip_status: 'completed',
                              })
                              await load(pin, driverId)
                            }}
                          >
                            Complete trip
                          </button>
                        )}
                        {editId === b.id ? (
                          <>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="min-h-[44px] rounded-lg border border-brand-cream-dark px-3"
                            />
                            <select
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="min-h-[44px] rounded-lg border border-brand-cream-dark px-3"
                            >
                              <option value="08:00">08:00</option>
                              <option value="12:30">12:30</option>
                              <option value="16:30">16:30</option>
                            </select>
                            <button
                              type="button"
                              className="min-h-[44px] rounded-lg bg-brand-green text-brand-cream font-semibold px-3"
                              onClick={async () => {
                                await driverUpdateBooking(pin, {
                                  booking_id: b.id,
                                  booking_date: editDate,
                                  start_time: editTime,
                                })
                                setEditId(null)
                                await load(pin, driverId)
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="min-h-[44px] rounded-lg border border-brand-cream-dark px-3"
                              onClick={() => setEditId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="min-h-[44px] px-3 rounded-lg border border-brand-cream-dark text-sm font-semibold"
                              onClick={() => {
                                setEditId(b.id)
                                setEditDate(b.booking_date)
                                setEditTime(String(b.start_time).slice(0, 5))
                              }}
                            >
                              Reschedule
                            </button>
                            {b.status === 'pending' && (
                              <button
                                type="button"
                                className="min-h-[44px] px-3 rounded-lg bg-brand-green text-brand-cream text-sm font-semibold"
                                onClick={async () => {
                                  await driverUpdateBooking(pin, {
                                    booking_id: b.id,
                                    status: 'paid',
                                  })
                                  await load(pin, driverId)
                                }}
                              >
                                Mark paid
                              </button>
                            )}
                            {b.status !== 'cancelled' && trip !== 'completed' && (
                              <button
                                type="button"
                                className="min-h-[44px] px-3 rounded-lg text-sm font-semibold text-red-800 border border-red-200"
                                onClick={async () => {
                                  await driverUpdateBooking(pin, {
                                    booking_id: b.id,
                                    status: 'cancelled',
                                  })
                                  await load(pin, driverId)
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="space-y-3 border-t border-brand-cream-dark pt-6">
            <h2 className="text-lg font-bold text-brand-green">Block availability</h2>
            <p className="text-sm text-brand-green/75">
              Block a full day or a single slot so guests cannot book it.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="min-h-[48px] rounded-xl border border-brand-cream-dark px-3"
              />
              <select
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                className="min-h-[48px] rounded-xl border border-brand-cream-dark px-3"
              >
                <option value="">Full day</option>
                <option value="08:00">08:00</option>
                <option value="12:30">12:30</option>
                <option value="16:30">16:30</option>
              </select>
              <input
                type="text"
                placeholder="Reason (optional)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="min-h-[48px] rounded-xl border border-brand-cream-dark px-3 sm:col-span-2"
              />
              <button
                type="button"
                disabled={!blockDate || !driverId}
                onClick={async () => {
                  try {
                    await driverBlockSlot(pin, {
                      driver_id: driverId,
                      unavailable_date: blockDate,
                      start_time: blockTime || null,
                      reason: blockReason || undefined,
                    })
                    setBlockDate('')
                    setBlockTime('')
                    setBlockReason('')
                    await load(pin, driverId)
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Could not block')
                  }
                }}
                className="sm:col-span-2 min-h-[48px] rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-40"
              >
                Add block
              </button>
            </div>
            {unavailable.length > 0 && (
              <ul className="space-y-2 pt-2">
                {unavailable.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-2 bg-brand-cream border border-brand-cream-dark rounded-xl px-3 py-3"
                  >
                    <span className="text-sm text-brand-green">
                      {u.unavailable_date}
                      {u.start_time
                        ? ` · ${String(u.start_time).slice(0, 5)}`
                        : ' · Full day'}
                      {u.reason ? ` — ${u.reason}` : ''}
                    </span>
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-800 min-h-[44px] px-2"
                      onClick={async () => {
                        await driverUnblock(pin, u.id)
                        await load(pin, driverId)
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
