import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { resolveExperienceContent } from '../lib/resolveExperience'
import {
  EXPERIENCE_DEFAULTS,
  getDefaultExperience,
  mergeExperienceContent,
} from '../data/experienceDefaults'
import { DEFAULT_HIGHLIGHTS } from '../lib/experienceTypes'
import { whatsappWithMessage } from '../lib/whatsappLinks'
import type { ExperienceContent } from '../lib/experienceTypes'

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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-bold text-brand-green mb-4 md:mb-6">
      {children}
    </h2>
  )
}

export default function ExperienceDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { tourBySlug, loading: catalogLoading } = useCatalog()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const catalogTour = slug ? tourBySlug(slug) : undefined

  const content: ExperienceContent | null = useMemo(() => {
    if (!slug) return null
    if (catalogTour) {
      return resolveExperienceContent(catalogTour)
    }
    const defaults = getDefaultExperience(slug)
    if (defaults) {
      return mergeExperienceContent(slug) ?? defaults
    }
    return null
  }, [slug, catalogTour])

  useEffect(() => {
    if (!content) return
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
  }, [content])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex])

  if (!slug || (!content && !catalogLoading)) {
    return <NotFound />
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
  const waUrl = whatsappWithMessage(
    `Hi! I'd like to book the ${content.display_name} with Khayr Cape Experiences.`
  )
  const aboutParagraphs = content.detailed_description
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const relatedSlugs = Object.keys(EXPERIENCE_DEFAULTS).filter((s) => s !== slug)

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
                Private Experience
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
                    <PriceWithInfo tour={catalogTour} compact />
                  </div>
                ) : catalogLoading ? (
                  <p className="text-sm text-brand-cream/90">Loading rates…</p>
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
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-12 px-5 py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-lg transition-colors shadow-md text-sm sm:text-base"
                >
                  <FaWhatsapp className="text-xl shrink-0" />
                  WhatsApp
                </a>
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
              {DEFAULT_HIGHLIGHTS.map((label, i) => {
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

          {/* Timeline */}
          {content.timeline.length > 0 && (
            <section>
              <SectionHeading>Journey Timeline</SectionHeading>
              <ol className="relative space-y-0 border-l-2 border-brand-gold/60 ml-3 sm:ml-4">
                {content.timeline.map((stop, i) => (
                  <li key={`${stop.title}-${i}`} className="relative pl-6 sm:pl-8 pb-8 last:pb-0">
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
          <section className="bg-brand-green rounded-2xl p-5 sm:p-8 shadow-lg text-brand-cream">
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
                <PriceWithInfo tour={catalogTour} compact />
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
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-12 px-5 py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                <FaWhatsapp className="text-xl shrink-0" />
                WhatsApp
              </a>
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
                          <PriceWithInfo tour={relCatalog} compact />
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
