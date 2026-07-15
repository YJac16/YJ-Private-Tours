import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import { methodNotAllowed } from './_lib/http'

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
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const date = String(req.query.date || '')
  const driverId = String(req.query.driver_id || '')
  if (!date || !driverId) {
    return res.status(400).json({ error: 'date and driver_id are required' })
  }

  try {
    if (useMockStore()) {
      return res.status(200).json(mockDb.slots(date, driverId))
    }

    const sb = supabaseAdmin()
    const selectedDate = new Date(`${date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const minDate = new Date(today)
    minDate.setDate(minDate.getDate() + 2)

    if (selectedDate < minDate) {
      return res.status(200).json({
        slots: [],
        reason: 'Bookings must be made at least 2 days in advance.',
      })
    }

    const { data: blocked } = await sb
      .from('blocked_dates')
      .select('id')
      .eq('blocked_date', date)
      .maybeSingle()

    if (blocked) {
      return res.status(200).json({ slots: [], reason: 'This date is unavailable.' })
    }

    const { data: dayBlocked } = await sb
      .from('driver_unavailable')
      .select('id')
      .eq('driver_id', driverId)
      .eq('unavailable_date', date)
      .is('start_time', null)
      .maybeSingle()

    if (dayBlocked) {
      return res
        .status(200)
        .json({ slots: [], reason: 'Driver is unavailable on this date.' })
    }

    const { data: timeSlots, error: slotsError } = await sb
      .from('time_slots')
      .select('id, start_time, label, sort_order')
      .eq('is_active', true)
      .order('sort_order')

    if (slotsError) return res.status(500).json({ error: slotsError.message })

    const { data: unavailableSlots } = await sb
      .from('driver_unavailable')
      .select('start_time')
      .eq('driver_id', driverId)
      .eq('unavailable_date', date)
      .not('start_time', 'is', null)

    const { data: bookedSlots } = await sb
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

    return res.status(200).json({ slots })
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Slots failed',
    })
  }
}
