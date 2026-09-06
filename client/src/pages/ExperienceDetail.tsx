import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineUserGroup,
  HiOutlineBadgeCheck,
  HiOutlineTruck,
  HiOutlineHome,
  HiOutlineAdjustments,
  HiOutlineCamera,
  HiOutlineLightBulb,
  HiOutlineGift,
  HiOutlineChevronDown,
  HiOutlineMap,
} from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PriceWithInfo from '../components/PriceWithInfo'
import { useCatalog } from '../hooks/useCatalog'
import CatalogLoadError from '../components/CatalogLoadError'
import { resolveExperienceContent } from '../lib/resolveExperience'
import {
  EXPERIENCE_DEFAULTS,
  getDefaultExperience,
  mergeExperienceContent,
} from '../data/experienceDefaults'
import {
  DEFAULT_HIGHLIGHTS,
  HERMANUS_HIGHLIGHTS,
  type ExperienceContent,
} from '../lib/experienceTypes'
import {
  formatSeasonLabel,
  isDateInSeason,
  isTourPubliclyVisible,
  WHALE_SEASON,
} from '../lib/seasonalVisibility'
import { whatsappWithMessage } from '../lib/whatsappLinks'
import type { Vehicle } from '../lib/bookingApi'

const HIGHLIGHT_ICONS = [
  HiOutlineBadgeCheck,
  HiOutlineUserGroup,
  HiOutlineTruck,
  HiOutlineHome,
  HiOutlineAdjustments,
  HiOutlineCamera,
  HiOutlineLightBulb,
  HiOutlineGift,
] as const

const HERMANUS_VEHICLE_CARDS = [
  {
    slug: 'suzuki',
    image: '/Suzuki XL6.jpg',
    fallbackName: 'Suzuki XL6',
    capacityLabel: 'Up to 5 guests',
    premium: false,
  },
  {
    slug: 'corolla',
    image: '/Toyota Corolla Cross.jpg',
    fallbackName: 'Toyota Corolla Cross GR Sport',
    capacityLabel: 'Up to 3 guests',
    premium: false,
  },
  {
    slug: 'mercedes',
    image: '/Mercedes Benz.png',
    fallbackName: 'Mercedes-Benz GLC 220 Coupe',
    capacityLabel: 'Up to 3 guests · Premium Experience',
    premium: true,
  },
] as const

function findCatalogVehicle(
  vehicles: Vehicle[],
  slugKey: string
): Vehicle | undefined {
  return vehicles.find((v) => {
    const s = (v.slug || '').toLowerCase()
    const n = (v.name || '').toLowerCase()
    return s === slugKey || s.includes(slugKey) || n.includes(slugKey)
  })
}

function boatEnquiryMessage(date: string | null, guests: string | null): string {
  const dateLine = date?.trim() ? date.trim() : '[DATE]'
  const guestsLine = guests?.trim() ? guests.trim() : '[NUMBER]'
  return [
    'Hi KhayrCape, I am interested in the Hermanus Whale Experience.',
    '',
    `Date: ${dateLine}`,
    `Guests: ${guestsLine}`,
    '',
    'I would also like to enquire about the possibility of arranging a whale-watching boat experience.',
    '',
    'I understand that the boat experience is separate from the KhayrCape tour and is subject to external operator availability, weather and sea conditions.',
  ].join('\n')
}

