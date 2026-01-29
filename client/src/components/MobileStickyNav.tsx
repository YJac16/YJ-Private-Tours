import { HiOutlineMap, HiOutlineTruck, HiOutlineUser } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'

const BOOK_WHATSAPP_URL = 'https://wa.link/d96tsl'

const items = [
  { href: '#tours', label: 'Tours', sub: 'Explore', icon: HiOutlineMap },
  { href: '#fleet', label: 'Fleet', sub: 'Vehicles', icon: HiOutlineTruck },
  { href: '#drivers', label: 'Drivers', sub: 'Experts', icon: HiOutlineUser },
  { href: BOOK_WHATSAPP_URL, label: 'Book', sub: 'Now', icon: FaWhatsapp, external: true },
]

export default function MobileStickyNav() {
  return (
    <nav
      className="sticky top-16 z-40 md:hidden bg-brand-cream border-b border-brand-cream-dark shadow-sm"
      aria-label="Quick links"
    >
      <div className="grid grid-cols-4 gap-0 max-w-full">
        {items.map((item) => {
          const Icon = item.icon
          const className =
            "flex flex-col items-center justify-center py-1.5 px-0.5 min-w-0 text-brand-green hover:bg-brand-cream-dark/40 active:bg-brand-cream-dark/60 transition-colors"
          const content = (
            <>
              <Icon className="text-base flex-shrink-0 mb-0.5" aria-hidden />
              <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">
                {item.label}
              </span>
              <span className="text-[8px] text-brand-green/70 truncate w-full text-center leading-tight">
                {item.sub}
              </span>
            </>
          )
          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            )
          }
          return (
            <a key={item.label} href={item.href} className={className}>
              {content}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
