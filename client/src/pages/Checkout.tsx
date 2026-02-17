import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { HiOutlineCreditCard, HiOutlineUser, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { tours } from '../data/tours'

const apiUrl = import.meta.env.VITE_API_URL || '/api'

export default function Checkout() {
  const { tourId } = useParams<{ tourId: string }>()
  const tour = tours.find((t) => t.id === tourId)

  const [cancelled, setCancelled] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCancelled(params.get('cancelled') === '1')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tour) return
    if (!form.name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!form.email.trim()) {
      setError('Please enter your email.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiUrl}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: tour.priceAmountCents,
          tourId: tour.id,
          tourTitle: tour.title,
          customerName: form.name.trim(),
          customerEmail: form.email.trim(),
          customerPhone: form.phone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Could not start payment.')
        setLoading(false)
        return
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }
      setError('Invalid response from server.')
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  if (!tour) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-green mb-4">Tour not found</h1>
            <Link to="/" className="text-brand-green underline">Back to tours</Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-cream">
        <div className="max-w-lg mx-auto px-4 py-8 md:py-12">
          <Link to={`/tour/${tour.id}`} className="inline-flex text-brand-green hover:underline text-sm mb-6">
            ← Back to tour
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold text-brand-green mb-2">Checkout</h1>
          <p className="text-brand-green/80 mb-6">{tour.title}</p>

          {cancelled && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              Payment was cancelled. You can try again below or contact us to book via WhatsApp.
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md border border-brand-cream-dark/20 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-brand-green/80">Total</span>
              <span className="text-xl font-bold text-brand-green">{tour.price}</span>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-brand-green mb-1">
                  Full name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-green/50 w-5 h-5" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-brand-cream-dark/30 rounded-lg focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                    placeholder="Your name"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brand-green mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-green/50 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-brand-cream-dark/30 rounded-lg focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-brand-green mb-1">
                  Phone (optional)
                </label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-green/50 w-5 h-5" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-brand-cream-dark/30 rounded-lg focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                    placeholder="+27 ..."
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-brand-green hover:bg-brand-green-dark disabled:opacity-70 disabled:cursor-not-allowed text-brand-cream font-medium rounded-lg transition-colors shadow-lg"
              >
                <HiOutlineCreditCard className="w-6 h-6" />
                {loading ? 'Redirecting to payment…' : 'Pay with Yoco'}
              </button>
            </form>
          </div>

          <p className="text-center text-brand-green/70 text-sm">
            You will be redirected to Yoco to pay securely. We do not store your card details.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
