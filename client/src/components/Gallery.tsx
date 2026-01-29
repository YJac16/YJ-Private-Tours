import { galleryImages } from '../data/gallery'

const PREVIEW_COUNT = 3

export default function Gallery() {
  const previewImages = galleryImages.slice(0, PREVIEW_COUNT)

  return (
    <section id="gallery" className="py-16 md:py-24 bg-brand-cream px-4 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-4 text-center">
          Gallery
        </h2>
        <p className="text-brand-green/90 text-center mb-12 max-w-2xl mx-auto">
          Scenes from Cape Town and the Western Cape.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
          {previewImages.map((img, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg overflow-hidden bg-brand-cream-dark/30 shadow-md hover:shadow-lg transition-shadow"
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
        <div className="text-center">
          <a
            href="/gallery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-lg transition-colors shadow-md"
          >
            View full gallery
          </a>
        </div>
      </div>
    </section>
  )
}
