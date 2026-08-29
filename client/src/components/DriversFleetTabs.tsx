import { useEffect, useMemo, useState } from 'react'
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
  const activeTab = pickedTab ?? hashTab ?? 'tours'

  useEffect(() => {
    if (hashTab) setPickedTab(hashTab)
  }, [hashTab])
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
      className="py-20 md:py-28 bg-brand-cream-light px-4 scroll-mt-28 md:scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-brand-green mb-3 text-center leading-tight">
          Tours, Drivers &amp; Fleet
        </h2>
        <p className="text-brand-green/90 text-center mb-8 md:mb-10 max-w-2xl mx-auto text-sm sm:text-base leading-snug">
          Meet your guide, see our vehicles, and explore tour options below.
        </p>

        <div
          className="flex flex-wrap justify-center gap-2 mb-10 md:mb-12"
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
              className={`inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl font-medium transition-colors min-h-11 ${
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
          <div id="tours-panel" className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-semibold text-brand-green">
                Choose Your Experience
              </h3>
              <p className="text-brand-green/90 text-sm sm:text-base mt-2 leading-snug">
                View details online, then book your private experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {visibleTours.map((tour) => {
                const catalogTour = tourBySlug(tour.tourSlug)
                return (
                  <article
                    key={tour.title}
                    className="group bg-brand-cream rounded-2xl shadow-md overflow-hidden border border-brand-cream-dark flex flex-col"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-brand-green-dark">
                      <img
                        src={tour.image}
                        alt={tour.title}
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2">
                        {tour.timeBadge && (
                          <p className="text-xs font-semibold text-brand-green bg-brand-gold px-2.5 py-1 rounded-full shadow-sm">
                            {tour.timeBadge}
                          </p>
                        )}
                        {tour.limitedTag && (
                          <p className="text-xs font-semibold text-amber-950 bg-amber-100 px-2.5 py-1 rounded-full shadow-sm">
                            {tour.limitedTag}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 bg-brand-green-dark">
                      <p className="text-sm font-medium text-brand-cream pt-0.5">
                        {tour.duration}
                      </p>
                      {catalogTour ? (
                        <PriceWithInfo
                          tour={catalogTour}
                          vehicles={catalogVehicles}
                          compact
                          showVehicleNote={false}
                          tone="onDark"
                        />
                      ) : pricingLoading ? (
                        <p className="text-sm font-semibold text-brand-cream">
                          Loading rates…
                        </p>
                      ) : null}
                    </div>
                    <div className="p-5 flex-1 flex flex-col gap-2">
                      {tour.promoTitle && (
                        <p className="text-xs font-semibold tracking-wide uppercase text-brand-gold">
                          {tour.promoTitle}
                        </p>
                      )}
                      <h3 className="font-serif text-lg sm:text-xl font-semibold text-brand-green leading-snug">
                        {tour.title}
                      </h3>
                      <p className="text-sm text-brand-green/85 leading-snug">
                        {tour.bullets.join(' · ')}
                      </p>
                      {tour.smallPrint && (
                        <p className="text-[11px] text-brand-green/70 leading-snug">
                          {tour.smallPrint}
                        </p>
                      )}
                      <div className="mt-auto pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Link
                          to={`/experience/${tour.tourSlug}`}
                          className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-4 py-3 border border-brand-gold text-brand-green hover:bg-brand-gold/10 font-semibold rounded-2xl transition-colors text-sm shadow-sm"
                        >
                          Explore
                        </Link>
                        <Link
                          to={tour.bookPath}
                          className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-4 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-2xl transition-colors text-sm shadow-sm"
                        >
                          Book
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
          <div className="bg-brand-cream rounded-2xl shadow-md border border-brand-cream-dark overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-[4/5] md:aspect-auto md:min-h-80 bg-brand-green-dark">
                <img
                  src="/driver-yaseen.JPG"
                  alt="Yaseen — Your guide"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-5 sm:p-8 md:p-10 flex flex-col justify-center gap-4">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-brand-green leading-snug">
                    Meet Your Private Cape Town Guide
                  </h3>
                  <p className="text-brand-gold font-semibold mt-1">Yaseen</p>
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
                  className="inline-flex items-center justify-center min-h-12 px-5 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-2xl transition-colors self-start"
                >
                  Chat with Yaseen
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {fleetVehicles.map((v) => (
              <article
                key={v.vehicleKey}
                className="bg-brand-cream rounded-2xl shadow-md overflow-hidden border border-brand-cream-dark flex flex-col"
              >
                <div className="aspect-[16/9] overflow-hidden bg-brand-green-dark">
                  <img
                    src={v.image}
                    alt={v.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col gap-2">
                  {'premium' in v && v.premium ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
                      Premium Experience
                    </p>
                  ) : null}
                  <h3 className="font-serif text-lg font-semibold text-brand-green">
                    {v.name}
                  </h3>
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
