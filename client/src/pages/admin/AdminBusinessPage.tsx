import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import {
  fetchAdminPricing,
  type Tour,
  type Vehicle,
} from '../../lib/bookingApi'
import type { BookingSettings } from '../../lib/pricing'
import {
  ADMIN_PIN_KEY,
  ADMIN_TABS,
  type AdminTabId,
  inputClass,
} from './adminShared'
import PricingTab from './tabs/PricingTab'
import TemplatesTab from './tabs/TemplatesTab'
import QuotesTab from './tabs/QuotesTab'
import InvoicesTab from './tabs/InvoicesTab'
import DiscountsTab from './tabs/DiscountsTab'
import ContentTab from './tabs/ContentTab'
import PdfTemplatesTab from './tabs/PdfTemplatesTab'
import ReportsTab from './tabs/ReportsTab'
import SettingsTab from './tabs/SettingsTab'

export default function AdminBusinessPage() {
  const [pin, setPin] = useState(() => sessionStorage.getItem(ADMIN_PIN_KEY) || '')
  const [pinInput, setPinInput] = useState('')
  const [activeTab, setActiveTab] = useState<AdminTabId>('pricing')
  const [tours, setTours] = useState<Tour[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [settings, setSettings] = useState<BookingSettings>({
    max_guests_default: 5,
    allow_larger_groups: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const unlock = (value: string) => {
    sessionStorage.setItem(ADMIN_PIN_KEY, value)
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
        sessionStorage.removeItem(ADMIN_PIN_KEY)
        setPin('')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pin) load(pin)
  }, [pin])

  const onSaved = () => {
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 2500)
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
              Pricing & Business Management
            </h1>
            <p className="text-sm text-brand-green/85 text-center">
              Enter your admin PIN to manage pricing, quotes, invoices, and
              experience content.
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN"
              className={inputClass}
              autoFocus
            />
            <button
              type="submit"
              className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold"
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
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-brand-green">
                Pricing & Business Management
              </h1>
              <p className="text-sm text-brand-green/80">
                Khayr Cape Experiences · cream / olive / gold
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(ADMIN_PIN_KEY)
                setPin('')
              }}
              className="text-sm underline text-brand-green/80"
            >
              Lock
            </button>
          </div>

          {loading && (
            <p className="text-sm text-brand-green/70 mb-4">Loading…</p>
          )}
          {error && (
            <p className="mb-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {savedFlash && (
            <p className="mb-4 text-sm text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Changes saved.
            </p>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <aside className="md:w-56 shrink-0">
              <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                {ADMIN_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? 'bg-brand-green text-brand-cream'
                        : 'bg-brand-cream border border-brand-cream-dark text-brand-green hover:border-brand-gold'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <p className="mt-4 hidden md:block text-sm">
                <Link to="/driver" className="text-brand-green underline">
                  Driver schedule
                </Link>
              </p>
            </aside>

            <div className="flex-1 min-w-0">
              {activeTab === 'pricing' && (
                <PricingTab
                  pin={pin}
                  tours={tours}
                  vehicles={vehicles}
                  settings={settings}
                  setTours={setTours}
                  setVehicles={setVehicles}
                  setSettings={setSettings}
                  onSaved={onSaved}
                />
              )}
              {activeTab === 'templates' && (
                <TemplatesTab
                  pin={pin}
                  tours={tours}
                  setTours={setTours}
                  onSaved={onSaved}
                />
              )}
              {activeTab === 'quotes' && (
                <QuotesTab pin={pin} tours={tours} vehicles={vehicles} />
              )}
              {activeTab === 'invoices' && <InvoicesTab pin={pin} />}
              {activeTab === 'discounts' && <DiscountsTab pin={pin} />}
              {activeTab === 'content' && (
                <ContentTab
                  pin={pin}
                  tours={tours}
                  setTours={setTours}
                  onSaved={onSaved}
                />
              )}
              {activeTab === 'pdf' && <PdfTemplatesTab pin={pin} />}
              {activeTab === 'reports' && <ReportsTab pin={pin} />}
              {activeTab === 'settings' && <SettingsTab pin={pin} />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
