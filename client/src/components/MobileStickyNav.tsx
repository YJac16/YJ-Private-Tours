import { Link } from 'react-router-dom'
import { HiOutlineMap, HiOutlineTruck, HiOutlineUser } from 'react-icons/hi'
import { FaCalendarCheck } from 'react-icons/fa'

const items = [
  { to: '/#tours', label: 'Tours', sub: 'Explore', icon: HiOutlineMap },
  { to: '/#drivers', label: 'Drivers', sub: 'Experts', icon: HiOutlineUser },
  { to: '/#fleet', label: 'Fleet', sub: 'Vehicles', icon: HiOutlineTruck },
  { to: '/book', label: 'Book', sub: 'Now', icon: FaCalendarCheck },
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
          return (
            <Link
              key={item.label}
              to={item.to}
              className="flex flex-col items-center justify-center py-2 px-0.5 min-h-[52px] min-w-0 text-brand-green hover:bg-brand-cream-dark/40 active:bg-brand-cream-dark/60 transition-colors"
            >
              <Icon className="shrink-0 text-base mb-0.5" aria-hidden />
              <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">
                {item.label}
              </span>
              <span className="text-[8px] text-brand-green/70 truncate w-full text-center leading-tight">
                {item.sub}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
