import type { ExperienceContent } from './experienceTypes'
import { mergeExperienceContent } from '../data/experienceDefaults'
import type { Tour } from './bookingApi'

/** Build merged experience content from catalog tour + defaults. */
export function resolveExperienceContent(tour: Tour): ExperienceContent | null {
  const slug = tour.slug || ''
  const ec = tour.experience_content

  const override: Partial<ExperienceContent> = {
    display_name: ec?.display_name || undefined,
    short_description:
      ec?.short_description ||
      tour.short_description ||
      tour.description ||
      undefined,
    hero_tagline: ec?.hero_tagline || tour.hero_tagline || undefined,
    detailed_description:
      ec?.detailed_description || tour.detailed_description || undefined,
    hero_image:
      ec?.hero_image ||
      tour.hero_image_url ||
      tour.image_url ||
      undefined,
    gallery_images:
      ec?.gallery_images || tour.gallery_images || undefined,
    timeline: ec?.timeline,
    included: ec?.included || tour.included_items || undefined,
    excluded: ec?.excluded || tour.excluded_items || undefined,
    perfect_for: ec?.perfect_for || tour.perfect_for || undefined,
    good_to_know: ec?.good_to_know || tour.good_to_know || undefined,
    faqs: ec?.faqs,
    map_embed_url: ec?.map_embed_url || tour.map_embed_url || undefined,
    seo_title: ec?.seo_title || tour.seo_title || undefined,
    seo_description: ec?.seo_description || tour.seo_description || undefined,
    seo_image: ec?.seo_image || tour.seo_image || undefined,
    pricing_notes: ec?.pricing_notes || tour.pricing_notes || undefined,
    duration_label: (() => {
      const fromCatalog = ec?.duration_label || tour.duration_label
      if (slug === 'hermanus' && fromCatalog && /5\s*[–-]\s*6/.test(fromCatalog)) {
        return undefined
      }
      return fromCatalog || undefined
    })(),
  }

  // Strip undefined so merge keeps defaults
  const cleaned = Object.fromEntries(
    Object.entries(override).filter(([, v]) => v !== undefined)
  ) as Partial<ExperienceContent>

  const merged = mergeExperienceContent(slug, cleaned)
  if (!merged) return null

  // Prefer live catalog display name when defaults use marketing titles
  if (!ec?.display_name && tour.name && !cleaned.display_name) {
    // keep marketing display_name from defaults when present
  }
  return merged
}
