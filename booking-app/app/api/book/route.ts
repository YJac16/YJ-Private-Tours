import { NextResponse } from 'next/server'
import { mockDb, useMockStore } from '@/lib/mock-store'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  createYocoCheckout,
  resolveTourAmountCents,
} from '@/lib/yoco'
import { notifyDriverBooking } from '@/lib/notify'

function normalizeTime(t: string) {
  return t.slice(0, 5)
}

async function startPayment(opts: {
  bookingId: string
  tourId: string
  tourSlug?: string | null
  tourName?: string | null
  amountCents?: number
  clientName: string
  clientEmail: string
}) {
  const amount = resolveTourAmountCents(
    opts.tourSlug || opts.tourId,
    opts.amountCents
  )
  const checkout = await createYocoCheckout({
    amountCents: amount,
    bookingId: opts.bookingId,
    clientName: opts.clientName,
    clientEmail: opts.clientEmail,
    tourName: opts.tourName || undefined,
  })

  if (!useMockStore()) {
    await supabaseAdmin.from('payments').insert({
      booking_id: opts.bookingId,
      status: 'pending',
      amount_cents: amount,
      currency: 'ZAR',
      external_id: checkout.id,
    })
  } else {
    mockDb.recordPayment({
      booking_id: opts.bookingId,
      amount_cents: amount,
      external_id: checkout.id,
      status: 'pending',
    })
  }

  return { checkout, amount }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      booking_date,
      start_time,
      driver_id,
      tour_id,
      vehicle_id,
      client_name,
      client_email,
      client_phone,
      notes,
      amount_cents,
    } = body

    if (
      !booking_date ||
      !start_time ||
      !driver_id ||
      !tour_id ||
      !vehicle_id ||
      !client_name ||
      !client_email
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.YOCO_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment is not configured (missing YOCO_SECRET_KEY).' },
        { status: 500 }
      )
    }

    if (useMockStore()) {
      try {
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
        const { checkout, amount } = await startPayment({
          bookingId: booking.id,
          tourId: tour_id,
          tourSlug: tour?.slug,
          tourName: tour?.name,
          amountCents: amount_cents,
          clientName: client_name,
          clientEmail: client_email,
        })
        const vehicle = catalog.vehicles.find((v) => v.id === vehicle_id)
        const driver = catalog.drivers.find((d) => d.id === driver_id)
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
        return NextResponse.json({
          success: true,
          booking_id: booking.id,
          payment: true,
          amount_cents: amount,
          checkout_url: checkout.redirectUrl,
          checkout_id: checkout.id,
          mock: true,
        })
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Booking failed'
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    const time = normalizeTime(String(start_time))

    const { data: blocked } = await supabaseAdmin
      .from('blocked_dates')
      .select('id')
      .eq('blocked_date', booking_date)
      .maybeSingle()

    if (blocked) {
      return NextResponse.json(
        { error: 'This date is blocked.' },
        { status: 400 }
      )
    }

    const { data: dayBlocked } = await supabaseAdmin
      .from('driver_unavailable')
      .select('id')
      .eq('driver_id', driver_id)
      .eq('unavailable_date', booking_date)
      .is('start_time', null)
      .maybeSingle()

    if (dayBlocked) {
      return NextResponse.json(
        { error: 'Driver is unavailable on this date.' },
        { status: 400 }
      )
    }

    const { data: slotBlocked } = await supabaseAdmin
      .from('driver_unavailable')
      .select('id')
      .eq('driver_id', driver_id)
      .eq('unavailable_date', booking_date)
      .eq('start_time', time)
      .maybeSingle()

    if (slotBlocked) {
      return NextResponse.json(
        { error: 'Driver is unavailable for this time slot.' },
        { status: 400 }
      )
    }

    const { data: existingBooking } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('driver_id', driver_id)
      .eq('booking_date', booking_date)
      .eq('start_time', time)
      .in('status', ['paid', 'pending'])
      .maybeSingle()

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This time slot is already booked.' },
        { status: 400 }
      )
    }

    const { data: tour } = await supabaseAdmin
      .from('tours')
      .select('id, name, slug')
      .eq('id', tour_id)
      .maybeSingle()

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
        client_phone: client_phone || null,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 400 }
      )
    }

    try {
      const { checkout, amount } = await startPayment({
        bookingId: booking.id,
        tourId: tour_id,
        tourSlug: tour?.slug,
        tourName: tour?.name,
        amountCents: amount_cents,
        clientName: client_name,
        clientEmail: client_email,
      })

      const [{ data: vehicle }, { data: driver }] = await Promise.all([
        supabaseAdmin.from('vehicles').select('name').eq('id', vehicle_id).maybeSingle(),
        supabaseAdmin.from('drivers').select('name').eq('id', driver_id).maybeSingle(),
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

      return NextResponse.json({
        success: true,
        booking_id: booking.id,
        payment: true,
        amount_cents: amount,
        checkout_url: checkout.redirectUrl,
        checkout_id: checkout.id,
      })
    } catch (payErr: unknown) {
      const message = payErr instanceof Error ? payErr.message : 'Payment failed'
      return NextResponse.json(
        {
          success: true,
          booking_id: booking.id,
          payment: false,
          warning: message,
        },
        { status: 200 }
      )
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Server error', details: message },
      { status: 500 }
    )
  }
}
