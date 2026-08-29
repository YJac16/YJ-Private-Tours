import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PriceSummary from '../components/PriceSummary'
import InformedConsentForm from '../components/InformedConsentForm'
import {
  createBooking,
  fetchCatalog,
  fetchSlots,
  isBookableDate,
  minBookableDate,
  type Catalog,
  type Driver,
  type Slot,
  type Tour,
  type Vehicle,
} from '../lib/bookingApi'
import { useAuth } from '../lib/auth'
import {
  calculatePrice,
  defaultVehicleForGuests,
  formatTourFromPrice,
  formatZar,
  maxGuestsForTour,
  resolvePricePerPerson,
  resolveVehiclePrice,
  startingFromCents,
  validateBookingGuests,
  vehicleFitsGuests,
  vehiclesForGuestCount,
  type BookingSettings,
} from '../lib/pricing'
import { isValidEmail, isValidPhone } from '../lib/contactValidation'
import { displayDurationLabel } from '../lib/displayDuration'
import { isSunsetFriendlyTime } from '../lib/sunsetSlots'
import { vehiclePhotoUrl } from '../lib/vehiclePhotos'

const STEPS = [
  'Experience',
  'Group & Date',
  'Driver',
  'Vehicle',
  'Summary',
  'Details',
  'Checkout',
] as const

