import type { PriceBreakdown } from './pricing'

/** POST /api/book body (guest checkout). Display currency must not affect this shape. */
export type BookSubmitBody = {
  booking_date: string
  start_time: string
  driver_id: string
  tour_id: string
  vehicle_id: string
  adult_count: number
  child_count: number
  client_name: string
  client_email: string
  client_phone?: string
  client_country?: string
  pickup_address?: string
  dietary_requirements?: string
  flight_number?: string
  special_requests?: string
  guest_consent_acknowledged?: boolean
}

/** Serializable checkout snapshot the /book flow relies on (ZAR cents only). */
export function serializeBookFlowCheckoutPayload(
  postBody: BookSubmitBody,
  breakdown: PriceBreakdown
): string {
  return JSON.stringify({
    postBody,
    yoco: {
      amount_cents: Math.round(breakdown.grand_total_cents),
      currency: 'ZAR',
    },
  })
}
