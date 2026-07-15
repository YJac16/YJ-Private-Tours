import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json(
      { error: 'Date is required' },
      { status: 400 }
    )
  }

  const selectedDate = new Date(date)
  const today = new Date()

  // Remove time part
  today.setHours(0, 0, 0, 0)

  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 2)

  // 1️⃣ Check 2-day rule
  if (selectedDate < minDate) {
    return NextResponse.json({
      available: false,
      reason: 'Bookings must be made at least 2 days in advance.'
    })
  }

  // 2️⃣ Check blocked dates
  const { data: blocked } = await supabaseAdmin
    .from('blocked_dates')
    .select('id')
    .eq('blocked_date', date)
    .maybeSingle()

  if (blocked) {
    return NextResponse.json({
      available: false,
      reason: 'This date is unavailable.'
    })
  }

  // 3️⃣ Check paid bookings
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('booking_date', date)
    .eq('status', 'paid')
    .maybeSingle()

  if (booking) {
    return NextResponse.json({
      available: false,
      reason: 'This date is already booked.'
    })
  }

  return NextResponse.json({ available: true })
}
