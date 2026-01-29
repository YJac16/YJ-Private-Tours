import { HiOutlineCheckCircle } from 'react-icons/hi'

const points = [
  'Private & flexible tours — your group, your pace',
  'Muslim-friendly & family-aware — halal options and cultural sensitivity',
  'Relaxed pacing — no rushing; time to enjoy each stop',
  'Local expertise — qualified guide who knows Cape Town and the region',
]

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="py-16 md:py-24 bg-brand-cream-light px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-10 text-center">
          Why Choose Us
        </h2>
        <ul className="space-y-4">
          {points.map((point, i) => (
            <li key={i} className="flex items-start gap-3">
              <HiOutlineCheckCircle className="text-brand-green text-2xl flex-shrink-0 mt-0.5" />
              <span className="text-brand-green/90 text-lg">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
