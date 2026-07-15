import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import {
  createYocoCheckout,
  resolveTourAmountCents,
} from '../booking-app/lib/yoco'
import { notifyDriverBooking } from '../booking-app/lib/notify'
import { methodNotAllowed, readJson } from './_lib/http'

function normalizeTime(t: string) {
  return t.slice(0, 5)
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
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
    const booking_date = String(body.booking_date || '')
    const start_time = String(body.start_time || '')
    const driver_id = String(body.driver_id || '')
    const tour_id = String(body.tour_id || '')
    const vehicle_id = String(body.vehicle_id || '')
    const client_name = String(body.client_name || '')
    const client_email = String(body.client_email || '')
    const client_phone = body.client_phone ? String(body.client_phone) : null
    const notes = body.notes ? String(body.notes) : null
    const amount_cents = body.amount_cents != null ? Number(body.amount_cents) : undefined

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

    if (useMockStore()) {
      const booking = mockDb.createBooking({
        booking_date,
        start_time,
        driver_id,
        tour_id,
        vehicle_id,
        client_name,
        client_email,
        client_phone,
        notes,
      })
      const catalog = mockDb.catalog()
      const tour = catalog.tours.find((t) => t.id === tour_id)
      const vehicle = catalog.vehicles.find((v) => v.id === vehicle_id)
      const driver = catalog.drivers.find((d) => d.id === driver_id)
      const amount = resolveTourAmountCents(tour?.slug || tour_id, amount_cents)
      const checkout = await createYocoCheckout({
        amountCents: amount,
        bookingId: booking.id,
        clientName: client_name,
        clientEmail: client_email,
        tourName: tour?.name,
      })
      mockDb.recordPayment({
        booking_id: booking.id,
        amount_cents: amount,
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
          tourName: tour?.name,
          vehicleName: vehicle?.name,
          driverName: driver?.name,
          notes,
          amountCents: amount,
        },
        'created'
      )
      return res.status(200).json({
        success: true,
        booking_id: booking.id,
        payment: true,
        amount_cents: amount,
        checkout_url: checkout.redirectUrl,
        checkout_id: checkout.id,
        mock: true,
      })
    }

    const sb = supabaseAdmin()
    const time = normalizeTime(start_time)

    const { data: tour } = await sb
      .from('tours')
      .select('id, name, slug')
      .eq('id', tour_id)
      .maybeSingle()

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
        notes,
        status: 'pending',
      })
      .select()
      .single()

    if (bookingError) {
      return res.status(400).json({ error: bookingError.message })
    }

    const amount = resolveTourAmountCents(tour?.slug || tour_id, amount_cents)
    const checkout = await createYocoCheckout({
      amountCents: amount,
      bookingId: booking.id,
      clientName: client_name,
      clientEmail: client_email,
      tourName: tour?.name,
    })

    await sb.from('payments').insert({
      booking_id: booking.id,
      status: 'pending',
      amount_cents: amount,
      currency: 'ZAR',
      external_id: checkout.id,
    })

    const [{ data: vehicle }, { data: driver }] = await Promise.all([
      sb.from('vehicles').select('name').eq('id', vehicle_id).maybeSingle(),
      sb.from('drivers').select('name').eq('id', driver_id).maybeSingle(),
    ])

    void notifyDriverBooking(
      {
        bookingId: booking.id,
        status: 'pending',
        bookingDate: booking_date,
        startTime: time,
        clientName: client_name,
        clientEmail: client_email,
        clientPhone: client_phone,
        tourName: tour?.name,
        vehicleName: vehicle?.name,
        driverName: driver?.name,
        notes,
        amountCents: amount,
      },
      'created'
    )

    return res.status(200).json({
      success: true,
      booking_id: booking.id,
      payment: true,
      amount_cents: amount,
      checkout_url: checkout.redirectUrl,
      checkout_id: checkout.id,
    })
  } catch (e: unknown) {
    return res.status(400).json({
      error: e instanceof Error ? e.message : 'Booking failed',
    })
  }
}