export default function BookPage() {
  const [searchParams] = useSearchParams()
  const { profile, accessToken } = useAuth()
  const [step, setStep] = useState(0)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [settings, setSettings] = useState<BookingSettings>({
    max_guests_default: 5,
    allow_larger_groups: false,
  })
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsReason, setSlotsReason] = useState<string | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [successRef, setSuccessRef] = useState<string | null>(null)
  const [consentForm, setConsentForm] = useState<{
    id: string
    version: string
    title: string
    body_html: string
  } | null>(null)
  const [consentSigned, setConsentSigned] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `book-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
  const cancelled = searchParams.get('cancelled') === '1'
  const cancelledBookingId = searchParams.get('booking_id')

  const [tourId, setTourId] = useState('')
  const [peopleCount, setPeopleCount] = useState(2)
  const [vehicleId, setVehicleId] = useState('')
  const [vehicleManual, setVehicleManual] = useState(false)
  const [date, setDate] = useState('')
  const [driverId, setDriverId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [dietary, setDietary] = useState('')
  const [flightNumber, setFlightNumber] = useState('')

  const tourSlug = searchParams.get('tour')
  const timeParam = searchParams.get('time')
  const vehicleSlug = searchParams.get('vehicle')
  const noteParam = searchParams.get('note')
  const minDate = minBookableDate()

  useEffect(() => {
    if (!profile) return
    if (profile.full_name) setName((n) => n || profile.full_name || '')
    if (profile.email) setEmail((e) => e || profile.email || '')
    if (profile.phone) setPhone((p) => p || profile.phone || '')
  }, [profile])

  useEffect(() => {
    if (!accessToken) {
      setConsentForm(null)
      setConsentSigned(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setConsentLoading(true)
      try {
        const res = await fetch('/api/account-consent', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const data = await res.json()
        if (!cancelled && res.ok) {
          setConsentForm(data.form || null)
          setConsentSigned(Boolean(data.signed))
        }
      } catch {
        /* ignore — pay step will surface errors */
      } finally {
        if (!cancelled) setConsentLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken])

  useEffect(() => {
    if (noteParam) setSpecialRequests((s) => s || noteParam)
  }, [noteParam])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const selectedTour = tours.find((t) => t.id === tourId)
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const selectedDriver = drivers.find((d) => d.id === driverId)

  const maxGuests = selectedTour
    ? maxGuestsForTour(selectedTour, settings)
    : settings.max_guests_default

  /** Always allow up to tour max (5); vehicle step blocks undersized cars. */
  const maxForStepper = maxGuests

  const breakdown = useMemo(() => {
    if (!selectedTour || !selectedVehicle) return null
    return calculatePrice(selectedTour, selectedVehicle, peopleCount, 0)
  }, [selectedTour, selectedVehicle, peopleCount])

  /** Preview total before vehicle is chosen: PPP × people only */
  const peoplePreview = useMemo(() => {
    if (!selectedTour) return null
    const ppp = resolvePricePerPerson(selectedTour)
    return {
      adult_count: peopleCount,
      child_count: 0,
      passenger_count: peopleCount,
      vehicle_price_cents: 0,
      price_per_person_cents: ppp,
      passenger_total_cents: peopleCount * ppp,
      grand_total_cents: peopleCount * ppp,
      final_price_cents: peopleCount * ppp,
    }
  }, [selectedTour, peopleCount])

  const liveBreakdown = breakdown || peoplePreview

  const fittingVehicles = useMemo(
    () => vehiclesForGuestCount(vehicles, Math.max(1, peopleCount)),
    [vehicles, peopleCount]
  )

  useEffect(() => {
    let cancelledFetch = false
    ;(async () => {
      try {
        const catalog: Catalog = await fetchCatalog()
        if (cancelledFetch) return
        setDrivers(catalog.drivers)
        setVehicles(catalog.vehicles)
        setTours(catalog.tours)
        setSettings(catalog.settings)
        setBlockedDates(catalog.blocked_dates || [])

        if (tourSlug) {
          const t = catalog.tours.find((x) => x.slug === tourSlug)
          if (t) setTourId(t.id)
        }
        if (timeParam) {
          if (tourSlug === 'sunset' && !isSunsetFriendlyTime(timeParam)) {
            setStartTime('')
          } else {
            setStartTime(timeParam)
          }
        }
        if (catalog.drivers.length === 1) {
          setDriverId(catalog.drivers[0].id)
        }
        if (vehicleSlug) {
          const v = catalog.vehicles.find((x) => x.slug === vehicleSlug)
          if (v) {
            setVehicleId(v.id)
            setVehicleManual(true)
          }
        }
      } catch (e) {
        if (!cancelledFetch) {
          setError(
            e instanceof Error
              ? e.message
              : 'Could not load booking options. Is the booking API running?'
          )
        }
      } finally {
        if (!cancelledFetch) setLoading(false)
      }
    })()
    return () => {
      cancelledFetch = true
    }
  }, [tourSlug, timeParam, vehicleSlug])

  useEffect(() => {
    if (!vehicles.length) return
    const count = Math.max(1, peopleCount)
    const current = vehicles.find((v) => v.id === vehicleId)

    // Keep a manual choice only while it still fits this group size
    if (vehicleManual && current && vehicleFitsGuests(current, count)) {
      return
    }

    const auto = defaultVehicleForGuests(vehicles, count)
    setVehicleId(auto?.id ?? '')
    if (current && !vehicleFitsGuests(current, count)) {
      setVehicleManual(false)
    }
  }, [peopleCount, vehicles, vehicleManual, vehicleId])

  useEffect(() => {
    if (peopleCount > maxForStepper) {
      setPeopleCount(Math.max(1, maxForStepper))
    }
  }, [maxForStepper, peopleCount])

  useEffect(() => {
    const activeDriver = driverId || drivers[0]?.id
    if (!date || !activeDriver) {
      setSlots([])
      setSlotsReason(null)
      return
    }
    let cancelledSlots = false
    ;(async () => {
      setSlotsLoading(true)
      try {
        const res = await fetchSlots(date, activeDriver, vehicleId || undefined)
        if (cancelledSlots) return
        setSlots(res.slots)
        setSlotsReason(res.reason ?? null)
        setStartTime((prev) => {
          if (!prev) return prev
          if (!res.slots.length) return ''
          const stillOk = res.slots.some(
            (s) => s.start_time === prev && s.available
          )
          return stillOk ? prev : ''
        })
      } catch (e) {
        if (!cancelledSlots) {
          setSlots([])
          setSlotsReason(
            e instanceof Error
              ? e.message
              : 'Could not load available times. Please try again.'
          )
          setStartTime('')
        }
      } finally {
        if (!cancelledSlots) setSlotsLoading(false)
      }
    })()
    return () => {
      cancelledSlots = true
    }
  }, [date, driverId, drivers, vehicleId])

  useEffect(() => {
    if (
      selectedTour?.slug === 'sunset' &&
      startTime &&
      !isSunsetFriendlyTime(startTime)
    ) {
      setStartTime('')
    }
  }, [selectedTour, startTime])

  const timeOptions = useMemo(() => {
    if (selectedTour?.slug === 'sunset') {
      return slots.filter((s) => isSunsetFriendlyTime(s.start_time))
    }
    return slots
  }, [slots, selectedTour])

  const canNext = () => {
    if (step === 0) return Boolean(tourId)
    if (step === 1) {
      return (
        peopleCount >= 1 &&
        Boolean(date) &&
        isBookableDate(date) &&
        !blockedDates.includes(date) &&
        Boolean(startTime) &&
        timeOptions.some((s) => s.start_time === startTime && s.available)
      )
    }
    if (step === 2) return Boolean(driverId)
    if (step === 3) {
      if (!vehicleId || !selectedTour || !selectedVehicle) return false
      return !validateBookingGuests(
        peopleCount,
        0,
        selectedTour,
        selectedVehicle,
        settings
      )
    }
    if (step === 4) return termsAccepted
    if (step === 5) {
      return Boolean(
        name.trim() &&
          isValidEmail(email) &&
          isValidPhone(phone) &&
          pickupAddress.trim()
      )
    }
    if (step === 6) {
      return Boolean(accessToken && consentSigned && termsAccepted)
    }
    return true
  }

  const goNext = () => {
    setError(null)
    if (step === 1 && !startTime) {
      setError('Please select a start time.')
      return
    }
    if (step === 5) {
      if (!isValidEmail(email)) {
        setError('Please enter a valid email address.')
        return
      }
      if (!isValidPhone(phone)) {
        setError('Please enter a valid phone number.')
        return
      }
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }

  const handlePay = async () => {
    if (!selectedTour || !selectedVehicle || !selectedDriver) return
    if (!accessToken) {
      setError('Please sign in to complete payment and keep your consent on file.')
      setStep(5)
      return
    }
    if (!consentSigned) {
      setError('Please sign the informed consent form before payment.')
      setStep(6)
      return
    }
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions and Privacy Policy.')
      setStep(4)
      return
    }
    const guestErr = validateBookingGuests(
      peopleCount,
      0,
      selectedTour,
      selectedVehicle,
      settings
    )
    if (guestErr) {
      setError(guestErr)
      setStep(3)
      return
    }
    if (
      !name.trim() ||
      !isValidEmail(email) ||
      !isValidPhone(phone) ||
      !pickupAddress.trim()
    ) {
      setError('Please enter a valid email, phone number, and pickup address.')
      setStep(5)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await createBooking(
        {
          booking_date: date,
          start_time: startTime,
          driver_id: driverId,
          tour_id: tourId,
          vehicle_id: vehicleId,
          adult_count: peopleCount,
          child_count: 0,
          client_name: name.trim(),
          client_email: email.trim(),
          client_phone: phone.trim(),
          client_country: country.trim() || undefined,
          pickup_address: pickupAddress.trim(),
          dietary_requirements: dietary.trim() || undefined,
          flight_number: flightNumber.trim() || undefined,
          special_requests: specialRequests.trim() || undefined,
        },
        accessToken,
        idempotencyKey
      )
      if (res.resume_thank_you) {
        window.location.href = res.resume_thank_you
        return
      }
      if (res.checkout_url) {
        window.location.href = res.checkout_url
        return
      }
      if (res.warning) setError(res.warning)
      setSuccessId(res.booking_id)
      setSuccessRef(res.booking_reference || null)
      setIdempotencyKey(
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `book-${Date.now()}-${Math.random().toString(36).slice(2)}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const stickySummary = Boolean(liveBreakdown && step >= 1 && step < 6)
  const showMobileBar = step < STEPS.length && !loading
  const primaryDisabled =
    step < STEPS.length - 1
      ? !canNext()
      : submitting || !breakdown || !termsAccepted
  const primaryLabel =
    step < STEPS.length - 1
      ? 'Continue'
      : submitting
        ? 'Redirecting to Yoco…'
        : breakdown
          ? `Pay ${formatZar(breakdown.grand_total_cents)}`
          : 'Pay with Yoco'
  const onPrimary = () => {
    if (step < STEPS.length - 1) goNext()
    else void handlePay()
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
              Reference:{' '}
              <span className="font-mono text-sm font-semibold">
                {successRef || successId}
              </span>
            </p>
            <Link
              to="/"
              className="inline-flex min-h-12 items-center justify-center px-6 py-3 bg-brand-green text-brand-cream font-semibold rounded-xl"
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
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-8 sm:py-12 pb-36 lg:pb-28">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-green text-center mb-2">
            Book your private experience
          </h1>
          <p className="text-center text-brand-green/75 text-sm mb-6">
            Live pricing · choose your group, date & vehicle · pay with Yoco
          </p>
          {cancelled && (
            <p className="mb-6 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
              Payment was cancelled
              {cancelledBookingId ? ' for this checkout' : ''}. Your unpaid hold
              expires automatically after 30 minutes so the slot can be booked
              again. You can continue whenever you&apos;re ready.
            </p>
          )}

          <ol
            className="hidden sm:flex gap-1 mb-8 overflow-x-auto pb-1"
            aria-label="Booking steps"
          >
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={`w-full text-center text-xs font-medium py-3 rounded-lg min-h-11 transition-colors ${
                    i === step
                      ? 'bg-brand-green text-brand-cream shadow-sm'
                      : i < step
                        ? 'bg-brand-green/20 text-brand-green'
                        : 'bg-brand-cream text-brand-green/45 border border-brand-cream-dark'
                  }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ol>

          <div className="sm:hidden mb-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-brand-green">
                Step {step + 1} of {STEPS.length}: {STEPS[step]}
              </p>
              <p className="text-xs text-brand-green/60 tabular-nums">
                {Math.round(((step + 1) / STEPS.length) * 100)}%
              </p>
            </div>
            <div
              className="h-1.5 rounded-full bg-brand-cream-dark/60 overflow-hidden"
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-label="Booking progress"
            >
              <div
                className="h-full bg-brand-green transition-all duration-300"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {STEPS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  disabled={i > step}
                  onClick={() => i < step && setStep(i)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-md text-[11px] font-medium min-h-9 ${
                    i === step
                      ? 'bg-brand-green text-brand-cream'
                      : i < step
                        ? 'bg-brand-green/15 text-brand-green'
                        : 'bg-brand-cream text-brand-green/40'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`grid gap-6 ${stickySummary ? 'lg:grid-cols-[1fr_300px]' : ''}`}
          >
            <div>
              {loading ? (
                <p className="text-center text-brand-green/80 py-16">
                  Loading experiences…
                </p>
              ) : (
                <div key={step} className="animate-[fadeIn_0.35s_ease-out] space-y-5">
                  {/* 0 — Experience */}
                  {step === 0 && (
                    <fieldset className="space-y-3">
                      <legend className="text-lg font-bold text-brand-green mb-1">
                        Select your experience
                      </legend>
                      {!accessToken && (
                        <p className="text-sm text-brand-green/85 bg-white border border-brand-cream-dark rounded-xl px-3 py-2">
                          Payment requires a signed-in account so your informed
                          consent stays on file. You can choose your experience
                          first, then{' '}
                          <Link
                            to={`/login?next=${encodeURIComponent('/book')}`}
                            className="font-semibold underline"
                          >
                            sign in
                          </Link>{' '}
                          before checkout.
                        </p>
                      )}
                      {tours.map((t) => {
                        const fromCents = startingFromCents(t, vehicles, 1)
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTourId(t.id)}
                            className={`w-full text-left rounded-2xl border overflow-hidden transition-all shadow-sm ${
                              tourId === t.id
                                ? 'border-brand-green ring-2 ring-brand-green/30'
                                : 'border-brand-cream-dark bg-brand-cream hover:border-brand-green/40'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row">
                              <div className="relative w-full sm:w-48 sm:shrink-0 aspect-video sm:aspect-auto sm:min-h-35 sm:self-stretch overflow-hidden bg-brand-cream-dark/30">
                                {t.image_url && (
                                  <img
                                    src={t.image_url}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-1.5">
                                <div className="flex flex-wrap justify-between gap-2">
                                  <h3 className="font-bold text-brand-green text-lg">
                                    {t.name}
                                  </h3>
                                  <span className="text-sm font-semibold text-brand-green shrink-0">
                                    From {formatZar(fromCents)}
                                  </span>
                                </div>
                                {displayDurationLabel(t.slug, t.duration_label) && (
                                  <p className="text-xs text-brand-green/70">
                                    {displayDurationLabel(t.slug, t.duration_label)}
                                  </p>
                                )}
                                <p className="text-sm text-brand-green/85">
                                  {t.description}
                                </p>
                                <p className="text-xs text-brand-green/70">
                                  1 guest + cheapest vehicle included
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </fieldset>
                  )}

                  {/* 1 — Group Size & Date (screenshot-style) */}
                  {step === 1 && (
                    <div className="bg-white rounded-2xl border border-brand-cream-dark shadow-sm p-5 sm:p-8 max-w-lg space-y-6">
                      <h2 className="text-2xl font-bold text-brand-green">
                        Group Size &amp; Date
                      </h2>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-green/70 mb-3">
                          Number of people (1–{maxForStepper}) *
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            type="button"
                            aria-label="Decrease people"
                            disabled={peopleCount <= 1}
                            onClick={() =>
                              setPeopleCount((n) => Math.max(1, n - 1))
                            }
                            className="size-12 rounded-full border-2 border-brand-green/40 text-brand-green text-2xl font-light disabled:opacity-30 hover:border-brand-green transition-colors"
                          >
                            −
                          </button>
                          <div className="min-w-18 min-h-13 px-4 flex items-center justify-center rounded-xl border border-brand-cream-dark text-2xl font-bold text-brand-green tabular-nums bg-brand-cream-light">
                            {peopleCount}
                          </div>
                          <button
                            type="button"
                            aria-label="Increase people"
                            disabled={peopleCount >= maxForStepper}
                            onClick={() =>
                              setPeopleCount((n) =>
                                Math.min(maxForStepper, n + 1)
                              )
                            }
                            className="size-12 rounded-full border-2 border-brand-green text-brand-green text-2xl font-light disabled:opacity-30 hover:bg-brand-green/5 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <label className="block">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-green/70 mb-2 block">
                          Tour date *
                        </span>
                        <input
                          type="date"
                          required
                          min={minDate}
                          value={date}
                          onChange={(e) => {
                            const next = e.target.value
                            if (next && blockedDates.includes(next)) {
                              setError('This date is blocked and cannot be booked.')
                              setDate('')
                              return
                            }
                            if (next && !isBookableDate(next)) {
                              setError(
                                'Bookings must be made at least 2 full days in advance.'
                              )
                              setDate('')
                              return
                            }
                            setError(null)
                            setDate(next)
                            setStartTime('')
                          }}
                          className="w-full min-h-13 rounded-xl border border-brand-cream-dark bg-white px-4 text-brand-green"
                        />
                        <span className="text-xs text-brand-green/60 mt-1.5 block">
                          Earliest available: {minDate}
                        </span>
                      </label>

                      <fieldset>
                        <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-green/70 mb-2">
                          Start time *
                        </legend>
                        {slotsLoading && (
                          <p className="text-sm text-brand-green/70 mb-2">
                            Checking availability…
                          </p>
                        )}
                        {!slotsLoading && slotsReason && (
                          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2">
                            {slotsReason}
                          </p>
                        )}
                        {!slotsLoading && !timeOptions.length && !slotsReason && (
                          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2">
                            {date
                              ? 'No available times for this date and driver.'
                              : 'Pick a date first.'}
                          </p>
                        )}
                        <div className="flex flex-col gap-3 isolate">
                          {timeOptions.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              disabled={!s.available || slotsLoading}
                              onClick={() => setStartTime(s.start_time)}
                              className={`relative z-0 w-full text-left px-4 py-4 min-h-14 rounded-xl border transition-colors touch-manipulation disabled:opacity-40 ${
                                startTime === s.start_time
                                  ? 'border-brand-green bg-brand-green text-brand-cream'
                                  : 'border-brand-cream-dark bg-white text-brand-green hover:border-brand-green/50'
                              }`}
                            >
                              <span className="pointer-events-none block font-semibold">
                                {s.label}
                              </span>
                              {!s.available && s.reason ? (
                                <span className="pointer-events-none block text-xs opacity-80 mt-0.5">
                                  {s.reason}
                                </span>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      {liveBreakdown && (
                        <PriceSummary
                          breakdown={liveBreakdown}
                          tourName={selectedTour?.name}
                          vehicleName={selectedVehicle?.name}
                        />
                      )}
                      {!selectedVehicle && selectedTour && (
                        <p className="text-xs text-brand-green/60 text-center">
                          Vehicle fee is added when you choose a vehicle next.
                        </p>
                      )}
                    </div>
                  )}

                  {/* 2 — Driver */}
                  {step === 2 && (
                    <fieldset className="space-y-3">
                      <legend className="text-lg font-bold text-brand-green mb-1">
                        Select your driver
                      </legend>
                      {drivers.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDriverId(d.id)}
                          className={`w-full text-left rounded-2xl border overflow-hidden transition-all shadow-sm ${
                            driverId === d.id
                              ? 'border-brand-green ring-2 ring-brand-green/30'
                              : 'border-brand-cream-dark bg-brand-cream'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row">
                            <div className="relative w-full sm:w-36 sm:shrink-0 aspect-square sm:aspect-auto sm:min-h-37.5 sm:self-stretch overflow-hidden bg-brand-cream-dark/30">
                              <img
                                src={d.photo_url || '/driver-yaseen.JPG'}
                                alt={d.full_name || d.name}
                                className="absolute inset-0 w-full h-full object-cover object-top"
                              />
                            </div>
                            <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-2">
                              <h3 className="font-bold text-brand-green text-lg">
                                {d.full_name || d.name}
                              </h3>
                              <p className="text-xs text-brand-green/70">
                                {(d.languages || ['English']).join(' · ')}
                                {d.years_experience
                                  ? ` · ${d.years_experience}+ years`
                                  : ''}
                              </p>
                              {d.bio && (
                                <p className="text-sm text-brand-green/85">
                                  {d.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </fieldset>
                  )}

                  {/* 3 — Vehicle (price updates on select) */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg font-bold text-brand-green">
                          Select your vehicle
                        </h2>
                        <p className="text-sm text-brand-green/70 mt-1">
                          For {peopleCount} guest{peopleCount === 1 ? '' : 's'} —
                          total updates as you choose.
                        </p>
                      </div>

                      {liveBreakdown && (
                        <PriceSummary
                          breakdown={
                            selectedVehicle && selectedTour
                              ? calculatePrice(
                                  selectedTour,
                                  selectedVehicle,
                                  peopleCount,
                                  0
                                )
                              : liveBreakdown
                          }
                          tourName={selectedTour?.name}
                          vehicleName={selectedVehicle?.name}
                          className="max-w-lg"
                        />
                      )}

                      <div className="space-y-3">
                        {vehicles.map((v) => {
                          const fits = vehicleFitsGuests(v, peopleCount)
                          const preview =
                            selectedTour && fits
                              ? calculatePrice(
                                  selectedTour,
                                  v,
                                  peopleCount,
                                  0
                                )
                              : null
                          return (
                            <button
                              key={v.id}
                              type="button"
                              disabled={!fits}
                              onClick={() => {
                                setVehicleId(v.id)
                                setVehicleManual(true)
                              }}
                              className={`w-full text-left rounded-2xl border overflow-hidden transition-all shadow-sm disabled:opacity-40 ${
                                vehicleId === v.id
                                  ? 'border-brand-green ring-2 ring-brand-green/30'
                                  : 'border-brand-cream-dark bg-white'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row">
                                <div className="relative w-full sm:w-48 sm:shrink-0 aspect-video sm:aspect-auto sm:min-h-40 sm:self-stretch overflow-hidden bg-brand-green-dark">
                                  <img
                                    src={vehiclePhotoUrl(v)}
                                    alt={v.name}
                                    className="absolute inset-0 w-full h-full object-cover object-center"
                                  />
                                </div>
                                <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-2">
                                  <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-2">
                                    <h3 className="font-bold text-brand-green text-lg leading-snug">
                                      {v.name}
                                    </h3>
                                    <span className="text-sm font-bold text-brand-green shrink-0">
                                      Vehicle fee:{' '}
                                      {formatZar(resolveVehiclePrice(v))}
                                    </span>
                                  </div>
                                  <ul className="text-sm text-brand-green/85 space-y-0.5">
                                    <li>
                                      • Up to {v.capacity_max} passengers
                                    </li>
                                    <li>
                                      • Luggage: {v.luggage_capacity || 2} bags
                                    </li>
                                    {(v.features || []).slice(0, 3).map((f) => (
                                      <li key={f}>• {f}</li>
                                    ))}
                                  </ul>
                                  {preview && (
                                    <p className="text-sm font-semibold text-brand-green pt-1">
                                      Your total with this vehicle:{' '}
                                      {formatZar(preview.grand_total_cents)}
                                    </p>
                                  )}
                                  {!fits && (
                                    <p className="text-xs text-amber-800">
                                      Not available for {peopleCount} guests (
                                      {v.capacity_min}–{v.capacity_max})
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {fittingVehicles.length === 0 && (
                        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                          No vehicle fits {peopleCount} guests. Go back and adjust
                          group size.
                        </p>
                      )}
                    </div>
                  )}

                  {/* 4 — Summary */}
                  {step === 4 && (
                    <div className="space-y-5 max-w-lg">
                      <h2 className="text-lg font-bold text-brand-green">
                        Booking summary
                      </h2>
                      <div className="bg-white border border-brand-cream-dark rounded-2xl p-5 space-y-3 shadow-sm">
                        <Row label="Experience" value={selectedTour?.name} />
                        <Row
                          label="Date & time"
                          value={`${date} at ${startTime}`}
                        />
                        <Row
                          label="Driver"
                          value={
                            selectedDriver?.full_name || selectedDriver?.name
                          }
                        />
                        <Row label="Vehicle" value={selectedVehicle?.name} />
                        <Row
                          label="Number of people"
                          value={String(peopleCount)}
                        />
                      </div>
                      {breakdown && (
                        <PriceSummary
                          breakdown={breakdown}
                          tourName={selectedTour?.name}
                          vehicleName={selectedVehicle?.name}
                        />
                      )}
                      <label className="flex items-start gap-3 text-sm text-brand-green cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-1 size-4 accent-brand-green"
                        />
                        <span>
                          I agree to the{' '}
                          <Link
                            to="/terms"
                            target="_blank"
                            className="underline font-semibold"
                          >
                            Terms &amp; Conditions
                          </Link>{' '}
                          and{' '}
                          <Link
                            to="/privacy"
                            target="_blank"
                            className="underline font-semibold"
                          >
                            Privacy Policy
                          </Link>
                        </span>
                      </label>
                    </div>
                  )}

                  {/* 5 — Details */}
                  {step === 5 && (
                    <div className="space-y-4 max-w-lg">
                      <h2 className="text-lg font-bold text-brand-green">
                        Your details
                      </h2>
                      {!accessToken ? (
                        <p className="text-sm text-brand-green/80 bg-white border border-brand-cream-dark rounded-xl px-3 py-2">
                          <Link
                            to={`/login?next=${encodeURIComponent('/book')}`}
                            className="font-semibold underline"
                          >
                            Sign in
                          </Link>{' '}
                          or{' '}
                          <Link
                            to={`/signup?next=${encodeURIComponent('/book')}`}
                            className="font-semibold underline"
                          >
                            create an account
                          </Link>{' '}
                          before checkout so your informed consent stays on file
                          for future bookings.
                        </p>
                      ) : (
                        <p className="text-sm text-brand-green/80 bg-white border border-brand-cream-dark rounded-xl px-3 py-2">
                          Signed in — your profile details are prefilled. Consent
                          is signed once per account.
                        </p>
                      )}
                      <Field label="Full name" required value={name} onChange={setName} autoComplete="name" />
                      <Field label="Email" type="email" required value={email} onChange={setEmail} autoComplete="email" />
                      {email.trim() && !isValidEmail(email) && (
                        <p className="text-xs text-amber-900 -mt-2">
                          Enter a real email address (for example name@domain.com).
                        </p>
                      )}
                      <Field label="Phone number" type="tel" required value={phone} onChange={setPhone} autoComplete="tel" />
                      {phone.trim() && !isValidPhone(phone) && (
                        <p className="text-xs text-amber-900 -mt-2">
                          Enter a plausible phone number with at least 9 digits.
                        </p>
                      )}
                      <Field label="Country" value={country} onChange={setCountry} autoComplete="country-name" />
                      <Field label="Hotel / pickup address" required value={pickupAddress} onChange={setPickupAddress} />
                      <label className="block">
                        <span className="block text-sm font-semibold text-brand-green mb-2">
                          Special requests
                        </span>
                        <textarea
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-brand-cream-dark bg-white px-3 py-2"
                        />
                      </label>
                      <Field label="Dietary requirements" value={dietary} onChange={setDietary} />
                      <Field label="Flight number (optional)" value={flightNumber} onChange={setFlightNumber} />
                    </div>
                  )}

                  {/* 6 — Checkout */}
                  {step === 6 && (
                    <div className="space-y-5 max-w-lg">
                      <h2 className="text-lg font-bold text-brand-green">
                        Secure checkout
                      </h2>
                      <p className="text-sm text-brand-green/80">
                        Confirm to create your booking (Pending Payment) and
                        continue to Yoco.
                      </p>
                      {!accessToken && (
                        <p className="text-sm text-amber-950 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                          Sign in is required before payment.{' '}
                          <Link
                            to={`/login?next=${encodeURIComponent('/book')}`}
                            className="font-semibold underline"
                          >
                            Sign in
                          </Link>
                        </p>
                      )}
                      {accessToken && consentLoading && (
                        <p className="text-sm text-brand-green/70">
                          Checking consent…
                        </p>
                      )}
                      {accessToken && !consentLoading && consentSigned && (
                        <p className="text-sm text-green-900 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                          Informed consent on file — you do not need to sign again
                          for this booking.
                        </p>
                      )}
                      {accessToken &&
                        !consentLoading &&
                        !consentSigned &&
                        consentForm && (
                          <div className="space-y-2">
                            <p className="text-sm text-brand-green/85">
                              Please sign the informed consent form once before
                              paying. Future bookings will skip this step.
                            </p>
                            <InformedConsentForm
                              form={consentForm}
                              accessToken={accessToken}
                              defaultName={name}
                              defaultEmail={email}
                              defaultPhone={phone}
                              onSigned={() => setConsentSigned(true)}
                              compact
                            />
                          </div>
                        )}
                      {breakdown && (
                        <PriceSummary
                          breakdown={breakdown}
                          tourName={selectedTour?.name}
                          vehicleName={selectedVehicle?.name}
                        />
                      )}
                      <div className="text-sm text-brand-green/85 bg-white border border-brand-cream-dark rounded-xl p-4 space-y-1">
                        <p>
                          <strong>{selectedTour?.name}</strong> · {date} at{' '}
                          {startTime}
                        </p>
                        <p>
                          {selectedDriver?.full_name || selectedDriver?.name} ·{' '}
                          {selectedVehicle?.name}
                        </p>
                        <p>
                          {peopleCount} guest{peopleCount === 1 ? '' : 's'}
                        </p>
                        <p>
                          {name} · {email} · {phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 max-w-lg">
                      {error}
                    </p>
                  )}

                  <div className="hidden lg:flex gap-2 pt-2 max-w-lg">
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null)
                          setStep((s) => s - 1)
                        }}
                        className="flex-1 min-h-12 rounded-xl border border-brand-cream-dark bg-white text-brand-green font-semibold"
                      >
                        Back
                      </button>
                    )}
                    {step < STEPS.length - 1 ? (
                      <button
                        type="button"
                        disabled={!canNext()}
                        onClick={goNext}
                        className="flex-1 min-h-12 rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-40 shadow-sm"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={submitting || !breakdown || !termsAccepted}
                        onClick={handlePay}
                        className="flex-1 min-h-12 rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-60 shadow-sm"
                      >
                        {submitting
                          ? 'Redirecting to Yoco…'
                          : breakdown
                            ? `Pay ${formatZar(breakdown.grand_total_cents)}`
                            : 'Pay with Yoco'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {stickySummary && liveBreakdown && (
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-green/55">
                    Live total
                  </p>
                  <PriceSummary
                    breakdown={
                      selectedVehicle && selectedTour
                        ? calculatePrice(
                            selectedTour,
                            selectedVehicle,
                            peopleCount,
                            0
                          )
                        : liveBreakdown
                    }
                    tourName={selectedTour?.name}
                    vehicleName={selectedVehicle?.name}
                    variant="compact"
                  />
                  {selectedTour && !selectedVehicle && (
                    <p className="text-xs text-brand-green/60">
                      {formatTourFromPrice(selectedTour)} before vehicle
                    </p>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      {showMobileBar && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-brand-cream-dark bg-brand-cream/95 backdrop-blur px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <div className="max-w-5xl mx-auto flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep((s) => s - 1)
                }}
                className="min-h-12 px-4 rounded-xl border border-brand-cream-dark bg-white text-brand-green font-semibold shrink-0"
              >
                Back
              </button>
            )}
            <div className="flex-1 min-w-0">
              {liveBreakdown || breakdown ? (
                <p className="text-xs text-brand-green/70 leading-tight">
                  Total
                </p>
              ) : (
                <p className="text-xs text-brand-green/70 leading-tight">
                  {STEPS[step]}
                </p>
              )}
              <p className="font-bold text-brand-green tabular-nums text-base truncate">
                {breakdown
                  ? formatZar(breakdown.grand_total_cents)
                  : liveBreakdown
                    ? formatZar(liveBreakdown.grand_total_cents)
                    : selectedTour
                      ? formatTourFromPrice(selectedTour, vehicles)
                      : '—'}
              </p>
            </div>
            <button
              type="button"
              disabled={primaryDisabled}
              onClick={onPrimary}
              className="min-h-12 px-5 rounded-xl bg-brand-green text-brand-cream font-semibold disabled:opacity-40 shadow-sm shrink-0"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      )}

      <Footer />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-brand-green/70">{label}</span>
      <span className="font-medium text-brand-green text-right">{value}</span>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-brand-green mb-2">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full min-h-12 rounded-xl border border-brand-cream-dark bg-white px-3"
      />
    </label>
  )
}
