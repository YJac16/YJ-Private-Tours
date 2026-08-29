import { EXPERIENCE_DEFAULTS } from '../data/experienceDefaults'

const STALE_HERMANUS = /5\s*[–-]\s*6/

/** Single display source for tour durations. Hermanus is a full day from Cape Town. */
export function displayDurationLabel(
  slug: string | null | undefined,
  catalogLabel?: string | null
): string {
  const defaults = slug ? EXPERIENCE_DEFAULTS[slug] : undefined
  if (slug === 'hermanus') {
    if (catalogLabel && !STALE_HERMANUS.test(catalogLabel)) {
      return catalogLabel
    }
    return defaults?.duration_label || 'Full Day · 8–10 hours'
  }
  return catalogLabel || defaults?.duration_label || ''
}
