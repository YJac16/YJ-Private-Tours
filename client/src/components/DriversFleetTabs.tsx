import { useState, useEffect } from 'react'
import { HiOutlineUser, HiOutlineTruck, HiOutlineMap } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { whatsappWithMessage } from '../lib/whatsappLinks'

const BOOK_WHATSAPP_URL = whatsappWithMessage(
  "Hi, I'd like to book with KhayrCape Experiences."
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
  timeBadge?: string
  limitedTag?: string
  duration: string
  price: string
  bullets: string[]
  buttonText: string
  whatsappPrefill: string
}

const timeSlotTours: TimeSlotTour[] = [
  {
    image: '/bo-kaap.jpg',
    title: 'Cape Town City & Culture Experience',
    timeBadge: '08:00 Start',
    duration: '3–4 hours',
    price: 'From R1500',
    bullets: ['Bo-Kaap', 'city highlights', 'viewpoints', 'optional coffee stop'],
    buttonText: 'Book 08:00 via WhatsApp',
    whatsappPrefill: "Hi, I'd like to book the 08:00 City & Culture tour",
  },
  {
    image: '/cape-point.jpg',
    title: 'Cape Peninsula Highlights (Express)',
    timeBadge: '12:30 Start',
    duration: '3.5–4.5 hours',
    price: 'From R2800',
    bullets: ["Chapman's Peak", 'Cape Point', 'Penguins'],
    buttonText: 'Book 12:30 via WhatsApp',
    whatsappPrefill: "Hi, I'd like to book the 12:30 Peninsula tour",
  },
  {
    image: '/campsbay.JPG',
    title: 'Ocean Sunset Experience',
    timeBadge: '16:30 Start — MOST POPULAR',
    duration: '2–3 hours',
    price: 'From R1800',
    bullets: ['Atlantic Seaboard', 'Camps Bay', 'sunset viewpoints'],
    buttonText: 'Book Sunset via WhatsApp',
    whatsappPrefill: "Hi, I'd like to book the Sunset tour",
  },
  {
    image: '/winelands.jpg',
    title: 'Halal-Friendly Winelands Experience',
    limitedTag: 'Limited Availability',
    duration: '5–6 hours',
    price: 'From R4000',
    bullets: [
      'Scenic winelands',
      'halal-friendly stops',
      'flexible pace for your group',
    ],
    buttonText: 'Check Availability on WhatsApp',
    whatsappPrefill:
      "Hi, I'd like to check availability for the Winelands tour",
  },
]

