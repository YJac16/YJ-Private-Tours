/** Local fleet photos used on experience pages — prefer these over catalog scenery. */
export const VEHICLE_PHOTOS: Record<string, string> = {
  suzuki: '/Suzuki XL6.jpg',
  corolla: '/Toyota Corolla Cross.jpg',
  mercedes: '/Mercedes Benz.png',
}

export function vehiclePhotoUrl(vehicle: {
  slug?: string | null
  image_url?: string | null
  name?: string | null
}): string {
  const slug = (vehicle.slug || '').toLowerCase()
  if (VEHICLE_PHOTOS[slug]) return VEHICLE_PHOTOS[slug]
  const name = (vehicle.name || '').toLowerCase()
  if (name.includes('suzuki')) return VEHICLE_PHOTOS.suzuki
  if (name.includes('corolla')) return VEHICLE_PHOTOS.corolla
  if (name.includes('mercedes') || name.includes('glc')) {
    return VEHICLE_PHOTOS.mercedes
  }
  return vehicle.image_url || VEHICLE_PHOTOS.suzuki
}
