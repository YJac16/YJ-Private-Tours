import { Link } from 'react-router-dom'
import { galleryImages } from '../data/gallery'
import Footer from '../components/Footer'

export default function GalleryPage() {
  return (
    <>
      <main className="min-h-screen bg-brand-cream">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <Link to="/" className="inline-flex text-brand-green hover:underline text-sm mb-6">
            ← Back to home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-green mb-4 text-center">
            Gallery
          </h1>
          <p className="text-brand-green/90 text-center mb-10 max-w-2xl mx-auto">
            Scenes from Cape Town and the Western Cape.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg overflow-hidden bg-brand-cream-dark/30 shadow-md"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
