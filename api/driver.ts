import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import {
  isAuthError,
  requireAuth,
  type AuthContext,
} from './_lib/authUser'
import { methodNotAllowed, readJson } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

type DriverRow = {
  id: string
  name: string
  full_name: string | null
  is_active: boolean
  photo_url: string | null
  languages: string[] | null
  years_experience: number | null
  bio: string | null
  user_id: string | null
  rating_avg?: number | null
  rating_count?: number
}

async function resolveDriver(
  auth: AuthContext,
  req: VercelRequest,
  bodyDriverId?: string
): Promise<DriverRow | { error: string; status: number }> {
  const queryId =
    (req.query.driver_id ? String(req.query.driver_id) : '') ||
    (bodyDriverId ? String(bodyDriverId) : '')

  if (useMockStore()) {
    if (auth.role === 'admin' && queryId) {
      const d = mockDb.findDriverById(queryId)
      if (!d) return { error: 'Driver not found', status: 404 }
      return d
    }
    if (auth.role === 'driver') {
      const d = mockDb.findDriverByUserId(auth.user.id)
      if (!d) return { error: 'No driver profile linked to this account', status: 404 }
      return d
    }
    if (auth.role === 'admin') {
      const all = mockDb.listAllDrivers()
      if (all[0]) return all[0]
      return { error: 'No drivers found', status: 404 }
    }
    return { error: 'Forbidden', status: 403 }
  }

  const sb = supabaseAdmin()
  if (auth.role === 'admin' && queryId) {
    const { data, error } = await sb
      .from('drivers')
      .select(
        'id, name, full_name, is_active, photo_url, languages, years_experience, bio, user_id, rating_avg, rating_count'
      )
      .eq('id', queryId)
      .maybeSingle()
    if (error) return { error: error.message, status: 500 }
    if (!data) return { error: 'Driver not found', status: 404 }
    return data as DriverRow
  }

  if (auth.role === 'driver') {
    const { data, error } = await sb
      .from('drivers')
      .select(
        'id, name, full_name, is_active, photo_url, languages, years_experience, bio, user_id, rating_avg, rating_count'
      )
      .eq('user_id', auth.user.id)
      .maybeSingle()
    if (error) return { error: error.message, status: 500 }
    if (!data) {
      return { error: 'No driver profile linked to this account', status: 404 }
    }
    return data as DriverRow
  }

  if (auth.role === 'admin') {
    const { data, error } = await sb
      .from('drivers')
      .select(
        'id, name, full_name, is_active, photo_url, languages, years_experience, bio, user_id, rating_avg, rating_count'
      )
      .order('full_name', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) return { error: error.message, status: 500 }
    if (!data) return { error: 'No drivers found', status: 404 }
    return data as DriverRow
  }

  return { error: 'Forbidden', status: 403 }
}

