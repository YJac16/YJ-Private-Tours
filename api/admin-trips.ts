import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { isAuthError, requireAuth } from './_lib/authUser'
import { methodNotAllowed, readJson } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

const BOOKING_SELECT = `
  id, booking_date, start_time, status, trip_status, payment_status,
  client_name, client_email, client_phone, notes, driver_id, vehicle_id, client_user_id,
  guest_count, adult_count, child_count, passenger_count,
  grand_total_cents, final_price_cents, driver_earnings_cents,
  pickup_address, special_requests, booking_reference, created_at,
  cancel_reason, cancelled_at, cancelled_by, refund_status, refund_amount_cents,
  reschedule_requested_at, reschedule_note,
  tour:tours(id, name, slug),
  vehicle:vehicles(id, name, slug),
  driver:drivers(id, name, full_name)
`

function qstr(req: VercelRequest, key: string): string {
  const v = req.query[key]
  return Array.isArray(v) ? String(v[0] || '') : String(v || '')
}

function filterMockBookings(
  list: ReturnType<typeof mockDb.listBookings>,
  opts: {
    q?: string
    status?: string
    trip_status?: string
    driver_id?: string
    from?: string
    to?: string
  }
) {
  const needle = (opts.q || '').trim().toLowerCase()
  return list.filter((b) => {
    if (opts.status && b.status !== opts.status) return false
    if (opts.trip_status && b.trip_status !== opts.trip_status) return false
    if (opts.driver_id && b.driver_id !== opts.driver_id) return false
    if (opts.from && b.booking_date < opts.from) return false
    if (opts.to && b.booking_date > opts.to) return false
    if (needle) {
      const hay = [
        b.client_name,
        b.client_email,
        b.client_phone,
        b.booking_reference,
        b.tour?.name,
        b.driver?.full_name || b.driver?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const auth = await requireAuth(req, ['admin'])
    if (isAuthError(auth)) {
      return res.status(auth.status).json({ error: auth.error })
    }

    if (req.method === 'GET') {
      const q = qstr(req, 'q')
      const status = qstr(req, 'status')
      const tripStatus = qstr(req, 'trip_status')
      const driverId = qstr(req, 'driver_id')
      const from = qstr(req, 'from')
      const to = qstr(req, 'to')
      const resource = qstr(req, 'resource')

      if (useMockStore()) {
        const all = mockDb.listBookings()
        if (resource === 'customers') {
          return res.status(200).json({ customers: mockDb.listCustomers() })
        }
        const bookings = filterMockBookings(all, {
          q,
          status,
          trip_status: tripStatus,
          driver_id: driverId,
          from,
          to,
        })
        return res.status(200).json({ bookings })
      }

      const sb = supabaseAdmin()
      await (
        await import('../booking-app/lib/booking-lifecycle')
      ).expireStalePendingBookings(sb)

      if (resource === 'customers') {
        const { data, error } = await sb
          .from('bookings')
          .select(
            'client_name, client_email, client_phone, booking_date, status, booking_reference, created_at'
          )
          .order('created_at', { ascending: false })
          .limit(2000)
        if (error) return res.status(500).json({ error: error.message })
        const map = new Map<
          string,
          {
            email: string
            name: string
            phone: string | null
            trip_count: number
            last_booking_date: string | null
            last_status: string | null
            last_reference: string | null
          }
        >()
        for (const row of data ?? []) {
          const email = String(row.client_email || '')
            .trim()
            .toLowerCase()
          if (!email) continue
          const existing = map.get(email)
          if (!existing) {
            map.set(email, {
              email,
              name: row.client_name || email,
              phone: row.client_phone ?? null,
              trip_count: 1,
              last_booking_date: row.booking_date,
              last_status: row.status,
              last_reference: row.booking_reference,
            })
          } else {
            existing.trip_count += 1
            if (
              row.booking_date &&
              (!existing.last_booking_date ||
                row.booking_date > existing.last_booking_date)
            ) {
              existing.last_booking_date = row.booking_date
              existing.last_status = row.status
              existing.last_reference = row.booking_reference
            }
          }
        }
        return res.status(200).json({
          customers: [...map.values()].sort((a, b) =>
            (b.last_booking_date || '').localeCompare(a.last_booking_date || '')
          ),
        })
      }

      let query = sb
        .from('bookings')
        .select(BOOKING_SELECT)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(500)

      if (status) query = query.eq('status', status)
      if (tripStatus) query = query.eq('trip_status', tripStatus)
      if (driverId) query = query.eq('driver_id', driverId)
      if (from) query = query.gte('booking_date', from)
      if (to) query = query.lte('booking_date', to)

      const { data, error } = await query
      if (error) return res.status(500).json({ error: error.message })

      let bookings = data ?? []
      if (q.trim()) {
        const needle = q.trim().toLowerCase()
        bookings = bookings.filter((b) => {
          const hay = [
            b.client_name,
            b.client_email,
            b.client_phone,
            b.booking_reference,
            (b.tour as { name?: string } | null)?.name,
            (b.driver as { full_name?: string; name?: string } | null)?.full_name ||
              (b.driver as { name?: string } | null)?.name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return hay.includes(needle)
        })
      }
      return res.status(200).json({ bookings })
    }

    if (req.method === 'PATCH') {
      const body = await readJson(req)
      const bookingId = String(body.booking_id || body.id || '')
      if (!bookingId) {
        return res.status(400).json({ error: 'booking_id required' })
      }

      const action = String(body.action || 'update')

      if (useMockStore()) {
        if (action === 'cancel') {
          const result = mockDb.cancelAccountBooking({
            bookingId,
            actor: 'admin',
            reason: body.reason ? String(body.reason) : 'Cancelled by admin',
            requestRefund: body.request_refund !== false,
          })
          if (!result.ok) {
            return res.status(result.status).json({ error: result.error })
          }
          return res.status(200).json({
            success: true,
            booking: mockDb.getBooking(bookingId),
            cancel: result,
          })
        }

        try {
          const booking = mockDb.adminUpdateBooking(bookingId, {
            booking_date: body.booking_date as string | undefined,
            start_time: body.start_time as string | undefined,
            driver_id: body.driver_id as string | undefined,
            vehicle_id: body.vehicle_id as string | undefined,
            trip_status: body.trip_status as string | undefined,
            notes: body.notes as string | undefined,
            pickup_address: body.pickup_address as string | undefined,
            special_requests: body.special_requests as string | undefined,
          })
          return res.status(200).json({ success: true, booking })
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Update failed'
          const status = msg.includes('conflict') ? 409 : 400
          return res.status(status).json({ error: msg })
        }
      }

      const sb = supabaseAdmin()
      const { expireStalePendingBookings, cancelBooking } = await import(
        '../booking-app/lib/booking-lifecycle'
      )
      await expireStalePendingBookings(sb)

      if (action === 'cancel') {
        const result = await cancelBooking(sb, {
          bookingId,
          actor: 'admin',
          reason: body.reason ? String(body.reason) : 'Cancelled by admin',
          requestRefund: body.request_refund !== false,
        })
        if (!result.ok) {
          return res.status(result.status).json({ error: result.error })
        }
        const { data } = await sb
          .from('bookings')
          .select(BOOKING_SELECT)
          .eq('id', bookingId)
          .single()
        return res.status(200).json({ success: true, booking: data, cancel: result })
      }

      const { data: existing, error: loadErr } = await sb
        .from('bookings')
        .select(
          'id, status, trip_status, booking_date, start_time, driver_id, vehicle_id, notes, pickup_address, special_requests'
        )
        .eq('id', bookingId)
        .maybeSingle()
      if (loadErr || !existing) {
        return res.status(404).json({ error: 'Booking not found' })
      }
      if (existing.status === 'cancelled' || existing.status === 'expired') {
        return res.status(400).json({ error: `Cannot update ${existing.status} booking` })
      }

      // Never allow admin to mark paid — webhook owns that transition.
      if (body.status === 'paid' || body.payment_status === 'paid') {
        return res.status(400).json({
          error: 'Admin cannot mark bookings paid; Yoco webhook is the source of truth',
        })
      }

      const nextDate = body.booking_date
        ? String(body.booking_date)
        : existing.booking_date
      const nextTime = body.start_time
        ? String(body.start_time).slice(0, 5)
        : String(existing.start_time).slice(0, 5)
      const nextDriver =
        body.driver_id !== undefined ? String(body.driver_id) : existing.driver_id
      const nextVehicle =
        body.vehicle_id !== undefined ? String(body.vehicle_id) : existing.vehicle_id

      const slotChanging =
        nextDate !== existing.booking_date ||
        nextTime !== String(existing.start_time).slice(0, 5) ||
        nextDriver !== existing.driver_id ||
        nextVehicle !== existing.vehicle_id

      if (slotChanging) {
        const { data: driverClash } = await sb
          .from('bookings')
          .select('id')
          .eq('driver_id', nextDriver)
          .eq('booking_date', nextDate)
          .eq('start_time', nextTime)
          .in('status', ['pending', 'paid'])
          .neq('id', bookingId)
          .maybeSingle()
        if (driverClash) {
          return res.status(409).json({ error: 'Driver slot conflict' })
        }
        if (nextVehicle) {
          const { data: vehicleClash } = await sb
            .from('bookings')
            .select('id')
            .eq('vehicle_id', nextVehicle)
            .eq('booking_date', nextDate)
            .eq('start_time', nextTime)
            .in('status', ['pending', 'paid'])
            .neq('id', bookingId)
            .maybeSingle()
          if (vehicleClash) {
            return res.status(409).json({ error: 'Vehicle slot conflict' })
          }
        }
      }

      const updates: Record<string, unknown> = {}
      if (body.booking_date) updates.booking_date = nextDate
      if (body.start_time) updates.start_time = nextTime
      if (body.driver_id !== undefined) updates.driver_id = nextDriver
      if (body.vehicle_id !== undefined) updates.vehicle_id = nextVehicle || null
      if (body.trip_status !== undefined) updates.trip_status = String(body.trip_status)
      if (body.notes !== undefined) updates.notes = body.notes
      if (body.pickup_address !== undefined) {
        updates.pickup_address = body.pickup_address
      }
      if (body.special_requests !== undefined) {
        updates.special_requests = body.special_requests
      }
      if (body.reschedule_note !== undefined) {
        updates.reschedule_note = body.reschedule_note
        updates.reschedule_requested_at = null
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' })
      }

      const { data, error } = await sb
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select(BOOKING_SELECT)
        .single()
      if (error) {
        const status = /duplicate|unique|conflict/i.test(error.message) ? 409 : 400
        return res.status(status).json({ error: error.message })
      }

      if (
        body.trip_status !== undefined &&
        String(body.trip_status) !== existing.trip_status
      ) {
        await sb.from('booking_status_history').insert({
          booking_id: bookingId,
          from_status: existing.trip_status || existing.status,
          to_status: String(body.trip_status),
          changed_by: 'admin',
          reason: 'trip_status_update',
          meta: { field: 'trip_status' },
        })
      }
      if (slotChanging) {
        await sb.from('booking_status_history').insert({
          booking_id: bookingId,
          from_status: existing.status,
          to_status: existing.status,
          changed_by: 'admin',
          reason: 'reschedule',
          meta: {
            from: {
              booking_date: existing.booking_date,
              start_time: existing.start_time,
              driver_id: existing.driver_id,
              vehicle_id: existing.vehicle_id,
            },
            to: {
              booking_date: nextDate,
              start_time: nextTime,
              driver_id: nextDriver,
              vehicle_id: nextVehicle,
            },
          },
        })

        const { bookingRowToEmailDetails, notifyDriverBooking } = await import(
          '../booking-app/lib/notify'
        )
        const kind =
          nextDriver !== existing.driver_id ? 'assigned' : 'rescheduled'
        void notifyDriverBooking(
          bookingRowToEmailDetails({
            id: data.id,
            status: data.status,
            booking_date: data.booking_date,
            start_time: data.start_time,
            client_name: data.client_name,
            client_email: data.client_email,
            client_phone: data.client_phone,
            notes: data.notes,
            booking_reference: data.booking_reference,
            grand_total_cents: data.grand_total_cents,
            final_price_cents: data.final_price_cents,
            tour: data.tour,
            vehicle: data.vehicle,
            driver: data.driver,
            changeNote: `Was ${existing.booking_date} ${String(existing.start_time).slice(0, 5)} → now ${nextDate} ${nextTime}`,
          }),
          kind
        )
      }

      return res.status(200).json({ success: true, booking: data })
    }

    return methodNotAllowed(res, ['GET', 'PATCH'])
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Admin trips API failed',
    })
  }
}
