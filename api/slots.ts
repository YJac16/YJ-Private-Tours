import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import { expireStalePendingBookings } from '../booking-app/lib/booking-lifecycle'
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
  const vehicleId = req.query.vehicle_id ? String(req.query.vehicle_id) : ''
  if (!date || !driverId) {
    return res.status(400).json({ error: 'date and driver_id are required' })
  }

  try {
    if (useMockStore()) {
      return res.status(200).json(mockDb.slots(date, driverId, vehicleId || undefined))
    }

    const sb = supabaseAdmin()
    await expireStalePendingBookings(sb)

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

    if (!timeSlots?.length) {
      return res.status(200).json({
        slots: [],
        reason: 'No bookable time slots are configured.',
      })
    }

    const { data: unavailableSlots } = await sb
      .from('driver_unavailable')
      .select('start_time')
      .eq('driver_id', driverId)
      .eq('unavailable_date', date)
      .not('start_time', 'is', null)

    const { data: driverBooked } = await sb
      .from('bookings')
      .select('start_time')
      .eq('driver_id', driverId)
      .eq('booking_date', date)
      .in('status', ['paid', 'pending'])

    let vehicleBookedTimes = new Set<string>()
    if (vehicleId) {
      const { data: vehicleBooked } = await sb
        .from('bookings')
        .select('start_time')
        .eq('vehicle_id', vehicleId)
        .eq('booking_date', date)
        .in('status', ['paid', 'pending'])
      vehicleBookedTimes = new Set(
        (vehicleBooked ?? []).map((s) => normalizeTime(String(s.start_time)))
      )
    }

    const unavailable = new Set(
      (unavailableSlots ?? []).map((s) => normalizeTime(String(s.start_time)))
    )
    const booked = new Set(
      (driverBooked ?? []).map((s) => normalizeTime(String(s.start_time)))
    )

    const slots = timeSlots.map((slot) => {
      const time = normalizeTime(String(slot.start_time))
      const driverBusy = unavailable.has(time) || booked.has(time)
      const vehicleBusy = vehicleBookedTimes.has(time)
      const available = !driverBusy && !vehicleBusy
      return {
        id: slot.id,
        start_time: time,
        label: slot.label,
        available,
        reason: !available
          ? unavailable.has(time)
            ? 'Driver blocked this slot'
            : vehicleBusy
              ? 'Vehicle already booked'
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
