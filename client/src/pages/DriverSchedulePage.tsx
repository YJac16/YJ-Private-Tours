import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { RequireAuth } from '../components/RequireAuth'
import { useAuth } from '../lib/auth'
import {
  driverBlockSlotAuth,
  driverUnblockAuth,
  driverUpdateBookingAuth,
  fetchDriverMe,
  updateDriverProfile,
  type DriverProfile,
  type DriverScheduleBooking,
  type DriverUnavailable,
} from '../lib/authApi'
import { formatZar } from '../lib/pricing'

type TripFilter = 'today' | 'upcoming' | 'completed' | 'cancelled'
type HubTab = 'trips' | 'profile'

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function mapsUrl(address?: string | null) {
  if (!address) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

function DriverHubInner() {
  const { accessToken, signOut, role } = useAuth()
  const [hubTab, setHubTab] = useState<HubTab>('trips')
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [bookings, setBookings] = useState<DriverScheduleBooking[]>([])
  const [unavailable, setUnavailable] = useState<DriverUnavailable[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [blockDate, setBlockDate] = useState('')
  const [blockTime, setBlockTime] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [filter, setFilter] = useState<TripFilter>('upcoming')

  const [fullName, setFullName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [languages, setLanguages] = useState('')
  const [bio, setBio] = useState('')
  const [years, setYears] = useState('0')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const load = async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDriverMe(accessToken)
      setDriver(data.driver)
      setBookings(data.bookings)
      setUnavailable(data.unavailable)
      setFullName(data.driver.full_name || data.driver.name || '')
      setPhotoUrl(data.driver.photo_url || '')
      setLanguages((data.driver.languages || []).join(', '))
      setBio(data.driver.bio || '')
      setYears(String(data.driver.years_experience ?? 0))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

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
      return (
        b.booking_date >= today &&
        b.status !== 'cancelled' &&
        trip !== 'cancelled' &&
        trip !== 'completed'
      )
    })
  }, [bookings, filter])

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    setProfileSaving(true)
    setProfileSaved(false)
    setError(null)
    try {
      const res = await updateDriverProfile(accessToken, {
        full_name: fullName.trim(),
        photo_url: photoUrl.trim() || null,
        languages: languages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        bio: bio.trim() || null,
        years_experience: Number(years) || 0,
      })
      setDriver(res.driver)
      setProfileSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setProfileSaving(false)
    }
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
            <div>
              <h1 className="text-2xl font-bold text-brand-green">Driver hub</h1>
              <p className="text-sm text-brand-green/80">
                {driver?.full_name || driver?.name || 'Your schedule'}
                {role === 'admin' ? ' · admin view' : ''}
              </p>
            </div>
            <button
              type="button"
              className="text-sm underline text-brand-green"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>

          <div className="flex gap-2">
            {(['trips', 'profile'] as HubTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setHubTab(tab)}
                className={`min-h-10 px-4 rounded-lg text-sm font-semibold capitalize ${
                  hubTab === tab
                    ? 'bg-brand-green text-brand-cream'
                    : 'bg-brand-cream border border-brand-cream-dark text-brand-green'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {hubTab === 'profile' && (
            <form
              onSubmit={onSaveProfile}
              className="bg-brand-cream border border-brand-cream-dark rounded-2xl p-5 space-y-3 shadow-sm"
            >
              <h2 className="text-lg font-bold text-brand-green">Profile</h2>
              {profileSaved && (
                <p className="text-sm text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  Profile saved.
                </p>
              )}
              <label className="block text-sm text-brand-green">
                Full name
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full min-h-12 rounded-xl border border-brand-cream-dark px-3"
                  required
                />
              </label>
              <label className="block text-sm text-brand-green">
                Photo URL
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="mt-1 w-full min-h-12 rounded-xl border border-brand-cream-dark px-3"
                  placeholder="/driver-yaseen.JPG"
                />
              </label>
              <label className="block text-sm text-brand-green">
                Languages (comma-separated)
                <input
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="mt-1 w-full min-h-12 rounded-xl border border-brand-cream-dark px-3"
                />
              </label>
              <label className="block text-sm text-brand-green">
                Years experience
                <input
                  type="number"
                  min={0}
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="mt-1 w-full min-h-12 rounded-xl border border-brand-cream-dark px-3"
                />
              </label>
              <label className="block text-sm text-brand-green">
                Bio
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-brand-cream-dark px-3 py-2"
                />
              </label>
              <button
                type="submit"
                disabled={profileSaving}
                className="min-h-12 px-5 rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
              >
                {profileSaving ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          )}

          {hubTab === 'trips' && (
            <>
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`min-h-10 px-3 rounded-lg text-sm font-semibold ${
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
                    onClick={() => load()}
                    className="text-sm underline text-brand-green min-h-11 px-2"
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
                                className="min-h-11 px-3 inline-flex items-center rounded-lg border border-brand-cream-dark text-sm font-semibold text-brand-green"
                              >
                                Navigate
                              </a>
                            )}
                            {trip === 'scheduled' && b.status !== 'cancelled' && (
                              <button
                                type="button"
                                className="min-h-11 px-3 rounded-lg bg-brand-green text-brand-cream text-sm font-semibold"
                                onClick={async () => {
                                  if (!accessToken) return
                                  await driverUpdateBookingAuth(accessToken, {
                                    booking_id: b.id,
                                    trip_status: 'in_progress',
                                  })
                                  await load()
                                }}
                              >
                                Start trip
                              </button>
                            )}
                            {trip === 'in_progress' && (
                              <button
                                type="button"
                                className="min-h-11 px-3 rounded-lg bg-brand-green text-brand-cream text-sm font-semibold"
                                onClick={async () => {
                                  if (!accessToken) return
                                  await driverUpdateBookingAuth(accessToken, {
                                    booking_id: b.id,
                                    trip_status: 'completed',
                                  })
                                  await load()
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
                                  className="min-h-11 rounded-lg border border-brand-cream-dark px-3"
                                />
                                <select
                                  value={editTime}
                                  onChange={(e) => setEditTime(e.target.value)}
                                  className="min-h-11 rounded-lg border border-brand-cream-dark px-3"
                                >
                                  <option value="08:00">08:00</option>
                                  <option value="12:30">12:30</option>
                                  <option value="16:30">16:30</option>
                                </select>
                                <button
                                  type="button"
                                  className="min-h-11 rounded-lg bg-brand-green text-brand-cream font-semibold px-3"
                                  onClick={async () => {
                                    if (!accessToken) return
                                    await driverUpdateBookingAuth(accessToken, {
                                      booking_id: b.id,
                                      booking_date: editDate,
                                      start_time: editTime,
                                    })
                                    setEditId(null)
                                    await load()
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="min-h-11 rounded-lg border border-brand-cream-dark px-3"
                                  onClick={() => setEditId(null)}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="min-h-11 px-3 rounded-lg border border-brand-cream-dark text-sm font-semibold"
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
                                    className="min-h-11 px-3 rounded-lg bg-brand-green text-brand-cream text-sm font-semibold"
                                    onClick={async () => {
                                      if (!accessToken) return
                                      await driverUpdateBookingAuth(accessToken, {
                                        booking_id: b.id,
                                        status: 'paid',
                                      })
                                      await load()
                                    }}
                                  >
                                    Mark paid
                                  </button>
                                )}
                                {b.status !== 'cancelled' && trip !== 'completed' && (
                                  <button
                                    type="button"
                                    className="min-h-11 px-3 rounded-lg text-sm font-semibold text-red-800 border border-red-200"
                                    onClick={async () => {
                                      if (!accessToken) return
                                      await driverUpdateBookingAuth(accessToken, {
                                        booking_id: b.id,
                                        status: 'cancelled',
                                      })
                                      await load()
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
                <h2 className="text-lg font-bold text-brand-green">
                  Block availability
                </h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="min-h-12 rounded-xl border border-brand-cream-dark px-3"
                  />
                  <select
                    value={blockTime}
                    onChange={(e) => setBlockTime(e.target.value)}
                    className="min-h-12 rounded-xl border border-brand-cream-dark px-3"
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
                    className="min-h-12 rounded-xl border border-brand-cream-dark px-3 sm:col-span-2"
                  />
                  <button
                    type="button"
                    disabled={!blockDate || !accessToken}
                    onClick={async () => {
                      if (!accessToken) return
                      try {
                        await driverBlockSlotAuth(accessToken, {
                          unavailable_date: blockDate,
                          start_time: blockTime || null,
                          reason: blockReason || undefined,
                        })
                        setBlockDate('')
                        setBlockTime('')
                        setBlockReason('')
                        await load()
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : 'Could not block'
                        )
                      }
                    }}
                    className="sm:col-span-2 min-h-12 rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-40"
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
                          className="text-sm font-semibold text-red-800 min-h-11 px-2"
                          onClick={async () => {
                            if (!accessToken) return
                            await driverUnblockAuth(accessToken, u.id)
                            await load()
                          }}
                        >
                          Remove
                        </button>
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

export default function DriverSchedulePage() {
  return (
    <RequireAuth roles={['driver', 'admin']}>
      <DriverHubInner />
    </RequireAuth>
  )
}
