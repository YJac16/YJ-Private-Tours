import { NextResponse } from 'next/server'
import { mockDb, useMockStore } from '@/lib/mock-store'
import { supabaseAdmin } from '@/lib/supabase-server'
import { notifyDriverBooking } from '@/lib/notify'

/**
 * Confirm a booking after the guest returns from Yoco (success redirect).
 * Production should also verify via Yoco webhook; this covers local/test reliably.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const bookingId = body.booking_id as string | undefined
    if (!bookingId) {
      return NextResponse.json({ error: 'booking_id required' }, { status: 400 })
    }

    if (useMockStore()) {
      const booking = mockDb.getBooking(bookingId)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      if (booking.status === 'paid') {
        return NextResponse.json({ success: true, already_paid: true, booking_id: bookingId })
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
      return NextResponse.json({ success: true, booking_id: bookingId, status: 'paid' })
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(
        `
        id, status, booking_date, start_time, client_name, client_email, client_phone, notes, driver_id,
        tour:tours(name),
        vehicle:vehicles(name),
        driver:drivers(name),
        payments(amount_cents)
      `
      )
      .eq('id', bookingId)
      .maybeSingle()

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'paid') {
      return NextResponse.json({ success: true, already_paid: true, booking_id: bookingId })
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'paid' })
      .eq('id', bookingId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await supabaseAdmin
      .from('payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
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

    return NextResponse.json({ success: true, booking_id: bookingId, status: 'paid' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
