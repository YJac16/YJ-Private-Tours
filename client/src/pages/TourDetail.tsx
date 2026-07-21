import { Navigate, Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { catalogSlugForTourId } from '../lib/tourSlugs'

export default function TourDetail() {
  const { tourId } = useParams<{ tourId: string }>()

  if (!tourId) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-green mb-4">
              Tour not found
            </h1>
            <Link to="/" className="text-brand-green underline">
              Back to home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const slug = catalogSlugForTourId(tourId)
  return <Navigate to={`/experience/${slug}`} replace />
}
