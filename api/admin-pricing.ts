import type { VercelRequest, VercelResponse } from '@vercel/node'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_BOOKING_SETTINGS, parseBookingSettings } from '../booking-app/lib/pricing'
import { assertAdminAccess } from './_lib/adminAuth'
import { methodNotAllowed, readJson } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

const TOUR_SELECT_FULL =
  'id, name, description, slug, duration_label, included_items, excluded_items, image_url, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests, short_description, hero_tagline, detailed_description, hero_image_url, gallery_images, map_embed_url, seo_title, seo_description, seo_image, pricing_notes, perfect_for, good_to_know, experience_content, admin_meta'

const TOUR_SELECT_BASIC =
  'id, name, description, slug, duration_label, included_items, excluded_items, image_url, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests'

const VEHICLE_SELECT =
  'id, name, slug, capacity_min, capacity_max, vehicle_price_cents, vehicle_surcharge_cents, luggage_capacity, is_luxury'

function normalizeTour(t: Record<string, unknown>) {
  return {
    ...t,
    price_per_person_cents:
      t.price_per_person_cents ?? t.additional_guest_price_cents ?? 0,
    included_items: (t.included_items as string[]) ?? [],
    excluded_items: (t.excluded_items as string[]) ?? [],
    gallery_images: (t.gallery_images as string[]) ?? [],
    perfect_for: (t.perfect_for as string[]) ?? [],
    good_to_know: (t.good_to_know as string[]) ?? [],
    experience_content: t.experience_content ?? null,
    admin_meta:
      t.admin_meta && typeof t.admin_meta === 'object' ? t.admin_meta : {},
  }
}

function normalizeVehicle(v: Record<string, unknown>) {
  return {
    ...v,
    vehicle_price_cents: v.vehicle_price_cents ?? v.vehicle_surcharge_cents ?? 0,
  }
}

async function fetchAdminPayload(sb: ReturnType<typeof supabaseAdmin>) {
  const [toursResult, vehiclesResult, settingsResult] = await Promise.all([
    sb.from('tours').select(TOUR_SELECT_FULL).order('name'),
    sb.from('vehicles').select(VEHICLE_SELECT).order('name'),
    sb.from('app_settings').select('value').eq('key', 'booking').maybeSingle(),
  ])

  let tours = toursResult.data
  let tErr = toursResult.error
  if (tErr) {
    const withoutMeta =
      'id, name, description, slug, duration_label, included_items, excluded_items, image_url, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests, short_description, hero_tagline, detailed_description, hero_image_url, gallery_images, map_embed_url, seo_title, seo_description, seo_image, pricing_notes, perfect_for, good_to_know, experience_content'
    const mid = await sb.from('tours').select(withoutMeta).order('name')
    if (!mid.error) {
      tours = mid.data
      tErr = null
    } else {
      const fallback = await sb.from('tours').select(TOUR_SELECT_BASIC).order('name')
      tours = fallback.data
      tErr = fallback.error
    }
  }
  if (tErr) throw new Error(tErr.message)
  if (vehiclesResult.error) throw new Error(vehiclesResult.error.message)

  return {
    tours: (tours ?? []).map((t) => normalizeTour(t as Record<string, unknown>)),
    vehicles: (vehiclesResult.data ?? []).map((v) =>
      normalizeVehicle(v as Record<string, unknown>)
    ),
    settings: parseBookingSettings(
      (settingsResult.data?.value as Record<string, unknown>) ||
        DEFAULT_BOOKING_SETTINGS
    ),
  }
}

function asStringOrNull(value: unknown): string | null {
  if (value == null) return null
  return String(value)
}

function asStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) return []
  return value.map((x) => String(x))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const gate = await assertAdminAccess(req)
      if (gate !== true) return res.status(gate.status).json({ error: gate.error })

      if (useMockStore()) {
        return res.status(200).json(mockDb.adminPricing())
      }

      const payload = await fetchAdminPayload(supabaseAdmin())
      return res.status(200).json(payload)
    }

    if (req.method === 'PATCH') {
      const body = await readJson(req)
      const gate = await assertAdminAccess(req, body.pin as string | undefined)
      if (gate !== true) return res.status(gate.status).json({ error: gate.error })

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

      const tourUpdates = body.tours as Array<Record<string, unknown>>
      if (Array.isArray(tourUpdates)) {
        for (const t of tourUpdates) {
          if (!t?.id) continue
          const patch: Record<string, unknown> = {}

          if (t.price_per_person_cents != null) {
            patch.price_per_person_cents = Math.round(Number(t.price_per_person_cents))
            patch.additional_guest_price_cents = Math.round(
              Number(t.price_per_person_cents)
            )
          }
          if (t.additional_guest_price_cents != null && t.price_per_person_cents == null) {
            patch.additional_guest_price_cents = Math.round(
              Number(t.additional_guest_price_cents)
            )
            patch.price_per_person_cents = Math.round(
              Number(t.additional_guest_price_cents)
            )
          }
          if (t.base_price_cents != null) {
            patch.base_price_cents = Math.round(Number(t.base_price_cents))
          }
          if (t.max_guests !== undefined) {
            patch.max_guests = t.max_guests == null ? null : Number(t.max_guests)
          }

          if (t.duration_label !== undefined) {
            patch.duration_label = asStringOrNull(t.duration_label)
          }
          if (t.description !== undefined) {
            patch.description = asStringOrNull(t.description)
          }
          if (t.short_description !== undefined) {
            patch.short_description = asStringOrNull(t.short_description)
          }
          if (t.hero_tagline !== undefined) {
            patch.hero_tagline = asStringOrNull(t.hero_tagline)
          }
          if (t.detailed_description !== undefined) {
            patch.detailed_description = asStringOrNull(t.detailed_description)
          }
          if (t.hero_image_url !== undefined) {
            patch.hero_image_url = asStringOrNull(t.hero_image_url)
          }
          if (t.image_url !== undefined) {
            patch.image_url = asStringOrNull(t.image_url)
          }
          if (t.map_embed_url !== undefined) {
            patch.map_embed_url = asStringOrNull(t.map_embed_url)
          }
          if (t.seo_title !== undefined) {
            patch.seo_title = asStringOrNull(t.seo_title)
          }
          if (t.seo_description !== undefined) {
            patch.seo_description = asStringOrNull(t.seo_description)
          }
          if (t.seo_image !== undefined) {
            patch.seo_image = asStringOrNull(t.seo_image)
          }
          if (t.pricing_notes !== undefined) {
            patch.pricing_notes = asStringOrNull(t.pricing_notes)
          }

          const gallery = asStringArray(t.gallery_images)
          if (gallery !== undefined) patch.gallery_images = gallery
          const included = asStringArray(t.included_items)
          if (included !== undefined) patch.included_items = included
          const excluded = asStringArray(t.excluded_items)
          if (excluded !== undefined) patch.excluded_items = excluded
          const perfectFor = asStringArray(t.perfect_for)
          if (perfectFor !== undefined) patch.perfect_for = perfectFor
          const goodToKnow = asStringArray(t.good_to_know)
          if (goodToKnow !== undefined) patch.good_to_know = goodToKnow

          if (t.experience_content !== undefined) {
            patch.experience_content =
              t.experience_content && typeof t.experience_content === 'object'
                ? t.experience_content
                : null
          }

          if (t.admin_meta !== undefined) {
            patch.admin_meta =
              t.admin_meta && typeof t.admin_meta === 'object' ? t.admin_meta : {}
          }

          if (Object.keys(patch).length) {
            const { error } = await sb.from('tours').update(patch).eq('id', t.id)
            if (error) {
              // Retry without experience columns if migration 007 is not applied yet
              const basicPatch: Record<string, unknown> = {}
              for (const key of [
                'price_per_person_cents',
                'additional_guest_price_cents',
                'base_price_cents',
                'max_guests',
                'duration_label',
                'description',
                'included_items',
                'excluded_items',
                'image_url',
              ]) {
                if (key in patch) basicPatch[key] = patch[key]
              }
              if (Object.keys(basicPatch).length) {
                const retry = await sb.from('tours').update(basicPatch).eq('id', t.id)
                if (retry.error) throw new Error(retry.error.message)
              } else {
                throw new Error(error.message)
              }
            }
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

      const payload = await fetchAdminPayload(sb)
      return res.status(200).json({ success: true, ...payload })
    }

    return methodNotAllowed(res, ['GET', 'PATCH'])
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Admin pricing failed',
    })
  }
}
