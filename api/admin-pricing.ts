import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_BOOKING_SETTINGS, parseBookingSettings } from '../booking-app/lib/pricing'
import { methodNotAllowed, readJson } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

function checkPin(req: VercelRequest, bodyPin?: string) {
  const expected = process.env.DRIVER_PIN || process.env.ADMIN_PIN || '0420'
  const headerPin = req.headers['x-driver-pin']
  const h = Array.isArray(headerPin) ? headerPin[0] : headerPin
  return (h || bodyPin) === expected
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      if (!checkPin(req)) return res.status(401).json({ error: 'Unauthorized' })

      if (useMockStore()) {
        return res.status(200).json(mockDb.adminPricing())
      }

      const sb = supabaseAdmin()
      const [{ data: tours }, { data: vehicles }, { data: settingsRow }] =
        await Promise.all([
          sb
            .from('tours')
            .select(
              'id, name, slug, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests, duration_label'
            )
            .order('name'),
          sb
            .from('vehicles')
            .select(
              'id, name, slug, capacity_min, capacity_max, vehicle_price_cents, vehicle_surcharge_cents, luggage_capacity, is_luxury'
            )
            .order('name'),
          sb.from('app_settings').select('value').eq('key', 'booking').maybeSingle(),
        ])

      return res.status(200).json({
        tours: (tours ?? []).map((t) => ({
          ...t,
          price_per_person_cents:
            t.price_per_person_cents ?? t.additional_guest_price_cents ?? 0,
        })),
        vehicles: (vehicles ?? []).map((v) => ({
          ...v,
          vehicle_price_cents: v.vehicle_price_cents ?? v.vehicle_surcharge_cents ?? 0,
        })),
        settings: parseBookingSettings(
          (settingsRow?.value as Record<string, unknown>) || DEFAULT_BOOKING_SETTINGS
        ),
      })
    }

    if (req.method === 'PATCH') {
      const body = await readJson(req)
      if (!checkPin(req, body.pin as string | undefined)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (useMockStore()) {
        mockDb.updateAdminPricing(body)
        return res.status(200).json({ success: true, ...mockDb.adminPricing() })
      }

      const sb = supabaseAdmin()

      if (body.settings) {
        const s = body.settings as Record<string, unknown>
        await sb.from('app_settings').upsert({
          key: 'booking',
          value: {
            max_guests_default: Number(s.max_guests_default) || 5,
            allow_larger_groups: Boolean(s.allow_larger_groups),
          },
          updated_at: new Date().toISOString(),
        })
      }

      const tourUpdates = body.tours as Array<{
        id: string
        price_per_person_cents?: number
        base_price_cents?: number
        additional_guest_price_cents?: number
        max_guests?: number | null
      }>
      if (Array.isArray(tourUpdates)) {
        for (const t of tourUpdates) {
          const patch: Record<string, unknown> = {}
          if (t.price_per_person_cents != null) {
            patch.price_per_person_cents = Math.round(t.price_per_person_cents)
            patch.additional_guest_price_cents = Math.round(t.price_per_person_cents)
          }
          if (t.additional_guest_price_cents != null && t.price_per_person_cents == null) {
            patch.additional_guest_price_cents = Math.round(t.additional_guest_price_cents)
            patch.price_per_person_cents = Math.round(t.additional_guest_price_cents)
          }
          if (t.base_price_cents != null) patch.base_price_cents = Math.round(t.base_price_cents)
          if (t.max_guests !== undefined) patch.max_guests = t.max_guests
          if (Object.keys(patch).length) {
            await sb.from('tours').update(patch).eq('id', t.id)
          }
        }
      }

      const vehicleUpdates = body.vehicles as Array<{
        id: string
        capacity_min?: number
        capacity_max?: number
        vehicle_price_cents?: number
        vehicle_surcharge_cents?: number
        luggage_capacity?: number
        is_luxury?: boolean
      }>
      if (Array.isArray(vehicleUpdates)) {
        for (const v of vehicleUpdates) {
          const patch: Record<string, unknown> = {}
          if (v.capacity_min != null) patch.capacity_min = Math.round(v.capacity_min)
          if (v.capacity_max != null) patch.capacity_max = Math.round(v.capacity_max)
          if (v.vehicle_price_cents != null) {
            patch.vehicle_price_cents = Math.round(v.vehicle_price_cents)
            patch.vehicle_surcharge_cents = Math.round(v.vehicle_price_cents)
          }
          if (v.vehicle_surcharge_cents != null && v.vehicle_price_cents == null) {
            patch.vehicle_surcharge_cents = Math.round(v.vehicle_surcharge_cents)
            patch.vehicle_price_cents = Math.round(v.vehicle_surcharge_cents)
          }
          if (v.luggage_capacity != null) {
            patch.luggage_capacity = Math.round(v.luggage_capacity)
          }
          if (v.is_luxury !== undefined) patch.is_luxury = Boolean(v.is_luxury)
          if (Object.keys(patch).length) {
            await sb.from('vehicles').update(patch).eq('id', v.id)
          }
        }
      }

      const [{ data: tours }, { data: vehicles }, { data: settingsRow }] =
        await Promise.all([
          sb
            .from('tours')
            .select(
              'id, name, slug, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests, duration_label'
            )
            .order('name'),
          sb
            .from('vehicles')
            .select(
              'id, name, slug, capacity_min, capacity_max, vehicle_price_cents, vehicle_surcharge_cents, luggage_capacity, is_luxury'
            )
            .order('name'),
          sb.from('app_settings').select('value').eq('key', 'booking').maybeSingle(),
        ])

      return res.status(200).json({
        success: true,
        tours: (tours ?? []).map((t) => ({
          ...t,
          price_per_person_cents:
            t.price_per_person_cents ?? t.additional_guest_price_cents ?? 0,
        })),
        vehicles: (vehicles ?? []).map((v) => ({
          ...v,
          vehicle_price_cents: v.vehicle_price_cents ?? v.vehicle_surcharge_cents ?? 0,
        })),
        settings: parseBookingSettings(
          (settingsRow?.value as Record<string, unknown>) || DEFAULT_BOOKING_SETTINGS
        ),
      })
    }

    return methodNotAllowed(res, ['GET', 'PATCH'])
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Admin pricing failed',
    })
  }
}
