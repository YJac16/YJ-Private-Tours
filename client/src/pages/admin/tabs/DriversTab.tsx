import { type FormEvent, useCallback, useEffect, useState } from 'react'
import {
  adminCreateDriver,
  adminListDrivers,
  adminUpdateDriver,
  type DriverProfile,
} from '../../../lib/authApi'
import { cardClass, inputClass, labelClass } from '../adminShared'

type Props = { token: string }

const emptyForm = () => ({
  full_name: '',
  photo_url: '',
  languages: 'English',
  years_experience: '0',
  bio: '',
  is_active: true,
  invite_email: '',
  invite_password: '',
})

export default function DriversTab({ token }: Props) {
  const [drivers, setDrivers] = useState<DriverProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminListDrivers(token)
      setDrivers(data.drivers)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const startEdit = (d: DriverProfile) => {
    setEditingId(d.id)
    setForm({
      full_name: d.full_name || d.name || '',
      photo_url: d.photo_url || '',
      languages: (d.languages || []).join(', '),
      years_experience: String(d.years_experience ?? 0),
      bio: d.bio || '',
      is_active: d.is_active,
      invite_email: '',
      invite_password: '',
    })
    setSaved(false)
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const payload: Record<string, unknown> = {
        full_name: form.full_name.trim(),
        photo_url: form.photo_url.trim() || null,
        languages: form.languages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        years_experience: Number(form.years_experience) || 0,
        bio: form.bio.trim() || null,
        is_active: form.is_active,
      }
      if (editingId) {
        await adminUpdateDriver(token, { id: editingId, ...payload })
      } else {
        if (form.invite_email.trim()) {
          payload.invite_email = form.invite_email.trim()
          payload.invite_password = form.invite_password
        }
        await adminCreateDriver(token, payload)
      }
      setSaved(true)
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-brand-green/70">Loading drivers…</p>
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
          Driver saved.
        </p>
      )}

      <form onSubmit={onSubmit} className={cardClass}>
        <h2 className="text-lg font-bold text-brand-green">
          {editingId ? 'Edit driver' : 'Add driver'}
        </h2>
        <label className={labelClass}>
          Full name
          <input
            className={inputClass}
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            required
          />
        </label>
        <label className={labelClass}>
          Photo URL
          <input
            className={inputClass}
            value={form.photo_url}
            onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))}
          />
        </label>
        <label className={labelClass}>
          Languages (comma-separated)
          <input
            className={inputClass}
            value={form.languages}
            onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
          />
        </label>
        <label className={labelClass}>
          Years experience
          <input
            type="number"
            min={0}
            className={inputClass}
            value={form.years_experience}
            onChange={(e) =>
              setForm((f) => ({ ...f, years_experience: e.target.value }))
            }
          />
        </label>
        <label className={labelClass}>
          Bio
          <textarea
            className={`${inputClass} py-2 min-h-20`}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-green">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_active: e.target.checked }))
            }
          />
          Active
        </label>

        {!editingId && (
          <div className="border-t border-brand-cream-dark pt-3 space-y-3">
            <p className="text-sm font-semibold text-brand-green">
              Optional login invite
            </p>
            <label className={labelClass}>
              Invite email
              <input
                type="email"
                className={inputClass}
                value={form.invite_email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invite_email: e.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              Invite password
              <input
                type="password"
                className={inputClass}
                value={form.invite_password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invite_password: e.target.value }))
                }
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 px-4 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : editingId ? 'Update driver' : 'Create driver'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="min-h-11 px-4 rounded-lg border border-brand-cream-dark text-brand-green"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-brand-green">All drivers</h2>
        {drivers.length === 0 ? (
          <p className="text-sm text-brand-green/70">No drivers yet.</p>
        ) : (
          <ul className="space-y-3">
            {drivers.map((d) => (
              <li key={d.id} className={cardClass}>
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-green">
                      {d.full_name || d.name}
                    </p>
                    <p className="text-xs text-brand-green/70">
                      {(d.languages || []).join(', ') || '—'} ·{' '}
                      {d.years_experience ?? 0} yrs ·{' '}
                      {d.is_active ? 'Active' : 'Inactive'}
                      {d.user_id ? ' · linked login' : ''}
                    </p>
                    {d.bio && (
                      <p className="text-sm text-brand-green/80 mt-1">{d.bio}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(d)}
                    className="text-sm text-brand-green underline min-h-11"
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
