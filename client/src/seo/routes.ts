import { EXPERIENCE_DEFAULTS } from '../data/experienceDefaults'
import { FLOOR_TOURS, FLOOR_VEHICLES, getFloorTour } from '../data/catalogFloors'
import { formatZar, startingFromCents } from '../lib/pricing'
import {
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  DEFAULT_OG,
  SITE,
} from './siteConfig'

export type RouteMeta = {
  path: string
  title: string
  description: string
  ogImage?: string
  ogType?: 'website' | 'article'
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

export const HOME_META: RouteMeta = {
  path: '/',
  title: 'KhayrCape Experiences — Private Muslim-Friendly Cape Town Tours',
  description:
    'Private Cape Town tours with a registered local guide — City & Culture, Cape Peninsula, Halal-friendly Winelands, and Ocean Sunset experiences. Book online or WhatsApp.',
  ogType: 'website',
}

export const STATIC_PAGE_META: RouteMeta[] = [
  HOME_META,
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

export const EXPERIENCE_SLUGS = Object.keys(EXPERIENCE_DEFAULTS)

export function experienceMeta(slug: string): RouteMeta | null {
  const content = EXPERIENCE_DEFAULTS[slug]
  if (!content) return null

  const title =
    content.seo_title || `${content.display_name} — KhayrCape Experiences`
  const description =
    content.seo_description ||
    content.short_description ||
    content.hero_tagline ||
    `Book ${content.display_name} — private Cape Town tour with KhayrCape Experiences.`

  const ogImage = content.seo_image
    ? content.seo_image.startsWith('http')
      ? content.seo_image
      : `${SITE}${content.seo_image}`
    : content.hero_image?.startsWith('http')
      ? content.hero_image
      : `${SITE}${content.hero_image || '/cape-town-og.jpg'}`

  const floorTour = getFloorTour(slug)
  const fromCents = floorTour
    ? startingFromCents(floorTour, FLOOR_VEHICLES, 1)
    : undefined

  const jsonLd: Array<Record<string, unknown>> = [
    buildTouristTripJsonLd(slug, content, fromCents),
  ]

  if (content.faqs.length > 0) {
    jsonLd.push(buildFaqJsonLd(content.faqs))
  }

  return {
    path: `/experience/${slug}`,
    title,
    description,
    ogImage,
    ogType: 'article',
    jsonLd,
  }
}

export function allPrerenderRoutes(): RouteMeta[] {
  const experiences = EXPERIENCE_SLUGS.map((slug) => experienceMeta(slug)).filter(
    Boolean
  ) as RouteMeta[]

  return [
    {
      ...HOME_META,
      jsonLd: buildLocalBusinessJsonLd(),
    },
    ...STATIC_PAGE_META.filter((r) => r.path !== '/'),
    ...experiences,
  ]
}

export function buildLocalBusinessJsonLd(): Record<string, unknown> {
  const lowest = FLOOR_TOURS.reduce((min, tour) => {
    const cents = startingFromCents(tour, FLOOR_VEHICLES, 1)
    return cents < min ? cents : min
  }, Number.POSITIVE_INFINITY)

  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: BUSINESS_NAME,
    url: SITE,
    image: DEFAULT_OG,
    telephone: BUSINESS_PHONE,
    email: BUSINESS_EMAIL,
    description: HOME_META.description,
    areaServed: {
      '@type': 'City',
      name: 'Cape Town',
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'Western Cape',
      },
    },
    priceRange: lowest < Number.POSITIVE_INFINITY ? formatZar(lowest) : '$$',
    sameAs: [`https://wa.me/${BUSINESS_PHONE.replace('+', '')}`],
  }
}

export function buildFaqJsonLd(
  faqs: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function buildTouristTripJsonLd(
  slug: string,
  content: (typeof EXPERIENCE_DEFAULTS)[string],
  fromCents?: number
): Record<string, unknown> {
  const url = `${SITE}/experience/${slug}`
  const image = content.hero_image?.startsWith('http')
    ? content.hero_image
    : `${SITE}${content.hero_image || '/cape-town-og.jpg'}`

  const trip: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: content.display_name,
    description: content.short_description || content.hero_tagline,
    url,
    image,
    touristType: 'Private tour',
    provider: {
      '@type': 'TravelAgency',
      name: BUSINESS_NAME,
      url: SITE,
      telephone: BUSINESS_PHONE,
    },
  }

  if (fromCents != null && fromCents > 0) {
    trip.offers = {
      '@type': 'Offer',
      priceCurrency: 'ZAR',
      price: (fromCents / 100).toFixed(0),
      url: `${SITE}/book?tour=${slug}`,
      availability: 'https://schema.org/InStock',
    }
  }

  return trip
}
