import { useParams, Link } from 'react-router-dom'
import { HiOutlineClock, HiOutlineCurrencyDollar } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { tours } from '../data/tours'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const BOOK_WHATSAPP_URL = 'https://wa.link/d96tsl'

export default function TourDetail() {
  const { tourId } = useParams<{ tourId: string }>()
  const tour = tours.find((t) => t.id === tourId)

  if (!tour) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-green mb-4">Tour not found</h1>
          <Link to="/" className="text-brand-green underline">Back to home</Link>
        </div>
      </div>
    )
  }

  const bookUrl = `${BOOK_WHATSAPP_URL}?text=${encodeURIComponent(`Hi! I'd like to book the ${tour.title} with KhayrCape Experiences.`)}`

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-cream">
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
          <Link to="/" className="inline-flex text-brand-green hover:underline text-sm mb-6">
            ← Back to tours
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold text-brand-green mb-6">
            {tour.title}
          </h1>

          <div className="aspect-video rounded-lg overflow-hidden bg-brand-cream-dark/30 mb-6">
            <img src={tour.image} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <p className="flex items-center gap-2 text-brand-green/90 text-sm">
              <HiOutlineClock className="text-lg flex-shrink-0" />
              {tour.duration}
            </p>
            <p className="flex items-center gap-2 text-brand-green/90 text-sm">
              <HiOutlineCurrencyDollar className="text-lg flex-shrink-0" />
              {tour.price}
            </p>
          </div>

          <div className="space-y-6 mb-10">
            <div>
              <h2 className="font-semibold text-brand-green mb-2">Overview</h2>
              <p className="text-brand-green/90">{tour.fullDescription}</p>
            </div>
            <div>
              <h2 className="font-semibold text-brand-green mb-2">Itinerary</h2>
              <ol className="list-decimal list-inside space-y-2 text-brand-green/90">
                {tour.itinerary.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <a
            href={bookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-lg transition-colors shadow-lg"
          >
            <FaWhatsapp className="text-2xl" />
            Book — WhatsApp +27 82 327 7446
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}
