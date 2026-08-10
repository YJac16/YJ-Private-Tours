import { type FormEvent, useEffect, useState } from 'react'

type ConsentFormData = {
  id: string
  version: string
  title: string
  body_html: string
}

type Props = {
  form: ConsentFormData
  accessToken: string
  defaultName?: string
  defaultEmail?: string
  defaultPhone?: string
  onSigned: () => void
  compact?: boolean
}

export default function InformedConsentForm({
  form,
  accessToken,
  defaultName = '',
  defaultEmail = '',
  defaultPhone = '',
  onSigned,
  compact = false,
}: Props) {
  const [fullName, setFullName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState(defaultPhone)
  const [signature, setSignature] = useState('')
  const [emergency, setEmergency] = useState('')
  const [medical, setMedical] = useState('')
  const [ack, setAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFullName(defaultName)
    setEmail(defaultEmail)
    setPhone(defaultPhone)
  }, [defaultName, defaultEmail, defaultPhone])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/account-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          signature_text: signature.trim(),
          acknowledgements: ack,
          emergency_contact: emergency.trim() || null,
          medical_notes: medical.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || 'Could not save consent'
        )
      }
      onSigned()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save consent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`space-y-4 ${
        compact
          ? ''
          : 'bg-brand-cream border border-brand-cream-dark rounded-2xl p-5 shadow-sm'
      }`}
    >
      <div>
        <h3 className="text-lg font-bold text-brand-green">{form.title}</h3>
        <p className="text-xs text-brand-green/70 mt-1">Version {form.version}</p>
      </div>
      <div
        className="max-h-56 overflow-y-auto rounded-xl border border-brand-cream-dark bg-white px-3 py-3 text-sm text-brand-green/90 leading-relaxed prose-p:mb-2"
        dangerouslySetInnerHTML={{ __html: form.body_html }}
      />
      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      <label className="block text-sm text-brand-green">
        Full name
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full min-h-11 rounded-lg border border-brand-cream-dark px-3"
          required
        />
      </label>
      <label className="block text-sm text-brand-green">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full min-h-11 rounded-lg border border-brand-cream-dark px-3"
          required
        />
      </label>
      <label className="block text-sm text-brand-green">
        Phone
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full min-h-11 rounded-lg border border-brand-cream-dark px-3"
        />
      </label>
      <label className="block text-sm text-brand-green">
        Emergency contact (optional)
        <input
          value={emergency}
          onChange={(e) => setEmergency(e.target.value)}
          className="mt-1 w-full min-h-11 rounded-lg border border-brand-cream-dark px-3"
        />
      </label>
      <label className="block text-sm text-brand-green">
        Medical notes (optional)
        <textarea
          value={medical}
          onChange={(e) => setMedical(e.target.value)}
          className="mt-1 w-full min-h-20 rounded-lg border border-brand-cream-dark px-3 py-2"
        />
      </label>
      <label className="block text-sm text-brand-green">
        Type your full name as signature
        <input
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          className="mt-1 w-full min-h-11 rounded-lg border border-brand-cream-dark px-3"
          required
          placeholder={fullName || 'Your full name'}
        />
      </label>
      <label className="flex items-start gap-2 text-sm text-brand-green">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-1"
          required
        />
        <span>
          I have read and understand this informed consent form, including
          risks of injury and that wildlife sightings and third-party boat
          activities are not guaranteed or included unless separately arranged.
        </span>
      </label>
      <button
        type="submit"
        disabled={submitting || !ack}
        className="min-h-12 px-5 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Sign informed consent'}
      </button>
    </form>
  )
}
