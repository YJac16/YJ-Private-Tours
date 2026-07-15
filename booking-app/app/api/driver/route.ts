import { NextResponse } from 'next/server'
import { mockDb, useMockStore } from '@/lib/mock-store'
import { supabaseAdmin } from '@/lib/supabase-server'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function checkPin(req: Request, bodyPin?: string) {
  const expected = process.env.DRIVER_PIN || '0420'
  const headerPin = req.headers.get('x-driver-pin')
  return (headerPin || bodyPin) === expected
}

export async function GET(req: Request) {
  if (!checkPin(req)) return unauthorized()

  const { searchParams } = new URL(req.url)
  const driverId = searchParams.get('driver_id')
  const from = searchParams.get('from')

  if (useMockStore()) {
    return NextResponse.json({
      bookings: mockDb.listBookings(driverId, from),
      unavailable: mockDb.listUnavailable().filter((u) =>
        driverId ? u.driver_id === driverId : true
      ),
    })
  }

  let query = supabaseAdmin
    .from('bookings')
    .select(
      `
      id,
      booking_date,
      start_time,
      status,
      client_name,
      client_email,
      client_phone,
      notes,
      driver_id,
      tour:tours(id, name, slug),
      vehicle:vehicles(id, name, slug)
    `
    )
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (driverId) query = query.eq('driver_id', driverId)
  if (from) query = query.gte('booking_date', from)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: unavailable } = await supabaseAdmin
    .from('driver_unavailable')
    .select('*')
    .order('unavailable_date', { ascending: true })

  return NextResponse.json({
    bookings: data ?? [],
    unavailable: unavailable ?? [],
  })
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    if (!checkPin(req, body.pin)) return unauthorized()

    const { booking_id, booking_date, start_time, status, notes } = body
    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id required' }, { status: 400 })
    }

    if (useMockStore()) {
      const booking = mockDb.updateBooking(booking_id, {
        booking_date,
        start_time,
        status,
        notes,
      })
      return NextResponse.json({ success: true, booking })
    }

    const updates: Record<string, unknown> = {}
    if (booking_date) updates.booking_date = booking_date
    if (start_time) updates.start_time = String(start_time).slice(0, 5)
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', booking_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, booking: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!checkPin(req, body.pin)) return unauthorized()

    const { driver_id, unavailable_date, start_time, reason } = body
    if (!driver_id || !unavailable_date) {
      return NextResponse.json(
        { error: 'driver_id and unavailable_date required' },
        { status: 400 }
      )
    }

    if (useMockStore()) {
      const row = mockDb.block({
        driver_id,
        unavailable_date,
        start_time: start_time || null,
        reason,
      })
      return NextResponse.json({ success: true, unavailable: row })
    }

    const { data, error } = await supabaseAdmin
      .from('driver_unavailable')
      .insert({
        driver_id,
        unavailable_date,
        start_time: start_time ? String(start_time).slice(0, 5) : null,
        reason: reason || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, unavailable: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!checkPin(req)) return unauthorized()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  if (useMockStore()) {
    mockDb.unblock(id)
    return NextResponse.json({ success: true })
  }

  const { error } = await supabaseAdmin
    .from('driver_unavailable')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
