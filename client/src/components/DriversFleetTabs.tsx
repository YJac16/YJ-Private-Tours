import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiOutlineUser, HiOutlineTruck, HiOutlineMap } from 'react-icons/hi'
import { whatsappWithMessage } from '../lib/whatsappLinks'
import { useCatalog } from '../hooks/useCatalog'
import PriceWithInfo from './PriceWithInfo'
import { isDateInSeason, WHALE_SEASON } from '../lib/seasonalVisibility'

const DRIVER_CHAT_ME = whatsappWithMessage(
  "Hi Yaseen, I'd like to chat with you about booking a tour."
)

type TabId = 'tours' | 'drivers' | 'fleet'

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'tours', label: 'Tours', icon: <HiOutlineMap className="text-lg" /> },
  { id: 'drivers', label: 'Drivers', icon: <HiOutlineUser className="text-lg" /> },
  { id: 'fleet', label: 'Fleet', icon: <HiOutlineTruck className="text-lg" /> },
]

type TimeSlotTour = {
  image: string
  title: string
  tourSlug: string
  timeBadge?: string
  limitedTag?: string
  duration: string
  bullets: string[]
  bookPath: string
  seasonal?: boolean
  promoTitle?: string
  smallPrint?: string
}

const timeSlotTours: TimeSlotTour[] = [
  {
    image: '/chapmans-peak.jpg',
    title: 'Hermanus Whale Experience',
    tourSlug: 'hermanus',
    timeBadge: '🐋 WHALE SEASON',
    duration: 'Full Day · 8–10 hours',
    bullets: [
      'Private journey from Cape Town',
      'Land-based whale-season viewing',
      'Qualified local guide',
    ],
    bookPath: '/book?tour=hermanus',
    seasonal: true,
    promoTitle: 'Whale Season Is Here',
    smallPrint:
      'Boat tour not included. Boat enquiries can be assisted with separately and are subject to external operator availability, weather and sea conditions. Whale sightings cannot be guaranteed.',
  },
  {
    image: '/bo-kaap.jpg',
    title: 'Cape Town City & Culture Experience',
    tourSlug: 'city',
    timeBadge: '08:00 Start',
    duration: '3–4 hours',
    bullets: ['Bo-Kaap', 'city highlights', 'viewpoints', 'optional coffee stop'],
    bookPath: '/book?tour=city&time=08:00',
  },
  {
    image: '/cape-point.jpg',
    title: 'Cape Peninsula Highlights (Express)',
    tourSlug: 'peninsula',
    timeBadge: '12:30 Start',
    duration: '3.5–4.5 hours',
    bullets: ["Chapman's Peak", 'Cape Point', 'Penguins'],
    bookPath: '/book?tour=peninsula&time=12:30',
  },
  {
    image: '/campsbay.JPG',
    title: 'Ocean Sunset Experience',
    tourSlug: 'sunset',
    timeBadge: '16:30 Start — MOST POPULAR',
    duration: '2–3 hours',
    bullets: ['Atlantic Seaboard', 'Camps Bay', 'sunset viewpoints'],
    bookPath: '/book?tour=sunset&time=16:30',
  },
  {
    image: '/winelands.jpg',
    title: 'Halal-Friendly Winelands Experience',
    tourSlug: 'winelands',
    limitedTag: 'Limited Availability',
    duration: '5–6 hours',
    bullets: [
      'Scenic winelands',
      'halal-friendly stops',
      'flexible pace for your group',
    ],
    bookPath: '/book?tour=winelands',
  },
]

