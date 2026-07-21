import { useCallback, useEffect, useState } from 'react'
import {
  fetchAdminBusiness,
  patchAdminBusiness,
  type BusinessSettings,
} from '../../../lib/bookingApi'
import { cardClass, inputClass, labelClass } from '../adminShared'

type PdfTemplate = {
  header?: string
  footer?: string
  terms?: string
  logo_url?: string
  colours?: { cream?: string; green?: string; gold?: string }
}

type Props = { pin: string }

const TEMPLATE_KEYS = [
  'quotation',
  'invoice',
  'receipt',
  'travel_pack',
  'driver_pack',
] as const

const emptyTemplate = (): PdfTemplate => ({
  header: '',
  footer: '',
  terms: '',
  logo_url: '',
  colours: { cream: '#F5F0E8', green: '#46533D', gold: '#C4A35A' },
})

export default function PdfTemplatesTab({ pin }: Props) {
  const [templates, setTemplates] = useState<Record<string, PdfTemplate>>({})
  const [activeKey, setActiveKey] = useState<string>(TEMPLATE_KEYS[0])
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
      const existing = settings.pdf_templates || {}
      const next: Record<string, PdfTemplate> = {}
      for (const key of TEMPLATE_KEYS) {
        next[key] = { ...emptyTemplate(), ...(existing[key] || {}) }
      }
      setTemplates(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load PDF templates')
    } finally {
      setLoading(false)
    }
  }, [pin])

  useEffect(() => {
    load()
  }, [load])

  const current = templates[activeKey] || emptyTemplate()

  const update = (patch: Partial<PdfTemplate>) => {
    setTemplates((prev) => ({
      ...prev,
      [activeKey]: { ...prev[activeKey], ...patch },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await patchAdminBusiness(pin, {
        resource: 'settings',
        action: 'update_settings',
        settings: { pdf_templates: templates },
      })
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-brand-green/70">Loading PDF templates…</p>
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
          PDF templates saved.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {TEMPLATE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveKey(key)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              activeKey === key
                ? 'bg-brand-green text-brand-cream'
                : 'bg-brand-cream border border-brand-cream-dark text-brand-green'
            }`}
          >
            {key.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className={cardClass}>
        <h2 className="text-lg font-bold text-brand-green capitalize">
          {activeKey.replace('_', ' ')} template
        </h2>
        <label className={labelClass}>
          Header
          <textarea
            rows={2}
            className={`${inputClass} py-2`}
            value={current.header ?? ''}
            onChange={(e) => update({ header: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          Footer
          <textarea
            rows={2}
            className={`${inputClass} py-2`}
            value={current.footer ?? ''}
            onChange={(e) => update({ footer: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          Terms
          <textarea
            rows={4}
            className={`${inputClass} py-2`}
            value={current.terms ?? ''}
            onChange={(e) => update({ terms: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          Logo URL
          <input
            className={inputClass}
            value={current.logo_url ?? ''}
            onChange={(e) => update({ logo_url: e.target.value })}
          />
        </label>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className={labelClass}>
            Cream
            <input
              className={inputClass}
              value={current.colours?.cream ?? ''}
              onChange={(e) =>
                update({
                  colours: { ...current.colours, cream: e.target.value },
                })
              }
            />
          </label>
          <label className={labelClass}>
            Green
            <input
              className={inputClass}
              value={current.colours?.green ?? ''}
              onChange={(e) =>
                update({
                  colours: { ...current.colours, green: e.target.value },
                })
              }
            />
          </label>
          <label className={labelClass}>
            Gold
            <input
              className={inputClass}
              value={current.colours?.gold ?? ''}
              onChange={(e) =>
                update({
                  colours: { ...current.colours, gold: e.target.value },
                })
              }
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save PDF templates'}
      </button>
    </div>
  )
}
