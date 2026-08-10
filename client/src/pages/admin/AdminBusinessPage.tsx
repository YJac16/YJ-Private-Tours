import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { RequireAuth } from '../../components/RequireAuth'
import { useAuth } from '../../lib/auth'
import {
  fetchAdminPricing,
  type Tour,
  type Vehicle,
} from '../../lib/bookingApi'
import type { BookingSettings } from '../../lib/pricing'
import { ADMIN_TABS, type AdminTabId } from './adminShared'
import PricingTab from './tabs/PricingTab'
import TemplatesTab from './tabs/TemplatesTab'
import QuotesTab from './tabs/QuotesTab'
import InvoicesTab from './tabs/InvoicesTab'
import DiscountsTab from './tabs/DiscountsTab'
import ContentTab from './tabs/ContentTab'
import PdfTemplatesTab from './tabs/PdfTemplatesTab'
import ReportsTab from './tabs/ReportsTab'
import SettingsTab from './tabs/SettingsTab'
import DriversTab from './tabs/DriversTab'
import TripsTab from './tabs/TripsTab'
import CalendarTab from './tabs/CalendarTab'
import CustomersTab from './tabs/CustomersTab'

function AdminBusinessInner() {
  const { accessToken, signOut } = useAuth()
  const pin = accessToken || ''
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

  const load = async (credential: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminPricing(credential)
      setTours(data.tours)
      setVehicles(data.vehicles)
      setSettings(data.settings)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pricing')
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
              onClick={() => signOut()}
              className="text-sm underline text-brand-green/80"
            >
              Sign out
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
              {activeTab === 'drivers' && <DriversTab token={pin} />}
              {activeTab === 'trips' && <TripsTab token={pin} />}
              {activeTab === 'calendar' && (
                <CalendarTab
                  token={pin}
                  onOpenTrips={() => setActiveTab('trips')}
                />
              )}
              {activeTab === 'customers' && <CustomersTab token={pin} />}
              {activeTab === 'settings' && <SettingsTab pin={pin} />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function AdminBusinessPage() {
  return (
    <RequireAuth roles={['admin']}>
      <AdminBusinessInner />
    </RequireAuth>
  )
}
