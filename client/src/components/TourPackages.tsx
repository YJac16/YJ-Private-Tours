import { HiOutlineClock, HiOutlineUserGroup } from 'react-icons/hi'

const packages = [
  {
    id: 'cape-peninsula',
    title: 'Cape Peninsula Private Tour (Half-Day)',
    description: 'Scenic drive along the peninsula with iconic views, beaches, and optional penguin colony visit. Perfect for a relaxed half-day outing.',
    duration: 'Half-day (approx. 4–5 hours)',
    image: '/cape-point.jpg',
  },
  {
    id: 'bo-kaap',
    title: 'Bo-Kaap & Cultural Heritage Tour',
    description: 'Explore the colourful Bo-Kaap, learn about Cape Malay heritage, and discover the history and culture of this unique neighbourhood.',
    duration: 'Half-day (approx. 3–4 hours)',
    image: '/bo-kaap.jpg',
  },
  {
    id: 'winelands',
    title: 'Cape Winelands Tour (Halal-friendly options)',
    description: 'Visit the winelands with halal-friendly stops, scenic drives, and optional non-alcoholic experiences. Family-friendly and flexible.',
    duration: 'Full day (approx. 6–8 hours)',
    image: '/winelands.jpg',
  },
]

export default function TourPackages() {
  return (
    <section id="tours" className="py-16 md:py-24 bg-stone-100 px-4 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4 text-center">
          Tour Packages
        </h2>
        <p className="text-stone-600 text-center mb-12 max-w-2xl mx-auto">
          All tours are private and tailored to your pace and interests.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <article
              key={pkg.id}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-stone-200 hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden bg-stone-200">
                <img
                  src={pkg.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 mb-2">
                  <HiOutlineUserGroup className="text-lg" />
                  Private Tour
                </span>
                <h3 className="text-xl font-bold text-stone-800 mb-3">
                  {pkg.title}
                </h3>
                <p className="text-stone-600 mb-4 flex-1">
                  {pkg.description}
                </p>
                <p className="flex items-center gap-2 text-stone-500 text-sm mb-6">
                  <HiOutlineClock className="text-lg flex-shrink-0" />
                  {pkg.duration}
                </p>
                <a
                  href="#enquiry"
                  className="block w-full text-center px-4 py-3 bg-stone-700 hover:bg-stone-800 text-white font-medium rounded-lg transition-colors"
                >
                  Enquiry
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