const fleetVehicles = [
  {
    name: 'Suzuki XL6',
    image: '/Suzuki XL6.jpg',
    subtitle: 'Spacious Comfort for Families',
    intro: 'The Suzuki XL6 is the ideal people mover for families or small groups who want space, comfort, and reliability while exploring the Western Cape.',
    features: [
      'Seats up to 5 passengers comfortably',
      'Ample luggage space for airport transfers or day tours',
      'Smooth, comfortable ride for long scenic drives',
      'Perfect for family holidays, Cape Peninsula tours & Winelands trips',
    ],
    tagline: 'A practical and comfortable choice for relaxed family adventures.',
  },
  {
    name: 'Toyota Corolla Cross GR',
    image: '/Toyota Corolla Cross.jpg',
    subtitle: 'Sporty Comfort with a Personal Touch',
    intro: 'For couples or small groups seeking a more personal and stylish travel experience, the Corolla Cross GR offers sporty elegance with everyday comfort.',
    features: [
      'Ideal for up to 3 passengers',
      'Modern, sleek design with a dynamic presence',
      'Comfortable interior for private tours',
      'Great for Winelands, city tours & romantic scenic drives',
    ],
    tagline: 'Perfect for guests who want comfort with a slightly more exclusive feel.',
  },
  {
    name: 'Mercedes-Benz GLC 250 Coupe (Black)',
    image: '/Mercedes Benz.png',
    subtitle: 'Premium Luxury Experience',
    intro: 'Experience the Western Cape in refined luxury with our black Mercedes-Benz GLC 250 Coupe — designed for guests who appreciate comfort, class, and exclusivity.',
    features: [
      'Accommodates up to 3 passengers',
      'Premium leather interior',
      'Smooth, powerful, and quiet ride',
      'Ideal for executive travel, honeymoon tours & VIP transfers',
    ],
    tagline: 'The perfect vehicle for clients seeking a first-class touring experience.',
  },
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
    <section id="tours-drivers-fleet" className="py-10 md:py-24 bg-brand-cream-light px-4 scroll-mt-20">
      <span id="tours" className="block -mt-24 pt-24" aria-hidden />
      <span id="drivers" className="block -mt-24 pt-24" aria-hidden />
      <span id="fleet" className="block -mt-24 pt-24" aria-hidden />
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-green mb-3 text-center leading-tight">
          Tours, Drivers & Fleet
        </h2>
        <p className="text-brand-green/90 text-center mb-8 md:mb-10 max-w-2xl mx-auto text-sm sm:text-base leading-snug">
          Meet your guide, see our vehicles, and explore tour options below.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
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
                Choose Your Time & Experience
              </h3>
              <p className="text-brand-green/90 text-sm sm:text-base mt-2 leading-snug">
                Pick a time slot and message to check availability.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 md:max-w-4xl md:mx-auto">
              {timeSlotTours.map((tour) => (
                <article
                  key={tour.title}
                  className="bg-brand-cream rounded-xl shadow-md overflow-hidden border border-brand-cream-dark flex flex-col"
                >
                  <div className="aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-brand-cream-dark/30">
                    <img
                      src={tour.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 sm:p-5 flex-1 flex flex-col gap-2">
                    {tour.timeBadge && (
                      <p className="text-xs sm:text-sm font-bold text-brand-green bg-brand-cream-dark/40 inline-block self-start px-2 py-1 rounded-md">
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
                    <p className="text-sm text-brand-green/85">
                      {tour.duration} · <span className="font-semibold">{tour.price}</span>
                    </p>
                    <ul className="text-sm text-brand-green/90 space-y-1 leading-snug">
                      {tour.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="text-brand-green shrink-0" aria-hidden>
                            •
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={whatsappWithMessage(tour.whatsappPrefill)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-lg transition-colors text-sm sm:text-base shadow-sm"
                    >
                      <FaWhatsapp className="text-xl flex-shrink-0" />
                      {tour.buttonText}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="bg-brand-cream rounded-xl shadow-md border border-brand-cream-dark overflow-hidden max-w-xl mx-auto md:max-w-none">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-[4/5] md:aspect-auto md:min-h-[320px] bg-brand-cream-dark/30">
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
                  <p className="text-brand-green/85 font-medium text-sm sm:text-base mt-2 leading-snug">
                    Local, reliable, and focused on giving you a flexible, comfortable experience.
                  </p>
                </div>
                <p className="text-brand-green/90 text-sm sm:text-base leading-relaxed">
                  Hi, I&apos;m Yaseen, a local Cape Town guide. I specialise in private, flexible
                  tours designed around your time, interests, and pace. Whether you&apos;re
                  travelling as a couple, family, or solo, I&apos;ll make sure your experience is
                  smooth, safe, and memorable.
                </p>
                <a
                  href={BOOK_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3.5 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-lg transition-colors w-full md:w-fit shadow-sm"
                >
                  <FaWhatsapp className="text-xl" />
                  Book — +27 82 327 7446
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="space-y-5 md:space-y-8">
            <div className="text-center md:max-w-2xl md:mx-auto">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-green">
                Choose Your Vehicle
              </h3>
              <p className="text-brand-green/90 text-sm sm:text-base mt-2 leading-snug">
                Comfortable, reliable options for different group sizes and preferences.
              </p>
            </div>
            {fleetVehicles.map((vehicle) => (
              <div
                key={vehicle.name}
                className="bg-brand-cream rounded-xl shadow-md border border-brand-cream-dark overflow-hidden flex flex-col md:flex-row max-w-xl mx-auto md:max-w-none"
              >
                <div className="md:w-1/2 aspect-video md:aspect-auto md:min-h-[280px] bg-brand-cream-dark/30">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-center md:w-1/2 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-brand-green">{vehicle.name}</h3>
                  <p className="text-brand-green/80 font-medium text-sm">{vehicle.subtitle}</p>
                  <p className="text-brand-green/90 text-sm leading-snug">{vehicle.intro}</p>
                  <ul className="space-y-1 text-brand-green/90 text-sm leading-snug">
                    {vehicle.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-brand-green shrink-0" aria-hidden>✔</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-brand-green/80 text-sm italic pt-1">{vehicle.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
