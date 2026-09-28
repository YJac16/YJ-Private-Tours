/**
 * Pure POST /api/book JSON body (matches BookPage.handlePay). No display currency.
 */

export type CreateBookingRequestBody = {
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

export type BuildCreateBookingRequestBodyInput = {
  booking_date: string
  start_time: string
  driver_id: string
  tour_id: string
  vehicle_id: string
  peopleCount: number
  name: string
  email: string
  phone: string
  country: string
  pickupAddress: string
  dietary: string
  flightNumber: string
  specialRequests: string
  accessToken: string | null | undefined
  guestConsentAck: boolean
}

/** Exact field construction previously inlined in BookPage.handlePay. */
export function buildCreateBookingRequestBody(
  input: BuildCreateBookingRequestBodyInput
): CreateBookingRequestBody {
  return {
    booking_date: input.booking_date,
    start_time: input.start_time,
    driver_id: input.driver_id,
    tour_id: input.tour_id,
    vehicle_id: input.vehicle_id,
    adult_count: input.peopleCount,
    child_count: 0,
    client_name: input.name.trim(),
    client_email: input.email.trim(),
    client_phone: input.phone.trim(),
    client_country: input.country.trim() || undefined,
    pickup_address: input.pickupAddress.trim(),
    dietary_requirements: input.dietary.trim() || undefined,
    flight_number: input.flightNumber.trim() || undefined,
    special_requests: input.specialRequests.trim() || undefined,
    guest_consent_acknowledged: !input.accessToken
      ? input.guestConsentAck
      : undefined,
  }
}
