import { useCallback, useEffect, useState } from 'react'
import {
  fetchAdminBusiness,
  patchAdminBusiness,
  type BusinessSettings,
} from '../../../lib/bookingApi'
import { cardClass, inputClass, labelClass } from '../adminShared'

type Discount = NonNullable<BusinessSettings['discounts']>[number]

type Props = { pin: string }

const emptyDiscount = (): Discount => ({
  id: crypto.randomUUID(),
  code: '',
  type: 'percent',
  value: 0,
  active: true,
})

export default function DiscountsTab({ pin }: Props) {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminBusiness(pin, 'settings')
      const settings = (data.settings as BusinessSettings) || {}
      setDiscounts(Array.isArray(settings.discounts) ? settings.discounts : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load discounts')
    } finally {
      setLoading(false)
    }
  }, [pin])

  useEffect(() => {
    load()
  }, [load])

  const update = (index: number, patch: Partial<Discount>) => {
    setDiscounts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await patchAdminBusiness(pin, {
        resource: 'settings',
        action: 'update_settings',
        settings: { discounts },
      })
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-brand-green/70">Loading discounts…</p>
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Discounts saved.
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-brand-green">Discount codes</h2>
        <button
          type="button"
          onClick={() => setDiscounts((d) => [...d, emptyDiscount()])}
          className="rounded-lg bg-brand-gold/90 px-3 py-2 text-sm font-semibold text-brand-green"
        >
          Add discount
        </button>
      </div>

      {discounts.length === 0 && (
        <p className="text-sm text-brand-green/70">No discounts yet.</p>
      )}

      {discounts.map((d, i) => (
        <div key={d.id} className={cardClass}>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={labelClass}>
              Code
              <input
                className={inputClass}
                value={d.code}
                onChange={(e) => update(i, { code: e.target.value.toUpperCase() })}
              />
            </label>
            <label className={labelClass}>
              Type
              <select
                className={inputClass}
                value={d.type}
                onChange={(e) =>
                  update(i, { type: e.target.value as 'percent' | 'fixed' })
                }
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed (cents)</option>
              </select>
            </label>
            <label className={labelClass}>
              Value {d.type === 'percent' ? '(%)' : '(cents)'}
              <input
                type="number"
                min={0}
                className={inputClass}
                value={d.value}
                onChange={(e) => update(i, { value: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2 text-brand-green">
              <input
                type="checkbox"
                checked={d.active}
                onChange={(e) => update(i, { active: e.target.checked })}
              />
              Active
            </label>
          </div>
          <button
            type="button"
            className="text-xs underline text-red-800"
            onClick={() => setDiscounts((prev) => prev.filter((_, idx) => idx !== i))}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save discounts'}
      </button>
    </div>
  )
}
