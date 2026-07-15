import { NextResponse } from 'next/server'
import { mockDb, useMockStore } from '@/lib/mock-store'
import { supabaseAdmin } from '@/lib/supabase-server'

function normalizeTime(t: string) {
  return t.slice(0, 5)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const driverId = searchParams.get('driver_id')

  if (!date || !driverId) {
    return NextResponse.json(
      { error: 'date and driver_id are required' },
      { status: 400 }
    )
  }

  if (useMockStore()) {
    return NextResponse.json(mockDb.slots(date, driverId))
  }

  const selectedDate = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 2)

  if (selectedDate < minDate) {
    return NextResponse.json({
      slots: [],
      reason: 'Bookings must be made at least 2 days in advance.',
    })
  }

  const { data: blocked } = await supabaseAdmin
    .from('blocked_dates')
    .select('id')
    .eq('blocked_date', date)
    .maybeSingle()

  if (blocked) {
    return NextResponse.json({
      slots: [],
      reason: 'This date is unavailable.',
    })
  }

  const { data: dayBlocked } = await supabaseAdmin
    .from('driver_unavailable')
    .select('id')
    .eq('driver_id', driverId)
    .eq('unavailable_date', date)
    .is('start_time', null)
    .maybeSingle()

  if (dayBlocked) {
    return NextResponse.json({
      slots: [],
      reason: 'Driver is unavailable on this date.',
    })
  }

  const { data: timeSlots, error: slotsError } = await supabaseAdmin
    .from('time_slots')
    .select('id, start_time, label, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 })
  }

  const { data: unavailableSlots } = await supabaseAdmin
    .from('driver_unavailable')
    .select('start_time')
    .eq('driver_id', driverId)
    .eq('unavailable_date', date)
    .not('start_time', 'is', null)

  const { data: bookedSlots } = await supabaseAdmin
    .from('bookings')
    .select('start_time')
    .eq('driver_id', driverId)
    .eq('booking_date', date)
    .in('status', ['paid', 'pending'])

  const unavailable = new Set(
    (unavailableSlots ?? []).map((s) => normalizeTime(String(s.start_time)))
  )
  const booked = new Set(
    (bookedSlots ?? []).map((s) => normalizeTime(String(s.start_time)))
  )

  const slots = (timeSlots ?? []).map((slot) => {
    const time = normalizeTime(String(slot.start_time))
    const available = !unavailable.has(time) && !booked.has(time)
    return {
      id: slot.id,
      start_time: time,
      label: slot.label,
      available,
      reason: !available
        ? unavailable.has(time)
          ? 'Driver blocked this slot'
          : 'Already booked'
        : null,
    }
  })

  return NextResponse.json({ slots })
}
