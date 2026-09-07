import { Link } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageMeta from '../components/PageMeta'
import { whatsappWithMessage } from '../lib/whatsappLinks'

const WA_HREF = whatsappWithMessage(
  "Hi, I followed a link on khayrcapeexperiences.com but couldn't find the page. Can you help?"
)

export default function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="Page not found — KhayrCape Experiences"
        description="This page doesn't exist. Return home, book a private Cape Town tour, or message us on WhatsApp."
        path="/404"
      />
      <Navbar />
      <main className="min-h-[75vh] bg-brand-cream-light px-4 py-16 sm:py-24 flex items-center">
        <div className="max-w-md mx-auto w-full text-center">
          <div className="relative mb-8 sm:mb-10">
            <p
              className="pointer-events-none select-none text-[7rem] sm:text-[9rem] font-bold leading-none text-brand-green/[0.07]"
              aria-hidden
            >
              404
            </p>
            <img
              src="/logo-vector-no-background.png"
              alt=""
              className="absolute inset-0 m-auto h-14 sm:h-16 w-auto object-contain"
              aria-hidden
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-brand-green mb-3">
            Page not found
          </h1>
          <p className="text-brand-green/80 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-sm mx-auto">
            That link doesn&apos;t match a page on KhayrCape Experiences. Head
            home, book a tour, or message us — we&apos;re happy to help.
          </p>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link
              to="/book"
              className="inline-flex items-center justify-center min-h-12 px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-xl transition-colors shadow-sm"
            >
              Book a tour
            </Link>
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-12 px-6 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              <FaWhatsapp className="text-xl shrink-0" aria-hidden />
              Chat on WhatsApp
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center min-h-12 px-6 py-3 border-2 border-brand-green/30 text-brand-green hover:bg-brand-green/5 font-semibold rounded-xl transition-colors"
            >
              Back to home
            </Link>
          </div>

          <p className="mt-8 text-sm text-brand-green/60">
            Or email{' '}
            <a
              href="mailto:hello@khayrcapeexperiences.com"
              className="text-brand-green underline underline-offset-2 hover:text-brand-green-dark"
            >
              hello@khayrcapeexperiences.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
