import { NextResponse } from 'next/server'
import { mockDb, useMockStore } from '@/lib/mock-store'
import { supabaseAdmin } from '@/lib/supabase-server'
import { TOUR_PRICES_CENTS } from '@/lib/yoco'

function withPrices<T extends { id: string; slug?: string | null }>(tours: T[]) {
  return tours.map((t) => ({
    ...t,
    price_cents:
      TOUR_PRICES_CENTS[t.slug || ''] || TOUR_PRICES_CENTS[t.id] || 150000,
  }))
}

export async function GET() {
  if (useMockStore()) {
    const catalog = mockDb.catalog()
    return NextResponse.json({
      ...catalog,
      tours: withPrices(catalog.tours),
      yoco_public_key: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || null,
    })
  }

  const [{ data: drivers, error: dErr }, { data: vehicles, error: vErr }, { data: tours, error: tErr }] =
    await Promise.all([
      supabaseAdmin
        .from('drivers')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name'),
      supabaseAdmin.from('vehicles').select('id, name, description, slug').order('name'),
      supabaseAdmin.from('tours').select('id, name, description, slug').order('name'),
    ])

  const err = dErr || vErr || tErr
  if (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({
    drivers: drivers ?? [],
    vehicles: vehicles ?? [],
    tours: withPrices(tours ?? []),
    yoco_public_key: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || null,
  })
}
