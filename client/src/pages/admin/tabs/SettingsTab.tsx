import { useCallback, useEffect, useState } from 'react'
import {
  fetchAdminBusiness,
  patchAdminBusiness,
  type BusinessSettings,
} from '../../../lib/bookingApi'
import { cardClass, inputClass, labelClass } from '../adminShared'

type Props = { pin: string }

const defaultSettings = (): BusinessSettings => ({
  company_name: 'Khayr Cape Experiences',
  logo_url: '',
  email: '',
  whatsapp: '',
  website: '',
  social: { instagram: '', facebook: '' },
  prefixes: {
    quote: 'KCE-Q',
    booking: 'KCE-B',
    invoice: 'KCE-INV',
    receipt: 'KCE-R',
  },
  currency: 'ZAR',
  vat_percent: 0,
  business_hours: '',
})

export default function SettingsTab({ pin }: Props) {
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminBusiness(pin, 'settings')
      const remote = (data.settings as BusinessSettings) || {}
      setSettings({ ...defaultSettings(), ...remote, prefixes: {
        ...defaultSettings().prefixes,
        ...(remote.prefixes || {}),
      }, social: {
        ...defaultSettings().social,
        ...(remote.social || {}),
      } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [pin])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await patchAdminBusiness(pin, {
        resource: 'settings',
        action: 'update_settings',
        settings,
      })
      if (res.settings) {
        setSettings({ ...defaultSettings(), ...(res.settings as BusinessSettings) })
      }
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-brand-green/70">Loading settings…</p>
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
          Settings saved.
        </p>
      )}

      <div className={cardClass}>
        <h2 className="text-lg font-bold text-brand-green">Company details</h2>
        <label className={labelClass}>
          Company name
          <input
            className={inputClass}
            value={settings.company_name ?? ''}
            onChange={(e) =>
              setSettings((s) => ({ ...s, company_name: e.target.value }))
            }
          />
        </label>
        <label className={labelClass}>
          Logo URL
          <input
            className={inputClass}
            value={settings.logo_url ?? ''}
            onChange={(e) =>
              setSettings((s) => ({ ...s, logo_url: e.target.value }))
            }
          />
        </label>
        <label className={labelClass}>
          Email
          <input
            type="email"
            className={inputClass}
            value={settings.email ?? ''}
            onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
          />
        </label>
        <label className={labelClass}>
          WhatsApp
          <input
            className={inputClass}
            value={settings.whatsapp ?? ''}
            onChange={(e) =>
              setSettings((s) => ({ ...s, whatsapp: e.target.value }))
            }
            placeholder="Include country code"
          />
        </label>
        <label className={labelClass}>
          Website
          <input
            className={inputClass}
            value={settings.website ?? ''}
            onChange={(e) =>
              setSettings((s) => ({ ...s, website: e.target.value }))
            }
          />
        </label>
        <label className={labelClass}>
          Business hours
          <textarea
            rows={2}
            className={`${inputClass} py-2`}
            value={settings.business_hours ?? ''}
            onChange={(e) =>
              setSettings((s) => ({ ...s, business_hours: e.target.value }))
            }
          />
        </label>
        <label className={labelClass}>
          Registered guide number
          <input
            className={inputClass}
            value={settings.guide_registration_number ?? ''}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                guide_registration_number: e.target.value,
              }))
            }
            placeholder="e.g. WC1234 — shown on site when set"
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={labelClass}>
            Currency
            <input
              className={inputClass}
              value={settings.currency ?? 'ZAR'}
              onChange={(e) =>
                setSettings((s) => ({ ...s, currency: e.target.value }))
              }
            />
          </label>
          <label className={labelClass}>
            VAT %
            <input
              type="number"
              min={0}
              step={0.1}
              className={inputClass}
              value={settings.vat_percent ?? 0}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  vat_percent: Number(e.target.value) || 0,
                }))
              }
            />
          </label>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-lg font-bold text-brand-green">Document prefixes</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {(['quote', 'booking', 'invoice', 'receipt'] as const).map((key) => (
            <label key={key} className={labelClass}>
              {key}
              <input
                className={inputClass}
                value={settings.prefixes?.[key] ?? ''}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    prefixes: { ...s.prefixes, [key]: e.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-lg font-bold text-brand-green">Social</h2>
        <label className={labelClass}>
          Instagram
          <input
            className={inputClass}
            value={settings.social?.instagram ?? ''}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                social: { ...s.social, instagram: e.target.value },
              }))
            }
          />
        </label>
        <label className={labelClass}>
          Facebook
          <input
            className={inputClass}
            value={settings.social?.facebook ?? ''}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                social: { ...s.social, facebook: e.target.value },
              }))
            }
          />
        </label>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  )
}
