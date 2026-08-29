import { Link } from 'react-router-dom'
import { galleryImages } from '../data/gallery'

const PREVIEW_COUNT = 3

export default function Gallery() {
  const previewImages = galleryImages.slice(0, PREVIEW_COUNT)

  return (
    <section
      id="gallery"
      className="py-20 md:py-28 bg-brand-cream px-4 scroll-mt-28 md:scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-brand-green mb-4 text-center">
          Gallery
        </h2>
        <p className="text-brand-green/90 text-center mb-10 md:mb-12 max-w-2xl mx-auto">
          Scenes from Cape Town and the Western Cape.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
          {previewImages.map((img, i) => (
            <figure
              key={i}
              className="rounded-2xl overflow-hidden bg-brand-cream-dark/30 shadow-md"
            >
              <div className="aspect-square">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="sr-only">{img.alt}</figcaption>
            </figure>
          ))}
        </div>
        <div className="text-center">
          <Link
            to="/gallery"
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-2xl transition-colors shadow-md"
          >
            View full gallery
          </Link>
        </div>
      </div>
    </section>
  )
}
