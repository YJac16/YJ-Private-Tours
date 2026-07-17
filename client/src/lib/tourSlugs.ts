/** Map legacy marketing tour ids to Supabase catalog slugs. */
export const LEGACY_TOUR_SLUGS: Record<string, string> = {
  'cape-peninsula': 'peninsula',
  'bo-kaap': 'city',
  winelands: 'winelands',
  sunset: 'sunset',
  city: 'city',
  peninsula: 'peninsula',
}

export function catalogSlugForTourId(tourId: string): string {
  return LEGACY_TOUR_SLUGS[tourId] || tourId
}
