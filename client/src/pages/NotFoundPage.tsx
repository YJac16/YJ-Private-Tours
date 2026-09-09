import { Link } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageMeta from '../components/PageMeta'
import { BUSINESS_EMAIL, BUSINESS_MAILTO } from '../lib/contactLinks'
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
      <main className="bg-brand-cream-light px-4 pt-8 sm:pt-10 lg:pt-8 pb-site-dock">
        <div className="max-w-md lg:max-w-2xl mx-auto w-full text-center">
          <div className="relative mb-6 sm:mb-7 lg:mb-4">
            <p
              className="pointer-events-none select-none text-[5.5rem] sm:text-[6.5rem] lg:text-[5.75rem] font-bold leading-none text-brand-green/[0.07]"
              aria-hidden
            >
              404
            </p>
            <img
              src="/logo-vector-no-background.png"
              alt=""
              className="absolute inset-0 m-auto h-12 sm:h-14 lg:h-12 w-auto object-contain"
              aria-hidden
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-brand-green mb-2">
            Page not found
          </h1>
          <p className="text-brand-green/80 text-sm sm:text-base leading-relaxed mb-6 sm:mb-7 lg:mb-5 max-w-sm mx-auto">
            That link doesn&apos;t match a page on KhayrCape Experiences. Head
            home, book a tour, or message us — we&apos;re happy to help.
          </p>

          <div className="flex flex-col gap-2.5 max-w-xs sm:max-w-sm lg:max-w-none mx-auto lg:flex-row lg:flex-wrap lg:justify-center lg:gap-2">
            <Link
              to="/book"
              className="inline-flex items-center justify-center min-h-11 px-6 py-2.5 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-xl transition-colors shadow-sm lg:flex-1 lg:min-w-[9.5rem] lg:max-w-[11rem] lg:px-4 lg:text-sm"
            >
              Book a tour
            </Link>
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-11 px-6 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-colors shadow-sm lg:flex-1 lg:min-w-[11rem] lg:max-w-[12.5rem] lg:px-4 lg:text-sm"
            >
              <FaWhatsapp className="text-lg shrink-0" aria-hidden />
              Chat on WhatsApp
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center min-h-11 px-6 py-2.5 border-2 border-brand-green/30 text-brand-green hover:bg-brand-green/5 font-semibold rounded-xl transition-colors lg:flex-1 lg:min-w-[9.5rem] lg:max-w-[11rem] lg:px-4 lg:text-sm"
            >
              Back to home
            </Link>
          </div>

          <p className="mt-6 lg:mt-4 text-sm lg:text-xs text-brand-green/60">
            Or email{' '}
            <a
              href={BUSINESS_MAILTO}
              className="text-brand-green underline underline-offset-2 hover:text-brand-green-dark"
            >
              {BUSINESS_EMAIL}
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
