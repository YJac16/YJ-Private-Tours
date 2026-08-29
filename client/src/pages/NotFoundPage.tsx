import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCatalog } from '../hooks/useCatalog'
import { formatStartingFromPerGuest } from '../lib/pricing'
import { displayDurationLabel } from '../lib/displayDuration'
import { whatsappWithMessage } from '../lib/whatsappLinks'

const MESSAGE_YASEEN = whatsappWithMessage(
  "Hi Yaseen, I'd like to chat about a private Cape Town experience."
)

const recoverExperiences = [
  {
    slug: 'city',
    title: 'Cape Town City & Culture',
    image: '/bo-kaap.jpg',
  },
  {
    slug: 'peninsula',
    title: 'Cape Peninsula Highlights',
    image: '/cape-point.jpg',
  },
  {
    slug: 'sunset',
    title: 'Ocean Sunset',
    image: '/campsbay.JPG',
  },
  {
    slug: 'winelands',
    title: 'Halal-Friendly Winelands',
    image: '/winelands.jpg',
  },
  {
    slug: 'hermanus',
    title: 'Hermanus Whale Experience',
    image: '/chapmans-peak.jpg',
  },
]

export default function NotFoundPage() {
  const { catalog, tourBySlug, loading } = useCatalog()
  const vehicles = catalog?.vehicles ?? []

  return (
    <>
      <Navbar />
      <main>
        <section
          className="relative min-h-[68vh] flex items-center justify-center px-4 py-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/cape-town-banner.jpg)' }}
        >
          <div
            className="absolute inset-0 bg-linear-to-b from-brand-green/50 via-brand-green/40 to-brand-green/70"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20"
            aria-hidden
          />
          <div className="relative z-10 max-w-xl mx-auto text-center">
            <p className="font-serif text-6xl sm:text-7xl font-semibold text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">
              404
            </p>
            <span className="mt-3 mb-5 mx-auto block h-0.5 w-12 bg-brand-gold" aria-hidden />
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white mb-3 leading-tight [text-shadow:0_1px_10px_rgba(0,0,0,0.65)]">
              This path is not on our map
            </h1>
            <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-8 [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">
              That link does not match a page. Head home, book a private Cape
              Town experience, or message Yaseen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex justify-center min-h-12 items-center px-6 rounded-2xl bg-white text-brand-green font-semibold hover:bg-brand-cream transition-colors"
              >
                Go home
              </Link>
              <Link
                to="/book"
                className="inline-flex justify-center min-h-12 items-center px-6 rounded-2xl bg-brand-green text-brand-cream font-semibold border-2 border-white/20 hover:bg-brand-green-dark transition-colors"
              >
                Book a tour
              </Link>
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center text-sm">
              <a
                href={MESSAGE_YASEEN}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 underline underline-offset-2 hover:text-brand-gold"
              >
                Message Yaseen
              </a>
              <Link
                to="/gallery"
                className="text-white/90 underline underline-offset-2 hover:text-brand-gold"
              >
                View the gallery
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-brand-cream-light px-4 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-brand-green text-center mb-8">
              Explore an experience
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {recoverExperiences.map((exp) => {
                const catalogTour = tourBySlug(exp.slug)
                const duration = displayDurationLabel(
                  exp.slug,
                  catalogTour?.duration_label
                )
                const fromPrice = catalogTour
                  ? formatStartingFromPerGuest(catalogTour, vehicles)
                  : loading
                    ? 'Loading rates…'
                    : null
                return (
                  <article
                    key={exp.slug}
                    className="bg-brand-cream rounded-2xl overflow-hidden border border-brand-cream-dark shadow-sm flex flex-col"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-brand-green-dark">
                      <img
                        src={exp.image}
                        alt={exp.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <h3 className="font-serif font-semibold text-brand-green leading-snug">
                        {exp.title}
                      </h3>
                      <p className="text-sm text-brand-green/75">{duration}</p>
                      {fromPrice && (
                        <p className="text-sm font-semibold text-brand-green">
                          {fromPrice}
                        </p>
                      )}
                      <Link
                        to={`/experience/${exp.slug}`}
                        className="mt-auto inline-flex justify-center min-h-11 items-center px-4 rounded-xl border border-brand-gold text-brand-green font-semibold text-sm hover:bg-brand-gold/10 transition-colors"
                      >
                        Explore
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
