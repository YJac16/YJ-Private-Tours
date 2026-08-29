import { Link } from 'react-router-dom'
import { galleryImages } from '../data/gallery'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function GalleryPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-cream">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex text-brand-green hover:underline text-sm mb-6"
          >
            ← Back to home
          </Link>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-brand-green mb-4 text-center">
            Gallery
          </h1>
          <p className="text-brand-green/90 text-center mb-10 max-w-2xl mx-auto">
            Scenes from Cape Town and the Western Cape.
          </p>
          <div className="columns-2 md:columns-3 gap-3 md:gap-4">
            {galleryImages.map((img, i) => (
              <figure
                key={i}
                className="mb-3 md:mb-4 break-inside-avoid rounded-2xl overflow-hidden bg-brand-cream-dark/20"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-auto object-cover rounded-2xl"
                  loading="lazy"
                />
                <figcaption className="mt-2 mb-1 px-0.5 text-xs sm:text-sm text-brand-green/75">
                  {img.alt}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
