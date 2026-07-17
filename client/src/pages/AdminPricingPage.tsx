import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  fetchAdminPricing,
  saveAdminPricing,
  type Tour,
  type Vehicle,
} from '../lib/bookingApi'
import type { BookingSettings } from '../lib/pricing'
import { formatZar } from '../lib/pricing'

const PIN_KEY = 'yj_admin_pin'

function centsToRands(cents: number) {
  return (cents / 100).toString()
}

function randsToCents(rands: string) {
  const n = parseFloat(rands.replace(/,/g, ''))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

export default function AdminPricingPage() {
  const [pin, setPin] = useState(() => sessionStorage.getItem(PIN_KEY) || '')
  const [pinInput, setPinInput] = useState('')
  const [tours, setTours] = useState<Tour[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [settings, setSettings] = useState<BookingSettings>({
    max_guests_default: 5,
    allow_larger_groups: false,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const unlock = (value: string) => {
    sessionStorage.setItem(PIN_KEY, value)
    setPin(value)
  }

  const load = async (activePin: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminPricing(activePin)
      setTours(data.tours)
      setVehicles(data.vehicles)
      setSettings(data.settings)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pricing')
      if (String(e).includes('Unauthorized')) {
        sessionStorage.removeItem(PIN_KEY)
        setPin('')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pin) load(pin)
  }, [pin])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const data = await saveAdminPricing(pin, {
        tours: tours.map((t) => ({
          id: t.id,
          price_per_person_cents: t.price_per_person_cents,
          max_guests: t.max_guests,
        })),
        vehicles: vehicles.map((v) => ({
          id: v.id,
          capacity_min: v.capacity_min,
          capacity_max: v.capacity_max,
          vehicle_price_cents: v.vehicle_price_cents,
          luggage_capacity: v.luggage_capacity,
          is_luxury: v.is_luxury,
        })),
        settings,
      })
      setTours(data.tours)
      setVehicles(data.vehicles)
      setSettings(data.settings)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

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
              Pricing admin
            </h1>
            <p className="text-sm text-brand-green/85 text-center">
              Enter your admin PIN to edit tour and vehicle pricing.
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
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-8 pb-24">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-brand-green">Pricing admin</h1>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(PIN_KEY)
                setPin('')
              }}
              className="text-sm underline text-brand-green/80"
            >
              Lock
            </button>
          </div>
          <p className="text-sm text-brand-green/85">
            Changes apply immediately on the booking page — no code deploy needed.
          </p>

          {loading && <p className="text-sm text-brand-green/70">Loading…</p>}
          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-sm text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Pricing saved.
            </p>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-brand-green">Booking limits</h2>
            <label className="flex items-center gap-3 text-sm text-brand-green">
              <input
                type="checkbox"
                checked={settings.allow_larger_groups}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    allow_larger_groups: e.target.checked,
                  }))
                }
              />
              Allow larger groups (use per-tour max below)
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-brand-green">Default max guests</span>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.max_guests_default}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    max_guests_default: Number(e.target.value) || 5,
                  }))
                }
                className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-cream-dark bg-brand-cream px-3"
              />
            </label>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-brand-green">Tours</h2>
            {tours.map((t, i) => (
              <div
                key={t.id}
                className="bg-brand-cream border border-brand-cream-dark rounded-xl p-4 space-y-3"
              >
                <p className="font-semibold text-brand-green">{t.name}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-sm block">
                    Price per person (R)
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={centsToRands(t.price_per_person_cents || 0)}
                      onChange={(e) => {
                        const next = [...tours]
                        next[i] = {
                          ...t,
                          price_per_person_cents: randsToCents(e.target.value),
                        }
                        setTours(next)
                      }}
                      className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-cream-dark px-3"
                    />
                  </label>
                  <label className="text-sm block">
                    Max guests (optional)
                    <input
                      type="number"
                      min={1}
                      value={t.max_guests ?? ''}
                      onChange={(e) => {
                        const next = [...tours]
                        next[i] = {
                          ...t,
                          max_guests: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }
                        setTours(next)
                      }}
                      className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-cream-dark px-3"
                    />
                  </label>
                </div>
                <p className="text-xs text-brand-green/70">
                  Formula: Vehicle fee + (per person × guests). Example 3 guests with
                  R2,500 vehicle:{' '}
                  {formatZar(250000 + 3 * (t.price_per_person_cents || 0))}
                </p>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-brand-green">Vehicles</h2>
            {vehicles.map((v, i) => (
              <div
                key={v.id}
                className="bg-brand-cream border border-brand-cream-dark rounded-xl p-4 space-y-3"
              >
                <p className="font-semibold text-brand-green">{v.name}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-sm block">
                    Min capacity
                    <input
                      type="number"
                      min={1}
                      value={v.capacity_min}
                      onChange={(e) => {
                        const next = [...vehicles]
                        next[i] = { ...v, capacity_min: Number(e.target.value) || 1 }
                        setVehicles(next)
                      }}
                      className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-cream-dark px-3"
                    />
                  </label>
                  <label className="text-sm block">
                    Max capacity
                    <input
                      type="number"
                      min={1}
                      value={v.capacity_max}
                      onChange={(e) => {
                        const next = [...vehicles]
                        next[i] = { ...v, capacity_max: Number(e.target.value) || 1 }
                        setVehicles(next)
                      }}
                      className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-cream-dark px-3"
                    />
                  </label>
                  <label className="text-sm block">
                    Vehicle fee (R)
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={centsToRands(v.vehicle_price_cents || 0)}
                      onChange={(e) => {
                        const next = [...vehicles]
                        next[i] = {
                          ...v,
                          vehicle_price_cents: randsToCents(e.target.value),
                        }
                        setVehicles(next)
                      }}
                      className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-cream-dark px-3"
                    />
                  </label>
                  <label className="text-sm block">
                    Luggage capacity
                    <input
                      type="number"
                      min={0}
                      value={v.luggage_capacity ?? 2}
                      onChange={(e) => {
                        const next = [...vehicles]
                        next[i] = {
                          ...v,
                          luggage_capacity: Number(e.target.value) || 0,
                        }
                        setVehicles(next)
                      }}
                      className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-cream-dark px-3"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm self-end pb-2 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={v.is_luxury}
                      onChange={(e) => {
                        const next = [...vehicles]
                        next[i] = { ...v, is_luxury: e.target.checked }
                        setVehicles(next)
                      }}
                    />
                    Luxury (manual selection only)
                  </label>
                </div>
              </div>
            ))}
          </section>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full min-h-[48px] rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save all pricing'}
          </button>

          <p className="text-center text-sm">
            <Link to="/driver" className="text-brand-green underline">
              Driver schedule
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
