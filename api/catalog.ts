import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import { TOUR_PRICES_CENTS } from '../booking-app/lib/yoco'
import { methodNotAllowed } from './_lib/http'

function withPrices<T extends { id: string; slug?: string | null }>(tours: T[]) {
  return tours.map((t) => ({
    ...t,
    price_cents:
      TOUR_PRICES_CENTS[t.slug || ''] || TOUR_PRICES_CENTS[t.id] || 150000,
  }))
}

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
        tours: withPrices(catalog.tours),
        yoco_public_key: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || null,
      })
    }

    const sb = supabaseAdmin()
    const [{ data: drivers, error: dErr }, { data: vehicles, error: vErr }, { data: tours, error: tErr }] =
      await Promise.all([
        sb.from('drivers').select('id, name, is_active').eq('is_active', true).order('name'),
        sb.from('vehicles').select('id, name, description, slug').order('name'),
        sb.from('tours').select('id, name, description, slug').order('name'),
      ])

    const err = dErr || vErr || tErr
    if (err) return res.status(500).json({ error: err.message })

    return res.status(200).json({
      drivers: drivers ?? [],
      vehicles: vehicles ?? [],
      tours: withPrices(tours ?? []),
      yoco_public_key: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || null,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Catalog failed'
    return res.status(500).json({ error: message })
  }
}
