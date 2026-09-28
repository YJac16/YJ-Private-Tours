import { Link } from 'react-router-dom'
import { HiOutlineCalendar } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import PublicHeroFromPrice from '../lib/displayCurrency/components/PublicHeroFromPrice'
import { WA_PHONE_E164 } from '../lib/whatsappLinks'
import { guideRegistration } from '../seo/siteConfig'

const HERO_WA_HREF = `https://wa.me/${WA_PHONE_E164}`

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex max-md:items-start max-md:justify-start md:items-center md:justify-center px-4 max-md:pt-[calc(var(--navbar-height,4rem)+0.625rem)] max-md:pb-[calc(var(--cookie-dock-height,0px)+0.5rem)] py-8 sm:py-16 md:py-24 bg-cover bg-center max-md:bg-[position:center_38%] md:bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/cape-town-banner.jpg)' }}
    >
      <div
        className="absolute inset-0 bg-linear-to-b from-brand-green/35 via-brand-green/25 to-brand-green/55"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-linear-to-t from-black/45 via-black/15 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 max-w-4xl mx-auto text-center w-full max-md:py-2">
        <div className="relative mx-auto mb-2 sm:mb-5 w-fit max-w-[min(88vw,26rem)]">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[130%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.22)_45%,transparent_72%)]"
            aria-hidden
          />
          <img
            src="/full-logo-white-out-no-background.png"
            alt="KhayrCape Experiences"
            className="relative mx-auto h-[6.4rem] sm:h-40 md:h-48 w-auto object-contain filter-[drop-shadow(0_1px_2px_rgba(0,0,0,0.75))_drop-shadow(0_6px_18px_rgba(0,0,0,0.5))]"
          />
        </div>
        <p className="inline-flex items-center justify-center gap-2 mb-2 sm:mb-3 text-[10px] sm:text-sm font-semibold tracking-wide uppercase text-white/95 bg-black/35 border border-white/20 rounded-full px-3 py-1.5 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
          {guideRegistration.label}
        </p>
        <h1 className="text-[1.55rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 leading-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.65),0_1px_3px_rgba(0,0,0,0.9)]">
          Private & Muslim-Friendly Tours of Cape Town
        </h1>
        <p className="text-base sm:text-xl md:text-2xl text-white font-semibold mb-1 sm:mb-2 [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
          Private Journeys, Thoughtfully Guided.
        </p>
        <p className="text-sm sm:text-lg md:text-xl text-white mb-2 sm:mb-3 max-w-2xl mx-auto leading-snug [text-shadow:0_1px_8px_rgba(0,0,0,0.65)]">
          Relaxed, cultural and scenic experiences with a registered local guide.
        </p>
        <div className="inline-block text-sm sm:text-base text-white mb-3 sm:mb-8 rounded-xl border border-white/15 bg-black/55 backdrop-blur-sm px-4 py-2 sm:py-2.5 sm:px-5 sm:py-3 shadow-lg shadow-black/30 text-left sm:text-center">
          <PublicHeroFromPrice />
        </div>
        <div className="flex flex-col gap-2 sm:gap-4 justify-stretch sm:flex-row sm:justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto max-md:pb-0">
          <Link
            to="/book"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-11 sm:min-h-12 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-xl transition-all shadow-lg shadow-black/25 active:scale-[0.98] w-full sm:w-auto sm:min-w-50 border-2 border-white/20 order-1"
          >
            <HiOutlineCalendar className="text-xl sm:text-2xl shrink-0" />
            Book a Tour
          </Link>
          <a
            href={HERO_WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-11 sm:min-h-12 bg-white/95 hover:bg-white text-brand-green font-semibold rounded-xl transition-all shadow-lg shadow-black/20 active:scale-[0.98] border-2 border-white/40 w-full sm:w-auto sm:min-w-50 order-2"
          >
            <FaWhatsapp className="text-xl sm:text-2xl shrink-0 text-[#25D366]" />
            WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  )
}
