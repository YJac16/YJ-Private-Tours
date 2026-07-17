import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_BOOKING_SETTINGS, parseBookingSettings } from '../booking-app/lib/pricing'
import { methodNotAllowed } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  try {
    if (useMockStore()) {
      const catalog = mockDb.catalog()
      return res.status(200).json({
        ...catalog,
        yoco_public_key: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || null,
      })
    }

    const sb = supabaseAdmin()
    const [
      { data: drivers, error: dErr },
      { data: vehicles, error: vErr },
      { data: tours, error: tErr },
      { data: settingsRow },
      { data: blocked },
    ] = await Promise.all([
      sb
        .from('drivers')
        .select(
          'id, name, full_name, is_active, photo_url, languages, years_experience, bio, rating_avg, rating_count'
        )
        .eq('is_active', true)
        .order('name'),
      sb
        .from('vehicles')
        .select(
          'id, name, description, slug, capacity_min, capacity_max, vehicle_price_cents, vehicle_surcharge_cents, luggage_capacity, features, image_url, is_luxury'
        )
        .order('name'),
      sb
        .from('tours')
        .select(
          'id, name, description, slug, duration_label, included_items, excluded_items, image_url, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests'
        )
        .order('name'),
      sb.from('app_settings').select('value').eq('key', 'booking').maybeSingle(),
      sb
        .from('blocked_dates')
        .select('blocked_date')
        .gte('blocked_date', new Date().toISOString().slice(0, 10)),
    ])

    const err = dErr || vErr || tErr
    if (err) return res.status(500).json({ error: err.message })

    const settings = parseBookingSettings(
      (settingsRow?.value as Record<string, unknown>) || DEFAULT_BOOKING_SETTINGS
    )

    const normalizedTours = (tours ?? []).map((t) => ({
      ...t,
      price_per_person_cents:
        t.price_per_person_cents ?? t.additional_guest_price_cents ?? 0,
      included_items: t.included_items ?? [],
      excluded_items: t.excluded_items ?? [],
    }))

    const normalizedVehicles = (vehicles ?? []).map((v) => ({
      ...v,
      vehicle_price_cents: v.vehicle_price_cents ?? v.vehicle_surcharge_cents ?? 0,
      features: v.features ?? [],
      luggage_capacity: v.luggage_capacity ?? 2,
    }))

    const normalizedDrivers = (drivers ?? []).map((d) => ({
      ...d,
      full_name: d.full_name || d.name,
      languages: d.languages ?? ['English'],
      years_experience: d.years_experience ?? 0,
      rating_count: d.rating_count ?? 0,
    }))

    return res.status(200).json({
      drivers: normalizedDrivers,
      vehicles: normalizedVehicles,
      tours: normalizedTours,
      settings,
      blocked_dates: (blocked ?? []).map((b) => b.blocked_date),
      yoco_public_key: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || null,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Catalog failed'
    return res.status(500).json({ error: message })
  }
}
