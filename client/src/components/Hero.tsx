import { HiOutlineMail, HiOutlineMap } from 'react-icons/hi'

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 md:py-24 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/cape-town-banner.jpg)' }}
    >
      {/* Strong overlay so text and buttons stay legible on any part of the image */}
      <div className="absolute inset-0 bg-brand-green/75" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" aria-hidden />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Main logo */}
        <img
          src="/Full logo.png"
          alt="KhayrCape Experiences"
          className="mx-auto h-20 md:h-28 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] mb-6"
        />
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
          Private & Muslim-Friendly Tours of Cape Town
        </h1>
        <p className="text-xl md:text-2xl text-white font-medium mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
          Private Journeys, Thoughtfully Guided.
        </p>
        <p className="text-lg md:text-xl text-white/95 mb-10 max-w-2xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          Relaxed, cultural, and scenic experiences with a qualified local guide
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#tours"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-white font-medium rounded-lg transition-colors shadow-lg border-2 border-white/20 min-w-[200px] justify-center"
          >
            <HiOutlineMap className="text-2xl" />
            Explore Tours
          </a>
          <a
            href="#enquiry"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-cream hover:bg-brand-cream-light text-brand-green font-medium rounded-lg transition-colors shadow-lg border-2 border-brand-cream-dark min-w-[200px] justify-center"
          >
            <HiOutlineMail className="text-xl" />
            Enquire Now
          </a>
        </div>
      </div>
    </section>
  )
}
