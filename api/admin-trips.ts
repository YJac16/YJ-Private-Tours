import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { isAuthError, requireAuth } from './_lib/authUser'
import { methodNotAllowed } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowed(res, ['GET'])
    }

    const auth = await requireAuth(req, ['admin'])
    if (isAuthError(auth)) {
      return res.status(auth.status).json({ error: auth.error })
    }

    if (useMockStore()) {
      return res.status(200).json({ bookings: mockDb.listBookings() })
    }

    const sb = supabaseAdmin()
    const { data, error } = await sb
      .from('bookings')
      .select(
        `
        id, booking_date, start_time, status, trip_status, payment_status,
        client_name, client_email, client_phone, notes, driver_id, client_user_id,
        guest_count, adult_count, child_count, passenger_count,
        grand_total_cents, final_price_cents, driver_earnings_cents,
        pickup_address, special_requests, booking_reference, created_at,
        tour:tours(id, name, slug),
        vehicle:vehicles(id, name, slug),
        driver:drivers(id, name, full_name)
      `
      )
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ bookings: data ?? [] })
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Admin trips API failed',
    })
  }
}