const fleetVehicles = [
  {
    name: 'Suzuki XL6',
    vehicleKey: 'suzuki',
    image: '/Suzuki XL6.jpg',
    subtitle: 'Spacious Comfort for Families',
    intro:
      'The Suzuki XL6 is the ideal people mover for families or small groups who want space, comfort, and reliability while exploring the Western Cape.',
    features: [
      'Seats up to 5 passengers comfortably',
      'Ample luggage space for airport transfers or day tours',
      'Smooth, comfortable ride for long scenic drives',
      'Perfect for family holidays, Cape Peninsula tours & Winelands trips',
    ],
    tagline: 'A practical and comfortable choice for relaxed family adventures.',
  },
  {
    name: 'Toyota Corolla Cross GR Sport',
    vehicleKey: 'corolla',
    image: '/Toyota Corolla Cross.jpg',
    subtitle: 'Sporty Comfort with a Personal Touch',
    intro:
      'For couples or small groups seeking a more personal and stylish travel experience, the Corolla Cross GR Sport offers sporty elegance with everyday comfort.',
    features: [
      'Ideal for up to 3 passengers',
      'Modern, sleek design with a dynamic presence',
      'Comfortable interior for private tours',
      'Great for Winelands, city tours & romantic scenic drives',
    ],
    tagline:
      'Perfect for guests who want comfort with a slightly more exclusive feel.',
  },
  {
    name: 'Mercedes-Benz GLC 220 Coupe',
    vehicleKey: 'mercedes',
    image: '/Mercedes Benz.png',
    subtitle: 'Premium Experience',
    intro:
      'Experience the Western Cape in refined luxury with our Mercedes-Benz GLC 220 Coupe — designed for guests who appreciate comfort, class, and exclusivity.',
    features: [
      'Accommodates up to 3 passengers',
      'Premium comfort and refined travel',
      'Smooth, powerful, and quiet ride',
      'Ideal for executive travel, honeymoon tours & VIP transfers',
    ],
    tagline: 'The perfect vehicle for clients seeking a first-class touring experience.',
    premium: true,
  },
]

