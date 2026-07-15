/**
 * GET /api/availability/dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns an array of available dates in the given range (inclusive).
 * Useful for calendar UI: only dates >= today + 2 days, not blocked, no paid booking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MAX_DAYS = 365

function dateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  try {
    const fromParam = request.nextUrl.searchParams.get('from')
    const toParam = request.nextUrl.searchParams.get('to')
    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: 'Query parameters "from" and "to" (YYYY-MM-DD) are required.' },
        { status: 400 }
      )
    }
    if (!DATE_REGEX.test(fromParam) || !DATE_REGEX.test(toParam)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const minBookable = new Date(today)
    minBookable.setDate(minBookable.getDate() + 2)
    minBookable.setHours(0, 0, 0, 0)

    let from = new Date(fromParam + 'T12:00:00Z')
    let to = new Date(toParam + 'T12:00:00Z')
    if (from > to) {
      return NextResponse.json(
        { error: '"from" must be before or equal to "to".' },
        { status: 400 }
      )
    }
    if (from < minBookable) from = minBookable
    const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1
    if (days > MAX_DAYS) {
      return NextResponse.json(
        { error: `Range may not exceed ${MAX_DAYS} days.` },
        { status: 400 }
      )
    }

    const { data: blockedRows } = await supabase
      .from('blocked_dates')
      .select('blocked_date')
      .gte('blocked_date', dateString(from))
      .lte('blocked_date', dateString(to))

    const blockedSet = new Set(
      (blockedRows ?? []).map((r: { blocked_date: string }) => r.blocked_date)
    )

    const { data: paidRows } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('status', 'paid')
      .gte('booking_date', dateString(from))
      .lte('booking_date', dateString(to))

    const paidSet = new Set(
      (paidRows ?? []).map((r: { booking_date: string }) => r.booking_date)
    )

    const available: string[] = []
    const cursor = new Date(from)
    cursor.setHours(0, 0, 0, 0)
    const toTime = to.getTime()
    while (cursor.getTime() <= toTime) {
      const d = dateString(cursor)
      if (!blockedSet.has(d) && !paidSet.has(d)) available.push(d)
      cursor.setDate(cursor.getDate() + 1)
    }

    return NextResponse.json({ dates: available })
  } catch (err) {
    console.error('[/api/availability/dates]', err)
    return NextResponse.json(
      { error: 'Failed to fetch available dates.' },
      { status: 500 }
    )
  }
}
