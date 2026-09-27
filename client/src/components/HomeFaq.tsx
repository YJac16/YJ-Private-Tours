import { Link } from 'react-router-dom'
import { HOME_CUSTOM_TOUR_FAQ } from '../data/customToursCopy'

export default function HomeFaq() {
  const { question, answerBeforeLink, answerAfterLink } = HOME_CUSTOM_TOUR_FAQ
  return (
    <section id="faq" className="py-14 md:py-20 px-4 bg-brand-cream">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-green mb-8 text-center">
          FAQ
        </h2>
        <div className="bg-brand-cream-light border border-brand-cream-dark rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-bold text-brand-green text-lg mb-2">{question}</h3>
          <p className="text-brand-green/90 text-sm sm:text-base leading-relaxed">
            {answerBeforeLink}
            <Link to="/custom-tours" className="font-semibold underline underline-offset-2">
              /custom-tours
            </Link>
            {answerAfterLink}
          </p>
        </div>
      </div>
    </section>
  )
}