function tabFromHash(hash: string): TabId | null {
  const id = hash.replace(/^#/, '') as TabId
  if (id === 'tours' || id === 'drivers' || id === 'fleet') return id
  return null
}

export default function DriversFleetTabs() {
  const location = useLocation()
  const { catalog, tourBySlug, loading: pricingLoading } = useCatalog()
  const catalogVehicles = catalog?.vehicles ?? []
  const hashTab = tabFromHash(location.hash)
  const [pickedTab, setPickedTab] = useState<TabId | null>(null)
  const activeTab = hashTab ?? pickedTab ?? 'tours'
  const whaleSeasonOpen = useMemo(() => isDateInSeason(new Date(), WHALE_SEASON), [])

  const visibleTours = useMemo(
    () =>
      timeSlotTours.filter((t) => {
        if (t.seasonal && !whaleSeasonOpen) return false
        if (t.tourSlug === 'hermanus' && !tourBySlug('hermanus') && !pricingLoading) {
          return whaleSeasonOpen
        }
        return true
      }),
    [whaleSeasonOpen, tourBySlug, pricingLoading]
  )

  const selectTab = (id: TabId) => {
    setPickedTab(id)
    const next = `/#${id}`
    if (`${location.pathname}${location.hash}` !== next) {
      window.history.replaceState(null, '', next)
    }
  }

  return (
    <section
      id="tours-drivers-fleet"
      className="py-10 md:py-24 bg-brand-cream-light px-4 scroll-mt-28 md:scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-green mb-3 text-center leading-tight">
          Tours, Drivers & Fleet
        </h2>
        <p className="text-brand-green/90 text-center mb-8 md:mb-10 max-w-2xl mx-auto text-sm sm:text-base leading-snug">
          Meet your guide, see our vehicles, and explore tour options below.
        </p>

        <div
          className="flex flex-wrap justify-center gap-2 mb-8 md:mb-10"
          role="tablist"
          aria-label="Tours, drivers, and fleet"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => selectTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg font-medium transition-colors min-h-11 ${
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

        {activeTab === 'tours' && (
          <div id="tours-panel" className="space-y-5 max-w-xl mx-auto md:max-w-none">
            <div className="text-center md:max-w-2xl md:mx-auto mb-2">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-green">
                Choose Your Experience
              </h3>
              <p className="text-brand-green/90 text-sm sm:text-base mt-2 leading-snug">
                View details online, then book your private experience.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 md:max-w-4xl md:mx-auto">
              {visibleTours.map((tour) => {
                const catalogTour = tourBySlug(tour.tourSlug)
                return (
                  <article
                    key={tour.title}
                    className="bg-brand-cream rounded-xl shadow-md overflow-hidden border border-brand-cream-dark flex flex-col"
                  >
                    <div className="aspect-16/10 sm:aspect-4/3 overflow-hidden bg-brand-cream-dark/30">
                      <img
                        src={tour.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 sm:p-5 flex-1 flex flex-col gap-2">
                      {tour.promoTitle && (
                        <p className="text-xs sm:text-sm font-bold tracking-wide uppercase text-brand-green">
                          {tour.promoTitle}
                        </p>
                      )}
                      {tour.timeBadge && (
                        <p className="text-xs sm:text-sm font-bold text-brand-green bg-brand-gold/30 inline-block self-start px-2 py-1 rounded-md">
                          {tour.timeBadge}
                        </p>
                      )}
                      {tour.limitedTag && (
                        <p className="text-xs sm:text-sm font-bold text-amber-900 bg-amber-100 inline-block self-start px-2 py-1 rounded-md">
                          {tour.limitedTag}
                        </p>
                      )}
                      <h3 className="text-lg sm:text-xl font-bold text-brand-green leading-snug">
                        {tour.title}
                      </h3>
                      <p className="text-sm text-brand-green/85">{tour.duration}</p>
                      {catalogTour ? (
                        <PriceWithInfo
                          tour={catalogTour}
                          vehicles={catalogVehicles}
                          compact
                        />
                      ) : pricingLoading ? (
                        <p className="text-sm font-semibold text-brand-green">
                          Loading rates…
                        </p>
                      ) : null}
                      <p className="text-sm text-brand-green/90 leading-snug">
                        {tour.bullets.join(' · ')}
                      </p>
                      {tour.smallPrint && (
                        <p className="text-[11px] text-brand-green/70 leading-snug">
                          {tour.smallPrint}
                        </p>
                      )}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Link
                          to={`/experience/${tour.tourSlug}`}
                          className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-4 py-3.5 border-2 border-brand-gold text-brand-green hover:bg-brand-gold/10 font-semibold rounded-lg transition-colors text-sm sm:text-base shadow-sm"
                        >
                          Explore Experience
                        </Link>
                        <Link
                          to={tour.bookPath}
                          className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-4 py-3.5 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-lg transition-colors text-sm sm:text-base shadow-sm"
                        >
                          Book Online
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="bg-brand-cream rounded-xl shadow-md border border-brand-cream-dark overflow-hidden max-w-xl mx-auto md:max-w-none">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-4/5 md:aspect-auto md:min-h-80 bg-brand-cream-dark/30">
                <img
                  src="/driver-yaseen.JPG"
                  alt="Yaseen — Your guide"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-center gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-brand-green leading-snug">
                    Meet Your Private Cape Town Guide
                  </h3>
                  <p className="text-brand-gold font-semibold mt-1">Yaseen</p>
                  {catalog?.guide_registration_number && (
                    <p className="mt-2 inline-flex text-xs font-semibold text-brand-green bg-brand-gold/25 border border-brand-gold/40 rounded-md px-2 py-1">
                      Registered guide · {catalog.guide_registration_number}
                    </p>
                  )}
                </div>
                <p className="text-sm sm:text-base text-brand-green/90 leading-relaxed">
                  Registered professional tourist guide offering private, flexible
                  experiences across Cape Town and the Western Cape — with
                  family-friendly and Muslim-friendly service.
                </p>
                <a
                  href={DRIVER_CHAT_ME}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center min-h-12 px-5 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-lg transition-colors self-start"
                >
                  Chat with Yaseen
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {fleetVehicles.map((v) => (
              <article
                key={v.vehicleKey}
                className="bg-brand-cream rounded-xl shadow-md overflow-hidden border border-brand-cream-dark flex flex-col"
              >
                <div className="aspect-16/10 overflow-hidden bg-brand-cream-dark/30">
                  <img src={v.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-4 sm:p-5 flex-1 flex flex-col gap-2">
                  {'premium' in v && v.premium ? (
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-gold">
                      Premium Experience
                    </p>
                  ) : null}
                  <h3 className="text-lg font-bold text-brand-green">{v.name}</h3>
                  <p className="text-sm font-semibold text-brand-green/80">
                    {v.subtitle}
                  </p>
                  <p className="text-sm text-brand-green/90 leading-snug">{v.intro}</p>
                  <ul className="text-sm text-brand-green/85 space-y-1 mt-1">
                    {v.features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-brand-green/70 mt-auto pt-2 italic">
                    {v.tagline}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