function isDriverError(
  v: DriverRow | { error: string; status: number }
): v is { error: string; status: number } {
  return 'error' in v && 'status' in v
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const auth = await requireAuth(req, ['driver', 'admin'])
    if (isAuthError(auth)) {
      return res.status(auth.status).json({ error: auth.error })
    }

    if (req.method === 'GET') {
      const driver = await resolveDriver(auth, req)
      if (isDriverError(driver)) {
        return res.status(driver.status).json({ error: driver.error })
      }

      const from = req.query.from ? String(req.query.from) : undefined
      const to = req.query.to ? String(req.query.to) : undefined
      const driverId = driver.id

      if (useMockStore()) {
        return res.status(200).json({
          driver,
          bookings: mockDb.listBookings(driverId, from, to),
          unavailable: mockDb
            .listUnavailable()
            .filter((u) => u.driver_id === driverId),
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
        .eq('driver_id', driverId)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (from) query = query.gte('booking_date', from)
      if (to) query = query.lte('booking_date', to)

      const { data, error } = await query
      if (error) return res.status(500).json({ error: error.message })

      const { data: unavailable } = await sb
        .from('driver_unavailable')
        .select('*')
        .eq('driver_id', driverId)
        .order('unavailable_date', { ascending: true })

      return res.status(200).json({
        driver,
        bookings: data ?? [],
        unavailable: unavailable ?? [],
      })
    }

    if (req.method === 'PATCH') {
      const body = await readJson(req)

      if (body.action === 'update_profile') {
        const driver = await resolveDriver(auth, req, body.driver_id as string)
        if (isDriverError(driver)) {
          return res.status(driver.status).json({ error: driver.error })
        }
        if (auth.role === 'driver' && driver.user_id !== auth.user.id) {
          return res.status(403).json({ error: 'Forbidden' })
        }

        const updates: Record<string, unknown> = {}
        if (body.full_name !== undefined) {
          updates.full_name = String(body.full_name)
          updates.name = String(body.full_name)
        }
        if (body.photo_url !== undefined) updates.photo_url = body.photo_url
        if (body.bio !== undefined) updates.bio = body.bio
        if (body.years_experience !== undefined) {
          updates.years_experience = Number(body.years_experience) || 0
        }
        if (body.languages !== undefined) {
          updates.languages = Array.isArray(body.languages)
            ? body.languages
            : String(body.languages)
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
        }

        if (useMockStore()) {
          const updated = mockDb.updateDriver(driver.id, updates as Parameters<
            typeof mockDb.updateDriver
          >[1])
          return res.status(200).json({ success: true, driver: updated })
        }

        const sb = supabaseAdmin()
        const { data, error } = await sb
          .from('drivers')
          .update(updates)
          .eq('id', driver.id)
          .select(
            'id, name, full_name, is_active, photo_url, languages, years_experience, bio, user_id, rating_avg, rating_count'
          )
          .single()
        if (error) return res.status(400).json({ error: error.message })
        return res.status(200).json({ success: true, driver: data })
      }

      const driver = await resolveDriver(auth, req, body.driver_id as string)
      if (isDriverError(driver)) {
        return res.status(driver.status).json({ error: driver.error })
      }

      const booking_id = String(body.booking_id || '')
      if (!booking_id) return res.status(400).json({ error: 'booking_id required' })

      if (useMockStore()) {
        const existing = mockDb.listBookings(driver.id).find((b) => b.id === booking_id)
        if (!existing) {
          return res.status(404).json({ error: 'Booking not found for this driver' })
        }
        if (body.status === 'paid') {
          return res.status(400).json({
            error: 'Drivers cannot mark bookings paid; Yoco webhook is the source of truth',
          })
        }
        if (body.status === 'cancelled') {
          const result = mockDb.cancelAccountBooking({
            bookingId: booking_id,
            actor: 'driver',
            reason: body.notes ? String(body.notes) : 'Cancelled by driver',
            requestRefund: true,
          })
          if (!result.ok) {
            return res.status(result.status).json({ error: result.error })
          }
          return res.status(200).json({
            success: true,
            booking: mockDb.getBooking(booking_id),
            cancel: result,
          })
        }
        const booking = mockDb.updateBooking(booking_id, {
          booking_date: body.booking_date as string | undefined,
          start_time: body.start_time as string | undefined,
          status: body.status as 'pending' | 'paid' | 'cancelled' | undefined,
          trip_status: body.trip_status as string | undefined,
          notes: body.notes as string | undefined,
        })
        return res.status(200).json({ success: true, booking })
      }

      const sb = supabaseAdmin()

      if (body.status === 'paid') {
        return res.status(400).json({
          error: 'Drivers cannot mark bookings paid; Yoco webhook is the source of truth',
        })
      }

      if (body.status === 'cancelled') {
        const { data: owned } = await sb
          .from('bookings')
          .select('id')
          .eq('id', booking_id)
          .eq('driver_id', driver.id)
          .maybeSingle()
        if (!owned) {
          return res.status(404).json({ error: 'Booking not found for this driver' })
        }
        const { cancelBooking } = await import('../booking-app/lib/booking-lifecycle')
        const result = await cancelBooking(sb, {
          bookingId: booking_id,
          actor: 'driver',
          reason: body.notes ? String(body.notes) : 'Cancelled by driver',
          requestRefund: true,
        })
        if (!result.ok) {
          return res.status(result.status).json({ error: result.error })
        }
        const { data } = await sb.from('bookings').select('*').eq('id', booking_id).single()
        return res.status(200).json({ success: true, booking: data, cancel: result })
      }

      const { data: before } = await sb
        .from('bookings')
        .select(
          `
          id, status, booking_date, start_time, client_name, client_email, client_phone,
          notes, booking_reference, grand_total_cents, final_price_cents,
          tour:tours(name), vehicle:vehicles(name), driver:drivers(name, full_name)
        `
        )
        .eq('id', booking_id)
        .eq('driver_id', driver.id)
        .maybeSingle()
      if (!before) {
        return res.status(404).json({ error: 'Booking not found for this driver' })
      }

      const updates: Record<string, unknown> = {}
      if (body.booking_date) updates.booking_date = body.booking_date
      if (body.start_time) updates.start_time = String(body.start_time).slice(0, 5)
      if (body.status) {
        updates.status = body.status
      }
      if (body.trip_status) updates.trip_status = body.trip_status
      if (body.notes !== undefined) updates.notes = body.notes

      const { data, error } = await sb
        .from('bookings')
        .update(updates)
        .eq('id', booking_id)
        .eq('driver_id', driver.id)
        .select(
          `
          id, status, booking_date, start_time, client_name, client_email, client_phone,
          notes, booking_reference, grand_total_cents, final_price_cents,
          tour:tours(name), vehicle:vehicles(name), driver:drivers(name, full_name)
        `
        )
        .single()

      if (error) return res.status(400).json({ error: error.message })

      const slotChanged =
        (body.booking_date && body.booking_date !== before.booking_date) ||
        (body.start_time &&
          String(body.start_time).slice(0, 5) !== String(before.start_time).slice(0, 5))
      if (slotChanged) {
        const { bookingRowToEmailDetails, notifyDriverBooking } = await import(
          '../booking-app/lib/notify'
        )
        void notifyDriverBooking(
          bookingRowToEmailDetails({
            ...data,
            changeNote: `Was ${before.booking_date} ${String(before.start_time).slice(0, 5)} → now ${data.booking_date} ${String(data.start_time).slice(0, 5)}`,
          }),
          'rescheduled'
        )
      }

      return res.status(200).json({ success: true, booking: data })
    }

    if (req.method === 'POST') {
      const body = await readJson(req)
      const driver = await resolveDriver(auth, req, body.driver_id as string)
      if (isDriverError(driver)) {
        return res.status(driver.status).json({ error: driver.error })
      }

      const unavailable_date = String(body.unavailable_date || '')
      if (!unavailable_date) {
        return res.status(400).json({ error: 'unavailable_date required' })
      }

      if (useMockStore()) {
        const row = mockDb.block({
          driver_id: driver.id,
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
          driver_id: driver.id,
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
      const driver = await resolveDriver(auth, req)
      if (isDriverError(driver)) {
        return res.status(driver.status).json({ error: driver.error })
      }

      const id = String(req.query.id || '')
      if (!id) return res.status(400).json({ error: 'id required' })

      if (useMockStore()) {
        const row = mockDb.listUnavailable().find((u) => u.id === id)
        if (!row || row.driver_id !== driver.id) {
          return res.status(404).json({ error: 'Block not found' })
        }
        mockDb.unblock(id)
        return res.status(200).json({ success: true })
      }

      const sb = supabaseAdmin()
      const { error } = await sb
        .from('driver_unavailable')
        .delete()
        .eq('id', id)
        .eq('driver_id', driver.id)
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
