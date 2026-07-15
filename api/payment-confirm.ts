import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import { notifyDriverBooking } from '../booking-app/lib/notify'
import { methodNotAllowed, readJson } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    const body = await readJson(req)
    const bookingId = String(body.booking_id || '')
    if (!bookingId) {
      return res.status(400).json({ error: 'booking_id required' })
    }

    if (useMockStore()) {
      const booking = mockDb.getBooking(bookingId)
      if (!booking) return res.status(404).json({ error: 'Booking not found' })
      if (booking.status === 'paid') {
        return res.status(200).json({
          success: true,
          already_paid: true,
          booking_id: bookingId,
        })
      }
      mockDb.confirmPayment(bookingId)
      const catalog = mockDb.catalog()
      void notifyDriverBooking(
        {
          bookingId: booking.id,
          status: 'paid',
          bookingDate: booking.booking_date,
          startTime: booking.start_time,
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          clientPhone: booking.client_phone,
          tourName: catalog.tours.find((t) => t.id === booking.tour_id)?.name,
          vehicleName: catalog.vehicles.find((v) => v.id === booking.vehicle_id)?.name,
          driverName: catalog.drivers.find((d) => d.id === booking.driver_id)?.name,
          notes: booking.notes,
        },
        'paid'
      )
      return res.status(200).json({ success: true, booking_id: bookingId, status: 'paid' })
    }

    const sb = supabaseAdmin()
    const { data: booking, error } = await sb
      .from('bookings')
      .select(
        `
        id, status, booking_date, start_time, client_name, client_email, client_phone, notes,
        tour:tours(name),
        vehicle:vehicles(name),
        driver:drivers(name),
        payments(amount_cents)
      `
      )
      .eq('id', bookingId)
      .maybeSingle()

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.status === 'paid') {
      return res.status(200).json({
        success: true,
        already_paid: true,
        booking_id: bookingId,
      })
    }

    const { error: updateError } = await sb
      .from('bookings')
      .update({ status: 'paid' })
      .eq('id', bookingId)

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    await sb
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('status', 'pending')

    const tour = booking.tour as { name?: string } | null
    const vehicle = booking.vehicle as { name?: string } | null
    const driver = booking.driver as { name?: string } | null
    const payments = booking.payments as Array<{ amount_cents?: number }> | null

    void notifyDriverBooking(
      {
        bookingId: booking.id,
        status: 'paid',
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        clientPhone: booking.client_phone,
        tourName: tour?.name,
        vehicleName: vehicle?.name,
        driverName: driver?.name,
        notes: booking.notes,
        amountCents: payments?.[0]?.amount_cents,
      },
      'paid'
    )

    return res.status(200).json({ success: true, booking_id: bookingId, status: 'paid' })
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Confirm failed',
    })
  }
}
