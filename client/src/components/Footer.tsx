import { Link } from 'react-router-dom'
import { HiOutlineLocationMarker, HiOutlinePhone } from 'react-icons/hi'
import { WA_PHONE_E164 } from '../lib/whatsappLinks'

const WA_DISPLAY = '+27 82 327 7446'
const WA_HREF = `https://wa.me/${WA_PHONE_E164}`

export default function Footer() {
  return (
    <footer className="bg-brand-green text-brand-cream py-12 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <p className="text-xl font-semibold text-brand-cream">
          KhayrCape Experiences
        </p>
        <p className="text-brand-cream/90 italic">Private Journeys, Thoughtfully Guided.</p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 text-brand-cream/80">
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex shrink-0" aria-hidden>
              <HiOutlineLocationMarker className="text-lg" />
            </span>
            Cape Town, South Africa
          </span>
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-cream underline underline-offset-2 hover:text-white font-medium"
          >
            <HiOutlinePhone className="text-lg shrink-0" aria-hidden />
            WhatsApp {WA_DISPLAY}
          </a>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-brand-cream/80 text-sm sm:text-base">
          <Link
            to="/book"
            className="text-brand-cream underline underline-offset-2 hover:text-white font-medium"
          >
            Book a tour
          </Link>
          <Link
            to="/terms"
            className="text-brand-cream underline underline-offset-2 hover:text-white font-medium"
          >
            Terms &amp; Conditions
          </Link>
          <Link
            to="/privacy"
            className="text-brand-cream underline underline-offset-2 hover:text-white font-medium"
          >
            Privacy Policy
          </Link>
          <Link
            to="/cookies"
            className="text-brand-cream underline underline-offset-2 hover:text-white font-medium"
          >
            Cookies
          </Link>
        </div>
        <p className="text-sm text-brand-cream/70 pt-4">
          © {new Date().getFullYear()} KhayrCape Experiences. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
