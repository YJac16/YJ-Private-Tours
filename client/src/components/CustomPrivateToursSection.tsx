import { Link } from 'react-router-dom'
import { HOME_CUSTOM_TOURS_BLURB } from '../data/customToursCopy'

export default function CustomPrivateToursSection() {
  return (
    <section
      id="custom-tours-home"
      className="py-14 md:py-20 px-4 bg-brand-green text-brand-cream"
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Custom private tours</h2>
        <p className="text-brand-cream/90 text-base md:text-lg leading-relaxed mb-8">
          {HOME_CUSTOM_TOURS_BLURB}
        </p>
        <Link
          to="/custom-tours"
          className="inline-flex items-center justify-center min-h-12 px-8 py-3 bg-brand-gold hover:bg-brand-gold/90 text-brand-green font-semibold rounded-xl transition-colors shadow-md"
        >
          Plan a custom tour
        </Link>
      </div>
    </section>
  )
}
