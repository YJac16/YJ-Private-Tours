import { Link } from 'react-router-dom'
import { HiOutlineLocationMarker, HiOutlinePhone } from 'react-icons/hi'
import { WA_PHONE_E164 } from '../lib/whatsappLinks'

const WA_DISPLAY = '+27 82 327 7446'
const WA_HREF = `https://wa.me/${WA_PHONE_E164}`

const experiences = [
  { to: '/experience/city', label: 'Cape Town City & Culture' },
  { to: '/experience/peninsula', label: 'Cape Peninsula Highlights' },
  { to: '/experience/sunset', label: 'Ocean Sunset' },
  { to: '/experience/winelands', label: 'Halal-Friendly Winelands' },
  { to: '/experience/hermanus', label: 'Hermanus Whale Experience' },
]

const company = [
  { to: '/#about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/book', label: 'Book a tour' },
]

const legal = [
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/cookies', label: 'Cookies' },
]

export default function Footer() {
  return (
    <footer className="bg-brand-green text-brand-cream py-14 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block" aria-label="KhayrCape Experiences home">
              <img
                src="/full-logo-white-out-no-background.png"
                alt="KhayrCape Experiences"
                className="h-16 md:h-20 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-brand-cream/85 italic text-sm leading-relaxed">
              Private Journeys, Thoughtfully Guided.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-brand-cream/75">
              <HiOutlineLocationMarker className="text-lg shrink-0 text-brand-gold" aria-hidden />
              Cape Town, South Africa
            </p>
          </div>

          <nav aria-label="Experiences">
            <h2 className="font-serif text-lg font-semibold text-brand-cream mb-4">
              Experiences
            </h2>
            <ul className="space-y-2.5">
              {experiences.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-brand-cream/80 hover:text-brand-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="font-serif text-lg font-semibold text-brand-cream mb-4">
              Company
            </h2>
            <ul className="space-y-2.5">
              {company.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-brand-cream/80 hover:text-brand-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal and contact">
            <h2 className="font-serif text-lg font-semibold text-brand-cream mb-4">
              Legal
            </h2>
            <ul className="space-y-2.5">
              {legal.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-brand-cream/80 hover:text-brand-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-cream/80 hover:text-brand-gold transition-colors font-medium"
                >
                  <HiOutlinePhone className="text-lg shrink-0" aria-hidden />
                  WhatsApp {WA_DISPLAY}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <p className="text-sm text-brand-cream/60 pt-10 mt-10 border-t border-brand-cream/15">
          © {new Date().getFullYear()} KhayrCape Experiences. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
