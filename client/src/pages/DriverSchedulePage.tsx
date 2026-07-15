import { useEffect, useState } from 'react'
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

const PIN_KEY = 'yj_driver_pin'

type BookingRow = Awaited<ReturnType<typeof driverFetchSchedule>>['bookings'][number]
type UnavailRow = Awaited<ReturnType<typeof driverFetchSchedule>>['unavailable'][number]

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

  const unlock = (value: string) => {
    sessionStorage.setItem(PIN_KEY, value)
    setPin(value)
  }

  const load = async (activePin: string, activeDriver: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await driverFetchSchedule(activePin, activeDriver || undefined)
      setBookings(data.bookings)
      setUnavailable(
        activeDriver
          ? data.unavailable.filter((u) => u.driver_id === activeDriver)
          : data.unavailable
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule')
      if (String(e).includes('Unauthorized') || (e instanceof Error && e.message.includes('Unauthorized'))) {
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
              Driver schedule
            </h1>
            <p className="text-sm text-brand-green/85 text-center">
              Enter your driver PIN to manage bookings and availability.
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN"
              className="w-full min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3"
              autoFocus
            />
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-lg bg-brand-green text-brand-cream font-semibold"
            >
              Unlock
            </button>
          </form>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-8 sm:py-10 pb-24">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-brand-green">Your schedule</h1>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(PIN_KEY)
                setPin('')
              }}
              className="text-sm text-brand-green/80 underline min-h-[44px] px-2"
            >
              Lock
            </button>
          </div>

          {drivers.length > 1 && (
            <label className="block">
              <span className="text-sm font-semibold text-brand-green mb-2 block">Driver</span>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-green">Block time off</h2>
            <p className="text-sm text-brand-green/80">
              Block a full day or a single slot so guests cannot book it.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3"
              />
              <select
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                className="min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3"
              >
                <option value="">Full day</option>
                <option value="08:00">08:00</option>
                <option value="12:30">12:30</option>
                <option value="16:30">16:30</option>
              </select>
            </div>
            <input
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3"
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
              className="w-full sm:w-auto min-h-[48px] px-5 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-40"
            >
              Add to schedule
            </button>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-green">Blocked days / slots</h2>
            {unavailable.length === 0 ? (
              <p className="text-sm text-brand-green/70">Nothing blocked.</p>
            ) : (
              <ul className="space-y-2">
                {unavailable.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-2 bg-brand-cream border border-brand-cream-dark rounded-lg px-3 py-3"
                  >
                    <span className="text-sm text-brand-green">
                      {u.unavailable_date}
                      {u.start_time ? ` · ${String(u.start_time).slice(0, 5)}` : ' · Full day'}
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

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-brand-green">Upcoming bookings</h2>
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
            ) : bookings.length === 0 ? (
              <p className="text-sm text-brand-green/70">No upcoming bookings.</p>
            ) : (
              <ul className="space-y-3">
                {bookings.map((b) => (
                  <li
                    key={b.id}
                    className="bg-brand-cream border border-brand-cream-dark rounded-xl p-4 space-y-2"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold text-brand-green">
                        {b.booking_date} · {String(b.start_time).slice(0, 5)}
                      </p>
                      <span className="text-xs font-bold uppercase tracking-wide text-brand-green/80">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm text-brand-green/90">
                      {b.client_name} · {b.client_email}
                      {b.client_phone ? ` · ${b.client_phone}` : ''}
                    </p>
                    <p className="text-sm text-brand-green/80">
                      {b.tour?.name ?? 'Tour'} · {b.vehicle?.name ?? 'Vehicle'}
                    </p>
                    {b.notes && (
                      <p className="text-sm italic text-brand-green/70">{b.notes}</p>
                    )}

                    {editId === b.id ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
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
                          className="min-h-[44px] rounded-lg bg-brand-green text-brand-cream font-semibold"
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
                          className="min-h-[44px] rounded-lg border border-brand-cream-dark"
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
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
                            Confirm
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
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
                            Cancel booking
                          </button>
                        )}
                      </div>
                    )}
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
