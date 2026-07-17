import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  createBooking,
  fetchCatalog,
  fetchSlots,
  isBookableDate,
  minBookableDate,
  type Driver,
  type Slot,
  type Tour,
  type Vehicle,
} from '../lib/bookingApi'

const STEPS = ['Date', 'Driver', 'Time', 'Vehicle', 'Details'] as const

export default function BookPage() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsReason, setSlotsReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const cancelled = searchParams.get('cancelled') === '1'

  const [date, setDate] = useState('')
  const [driverId, setDriverId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [tourId, setTourId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const minDate = minBookableDate()
  const dateTooSoon = Boolean(date) && !isBookableDate(date)
  const vehicleSlug = searchParams.get('vehicle')
  const tourSlug = searchParams.get('tour')
  const timeParam = searchParams.get('time')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const catalog = await fetchCatalog()
        if (cancelled) return
        setDrivers(catalog.drivers)
        setVehicles(catalog.vehicles)
        setTours(catalog.tours)

        if (vehicleSlug) {
          const v = catalog.vehicles.find((x) => x.slug === vehicleSlug)
          if (v) setVehicleId(v.id)
        }
        if (tourSlug) {
          const t = catalog.tours.find((x) => x.slug === tourSlug)
          if (t) setTourId(t.id)
        }
        if (timeParam) setStartTime(timeParam)
        if (catalog.drivers.length === 1) {
          setDriverId(catalog.drivers[0].id)
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : 'Could not load booking options. Is the booking API running?'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [vehicleSlug, tourSlug, timeParam])

  useEffect(() => {
    if (!date || !driverId) {
      setSlots([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchSlots(date, driverId)
        if (cancelled) return
        setSlots(res.slots)
        setSlotsReason(res.reason ?? null)
        if (startTime && !res.slots.some((s) => s.start_time === startTime && s.available)) {
          setStartTime('')
        }
      } catch (e) {
        if (!cancelled) {
          setSlots([])
          setSlotsReason(e instanceof Error ? e.message : 'Failed to load times')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [date, driverId, startTime])

  const canNext = () => {
    if (step === 0) return Boolean(date) && isBookableDate(date)
    if (step === 1) return Boolean(driverId)
    if (step === 2) return Boolean(startTime)
    if (step === 3) return Boolean(vehicleId)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isBookableDate(date)) {
      setError('Bookings must be made at least 2 full days in advance.')
      setStep(0)
      return
    }
    if (!tourId) {
      setError('Please select a tour experience.')
      return
    }
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const selectedTour = tours.find((t) => t.id === tourId)
      const res = await createBooking({
        booking_date: date,
        start_time: startTime,
        driver_id: driverId,
        tour_id: tourId,
        vehicle_id: vehicleId,
        client_name: name.trim(),
        client_email: email.trim(),
        client_phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        amount_cents: selectedTour?.price_cents,
      })
      if (res.checkout_url) {
        window.location.href = res.checkout_url
        return
      }
      if (res.warning) {
        setError(res.warning)
      }
      setSuccessId(res.booking_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (successId) {
    return (
      <>
        <Navbar />
        <main className="min-h-[70vh] bg-brand-cream-light px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-green mb-3">
              Booking request received
            </h1>
            <p className="text-brand-green/90 mb-6 leading-relaxed">
              Thanks! Your request is pending confirmation. We&apos;ll be in touch
              shortly. Reference: <span className="font-mono text-sm">{successId.slice(0, 8)}</span>
            </p>
            <Link
              to="/"
              className="inline-flex min-h-[48px] items-center justify-center px-6 py-3 bg-brand-green text-brand-cream font-semibold rounded-lg"
            >
              Back to home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-8 sm:py-12 pb-24">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-green text-center mb-2">
            Book your private tour
          </h1>
          <p className="text-center text-brand-green/85 text-sm sm:text-base mb-2">
            Choose a date, driver, time, and vehicle.
          </p>
          <p className="text-center text-brand-green/70 text-xs sm:text-sm mb-6">
            Bookings need at least <strong>2 full days&apos; notice</strong> (calendar days) so your guide can confirm.
          </p>
          {cancelled && (
            <p className="mb-6 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
              Payment was cancelled. You can try booking again whenever you&apos;re ready.
            </p>
          )}

          <ol className="flex gap-1 mb-8 overflow-x-auto pb-1" aria-label="Booking steps">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1 min-w-[4.5rem]">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={`w-full text-center text-[11px] sm:text-xs font-medium py-2 rounded-md min-h-[40px] ${
                    i === step
                      ? 'bg-brand-green text-brand-cream'
                      : i < step
                        ? 'bg-brand-green/20 text-brand-green'
                        : 'bg-brand-cream text-brand-green/50 border border-brand-cream-dark'
                  }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ol>

          {loading ? (
            <p className="text-center text-brand-green/80 py-12">Loading…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 0 && (
                <label className="block">
                  <span className="block text-sm font-semibold text-brand-green mb-2">
                    Preferred date
                  </span>
                  <input
                    type="date"
                    required
                    min={minDate}
                    value={date}
                    onChange={(e) => {
                      const next = e.target.value
                      if (next && !isBookableDate(next)) {
                        setError(
                          'Bookings must be made at least 2 full days in advance.'
                        )
                        setDate('')
                        setStartTime('')
                        return
                      }
                      setError(null)
                      setDate(next)
                      setStartTime('')
                    }}
                    className="w-full min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3 text-brand-green"
                  />
                  {dateTooSoon && (
                    <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
                      Bookings must be made at least 2 full days in advance. Earliest
                      date: {minDate}.
                    </p>
                  )}
                  <span className="block text-xs text-brand-green/70 mt-2">
                    Earliest available: {minDate} (2 full days&apos; notice required)
                  </span>
                </label>
              )}

              {step === 1 && (
                <fieldset>
                  <legend className="text-sm font-semibold text-brand-green mb-3">
                    Select your driver / guide
                  </legend>
                  <div className="space-y-2">
                    {drivers.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDriverId(d.id)}
                        className={`w-full text-left px-4 py-3.5 min-h-[48px] rounded-lg border transition-colors ${
                          driverId === d.id
                            ? 'border-brand-green bg-brand-green text-brand-cream'
                            : 'border-brand-cream-dark bg-brand-cream text-brand-green'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                    {drivers.length === 0 && (
                      <p className="text-sm text-brand-green/80">No active drivers found.</p>
                    )}
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset>
                  <legend className="text-sm font-semibold text-brand-green mb-3">
                    Available start times
                  </legend>
                  {slotsReason && slots.every((s) => !s.available) && (
                    <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                      {slotsReason}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setStartTime(s.start_time)}
                        className={`w-full text-left px-4 py-3.5 min-h-[48px] rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          startTime === s.start_time
                            ? 'border-brand-green bg-brand-green text-brand-cream'
                            : 'border-brand-cream-dark bg-brand-cream text-brand-green'
                        }`}
                      >
                        <span className="font-medium">{s.label}</span>
                        {!s.available && s.reason && (
                          <span className="block text-xs opacity-80 mt-0.5">{s.reason}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 3 && (
                <fieldset>
                  <legend className="text-sm font-semibold text-brand-green mb-3">
                    Choose your vehicle
                  </legend>
                  <div className="space-y-2">
                    {vehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVehicleId(v.id)}
                        className={`w-full text-left px-4 py-3.5 min-h-[52px] rounded-lg border transition-colors ${
                          vehicleId === v.id
                            ? 'border-brand-green bg-brand-green text-brand-cream'
                            : 'border-brand-cream-dark bg-brand-cream text-brand-green'
                        }`}
                      >
                        <span className="font-semibold block">{v.name}</span>
                        {v.description && (
                          <span className="text-xs opacity-85 mt-0.5 block">{v.description}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="block text-sm font-semibold text-brand-green mb-2">
                      Tour experience
                    </span>
                    <select
                      required
                      value={tourId}
                      onChange={(e) => setTourId(e.target.value)}
                      className="w-full min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3 text-brand-green"
                    >
                      <option value="">Select a tour…</option>
                      {tours.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.price_cents
                            ? ` — R${(t.price_cents / 100).toLocaleString('en-ZA')}`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-sm font-semibold text-brand-green mb-2">
                      Full name
                    </span>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-semibold text-brand-green mb-2">
                      Email
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3"
                      autoComplete="email"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-semibold text-brand-green mb-2">
                      Phone (optional)
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-semibold text-brand-green mb-2">
                      Notes (optional)
                    </span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-brand-cream-dark bg-brand-cream px-3 py-2"
                      placeholder="Pickup location, group size, preferences…"
                    />
                  </label>
                  <div className="text-sm text-brand-green/85 bg-brand-cream border border-brand-cream-dark rounded-lg p-3 leading-snug space-y-1">
                    <p>
                      <strong>Summary:</strong> {date || '—'} at {startTime || '—'}
                    </p>
                    <p>
                      Driver:{' '}
                      {drivers.find((d) => d.id === driverId)?.name ?? '—'} · Vehicle:{' '}
                      {vehicles.find((v) => v.id === vehicleId)?.name ?? '—'}
                    </p>
                    <p className="font-semibold text-brand-green pt-1">
                      Total:{' '}
                      {tours.find((t) => t.id === tourId)?.price_cents
                        ? `R${((tours.find((t) => t.id === tourId)?.price_cents || 0) / 100).toLocaleString('en-ZA')}`
                        : '—'}
                    </p>
                    <p className="text-xs text-brand-green/70">
                      You&apos;ll pay securely via Yoco on the next step.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 min-h-[48px] rounded-lg border border-brand-cream-dark bg-brand-cream text-brand-green font-semibold"
                  >
                    Back
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    disabled={!canNext()}
                    onClick={() => setStep((s) => s + 1)}
                    className="flex-1 min-h-[48px] rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-40"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 min-h-[48px] rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-60"
                  >
                    {submitting ? 'Redirecting to Yoco…' : 'Pay with Yoco'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
