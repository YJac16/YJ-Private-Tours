/**
 * Build-time export of route SEO metadata for prerender + sitemap scripts.
 * Source of truth lives in client/src/seo/routes.ts — keep slugs/descriptions aligned.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'client', 'seo-manifest.json')

const SITE = 'https://khayrcapeexperiences.com'

const HOME = {
  path: '/',
  title: 'KhayrCape Experiences — Private Muslim-Friendly Cape Town Tours',
  description:
    'Private Cape Town tours with a registered local guide — City & Culture, Cape Peninsula, Halal-friendly Winelands, and Ocean Sunset experiences. Book online or WhatsApp.',
  ogType: 'website',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'KhayrCape Experiences',
    url: SITE,
    image: `${SITE}/cape-town-og.jpg`,
    telephone: '+27823277446',
    email: 'hello.khayrcapeexperiences@gmail.com',
    description:
      'Private Cape Town tours with a registered local guide — City & Culture, Cape Peninsula, Halal-friendly Winelands, and Ocean Sunset experiences. Book online or WhatsApp.',
    areaServed: {
      '@type': 'City',
      name: 'Cape Town',
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Western Cape' },
    },
    priceRange: 'R2,900',
    sameAs: ['https://wa.me/27823277446'],
  },
}

const STATIC = [
  HOME,
  {
    path: '/book',
    title: 'Book a Private Tour — KhayrCape Experiences',
    description:
      'Book your private Cape Town tour online. Choose your experience, date, vehicle, and pay securely with Yoco — no account required.',
  },
  {
    path: '/gallery',
    title: 'Gallery — KhayrCape Experiences',
    description:
      'Photos from Cape Town and the Western Cape — scenes from private tours with KhayrCape Experiences.',
  },
  {
    path: '/terms',
    title: 'Terms & Conditions — KhayrCape Experiences',
    description:
      'Booking terms, cancellation policy, and conditions for private Cape Town tours with KhayrCape Experiences.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy — KhayrCape Experiences',
    description:
      'How KhayrCape Experiences collects, uses, and protects your personal information under POPIA (South Africa).',
  },
  {
    path: '/cookies',
    title: 'Cookie Policy — KhayrCape Experiences',
    description:
      'How KhayrCape Experiences uses cookies and browser storage for sign-in, bookings, and site preferences.',
  },
]

const EXPERIENCES = {
  city: {
    title: 'Cape Town City & Culture Experience | Khayr Cape Experiences',
    description:
      'Private Cape Town city tour with Bo-Kaap, Signal Hill, historic landmarks, and hotel pickup. Book online with Khayr Cape Experiences.',
    ogImage: `${SITE}/experiences/bo-kaap.jpg`,
    display_name: 'Cape Town City & Culture Experience',
    short_description:
      'A private introduction to Cape Town’s colourful heritage, viewpoints, and historic city centre.',
    hero_tagline:
      'Discover Bo-Kaap, Signal Hill, and the city’s cultural heart with a registered local guide.',
    hero_image: '/experiences/bo-kaap.jpg',
    fromPrice: 2900,
    faqs: [
      {
        question: 'How long is the experience?',
        answer:
          'This experience typically lasts 3–4 hours. Exact timing can flex slightly with traffic, photo stops, and your preferred pace.',
      },
    ],
  },
  peninsula: {
    title: 'Cape Peninsula Experience | Khayr Cape Experiences',
    description:
      'Private Cape Peninsula tour with Chapman’s Peak and Cape Point. Flexible pacing, hotel pickup, and online booking.',
    ogImage: `${SITE}/experiences/cape-point.jpg`,
    display_name: 'Cape Peninsula Experience',
    short_description:
      'Scenic coastal cliffs, Cape Point drama, and Atlantic beauty on a private peninsula journey.',
    hero_tagline:
      'Chapman’s Peak, Cape Point, and ocean vistas — privately guided at your pace.',
    hero_image: '/experiences/cape-point.jpg',
    fromPrice: 3400,
    faqs: [],
  },
  sunset: {
    title: 'Ocean Sunset Experience | Khayr Cape Experiences',
    description:
      'Private Atlantic Seaboard sunset experience in Cape Town with Camps Bay viewpoints and hotel pickup.',
    ogImage: `${SITE}/experiences/camps-bay-cape-town.jpg`,
    display_name: 'Ocean Sunset Experience',
    short_description:
      'Golden-hour Atlantic Seaboard views, Camps Bay light, and relaxed sunset photography.',
    hero_tagline:
      'Watch the Atlantic turn gold — a private late-afternoon coastal experience.',
    hero_image: '/experiences/camps-bay-cape-town.jpg',
    fromPrice: 3000,
    faqs: [],
  },
  winelands: {
    title: 'Halal-Friendly Winelands Experience | Khayr Cape Experiences',
    description:
      'Private Stellenbosch and Franschhoek winelands experience with halal-aware options, hotel pickup, and flexible pacing.',
    ogImage: `${SITE}/experiences/unsplash-franschhoek-vineyard-mountains.jpg`,
    display_name: 'Halal-Friendly Winelands Experience',
    short_description:
      'Scenic Stellenbosch and Franschhoek landscapes with halal-aware pacing and private comfort.',
    hero_tagline:
      'Mountain valleys, vineyard scenery, and flexible halal-friendly stops — privately guided.',
    hero_image: '/experiences/unsplash-franschhoek-vineyard-mountains.jpg',
    fromPrice: 3300,
    faqs: [],
  },
  hermanus: {
    title: 'Hermanus Whale Experience from Cape Town | KhayrCape Experiences',
    description:
      'Experience Hermanus during whale season with a private day experience from Cape Town, including private transport, a qualified local guide, scenic coastal sightseeing and land-based whale-viewing opportunities.',
    ogImage: `${SITE}/experiences/hermanus-cliff-path-coast.jpg`,
    display_name: 'Hermanus Whale Experience',
    short_description: 'A Private Whale-Season Journey from Cape Town',
    hero_tagline:
      'Discover Hermanus during whale season with private transport, a qualified local guide and a relaxed day exploring the spectacular Whale Coast.',
    hero_image: '/experiences/hermanus-cliff-path-coast.jpg',
    fromPrice: 5900,
    faqs: [
      {
        question: 'Is the boat tour included?',
        answer:
          'No. The whale-watching boat experience is not included in the KhayrCape tour price.',
      },
    ],
  },
}

function touristTrip(slug, exp) {
  const url = `${SITE}/experience/${slug}`
  const image = exp.hero_image.startsWith('http')
    ? exp.hero_image
    : `${SITE}${exp.hero_image}`

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: exp.display_name,
    description: exp.short_description || exp.hero_tagline,
    url,
    image,
    touristType: 'Private tour',
    provider: {
      '@type': 'TravelAgency',
      name: 'KhayrCape Experiences',
      url: SITE,
      telephone: '+27823277446',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ZAR',
      price: String(exp.fromPrice),
      url: `${SITE}/book?tour=${slug}`,
      availability: 'https://schema.org/InStock',
    },
  }
}

function faqPage(faqs) {
  if (!faqs?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

const experienceRoutes = Object.entries(EXPERIENCES).map(([slug, exp]) => {
  const jsonLd = [touristTrip(slug, exp)]
  const faq = faqPage(exp.faqs)
  if (faq) jsonLd.push(faq)

  return {
    path: `/experience/${slug}`,
    title: exp.title,
    description: exp.description,
    ogImage: exp.ogImage,
    ogType: 'article',
    jsonLd,
  }
})

const manifest = [...STATIC, ...experienceRoutes]
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2))
console.log(`generate-seo-manifest: wrote ${manifest.length} routes to ${OUT}`)
