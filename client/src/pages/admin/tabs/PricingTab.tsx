import { useState, type Dispatch, type SetStateAction } from 'react'
import {
  saveAdminPricing,
  type Tour,
  type Vehicle,
} from '../../../lib/bookingApi'
import { formatZar, type BookingSettings } from '../../../lib/pricing'
import {
  cardClass,
  centsToRands,
  getAdminMeta,
  inputClass,
  labelClass,
  mergeAdminMeta,
  randsToCents,
} from '../adminShared'

type Props = {
  pin: string
  tours: Tour[]
  vehicles: Vehicle[]
  settings: BookingSettings
  setTours: Dispatch<SetStateAction<Tour[]>>
  setVehicles: Dispatch<SetStateAction<Vehicle[]>>
  setSettings: Dispatch<SetStateAction<BookingSettings>>
  onSaved: () => void
}

export default function PricingTab({
  pin,
  tours,
  vehicles,
  settings,
  setTours,
  setVehicles,
  setSettings,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedTours = [...tours].sort((a, b) => {
    const ao = getAdminMeta(a).display_order ?? 999
    const bo = getAdminMeta(b).display_order ?? 999
    return ao - bo
  })

  const updateTour = (id: string, patch: Partial<Tour>) => {
    setTours((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const updateMeta = (tour: Tour, patch: Parameters<typeof mergeAdminMeta>[1]) => {
    updateTour(tour.id, { admin_meta: mergeAdminMeta(tour, patch) })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = await saveAdminPricing(pin, {
        tours: tours.map((t) => ({
          id: t.id,
          price_per_person_cents: t.price_per_person_cents,
          base_price_cents: t.base_price_cents,
          max_guests: t.max_guests,
          duration_label: t.duration_label ?? null,
          admin_meta: getAdminMeta(t),
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
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
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
        <label className={labelClass}>
          Default max guests
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
            className={inputClass}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-brand-green">Tours</h2>
        {sortedTours.map((t) => {
          const meta = getAdminMeta(t)
          return (
            <div key={t.id} className={cardClass}>
              <p className="font-semibold text-brand-green">{t.name}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className={labelClass}>
                  Duration label
                  <input
                    type="text"
                    value={t.duration_label ?? ''}
                    onChange={(e) =>
                      updateTour(t.id, { duration_label: e.target.value || null })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Base price (R)
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={centsToRands(t.base_price_cents || 0)}
                    onChange={(e) =>
                      updateTour(t.id, {
                        base_price_cents: randsToCents(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Price per person (R)
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={centsToRands(t.price_per_person_cents || 0)}
                    onChange={(e) =>
                      updateTour(t.id, {
                        price_per_person_cents: randsToCents(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Weekend price (R)
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={centsToRands(meta.weekend_price_cents || 0)}
                    onChange={(e) =>
                      updateMeta(t, {
                        weekend_price_cents: randsToCents(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Holiday price (R)
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={centsToRands(meta.holiday_price_cents || 0)}
                    onChange={(e) =>
                      updateMeta(t, {
                        holiday_price_cents: randsToCents(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Peak price (R)
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={centsToRands(meta.peak_price_cents || 0)}
                    onChange={(e) =>
                      updateMeta(t, {
                        peak_price_cents: randsToCents(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Additional hour (R)
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={centsToRands(meta.additional_hour_price_cents || 0)}
                    onChange={(e) =>
                      updateMeta(t, {
                        additional_hour_price_cents: randsToCents(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Min guests
                  <input
                    type="number"
                    min={1}
                    value={meta.min_guests ?? ''}
                    onChange={(e) =>
                      updateMeta(t, {
                        min_guests: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Max guests
                  <input
                    type="number"
                    min={1}
                    value={t.max_guests ?? ''}
                    onChange={(e) =>
                      updateTour(t.id, {
                        max_guests: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Recommended vehicle
                  <select
                    className={inputClass}
                    value={meta.recommended_vehicle_id ?? ''}
                    onChange={(e) =>
                      updateMeta(t, {
                        recommended_vehicle_id: e.target.value || null,
                      })
                    }
                  >
                    <option value="">— None —</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Display order
                  <input
                    type="number"
                    value={meta.display_order ?? 0}
                    onChange={(e) =>
                      updateMeta(t, {
                        display_order: Number(e.target.value) || 0,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  Status
                  <select
                    className={inputClass}
                    value={meta.status ?? 'active'}
                    onChange={(e) =>
                      updateMeta(t, {
                        status: e.target.value as 'active' | 'draft' | 'hidden',
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </label>
              </div>
              <p className="text-xs text-brand-green/70">
                Formula: Vehicle fee + (per person × guests). Example 3 guests with
                R2,500 vehicle:{' '}
                {formatZar(250000 + 3 * (t.price_per_person_cents || 0))}
              </p>
            </div>
          )
        })}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-brand-green">Vehicles</h2>
        {vehicles.map((v, i) => (
          <div key={v.id} className={cardClass}>
            <p className="font-semibold text-brand-green">{v.name}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className={labelClass}>
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
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
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
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
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
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
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
                  className={inputClass}
                />
              </label>
              <label className="flex items-center gap-2 text-sm self-end pb-2 sm:col-span-2 text-brand-green">
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
        className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save pricing'}
      </button>
    </div>
  )
}
