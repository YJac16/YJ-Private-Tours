/**
 * Read-only payment/booking status. NEVER marks paid.
 * Next twin of api/payment-confirm.ts
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '@/lib/mock-store'
import { expireStalePendingBookings } from '@/lib/booking-lifecycle'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { booking_id?: string }
    const bookingId = String(body.booking_id || '')
    if (!bookingId) {
      return NextResponse.json({ error: 'booking_id required' }, { status: 400 })
    }

    if (useMockStore()) {
      const booking = mockDb.getBooking(bookingId)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        booking_id: booking.id,
        booking_reference: booking.booking_reference ?? null,
        status: booking.status,
        payment_status: booking.payment_status ?? booking.status,
        paid: booking.status === 'paid',
        confirmed_via: 'status_only',
      })
    }

    const sb = supabaseAdmin()
    await expireStalePendingBookings(sb)

    const { data: booking, error } = await sb
      .from('bookings')
      .select(
        'id, status, payment_status, booking_reference, grand_total_cents, final_price_cents'
      )
      .eq('id', bookingId)
      .maybeSingle()

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      booking_reference: booking.booking_reference ?? null,
      status: booking.status,
      payment_status: booking.payment_status ?? null,
      amount_cents: booking.grand_total_cents ?? booking.final_price_cents ?? null,
      paid: booking.status === 'paid',
      confirmed_via: 'status_only',
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Status lookup failed' },
      { status: 500 }
    )
  }
}
