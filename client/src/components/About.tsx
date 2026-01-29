export default function About() {
  return (
    <section id="about" className="py-16 md:py-24 bg-brand-cream-light px-4 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-8 text-center">
          About KhayrCape Experiences
        </h2>
        <p className="text-brand-green/90 text-lg leading-relaxed mb-6">
          KhayrCape Experiences offers private, Muslim-friendly tours of Cape Town and the Western Cape.
          We focus on relaxed pacing, cultural sensitivity, and showing you the best of the region in a
          way that respects your values and preferences.
        </p>
        <ul className="space-y-3 text-brand-green/90">
          <li className="flex items-start gap-2">
            <span className="text-brand-green/70 mt-1">•</span>
            <span><strong className="text-brand-green">Private tours</strong> — Your group only, no strangers.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-green/70 mt-1">•</span>
            <span><strong className="text-brand-green">Family-friendly pacing</strong> — No rush; time for rest and reflection.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-green/70 mt-1">•</span>
            <span><strong className="text-brand-green">Cultural sensitivity</strong> — Halal-friendly options and awareness of your needs.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-green/70 mt-1">•</span>
            <span><strong className="text-brand-green">Pre-booked only</strong> — All tours are arranged in advance for a smooth experience.</span>
          </li>
        </ul>
      </div>
    </section>
  )
}
