import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineUser, HiOutlineTruck, HiOutlineMap, HiOutlineClock } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { tours } from '../data/tours'

const BOOK_WHATSAPP_URL = 'https://wa.link/d96tsl'

type TabId = 'tours' | 'drivers' | 'fleet'

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'tours', label: 'Tours', icon: <HiOutlineMap className="text-lg" /> },
  { id: 'drivers', label: 'Drivers', icon: <HiOutlineUser className="text-lg" /> },
  { id: 'fleet', label: 'Fleet', icon: <HiOutlineTruck className="text-lg" /> },
]

const fleetVehicles = [
  { name: 'Suzuki XL6', image: '/Suzuki XL6.jpg', description: 'Spacious and comfortable for families and small groups.' },
  { name: 'Toyota Corolla Cross', image: '/Toyota Corolla Cross.jpg', description: 'Reliable and comfortable for your journey.' },
]

export default function DriversFleetTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('tours')

  useEffect(() => {
    const hash = window.location.hash.slice(1) as TabId | ''
    if (hash === 'drivers' || hash === 'fleet') setActiveTab(hash)
    else if (hash === 'tours') setActiveTab('tours')
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1) as TabId | ''
      if (hash === 'drivers' || hash === 'fleet' || hash === 'tours') setActiveTab(hash as TabId)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <section id="tours-drivers-fleet" className="py-16 md:py-24 bg-brand-cream-light px-4 scroll-mt-20">
      <span id="tours" className="block -mt-24 pt-24" aria-hidden />
      <span id="drivers" className="block -mt-24 pt-24" aria-hidden />
      <span id="fleet" className="block -mt-24 pt-24" aria-hidden />
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-4 text-center">
          Tours, Drivers & Fleet
        </h2>
        <p className="text-brand-green/90 text-center mb-10 max-w-2xl mx-auto">
          Meet your guide, see our vehicles, and explore tour options below.
        </p>

        {/* Tab buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-green text-brand-cream shadow-md'
                  : 'bg-brand-cream text-brand-green hover:bg-brand-cream-dark/50 border border-brand-cream-dark'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tours tab: all tour packages */}
        {activeTab === 'tours' && (
          <div id="tours-panel" className="space-y-8">
            <p className="text-brand-green/90 text-center max-w-2xl mx-auto">
              All tours are private and tailored to your pace and interests.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tours.map((tour) => (
                <article
                  key={tour.id}
                  className="bg-brand-cream rounded-xl shadow-md overflow-hidden border border-brand-cream-dark hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-brand-cream-dark/30">
                    <img
                      src={tour.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-brand-green mb-2">
                      {tour.title}
                    </h3>
                    <p className="text-brand-green/90 mb-4 flex-1 text-sm">
                      {tour.briefDescription}
                    </p>
                    <p className="flex items-center gap-2 text-brand-green/80 text-sm mb-4">
                      <HiOutlineClock className="text-lg flex-shrink-0" />
                      {tour.duration}
                    </p>
                    <Link
                      to={`/tour/${tour.id}`}
                      className="block w-full text-center px-4 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-lg transition-colors shadow-md ring-2 ring-brand-green/30"
                    >
                      View details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="bg-brand-cream rounded-xl shadow-md border border-brand-cream-dark overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-[4/5] md:aspect-auto md:min-h-[320px] bg-brand-cream-dark/30">
                <img
                  src="/driver-yaseen.JPG"
                  alt="Yaseen â€” Your guide"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-brand-green mb-2">Yaseen</h3>
                <p className="text-brand-green/90 mb-4">
                  Your qualified local guide for private tours of Cape Town and the Western Cape.
                  Thoughtful, culturally sensitive, and focused on giving you a relaxed and memorable experience.
                </p>
                <a
                  href={BOOK_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 justify-center px-4 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-lg transition-colors w-fit"
                >
                  <FaWhatsapp className="text-xl" />
                  Book â€” +27 82 327 7446
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="space-y-6">
            {fleetVehicles.map((vehicle) => (
              <div
                key={vehicle.name}
                className="bg-brand-cream rounded-xl shadow-md border border-brand-cream-dark overflow-hidden flex flex-col md:flex-row"
              >
                <div className="md:w-1/2 aspect-video md:aspect-auto md:min-h-[240px] bg-brand-cream-dark/30">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center md:w-1/2">
                  <h3 className="text-xl font-bold text-brand-green mb-2">{vehicle.name}</h3>
                  <p className="text-brand-green/90">{vehicle.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
