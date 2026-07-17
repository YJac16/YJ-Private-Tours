import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import { methodNotAllowed, readJson } from './_lib/http'

function checkPin(req: VercelRequest, bodyPin?: string) {
  const expected = process.env.DRIVER_PIN || '0420'
  const headerPin = req.headers['x-driver-pin']
  const h = Array.isArray(headerPin) ? headerPin[0] : headerPin
  return (h || bodyPin) === expected
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      if (!checkPin(req)) return res.status(401).json({ error: 'Unauthorized' })
      const driverId = req.query.driver_id ? String(req.query.driver_id) : undefined
      const from = req.query.from ? String(req.query.from) : undefined

      if (useMockStore()) {
        return res.status(200).json({
          bookings: mockDb.listBookings(driverId, from),
          unavailable: mockDb
            .listUnavailable()
            .filter((u) => (driverId ? u.driver_id === driverId : true)),
        })
      }

      const sb = supabaseAdmin()
      let query = sb
        .from('bookings')
        .select(
          `
          id, booking_date, start_time, status, trip_status, payment_status,
          client_name, client_email, client_phone, notes, driver_id,
          guest_count, adult_count, child_count, passenger_count,
          grand_total_cents, final_price_cents, driver_earnings_cents,
          pickup_address, special_requests, booking_reference,
          tour:tours(id, name, slug),
          vehicle:vehicles(id, name, slug)
        `
        )
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (driverId) query = query.eq('driver_id', driverId)
      if (from) query = query.gte('booking_date', from)

      const { data, error } = await query
      if (error) return res.status(500).json({ error: error.message })

      const { data: unavailable } = await sb
        .from('driver_unavailable')
        .select('*')
        .order('unavailable_date', { ascending: true })

      return res.status(200).json({
        bookings: data ?? [],
        unavailable: unavailable ?? [],
      })
    }

    if (req.method === 'PATCH') {
      const body = await readJson(req)
      if (!checkPin(req, body.pin as string | undefined)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const booking_id = String(body.booking_id || '')
      if (!booking_id) return res.status(400).json({ error: 'booking_id required' })

      if (useMockStore()) {
        const booking = mockDb.updateBooking(booking_id, {
          booking_date: body.booking_date as string | undefined,
          start_time: body.start_time as string | undefined,
          status: body.status as 'pending' | 'paid' | 'cancelled' | undefined,
          trip_status: body.trip_status as string | undefined,
          notes: body.notes as string | undefined,
        })
        return res.status(200).json({ success: true, booking })
      }

      const updates: Record<string, unknown> = {}
      if (body.booking_date) updates.booking_date = body.booking_date
      if (body.start_time) updates.start_time = String(body.start_time).slice(0, 5)
      if (body.status) {
        updates.status = body.status
        if (body.status === 'paid') updates.payment_status = 'paid'
        if (body.status === 'cancelled') {
          updates.payment_status = 'cancelled'
          updates.trip_status = 'cancelled'
        }
      }
      if (body.trip_status) updates.trip_status = body.trip_status
      if (body.notes !== undefined) updates.notes = body.notes

      const sb = supabaseAdmin()
      const { data, error } = await sb
        .from('bookings')
        .update(updates)
        .eq('id', booking_id)
        .select()
        .single()

      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true, booking: data })
    }

    if (req.method === 'POST') {
      const body = await readJson(req)
      if (!checkPin(req, body.pin as string | undefined)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const driver_id = String(body.driver_id || '')
      const unavailable_date = String(body.unavailable_date || '')
      if (!driver_id || !unavailable_date) {
        return res.status(400).json({ error: 'driver_id and unavailable_date required' })
      }

      if (useMockStore()) {
        const row = mockDb.block({
          driver_id,
          unavailable_date,
          start_time: (body.start_time as string) || null,
          reason: (body.reason as string) || null,
        })
        return res.status(200).json({ success: true, unavailable: row })
      }

      const sb = supabaseAdmin()
      const { data, error } = await sb
        .from('driver_unavailable')
        .insert({
          driver_id,
          unavailable_date,
          start_time: body.start_time ? String(body.start_time).slice(0, 5) : null,
          reason: (body.reason as string) || null,
        })
        .select()
        .single()

      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true, unavailable: data })
    }

    if (req.method === 'DELETE') {
      if (!checkPin(req)) return res.status(401).json({ error: 'Unauthorized' })
      const id = String(req.query.id || '')
      if (!id) return res.status(400).json({ error: 'id required' })

      if (useMockStore()) {
        mockDb.unblock(id)
        return res.status(200).json({ success: true })
      }

      const sb = supabaseAdmin()
      const { error } = await sb.from('driver_unavailable').delete().eq('id', id)
      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true })
    }

    return methodNotAllowed(res, ['GET', 'PATCH', 'POST', 'DELETE'])
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Driver API failed',
    })
  }
}
