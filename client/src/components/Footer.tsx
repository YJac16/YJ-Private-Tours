import { HiOutlineLocationMarker, HiOutlineClock } from 'react-icons/hi'

export default function Footer() {
  return (
    <footer className="bg-brand-green text-brand-cream py-12 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <p className="text-xl font-semibold text-brand-cream">
          KhayrCape Experiences
        </p>
        <p className="text-brand-cream/90 italic">Private Journeys, Thoughtfully Guided.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-brand-cream/80">
          <span className="inline-flex items-center gap-2">
            <HiOutlineClock className="text-lg" />
            Operating hours: 08:00 – 15:00
          </span>
          <span className="inline-flex items-center gap-2">
            <HiOutlineLocationMarker className="text-lg" />
            Cape Town, South Africa
          </span>
        </div>
        <p className="text-sm text-brand-cream/70 pt-4">
          © {new Date().getFullYear()} KhayrCape Experiences. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
