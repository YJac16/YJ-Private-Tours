import {
  HiOutlineBadgeCheck,
  HiOutlineClock,
  HiOutlineHeart,
  HiOutlineUserGroup,
} from 'react-icons/hi'

const tiles = [
  {
    title: 'Private',
    body: 'Your group only — no shared coaches, no strangers.',
    icon: HiOutlineUserGroup,
  },
  {
    title: 'Muslim-friendly',
    body: 'Halal-aware stops and cultural sensitivity throughout.',
    icon: HiOutlineHeart,
  },
  {
    title: 'Relaxed pace',
    body: 'Time for rest, photos, and reflection — never rushed.',
    icon: HiOutlineClock,
  },
  {
    title: 'Qualified guide',
    body: 'A registered local professional who knows the Cape.',
    icon: HiOutlineBadgeCheck,
  },
]

export default function About() {
  return (
    <section
      id="about"
      className="py-20 md:py-28 bg-brand-cream px-4 scroll-mt-28 md:scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-10 md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold mb-3">
            Why KhayrCape
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-brand-green mb-5 leading-tight">
            About KhayrCape Experiences
          </h2>
          <p className="text-brand-green/90 text-base md:text-lg leading-relaxed">
            Private, Muslim-friendly tours of Cape Town and the Western Cape —
            relaxed pacing, cultural sensitivity, and the best of the region in
            a way that respects your values.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {tiles.map((tile) => {
            const Icon = tile.icon
            return (
              <article
                key={tile.title}
                className="rounded-2xl bg-brand-cream-light border border-brand-cream-dark px-5 py-6 shadow-sm"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-green mb-4">
                  <Icon className="text-2xl" aria-hidden />
                </span>
                <h3 className="font-serif text-lg font-semibold text-brand-green mb-1.5">
                  {tile.title}
                </h3>
                <p className="text-sm text-brand-green/80 leading-relaxed">
                  {tile.body}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
