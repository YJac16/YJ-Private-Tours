import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { whatsappWithMessage } from '../lib/whatsappLinks'

const TOUR_OPTIONS = [
  { value: '', label: 'Select a tour...' },
  { value: 'Cape Peninsula Experience', label: 'Cape Peninsula Experience' },
  { value: 'Cape Town City & Culture Experience', label: 'Cape Town City & Culture Experience' },
  { value: 'Halal-Friendly Winelands Experience', label: 'Halal-Friendly Winelands Experience' },
  { value: 'Ocean Sunset Experience', label: 'Ocean Sunset Experience' },
  { value: 'Other / Not sure yet', label: 'Other / Not sure yet' },
]

/**
 * WhatsApp-based enquiry form (no server endpoint).
 * Prefer the floating WhatsApp button or /book for conversion; this component
 * can be mounted on a page if a structured enquiry section is needed.
 */
export default function ContactEnquiry() {
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    tourInterest: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!form.tourInterest) {
      setError('Please select a tour interest.')
      return
    }

    const lines = [
      `Hello KhayrCape — enquiry from the website.`,
      `Name: ${form.name.trim()}`,
      form.email.trim() ? `Email: ${form.email.trim()}` : null,
      form.phone.trim() ? `Phone: ${form.phone.trim()}` : null,
      `Tour interest: ${form.tourInterest}`,
      form.message.trim() ? `Message: ${form.message.trim()}` : null,
    ].filter(Boolean)

    window.open(whatsappWithMessage(lines.join('\n')), '_blank', 'noopener,noreferrer')
  }

  return (
    <section id="enquiry" className="py-16 md:py-24 bg-brand-cream px-4 scroll-mt-20">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-4 text-center">
          Contact / Enquiry
        </h2>
        <p className="text-brand-green/90 text-center mb-4">
          Prefer WhatsApp? Fill in a few details and we&apos;ll open a pre-filled message for you.
        </p>
        <p className="text-brand-green/80 text-center text-sm mb-10">
          Or{' '}
          <Link to="/book" className="underline font-semibold text-brand-green">
            book online
          </Link>{' '}
          for instant availability and secure payment.
        </p>
        <form
          onSubmit={handleSubmit}
          className="bg-brand-cream-light rounded-xl shadow-md border border-brand-cream-dark p-6 md:p-8 space-y-5"
        >
          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <label className="block text-sm text-brand-green">
            Name *
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3 bg-white"
            />
          </label>
          <label className="block text-sm text-brand-green">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3 bg-white"
            />
          </label>
          <label className="block text-sm text-brand-green">
            Phone
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3 bg-white"
            />
          </label>
          <label className="block text-sm text-brand-green">
            Tour interest *
            <select
              name="tourInterest"
              required
              value={form.tourInterest}
              onChange={handleChange}
              className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3 bg-white"
            >
              {TOUR_OPTIONS.map((opt) => (
                <option key={opt.value || 'empty'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-brand-green">
            Message
            <textarea
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-brand-cream-dark px-3 py-2 bg-white"
            />
          </label>
          <p className="text-xs text-brand-green/70">
            By continuing you acknowledge our{' '}
            <Link to="/privacy" className="underline font-medium">
              Privacy Policy
            </Link>
            . Your message opens in WhatsApp — no form data is stored on this website.
          </p>
          <button
            type="submit"
            className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold hover:opacity-95"
          >
            Continue on WhatsApp
          </button>
        </form>
      </div>
    </section>
  )
}