function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-brand-green mb-4">
            Experience not found
          </h1>
          <p className="text-brand-green/80 mb-6 text-sm leading-relaxed">
            We couldn&apos;t find that experience. Browse our tours on the home
            page or book online.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/#tours"
              className="inline-flex items-center justify-center min-h-12 px-5 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-lg transition-colors"
            >
              View experiences
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center justify-center min-h-12 px-5 py-3 border-2 border-brand-green text-brand-green hover:bg-brand-green/5 font-semibold rounded-lg transition-colors"
            >
              Book online
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function HermanusUnavailable({ title }: { title: string }) {
  const seasonLabel = formatSeasonLabel(WHALE_SEASON)
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <span className="inline-block mb-3 text-xs font-semibold tracking-wide uppercase text-brand-green bg-brand-gold px-3 py-1.5 rounded-full">
            Seasonal
          </span>
          <h1 className="text-2xl font-bold text-brand-green mb-3">{title}</h1>
          <p className="text-brand-green/85 mb-2 text-base font-medium">
            Available {seasonLabel}
          </p>
          <p className="text-brand-green/75 mb-6 text-sm leading-relaxed">
            The Hermanus Whale Experience is only offered during whale season
            (June – October). Please browse our other private experiences in the
            meantime.
          </p>
          <Link
            to="/#tours"
            className="inline-flex items-center justify-center min-h-12 px-5 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-lg transition-colors"
          >
            View experiences
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-bold text-brand-green mb-4 md:mb-6">
      {children}
    </h2>
  )
}

