/** Shared experience content model (catalog + admin + detail pages). */

export type TimelineStop = {
  title: string
  description: string
  duration?: string
  icon?: string
  image?: string
}

export type FaqItem = {
  question: string
  answer: string
}

export type ExperienceContent = {
  display_name: string
  short_description: string
  hero_tagline: string
  detailed_description: string
  hero_image: string
  gallery_images: string[]
  timeline: TimelineStop[]
  included: string[]
  excluded: string[]
  perfect_for: string[]
  good_to_know: string[]
  faqs: FaqItem[]
  map_embed_url: string
  seo_title: string
  seo_description: string
  seo_image: string
  pricing_notes: string
  duration_label: string
}

export const DEFAULT_HIGHLIGHTS = [
  'Private Guided Experience',
  'Registered Professional Tourist Guide',
  'Comfortable Air-Conditioned Vehicle',
  'Hotel / Airbnb Pickup & Drop-off',
  'Flexible Itinerary',
  'Photography Stops',
  'Local Cultural Insights',
  'Complimentary Bottled Water',
] as const

export const PRICE_INFO_TEXT =
  'Your final tour price is calculated based on the number of guests and your selected private vehicle. Vehicle pricing is shown during checkout.'
