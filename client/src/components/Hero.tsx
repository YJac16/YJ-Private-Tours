import { Link } from 'react-router-dom'
import { HiOutlineMap, HiOutlineCalendar } from 'react-icons/hi'

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-dvh flex items-center justify-center px-4 py-20 sm:py-16 md:py-24 bg-cover bg-center bg-no-repeat"
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
      <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
        <div className="relative mx-auto mb-4 sm:mb-5 w-fit max-w-[min(92vw,28rem)]">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[130%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.22)_45%,transparent_72%)]"
            aria-hidden
          />
          <img
            src="/full-logo-white-out-no-background.png"
            alt="KhayrCape Experiences"
            className="relative mx-auto h-32 sm:h-40 md:h-48 w-auto object-contain filter-[drop-shadow(0_1px_2px_rgba(0,0,0,0.75))_drop-shadow(0_6px_18px_rgba(0,0,0,0.5))]"
          />
        </div>
        <h1 className="font-serif text-[1.65rem] sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 sm:mb-5 leading-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.65),0_1px_3px_rgba(0,0,0,0.9)]">
          Private &amp; Muslim-Friendly Tours of Cape Town
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white mb-8 sm:mb-10 max-w-2xl mx-auto leading-snug [text-shadow:0_1px_8px_rgba(0,0,0,0.65)]">
          Relaxed, cultural, and scenic experiences with a qualified local guide.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-stretch sm:justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
          <Link
            to="/#tours"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 min-h-12 bg-white text-brand-green font-semibold rounded-2xl transition-all shadow-lg shadow-black/20 hover:bg-brand-cream active:scale-[0.98] border-2 border-white/30 w-full sm:w-auto sm:min-w-50"
          >
            <HiOutlineMap className="text-2xl shrink-0" />
            Explore Tours
          </Link>
          <Link
            to="/book"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 min-h-12 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-semibold rounded-2xl transition-all shadow-lg shadow-black/25 active:scale-[0.98] w-full sm:w-auto sm:min-w-50 border-2 border-white/20"
          >
            <HiOutlineCalendar className="text-2xl shrink-0" />
            Book a tour
          </Link>
        </div>
      </div>
    </section>
  )
}
