import { NextResponse } from 'next/server'
import { mockDb, useMockStore } from '@/lib/mock-store'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  calculatePrice,
  DEFAULT_BOOKING_SETTINGS,
  generateBookingReference,
  parseBookingSettings,
  validateBookingGuests,
  type PricingTour,
  type PricingVehicle,
} from '@/lib/pricing'
import { createYocoCheckout } from '@/lib/yoco'
import { notifyDriverBooking } from '@/lib/notify'

function normalizeTime(t: string) {
  return t.slice(0, 5)
}

async function loadPricingContext(
  tour_id: string,
  vehicle_id: string,
  driver_id: string
) {
  const [{ data: tour }, { data: vehicle }, { data: driver }, { data: settingsRow }] =
    await Promise.all([
      supabaseAdmin
        .from('tours')
        .select(
          'id, name, slug, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests'
        )
        .eq('id', tour_id)
        .single(),
      supabaseAdmin
        .from('vehicles')
        .select(
          'id, name, slug, capacity_min, capacity_max, vehicle_price_cents, vehicle_surcharge_cents, is_luxury'
        )
        .eq('id', vehicle_id)
        .single(),
      supabaseAdmin
        .from('drivers')
        .select('id, name, full_name')
        .eq('id', driver_id)
        .single(),
      supabaseAdmin.from('app_settings').select('value').eq('key', 'booking').maybeSingle(),
    ])

  if (!tour || !vehicle) throw new Error('Invalid tour or vehicle')
  if (!driver) throw new Error('Invalid driver')

  const settings = parseBookingSettings(
    (settingsRow?.value as Record<string, unknown>) || DEFAULT_BOOKING_SETTINGS
  )

  return {
    tour: {
      ...tour,
      price_per_person_cents:
        tour.price_per_person_cents ?? tour.additional_guest_price_cents ?? 0,
    } as PricingTour & { name: string },
    vehicle: {
      ...vehicle,
      vehicle_price_cents:
        vehicle.vehicle_price_cents ?? vehicle.vehicle_surcharge_cents ?? 0,
    } as PricingVehicle,
    driver,
    settings,
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.YOCO_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment is not configured (missing YOCO_SECRET_KEY).' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const booking_date = String(body.booking_date || '')
    const start_time = String(body.start_time || '')
    const driver_id = String(body.driver_id || '')
    const tour_id = String(body.tour_id || '')
    const vehicle_id = String(body.vehicle_id || '')
    const client_name = String(body.client_name || '')
    const client_email = String(body.client_email || '')
    const client_phone = body.client_phone ? String(body.client_phone) : null
    const client_country = body.client_country ? String(body.client_country) : null
    const pickup_address = body.pickup_address ? String(body.pickup_address) : null
    const dietary_requirements = body.dietary_requirements
      ? String(body.dietary_requirements)
      : null
    const flight_number = body.flight_number ? String(body.flight_number) : null
    const special_requests = body.special_requests
      ? String(body.special_requests)
      : null
    const notes = body.notes ? String(body.notes) : special_requests
    const adult_count = Math.round(Number(body.adult_count ?? body.guest_count) || 1)
    const child_count = Math.round(Number(body.child_count) || 0)

    if (
      !booking_date ||
      !start_time ||
      !driver_id ||
      !tour_id ||
      !vehicle_id ||
      !client_name ||
      !client_email
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const booking_reference = generateBookingReference()

    if (useMockStore()) {
      const catalog = mockDb.catalog()
      const tour = catalog.tours.find((t) => t.id === tour_id)
      const vehicle = catalog.vehicles.find((v) => v.id === vehicle_id)
      const driver = catalog.drivers.find((d) => d.id === driver_id)
      if (!tour || !vehicle) {
        return NextResponse.json({ error: 'Invalid tour or vehicle' }, { status: 400 })
      }

      const guestError = validateBookingGuests(
        adult_count,
        child_count,
        tour,
        vehicle,
        catalog.settings
      )
      if (guestError) return NextResponse.json({ error: guestError }, { status: 400 })

      const breakdown = calculatePrice(tour, vehicle, adult_count, child_count)

      const booking = mockDb.createBooking({
        booking_date,
        start_time,
        driver_id,
        tour_id,
        vehicle_id,
        client_name,
        client_email,
        client_phone,
        client_country,
        pickup_address,
        dietary_requirements,
        flight_number,
        special_requests,
        notes,
        adult_count: breakdown.adult_count,
        child_count: breakdown.child_count,
        passenger_count: breakdown.passenger_count,
        guest_count: breakdown.passenger_count,
        vehicle_price_cents: breakdown.vehicle_price_cents,
        price_per_person_cents: breakdown.price_per_person_cents,
        passenger_total_cents: breakdown.passenger_total_cents,
        grand_total_cents: breakdown.grand_total_cents,
        final_price_cents: breakdown.final_price_cents,
        booking_reference,
        driver_name_snapshot: driver?.full_name || driver?.name,
        vehicle_name_snapshot: vehicle.name,
        tour_name_snapshot: tour.name,
      })

      const checkout = await createYocoCheckout({
        amountCents: breakdown.grand_total_cents,
        bookingId: booking.id,
        clientName: client_name,
        clientEmail: client_email,
        tourName: tour.name,
      })
      mockDb.recordPayment({
        booking_id: booking.id,
        amount_cents: breakdown.grand_total_cents,
        external_id: checkout.id,
        status: 'pending',
      })
      void notifyDriverBooking(
        {
          bookingId: booking.id,
          status: 'pending',
          bookingDate: booking_date,
          startTime: start_time,
          clientName: client_name,
          clientEmail: client_email,
          clientPhone: client_phone,
          tourName: tour.name,
          vehicleName: vehicle.name,
          driverName: driver?.full_name || driver?.name,
          notes: special_requests || notes,
          amountCents: breakdown.grand_total_cents,
        },
        'created'
      )
      return NextResponse.json({
        success: true,
        booking_id: booking.id,
        booking_reference,
        payment: true,
        amount_cents: breakdown.grand_total_cents,
        pricing: breakdown,
        checkout_url: checkout.redirectUrl,
        checkout_id: checkout.id,
        mock: true,
      })
    }

    const time = normalizeTime(start_time)
    const { tour, vehicle, driver, settings } = await loadPricingContext(
      tour_id,
      vehicle_id,
      driver_id
    )

    const guestError = validateBookingGuests(
      adult_count,
      child_count,
      tour,
      vehicle,
      settings
    )
    if (guestError) return NextResponse.json({ error: guestError }, { status: 400 })

    const breakdown = calculatePrice(tour, vehicle, adult_count, child_count)
    const driverName = driver.full_name || driver.name

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        booking_date,
        start_time: time,
        driver_id,
        tour_id,
        vehicle_id,
        client_name,
        client_email,
        client_phone,
        client_country,
        pickup_address,
        dietary_requirements,
        flight_number,
        special_requests,
        notes,
        status: 'pending',
        payment_status: 'pending',
        trip_status: 'scheduled',
        guest_count: breakdown.passenger_count,
        adult_count: breakdown.adult_count,
        child_count: breakdown.child_count,
        passenger_count: breakdown.passenger_count,
        vehicle_price_cents: breakdown.vehicle_price_cents,
        price_per_person_cents: breakdown.price_per_person_cents,
        passenger_total_cents: breakdown.passenger_total_cents,
        grand_total_cents: breakdown.grand_total_cents,
        final_price_cents: breakdown.final_price_cents,
        booking_reference,
        driver_name_snapshot: driverName,
        vehicle_name_snapshot: vehicle.name,
        tour_name_snapshot: tour.name,
      })
      .select()
      .single()

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 400 })
    }

    const checkout = await createYocoCheckout({
      amountCents: breakdown.grand_total_cents,
      bookingId: booking.id,
      clientName: client_name,
      clientEmail: client_email,
      tourName: tour.name,
    })

    await supabaseAdmin.from('payments').insert({
      booking_id: booking.id,
      status: 'pending',
      amount_cents: breakdown.grand_total_cents,
      currency: 'ZAR',
      external_id: checkout.id,
    })

    await supabaseAdmin
      .from('bookings')
      .update({ yoco_payment_reference: checkout.id })
      .eq('id', booking.id)

    void notifyDriverBooking(
      {
        bookingId: booking.id,
        status: 'pending',
        bookingDate: booking_date,
        startTime: time,
        clientName: client_name,
        clientEmail: client_email,
        clientPhone: client_phone,
        tourName: tour.name,
        vehicleName: vehicle.name,
        driverName,
        notes: special_requests || notes,
        amountCents: breakdown.grand_total_cents,
      },
      'created'
    )

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      booking_reference,
      payment: true,
      amount_cents: breakdown.grand_total_cents,
      pricing: breakdown,
      checkout_url: checkout.redirectUrl,
      checkout_id: checkout.id,
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Booking failed' },
      { status: 400 }
    )
  }
}
