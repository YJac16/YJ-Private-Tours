import { NextResponse } from 'next/server'
import { mockDb, useMockStore } from '@/lib/mock-store'
import { supabaseAdmin } from '@/lib/supabase-server'
import { DEFAULT_BOOKING_SETTINGS, parseBookingSettings } from '@/lib/pricing'

export async function GET() {
  if (useMockStore()) {
    const catalog = mockDb.catalog()
    return NextResponse.json({
      ...catalog,
      yoco_public_key: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || null,
    })
  }

  const [
    { data: drivers, error: dErr },
    { data: vehicles, error: vErr },
    { data: tours, error: tErr },
    { data: settingsRow },
    { data: blocked },
  ] = await Promise.all([
    supabaseAdmin
      .from('drivers')
      .select(
        'id, name, full_name, is_active, photo_url, languages, years_experience, bio, rating_avg, rating_count'
      )
      .eq('is_active', true)
      .order('name'),
    supabaseAdmin
      .from('vehicles')
      .select(
        'id, name, description, slug, capacity_min, capacity_max, vehicle_price_cents, vehicle_surcharge_cents, luggage_capacity, features, image_url, is_luxury'
      )
      .order('name'),
    supabaseAdmin
      .from('tours')
      .select(
        'id, name, description, slug, duration_label, included_items, excluded_items, image_url, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests'
      )
      .order('name'),
    supabaseAdmin.from('app_settings').select('value').eq('key', 'booking').maybeSingle(),
    supabaseAdmin
      .from('blocked_dates')
      .select('blocked_date')
      .gte('blocked_date', new Date().toISOString().slice(0, 10)),
  ])

  const err = dErr || vErr || tErr
  if (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  const settings = parseBookingSettings(
    (settingsRow?.value as Record<string, unknown>) || DEFAULT_BOOKING_SETTINGS
  )

  return NextResponse.json({
    drivers: (drivers ?? []).map((d) => ({
      ...d,
      full_name: d.full_name || d.name,
      languages: d.languages ?? ['English'],
      years_experience: d.years_experience ?? 0,
      rating_count: d.rating_count ?? 0,
    })),
    vehicles: (vehicles ?? []).map((v) => ({
      ...v,
      vehicle_price_cents: v.vehicle_price_cents ?? v.vehicle_surcharge_cents ?? 0,
      features: v.features ?? [],
      luggage_capacity: v.luggage_capacity ?? 2,
    })),
    tours: (tours ?? []).map((t) => ({
      ...t,
      price_per_person_cents:
        t.price_per_person_cents ?? t.additional_guest_price_cents ?? 0,
      included_items: t.included_items ?? [],
      excluded_items: t.excluded_items ?? [],
    })),
    settings,
    blocked_dates: (blocked ?? []).map((b) => b.blocked_date),
    yoco_public_key: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || null,
  })
}
