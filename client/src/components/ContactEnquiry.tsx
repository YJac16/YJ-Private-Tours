import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const TOUR_OPTIONS = [
  { value: '', label: 'Select a tour...' },
  { value: 'cape-peninsula', label: 'Cape Peninsula Private Tour (Half-Day)' },
  { value: 'bo-kaap', label: 'Bo-Kaap & Cultural Heritage Tour' },
  { value: 'winelands', label: 'Cape Winelands Tour (Halal-friendly options)' },
  { value: 'other', label: 'Other / Not sure yet' },
]

export default function ContactEnquiry() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    tourInterest: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!form.email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (!form.tourInterest) {
      setError('Please select a tour interest.')
      return
    }

    setLoading(true)
    try {
      // In dev, Vite proxy forwards /api to backend; in prod use full API URL via env
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      await axios.post(`${apiUrl}/enquiry`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        tourInterest: form.tourInterest,
        message: form.message.trim() || undefined,
      })
      navigate('/thank-you')
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Something went wrong. Please try again or contact us on WhatsApp.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="enquiry" className="py-16 md:py-24 bg-brand-cream px-4 scroll-mt-20">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-4 text-center">
          Contact / Enquiry
        </h2>
        <p className="text-brand-green/90 text-center mb-10">
          Send us a message and we’ll get back to you as soon as we can.
        </p>
        <form onSubmit={handleSubmit} className="bg-brand-cream-light rounded-xl shadow-md border border-brand-cream-dark p-6 md:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-brand-green mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-brand-cream-dark bg-brand-cream focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none text-brand-green placeholder:text-brand-green/50"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-green mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-brand-cream-dark bg-brand-cream focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none text-brand-green placeholder:text-brand-green/50"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-brand-green mb-1">
              Phone <span className="text-brand-green/60">(optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-brand-cream-dark bg-brand-cream focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none text-brand-green placeholder:text-brand-green/50"
              placeholder="+27..."
            />
          </div>
          <div>
            <label htmlFor="tourInterest" className="block text-sm font-medium text-brand-green mb-1">
              Tour interest <span className="text-red-500">*</span>
            </label>
            <select
              id="tourInterest"
              name="tourInterest"
              required
              value={form.tourInterest}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-brand-cream-dark bg-brand-cream focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none text-brand-green"
            >
              {TOUR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-brand-green mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-brand-cream-dark bg-brand-cream focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none resize-none text-brand-green placeholder:text-brand-green/50"
              placeholder="Tell us your dates, group size, or any questions..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-green hover:bg-brand-green-dark disabled:bg-brand-green/60 text-brand-cream font-medium rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Submit Enquiry'}
          </button>
        </form>
      </div>
    </section>
  )
}
