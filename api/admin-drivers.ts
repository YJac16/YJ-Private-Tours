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

const DRIVER_SELECT =
  'id, name, full_name, is_active, photo_url, languages, years_experience, bio, rating_avg, rating_count, user_id, created_at'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const auth = await requireAuth(req, ['admin'])
    if (isAuthError(auth)) {
      return res.status(auth.status).json({ error: auth.error })
    }

    if (req.method === 'GET') {
      if (useMockStore()) {
        return res.status(200).json({ drivers: mockDb.listAllDrivers() })
      }
      const sb = supabaseAdmin()
      const { data, error } = await sb
        .from('drivers')
        .select(DRIVER_SELECT)
        .order('full_name', { ascending: true })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ drivers: data ?? [] })
    }

    if (req.method === 'POST') {
      const body = await readJson(req)
      const full_name = String(body.full_name || body.name || '').trim()
      if (!full_name) {
        return res.status(400).json({ error: 'full_name required' })
      }

      let user_id: string | null =
        body.user_id != null ? String(body.user_id) : null

      const inviteEmail =
        typeof body.invite_email === 'string' ? body.invite_email.trim() : ''
      const invitePassword =
        typeof body.invite_password === 'string' ? body.invite_password : ''

      if (inviteEmail && invitePassword && !useMockStore()) {
        const sb = supabaseAdmin()
        const { data: created, error: createErr } =
          await sb.auth.admin.createUser({
            email: inviteEmail,
            password: invitePassword,
            email_confirm: true,
            user_metadata: { full_name },
          })
        if (createErr || !created.user) {
          return res.status(400).json({
            error: createErr?.message || 'Could not create invite user',
          })
        }
        user_id = created.user.id
        await sb.from('profiles').upsert({
          id: user_id,
          role: 'driver',
          email: inviteEmail,
          full_name,
        })
      } else if (inviteEmail && useMockStore()) {
        user_id =
          user_id ||
          `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`
      }

      const payload = {
        name: String(body.name || full_name),
        full_name,
        is_active: body.is_active !== false,
        photo_url: (body.photo_url as string) || null,
        languages: Array.isArray(body.languages)
          ? (body.languages as string[])
          : String(body.languages || 'English')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
        years_experience: Number(body.years_experience) || 0,
        bio: (body.bio as string) || null,
        user_id,
      }

      if (useMockStore()) {
        const driver = mockDb.createDriver(payload)
        return res.status(200).json({ success: true, driver })
      }

      const sb = supabaseAdmin()
      const { data, error } = await sb
        .from('drivers')
        .insert(payload)
        .select(DRIVER_SELECT)
        .single()
      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true, driver: data })
    }

    if (req.method === 'PATCH') {
      const body = await readJson(req)
      const id = String(body.id || body.driver_id || '')
      if (!id) return res.status(400).json({ error: 'id required' })

      const updates: Record<string, unknown> = {}
      if (body.full_name !== undefined) {
        updates.full_name = String(body.full_name)
        if (body.name === undefined) updates.name = String(body.full_name)
      }
      if (body.name !== undefined) updates.name = String(body.name)
      if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)
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
              .map((s) => s.trim())
              .filter(Boolean)
      }
      if (body.user_id !== undefined) {
        updates.user_id = body.user_id ? String(body.user_id) : null
      }

      if (useMockStore()) {
        const driver = mockDb.updateDriver(id, updates as Parameters<
          typeof mockDb.updateDriver
        >[1])
        return res.status(200).json({ success: true, driver })
      }

      const sb = supabaseAdmin()
      const { data, error } = await sb
        .from('drivers')
        .update(updates)
        .eq('id', id)
        .select(DRIVER_SELECT)
        .single()
      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true, driver: data })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH'])
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Admin drivers API failed',
    })
  }
}
