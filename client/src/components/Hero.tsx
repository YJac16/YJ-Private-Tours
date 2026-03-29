import { HiOutlineMap } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { whatsappWithMessage } from '../lib/whatsappLinks'

const WHATSAPP_HERO =
  "Hi, I'd like to book a private tour with KhayrCape Experiences."

export default function Hero() {
  const waHref = whatsappWithMessage(WHATSAPP_HERO)

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] min-h-[100dvh] flex items-center justify-center px-4 py-20 sm:py-16 md:py-24 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/cape-town-banner.jpg)' }}
    >
      {/* Light tint so the banner photo stays visible; darker at bottom for button contrast */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-brand-green/35 via-brand-green/25 to-brand-green/55"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
        <img
          src="/Full logo.png"
          alt="KhayrCape Experiences"
          className="mx-auto h-16 sm:h-20 md:h-28 w-auto object-contain drop-shadow-lg mb-5 sm:mb-6"
        />
        <h1 className="text-[1.65rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.65),0_1px_3px_rgba(0,0,0,0.9)]">
          Private & Muslim-Friendly Tours of Cape Town
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-white font-semibold mb-1 sm:mb-2 [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
          Private Journeys, Thoughtfully Guided.
        </p>
        <p className="text-base sm:text-lg md:text-xl text-white mb-8 sm:mb-10 max-w-2xl mx-auto leading-snug [text-shadow:0_1px_8px_rgba(0,0,0,0.65)]">
          Relaxed, cultural, and scenic experiences with a qualified local guide
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-stretch sm:justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
          <a
            href="#tours"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 min-h-[48px] bg-white text-brand-green font-semibold rounded-xl transition-all shadow-lg shadow-black/20 hover:bg-brand-cream active:scale-[0.98] border-2 border-white/30 w-full sm:w-auto sm:min-w-[200px]"
          >
            <HiOutlineMap className="text-2xl flex-shrink-0" />
            Explore Tours
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 min-h-[48px] bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-all shadow-lg shadow-black/25 active:scale-[0.98] w-full sm:w-auto sm:min-w-[200px]"
          >
            <FaWhatsapp className="text-2xl flex-shrink-0" />
            Book on WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