export default function ExperienceDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const {
    catalog,
    tourBySlug,
    loading: catalogLoading,
    error: catalogError,
    retry: retryCatalog,
  } = useCatalog()
  const catalogVehicles = catalog?.vehicles ?? []
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [showStickyBook, setShowStickyBook] = useState(false)
  const bottomCtaRef = useRef<HTMLElement>(null)

  const isHermanus = slug === 'hermanus'
  const inWhaleSeason = isDateInSeason(new Date(), WHALE_SEASON)
  const catalogTour = slug ? tourBySlug(slug) : undefined
  const defaults = slug ? getDefaultExperience(slug) : null

  const hermanusOutOfSeason =
    isHermanus &&
    (!inWhaleSeason ||
      (!catalogLoading && !catalogTour && !!defaults && !inWhaleSeason))

  let content: ExperienceContent | null = null
  if (slug) {
    if (catalogTour) {
      content = resolveExperienceContent(catalogTour)
    } else if (defaults) {
      content = mergeExperienceContent(slug) ?? defaults
    }
  }

  useEffect(() => {
    if (!content || hermanusOutOfSeason) return
    const prevTitle = document.title
    document.title = content.seo_title || content.display_name

    let meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content') ?? null
    if (content.seo_description) {
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content.seo_description)
    }

    return () => {
      document.title = prevTitle
      if (meta && prevDesc !== null) {
        meta.setAttribute('content', prevDesc)
      }
    }
  }, [content, hermanusOutOfSeason])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex])

  useEffect(() => {
    if (hermanusOutOfSeason) {
      setShowStickyBook(false)
      return
    }
    const onScroll = () => {
      const pastHero = window.scrollY > 320
      const el = bottomCtaRef.current
      let nearBottomCta = false
      if (el) {
        const rect = el.getBoundingClientRect()
        nearBottomCta = rect.top < window.innerHeight - 72
      }
      setShowStickyBook(pastHero && !nearBottomCta)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [content, hermanusOutOfSeason])

  if (!slug || (!content && !catalogLoading && !hermanusOutOfSeason)) {
    return <NotFound />
  }

  if (hermanusOutOfSeason) {
    return (
      <HermanusUnavailable
        title={defaults?.display_name || 'Hermanus Whale Experience'}
      />
    )
  }

  if (!content) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
          <p className="text-brand-green font-medium">Loading experience…</p>
        </main>
        <Footer />
      </>
    )
  }

  const bookPath = `/book?tour=${slug}`
  const aboutParagraphs = content.detailed_description
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const highlights = isHermanus ? HERMANUS_HIGHLIGHTS : DEFAULT_HIGHLIGHTS

  const boatWaUrl = isHermanus
    ? whatsappWithMessage(
        boatEnquiryMessage(
          searchParams.get('date'),
          searchParams.get('guests')
        )
      )
    : null

  const relatedSlugs = Object.keys(EXPERIENCE_DEFAULTS).filter((relSlug) => {
    if (relSlug === slug) return false
    if (relSlug === 'hermanus' && !inWhaleSeason) return false
    const relCatalog = tourBySlug(relSlug)
    if (relCatalog && !isTourPubliclyVisible(relCatalog)) return false
    if (
      !relCatalog &&
      relSlug === 'hermanus' &&
      !isDateInSeason(new Date(), WHALE_SEASON)
    ) {
      return false
    }
    return true
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-cream">
        {/* Hero */}
        <section className="relative aspect-16/10 sm:aspect-21/9 max-h-130 w-full overflow-hidden bg-brand-cream-dark/40">
          <img
            src={content.hero_image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-brand-green/85 via-brand-green/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-6 sm:pb-10 z-10">
            <div className="max-w-4xl mx-auto">
              <span className="inline-block mb-3 text-xs sm:text-sm font-semibold tracking-wide uppercase text-brand-green bg-brand-gold px-3 py-1.5 rounded-full shadow-sm">
                {isHermanus && inWhaleSeason
                  ? 'WHALE SEASON'
                  : 'Private Experience'}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-cream leading-tight mb-2 drop-shadow-sm">
                {content.display_name}
              </h1>
              <p className="text-brand-cream/95 text-sm sm:text-base max-w-2xl leading-snug mb-4">
                {content.hero_tagline}
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="inline-flex items-center gap-1.5 text-brand-cream/95 text-sm">
                  <HiOutlineClock className="text-lg shrink-0 text-brand-gold" />
                  {content.duration_label}
                </p>
                {catalogTour ? (
                  <div className="bg-brand-cream/95 rounded-lg px-3 py-2 shadow-sm">
                    <PriceWithInfo
                      tour={catalogTour}
                      vehicles={catalogVehicles}
                      compact
                    />
                  </div>
                ) : catalogLoading ? (
                  <p className="text-sm text-brand-cream/90">Loading rates…</p>
                ) : catalogError ? (
                  <CatalogLoadError
                    message={catalogError}
                    onRetry={retryCatalog}
                    className="text-left max-w-sm"
                  />
                ) : null}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-lg">
                <Link
                  to={bookPath}
                  className="inline-flex items-center justify-center gap-2 min-h-12 px-5 py-3.5 bg-brand-gold hover:bg-brand-gold/90 text-brand-green font-semibold rounded-lg transition-colors shadow-md text-sm sm:text-base"
                >
                  <HiOutlineCreditCard className="text-xl shrink-0" />
                  Book Online
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14 space-y-12 md:space-y-16">
          <Link
            to="/#tours"
            className="inline-flex text-brand-green hover:underline text-sm -mt-4"
          >
            ← Back to experiences
          </Link>

          {/* About */}
          <section>
            <SectionHeading>About This Experience</SectionHeading>
            <div className="space-y-4 text-brand-green/90 text-sm sm:text-base leading-relaxed">
              {aboutParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {/* Highlights */}
          <section>
            <SectionHeading>Experience Highlights</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {highlights.map((label, i) => {
                const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length]
                return (
                  <div
                    key={label}
                    className="flex items-start gap-3 bg-brand-cream-light rounded-xl border border-brand-cream-dark p-4 shadow-sm"
                  >
                    <span className="shrink-0 w-10 h-10 rounded-lg bg-brand-gold/20 text-brand-green flex items-center justify-center">
                      <Icon className="text-xl" />
                    </span>
                    <p className="font-medium text-brand-green text-sm sm:text-base leading-snug pt-1.5">
                      {label}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Hermanus: Choose Your Vehicle */}
          {isHermanus && (
            <section>
              <SectionHeading>Choose Your Vehicle</SectionHeading>
              <p className="text-sm text-brand-green/80 mb-4 leading-relaxed">
                Select your vehicle during booking. Capacity limits apply to keep
                every journey private and comfortable.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {HERMANUS_VEHICLE_CARDS.map((card) => {
                  const fromCatalog = findCatalogVehicle(
                    catalogVehicles,
                    card.slug
                  )
                  const name = fromCatalog?.name || card.fallbackName
                  const capacity =
                    fromCatalog?.capacity_max != null
                      ? `Up to ${fromCatalog.capacity_max} guests${
                          card.premium ? ' · Premium Experience' : ''
                        }`
                      : card.capacityLabel
                  return (
                    <article
                      key={card.slug}
                      className="bg-brand-cream-light rounded-xl border border-brand-cream-dark overflow-hidden shadow-sm flex flex-col"
                    >
                      <div className="aspect-16/10 bg-brand-cream-dark/30 overflow-hidden relative">
                        <img
                          src={fromCatalog?.image_url || card.image}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {card.premium && (
                          <span className="absolute top-2 left-2 text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-brand-green bg-brand-gold px-2 py-1 rounded-full">
                            Premium Experience
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="font-bold text-brand-green text-sm sm:text-base leading-snug mb-1">
                          {name}
                        </h3>
                        <p className="text-xs sm:text-sm text-brand-green/80">
                          {capacity}
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {/* Timeline */}
          {content.timeline.length > 0 && (
            <section>
              <SectionHeading>Journey Timeline</SectionHeading>
              <ol className="relative space-y-0 border-l-2 border-brand-gold/60 ml-3 sm:ml-4">
                {content.timeline.map((stop, i) => (
                  <li
                    key={`${stop.title}-${i}`}
                    className="relative pl-6 sm:pl-8 pb-8 last:pb-0"
                  >
                    <span className="absolute -left-2.25 top-1.5 w-4 h-4 rounded-full bg-brand-gold border-2 border-brand-cream shadow-sm" />
                    <div className="bg-brand-cream-light rounded-xl border border-brand-cream-dark p-4 sm:p-5 shadow-sm">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                        <h3 className="font-bold text-brand-green text-base sm:text-lg">
                          {stop.title}
                        </h3>
                        {stop.duration && (
                          <span className="text-xs sm:text-sm text-brand-green/70 font-medium">
                            {stop.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-brand-green/90 leading-relaxed">
                        {stop.description}
                      </p>
                      {stop.image && (
                        <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-brand-cream-dark/30">
                          <img
                            src={stop.image}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Hermanus: Whale Season Information */}
          {isHermanus && (
            <section>
              <SectionHeading>Whale Season Information</SectionHeading>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    label: 'Season',
                    value: formatSeasonLabel(WHALE_SEASON),
                  },
                  { label: 'Experience', value: 'Full Day' },
                  { label: 'Duration', value: 'Approximately 8–10 hours' },
                  { label: 'Start', value: 'Cape Town' },
                  { label: 'Destination', value: 'Hermanus' },
                  {
                    label: 'Wildlife',
                    value: 'Sightings are not guaranteed',
                  },
                  {
                    label: 'Boat',
                    value: 'Not included — enquiry only',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="bg-brand-cream-light rounded-xl border border-brand-cream-dark p-4 shadow-sm"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wide text-brand-green/65 mb-1">
                      {row.label}
                    </dt>
                    <dd className="text-sm sm:text-base font-medium text-brand-green">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Map */}
          {content.map_embed_url && (
            <section>
              <SectionHeading>Interactive Route Map</SectionHeading>
              <div className="rounded-xl overflow-hidden border border-brand-cream-dark shadow-md bg-brand-cream-dark/20 aspect-video">
                <iframe
                  title="Route preview"
                  src={content.map_embed_url}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <p className="mt-2 text-xs text-brand-green/70 inline-flex items-center gap-1">
                <HiOutlineMap className="shrink-0" />
                Route preview — actual stops may flex with your preferences.
              </p>
            </section>
          )}

          {/* Gallery */}
          {content.gallery_images.length > 0 && (
            <section>
              <SectionHeading>Photo Gallery</SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {content.gallery_images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="aspect-square rounded-xl overflow-hidden bg-brand-cream-dark/30 shadow-sm border border-brand-cream-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Included */}
          {content.included.length > 0 && (
            <section>
              <SectionHeading>What&apos;s Included</SectionHeading>
              <ul className="space-y-2.5">
                {content.included.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm sm:text-base text-brand-green/90"
                  >
                    <HiOutlineCheck className="text-brand-gold text-xl shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Excluded */}
          {content.excluded.length > 0 && (
            <section>
              <SectionHeading>What&apos;s Not Included</SectionHeading>
              <ul className="space-y-2.5">
                {content.excluded.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm sm:text-base text-brand-green/90"
                  >
                    <HiOutlineX className="text-brand-green/50 text-xl shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Hermanus: boat enquiry */}
          {isHermanus && boatWaUrl && (
            <section className="bg-brand-cream-light rounded-2xl border border-brand-cream-dark p-5 sm:p-7 shadow-sm">
              <SectionHeading>Want to take it onto the water?</SectionHeading>
              <p className="text-sm sm:text-base text-brand-green/90 leading-relaxed mb-3">
                For guests interested in a whale-watching boat experience,
                KhayrCape can assist with an enquiry to an external licensed
                whale-watching operator.
              </p>
              <p className="text-sm text-brand-green/85 leading-relaxed mb-2">
                The boat is <strong className="font-semibold">not included</strong>{' '}
                in this land-based Hermanus experience. Arrangements are separate
                from your KhayrCape tour and are subject to:
              </p>
              <ul className="space-y-1.5 mb-5 text-sm text-brand-green/90">
                {[
                  'Operator availability',
                  'Weather',
                  'Sea conditions',
                  'Operator requirements',
                  'Availability on the selected date',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-brand-green/70 mb-4">
                No boat availability is ever guaranteed. This enquiry does not
                create a paid boat booking.
              </p>
              <a
                href={boatWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-12 px-5 py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-lg transition-colors shadow-md text-sm sm:text-base"
              >
                <FaWhatsapp className="text-xl shrink-0" />
                Enquire about boat tour
              </a>
            </section>
          )}

          {/* Perfect For */}
          {content.perfect_for.length > 0 && (
            <section>
              <SectionHeading>Perfect For</SectionHeading>
              <div className="flex flex-wrap gap-2">
                {content.perfect_for.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex px-3 py-1.5 rounded-full text-sm font-medium text-brand-green bg-brand-cream-light border border-brand-cream-dark"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Good To Know */}
          {content.good_to_know.length > 0 && (
            <section>
              <SectionHeading>Good To Know</SectionHeading>
              <ul className="space-y-2.5">
                {content.good_to_know.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm sm:text-base text-brand-green/90"
                  >
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Hermanus: Important Information */}
          {isHermanus && (
            <section>
              <SectionHeading>Important Information</SectionHeading>
              <dl className="space-y-3">
                {[
                  { label: 'Whale season', value: 'June – October' },
                  { label: 'Experience', value: 'Full Day' },
                  {
                    label: 'Duration',
                    value: 'Approximately 8–10 hours',
                  },
                  { label: 'Start', value: 'Cape Town' },
                  { label: 'Destination', value: 'Hermanus' },
                  {
                    label: 'Wildlife',
                    value: 'Sightings are not guaranteed.',
                  },
                  {
                    label: 'Boat',
                    value: 'Not included. Enquiry only.',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col sm:flex-row sm:gap-4 border-b border-brand-cream-dark/80 pb-3 last:border-0"
                  >
                    <dt className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-brand-green/65 sm:w-36 shrink-0">
                      {row.label}
                    </dt>
                    <dd className="text-sm sm:text-base text-brand-green/90">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* FAQs */}
          {content.faqs.length > 0 && (
            <section>
              <SectionHeading>FAQs</SectionHeading>
              <div className="space-y-2">
                {content.faqs.map((faq, i) => {
                  const isOpen = openFaq === i
                  return (
                    <div
                      key={faq.question}
                      className="rounded-xl border border-brand-cream-dark bg-brand-cream-light overflow-hidden shadow-sm"
                    >
                      <button
                        type="button"
                        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left font-semibold text-brand-green text-sm sm:text-base min-h-12"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                      >
                        <span>{faq.question}</span>
                        <HiOutlineChevronDown
                          className={`text-xl shrink-0 text-brand-gold transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-sm text-brand-green/90 leading-relaxed border-t border-brand-cream-dark/60 pt-3">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Ready To Book */}
          <section
            ref={bottomCtaRef}
            className="bg-brand-green rounded-2xl p-5 sm:p-8 shadow-lg text-brand-cream"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Ready To Book?</h2>
            <p className="text-brand-cream/90 text-sm sm:text-base mb-1">
              {content.display_name}
            </p>
            <p className="inline-flex items-center gap-1.5 text-sm text-brand-cream/85 mb-4">
              <HiOutlineClock className="text-brand-gold" />
              {content.duration_label}
            </p>
            {catalogTour ? (
              <div className="mb-5 bg-brand-cream rounded-lg px-3 py-2 inline-block">
                <PriceWithInfo
                  tour={catalogTour}
                  vehicles={catalogVehicles}
                  compact
                />
              </div>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md">
              <Link
                to={bookPath}
                className="inline-flex items-center justify-center gap-2 min-h-12 px-5 py-3.5 bg-brand-gold hover:bg-brand-gold/90 text-brand-green font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                <HiOutlineCreditCard className="text-xl shrink-0" />
                Book Online
              </Link>
            </div>
          </section>

          {/* Related */}
          {relatedSlugs.length > 0 && (
            <section>
              <SectionHeading>Related Experiences</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedSlugs.map((relSlug) => {
                  const rel =
                    getDefaultExperience(relSlug) ??
                    EXPERIENCE_DEFAULTS[relSlug]
                  if (!rel) return null
                  const relCatalog = tourBySlug(relSlug)
                  return (
                    <article
                      key={relSlug}
                      className="bg-brand-cream-light rounded-xl shadow-md overflow-hidden border border-brand-cream-dark flex flex-col"
                    >
                      <div className="aspect-16/10 overflow-hidden bg-brand-cream-dark/30">
                        <img
                          src={rel.hero_image}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col gap-2">
                        <h3 className="font-bold text-brand-green text-base sm:text-lg leading-snug">
                          {rel.display_name}
                        </h3>
                        <p className="text-sm text-brand-green/85">
                          {rel.duration_label}
                        </p>
                        {relCatalog ? (
                          <PriceWithInfo
                            tour={relCatalog}
                            vehicles={catalogVehicles}
                            compact
                          />
                        ) : null}
                        <div className="mt-auto pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Link
                            to={`/experience/${relSlug}`}
                            className="inline-flex items-center justify-center min-h-11 px-3 py-2.5 border-2 border-brand-gold text-brand-green hover:bg-brand-gold/10 font-semibold rounded-lg transition-colors text-sm"
                          >
                            View Details
                          </Link>
                          <Link
                            to={`/book?tour=${relSlug}`}
                            className="inline-flex items-center justify-center min-h-11 px-3 py-2.5 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-lg transition-colors text-sm"
                          >
                            Book Online
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {showStickyBook && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-brand-cream-dark bg-brand-cream/95 backdrop-blur px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <div className="max-w-4xl mx-auto">
            <Link
              to={bookPath}
              className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-4 rounded-lg bg-brand-gold text-brand-green font-semibold"
            >
              <HiOutlineCreditCard className="text-xl shrink-0" />
              Book Online
            </Link>
          </div>
        </div>
      )}

      <Footer />

      {/* Lightbox */}
      {lightboxIndex !== null && content.gallery_images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/90 hover:text-white text-sm font-medium px-3 py-2 rounded-lg bg-white/10"
            onClick={() => setLightboxIndex(null)}
          >
            Close
          </button>
          <img
            src={content.gallery_images[lightboxIndex]}
            alt=""
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
