import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import {
  calculatePrice,
  DEFAULT_BOOKING_SETTINGS,
  generateBookingReference,
  parseBookingSettings,
  validateBookingGuests,
  type PricingTour,
  type PricingVehicle,
} from '../booking-app/lib/pricing'
import { isTourPubliclyVisible } from '../booking-app/lib/seasonalVisibility'
import { createYocoCheckout } from '../booking-app/lib/yoco'
import { notifyDriverBooking } from '../booking-app/lib/notify'
import { expireStalePendingBookings } from '../booking-app/lib/booking-lifecycle'
import { methodNotAllowed, readJson } from './_lib/http'
import { getAuthContext } from './_lib/authUser'

function headerValue(req: VercelRequest, name: string): string {
  const raw = req.headers[name.toLowerCase()]
  return Array.isArray(raw) ? String(raw[0] || '') : String(raw || '')
}

function isSlotConflictMessage(msg: string) {
  return /already reserved|already booked|duplicate key|unique/i.test(msg)
}

function normalizeTime(t: string) {
  return t.slice(0, 5)
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function loadPricingContext(
  sb: ReturnType<typeof supabaseAdmin>,
  tour_id: string,
  vehicle_id: string,
  driver_id: string
) {
  const [{ data: tour }, { data: vehicle }, { data: driver }, { data: settingsRow }] =
    await Promise.all([
      sb
        .from('tours')
        .select(
          'id, name, slug, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests, admin_meta'
        )
        .eq('id', tour_id)
        .single(),
      sb
        .from('vehicles')
        .select(
          'id, name, slug, capacity_min, capacity_max, vehicle_price_cents, vehicle_surcharge_cents, is_luxury'
        )
        .eq('id', vehicle_id)
        .single(),
      sb
        .from('drivers')
        .select('id, name, full_name')
        .eq('id', driver_id)
        .single(),
      sb.from('app_settings').select('value').eq('key', 'booking').maybeSingle(),
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
      admin_meta:
        tour.admin_meta && typeof tour.admin_meta === 'object'
          ? tour.admin_meta
          : {},
    } as PricingTour & {
      name: string
      slug?: string
      admin_meta?: Record<string, unknown>
    },
    vehicle: {
      ...vehicle,
      vehicle_price_cents:
        vehicle.vehicle_price_cents ?? vehicle.vehicle_surcharge_cents ?? 0,
    } as PricingVehicle,
    driver,
    settings,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    if (!process.env.YOCO_SECRET_KEY) {
      return res.status(500).json({
        error: 'Payment is not configured (missing YOCO_SECRET_KEY on the host).',
      })
    }

    const body = await readJson(req)
    const auth = await getAuthContext(req)
    const client_user_id = auth?.user.id ?? null
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
    const notes = body.notes
      ? String(body.notes)
      : special_requests
    const guest_consent_acknowledged = Boolean(body.guest_consent_acknowledged)
    const idempotencyKey = (
      headerValue(req, 'idempotency-key') ||
      String(body.idempotency_key || '')
    ).trim()

    const adult_count = Math.round(
      Number(body.adult_count ?? body.guest_count) || 1
    )
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
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const booking_reference = generateBookingReference()

    if (useMockStore()) {
      const catalog = mockDb.catalog()
      const tour = catalog.tours.find((t) => t.id === tour_id)
      const vehicle = catalog.vehicles.find((v) => v.id === vehicle_id)
      const driver = catalog.drivers.find((d) => d.id === driver_id)
      if (!tour || !vehicle) {
        return res.status(400).json({ error: 'Invalid tour or vehicle' })
      }

      if (
        !isTourPubliclyVisible(
          {
            slug: tour.slug,
            admin_meta: (tour as { admin_meta?: Record<string, unknown> })
              .admin_meta,
          },
          new Date(),
          { travelDate: booking_date }
        )
      ) {
        return res.status(400).json({
          error:
            'This experience is not available for the selected date (seasonal or hidden).',
        })
      }

      const guestError = validateBookingGuests(
        adult_count,
        child_count,
        tour,
        vehicle,
        catalog.settings
      )
      if (guestError) return res.status(400).json({ error: guestError })

      if (!client_user_id && !guest_consent_acknowledged) {
        return res.status(400).json({
          error:
            'Please acknowledge the informed consent and POPIA terms before payment.',
          code: 'GUEST_CONSENT_REQUIRED',
        })
      }

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
        client_user_id,
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
          bookingId: booking_reference || booking.id,
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
      return res.status(200).json({
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

    const sb = supabaseAdmin()
    await expireStalePendingBookings(sb)

    if (idempotencyKey) {
      const { data: existingKey } = await sb
        .from('booking_idempotency_keys')
        .select('booking_id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existingKey?.booking_id) {
        const { data: existing } = await sb
          .from('bookings')
          .select(
            'id, status, booking_reference, grand_total_cents, yoco_payment_reference'
          )
          .eq('id', existingKey.booking_id)
          .maybeSingle()

        if (existing && existing.status !== 'expired' && existing.status !== 'cancelled') {
          if (existing.status === 'paid') {
            const site = (
              process.env.SITE_URL ||
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
              ''
            ).replace(/\/$/, '')
            return res.status(200).json({
              success: true,
              booking_id: existing.id,
              booking_reference: existing.booking_reference,
              payment: true,
              amount_cents: existing.grand_total_cents,
              idempotent_replay: true,
              message: 'Booking already paid',
              resume_thank_you: site
                ? `${site}/thank-you?payment=success&booking_id=${existing.id}`
                : undefined,
            })
          }

          const { data: tourRow } = await sb
            .from('tours')
            .select('name')
            .eq('id', tour_id)
            .maybeSingle()

          const amount = Number(existing.grand_total_cents) || 0
          const checkout = await createYocoCheckout({
            amountCents: amount,
            bookingId: existing.id,
            bookingReference: existing.booking_reference || undefined,
            clientName: client_name,
            clientEmail: client_email,
            tourName: tourRow?.name,
          })

          await sb
            .from('payments')
            .update({ external_id: checkout.id, status: 'pending' })
            .eq('booking_id', existing.id)
            .eq('status', 'pending')

          await sb
            .from('bookings')
            .update({ yoco_payment_reference: checkout.id })
            .eq('id', existing.id)

          return res.status(200).json({
            success: true,
            booking_id: existing.id,
            booking_reference: existing.booking_reference,
            payment: true,
            amount_cents: amount,
            checkout_url: checkout.redirectUrl,
            checkout_id: checkout.id,
            idempotent_replay: true,
          })
        }
      }
    }

    const time = normalizeTime(start_time)
    const { tour, vehicle, driver, settings } = await loadPricingContext(
      sb,
      tour_id,
      vehicle_id,
      driver_id
    )

    if (
      !isTourPubliclyVisible(
        {
          slug: tour.slug,
          admin_meta: (
            tour as { admin_meta?: Record<string, unknown> }
          ).admin_meta,
        },
        new Date(),
        { travelDate: booking_date }
      )
    ) {
      return res.status(400).json({
        error:
          'This experience is not available for the selected date (seasonal or hidden).',
      })
    }

    if (client_user_id) {
      const { data: currentForm } = await sb
        .from('consent_form_versions')
        .select('id')
        .eq('is_current', true)
        .maybeSingle()
      if (currentForm?.id) {
        const { data: signed } = await sb
          .from('client_consents')
          .select('id')
          .eq('user_id', client_user_id)
          .eq('version_id', currentForm.id)
          .maybeSingle()
        if (!signed) {
          return res.status(403).json({
            error:
              'Please sign the informed consent form on your account before completing payment.',
            code: 'CONSENT_REQUIRED',
          })
        }
      }
    } else if (!guest_consent_acknowledged) {
      return res.status(400).json({
        error:
          'Please acknowledge the informed consent and POPIA terms before payment.',
        code: 'GUEST_CONSENT_REQUIRED',
      })
    }

    const guestError = validateBookingGuests(
      adult_count,
      child_count,
      tour,
      vehicle,
      settings
    )
    if (guestError) return res.status(400).json({ error: guestError })

    const breakdown = calculatePrice(tour, vehicle, adult_count, child_count)
    const driverName = driver.full_name || driver.name

    const { data: booking, error: bookingError } = await sb
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
        client_user_id,
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
      const status = isSlotConflictMessage(bookingError.message) ? 409 : 400
      return res.status(status).json({
        error: isSlotConflictMessage(bookingError.message)
          ? 'That driver or vehicle slot is no longer available. Please choose another time.'
          : bookingError.message,
      })
    }

    if (idempotencyKey) {
      await sb.from('booking_idempotency_keys').upsert({
        idempotency_key: idempotencyKey,
        booking_id: booking.id,
      })
    }

    const checkout = await createYocoCheckout({
      amountCents: breakdown.grand_total_cents,
      bookingId: booking.id,
      bookingReference: booking_reference,
      clientName: client_name,
      clientEmail: client_email,
      tourName: tour.name,
    })

    await sb.from('payments').insert({
      booking_id: booking.id,
      status: 'pending',
      amount_cents: breakdown.grand_total_cents,
      currency: 'ZAR',
      external_id: checkout.id,
    })

    await sb
      .from('bookings')
      .update({ yoco_payment_reference: checkout.id })
      .eq('id', booking.id)

    void notifyDriverBooking(
      {
        bookingId: booking_reference || booking.id,
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
      'created',
      sb
    )

    return res.status(200).json({
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
    return res.status(400).json({
      error: e instanceof Error ? e.message : 'Booking failed',
    })
  }
}
