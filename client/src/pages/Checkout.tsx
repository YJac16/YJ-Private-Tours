import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { catalogSlugForTourId } from '../lib/tourSlugs'

/** Legacy checkout URLs redirect to the full booking flow with dynamic pax pricing. */
export default function Checkout() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const slug = tourId ? catalogSlugForTourId(tourId) : ''
  const qs = new URLSearchParams()
  if (slug) qs.set('tour', slug)
  if (searchParams.get('cancelled') === '1') qs.set('cancelled', '1')
  const target = qs.toString() ? `/book?${qs}` : '/book'
  return <Navigate to={target} replace />
}
