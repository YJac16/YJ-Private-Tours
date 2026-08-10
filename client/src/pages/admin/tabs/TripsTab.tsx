import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminListTrips,
  adminUpdateTrip,
  adminListDrivers,
  type AccountBooking,
  type DriverProfile,
} from '../../../lib/authApi'
import { formatZar } from '../../../lib/pricing'
import { cardClass, inputClass, labelClass } from '../adminShared'

type Props = { token: string }

const TRIP_STATUSES = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'no_show',
  'cancelled',
] as const

const BOOKING_STATUSES = ['pending', 'paid', 'cancelled', 'expired'] as const

export default function TripsTab({ token }: Props) {
  const [bookings, setBookings] = useState<AccountBooking[]>([])
  const [drivers, setDrivers] = useState<DriverProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [tripStatus, setTripStatus] = useState('')
  const [driverId, setDriverId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editDriver, setEditDriver] = useState('')
  const [editTripStatus, setEditTripStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tripData, driverData] = await Promise.all([
        adminListTrips(token, {
          q: q || undefined,
          status: status || undefined,
          trip_status: tripStatus || undefined,
          driver_id: driverId || undefined,
          from: from || undefined,
          to: to || undefined,
        }),
        adminListDrivers(token),
      ])
      setBookings(tripData.bookings)
      setDrivers(driverData.drivers)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trips')
    } finally {
      setLoading(false)
    }
  }, [token, q, status, tripStatus, driverId, from, to])

  useEffect(() => {
    load()
  }, [load])

  const selected = useMemo(
    () => bookings.find((b) => b.id === selectedId) || null,
    [bookings, selectedId]
  )

  useEffect(() => {
    if (!selected) return
    setEditDate(selected.booking_date)
    setEditTime(String(selected.start_time).slice(0, 5))
    setEditDriver(selected.driver_id || selected.driver?.id || '')
    setEditTripStatus(selected.trip_status || 'scheduled')
    setEditNotes(selected.notes || '')
    setCancelReason('')
  }, [selected])

  const showFlash = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 3000)
  }

  const saveSelected = async () => {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      await adminUpdateTrip(token, {
        booking_id: selected.id,
        action: 'update',
        booking_date: editDate,
        start_time: editTime,
        driver_id: editDriver,
        trip_status: editTripStatus,
        notes: editNotes,
      })
      showFlash('Trip updated')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const cancelSelected = async () => {
    if (!selected) return
    if (!window.confirm('Cancel this booking? Refund rules still apply (≥24h).')) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await adminUpdateTrip(token, {
        booking_id: selected.id,
        action: 'cancel',
        reason: cancelReason || 'Cancelled by admin',
        request_refund: true,
      })
      showFlash(res.cancel?.message || 'Booking cancelled')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed')
    } finally {
      setSaving(false)
    }
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

      <div className={`${cardClass} grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
        <label className={labelClass}>
          Search
          <input
            className={inputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, ref…"
          />
        </label>
        <label className={labelClass}>
          Booking status
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Trip status
          <select
            className={inputClass}
            value={tripStatus}
            onChange={(e) => setTripStatus(e.target.value)}
          >
            <option value="">All</option>
            {TRIP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Driver
          <select
            className={inputClass}
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          >
            <option value="">All drivers</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name || d.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          From date
          <input
            type="date"
            className={inputClass}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          To date
          <input
            type="date"
            className={inputClass}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>

      {flash && (
        <p className="text-sm text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {flash}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-brand-green/70">Loading trips…</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-brand-green/70">No bookings match filters.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => {
            const total = b.grand_total_cents ?? b.final_price_cents
            const active = selectedId === b.id
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(active ? null : b.id)}
                  className={`${cardClass} w-full text-left transition ${
                    active ? 'border-brand-gold ring-1 ring-brand-gold/40' : ''
                  }`}
                >
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
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {selected && (
        <div className={cardClass}>
          <h3 className="font-bold text-brand-green">Edit trip</h3>
          <p className="text-xs text-brand-green/70">
            {selected.booking_reference || selected.id} · payment stays webhook-owned
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Date
              <input
                type="date"
                className={inputClass}
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Time
              <input
                type="time"
                className={inputClass}
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Driver
              <select
                className={inputClass}
                value={editDriver}
                onChange={(e) => setEditDriver(e.target.value)}
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Trip status
              <select
                className={inputClass}
                value={editTripStatus}
                onChange={(e) => setEditTripStatus(e.target.value)}
              >
                {TRIP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Notes
              <textarea
                className={inputClass}
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => saveSelected()}
              className="min-h-11 px-4 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
          {selected.status !== 'cancelled' && selected.status !== 'expired' && (
            <div className="border-t border-brand-cream-dark pt-3 space-y-2">
              <label className={labelClass}>
                Cancel reason
                <input
                  className={inputClass}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Optional reason"
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => cancelSelected()}
                className="min-h-11 px-4 rounded-lg border border-red-300 text-red-800 font-semibold disabled:opacity-60"
              >
                Cancel booking
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
