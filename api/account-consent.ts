import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { getAuthContext } from './_lib/authUser'
import { methodNotAllowed, readJson } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

function headerValue(req: VercelRequest, name: string): string {
  const raw = req.headers[name.toLowerCase()]
  return Array.isArray(raw) ? String(raw[0] || '') : String(raw || '')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await getAuthContext(req)
  if (!auth) return res.status(401).json({ error: 'Sign in required' })

  const sb = supabaseAdmin()

  try {
    if (req.method === 'GET') {
      const userIdParam =
        auth.role === 'admin' ? String(req.query.user_id || '') : ''
      const emailParam =
        auth.role === 'admin'
          ? String(req.query.email || '')
              .trim()
              .toLowerCase()
          : ''
      let targetUserId = userIdParam || auth.user.id

      if ((userIdParam || emailParam) && auth.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' })
      }

      if (emailParam && !userIdParam) {
        const { data: profile } = await sb
          .from('profiles')
          .select('id')
          .ilike('email', emailParam)
          .maybeSingle()
        if (!profile?.id) {
          return res.status(200).json({
            form: null,
            consent: null,
            signed: false,
            profile_missing: true,
          })
        }
        targetUserId = profile.id
      }

      const { data: form, error: formErr } = await sb
        .from('consent_form_versions')
        .select('id, version, title, body_html, effective_at, is_current')
        .eq('is_current', true)
        .maybeSingle()
      if (formErr) return res.status(500).json({ error: formErr.message })

      let consent = null
      if (form?.id) {
        const { data: signed, error: cErr } = await sb
          .from('client_consents')
          .select(
            'id, version_id, full_name, email, phone, signature_text, signed_at, form_payload'
          )
          .eq('user_id', targetUserId)
          .eq('version_id', form.id)
          .maybeSingle()
        if (cErr) return res.status(500).json({ error: cErr.message })
        consent = signed
      }

      return res.status(200).json({
        form,
        consent,
        signed: Boolean(consent),
      })
    }

    if (req.method === 'POST') {
      const body = await readJson(req)
      const full_name = String(body.full_name || '').trim()
      const email = String(body.email || auth.user.email || '').trim()
      const phone = body.phone ? String(body.phone).trim() : null
      const signature_text = String(body.signature_text || '').trim()
      const acknowledgements = Boolean(body.acknowledgements)
      const emergency_contact = body.emergency_contact
        ? String(body.emergency_contact).trim()
        : null
      const medical_notes = body.medical_notes
        ? String(body.medical_notes).trim()
        : null

      if (!full_name || !email || !signature_text) {
        return res.status(400).json({
          error: 'Full name, email, and typed signature are required.',
        })
      }
      if (!acknowledgements) {
        return res.status(400).json({
          error: 'You must acknowledge the informed consent terms.',
        })
      }
      if (signature_text.toLowerCase() !== full_name.toLowerCase()) {
        return res.status(400).json({
          error: 'Signature must match your full name exactly.',
        })
      }

      const { data: form, error: formErr } = await sb
        .from('consent_form_versions')
        .select('id, version')
        .eq('is_current', true)
        .maybeSingle()
      if (formErr || !form) {
        return res.status(500).json({
          error: formErr?.message || 'Consent form is not configured.',
        })
      }

      const { data: existing } = await sb
        .from('client_consents')
        .select('id, signed_at')
        .eq('user_id', auth.user.id)
        .eq('version_id', form.id)
        .maybeSingle()

      if (existing) {
        return res.status(200).json({
          success: true,
          already_signed: true,
          consent: existing,
        })
      }

      const { data: inserted, error: insErr } = await sb
        .from('client_consents')
        .insert({
          user_id: auth.user.id,
          version_id: form.id,
          full_name,
          email,
          phone,
          signature_text,
          ip: headerValue(req, 'x-forwarded-for').split(',')[0]?.trim() || null,
          user_agent: headerValue(req, 'user-agent') || null,
          form_payload: {
            acknowledgements: true,
            emergency_contact,
            medical_notes,
            version: form.version,
          },
        })
        .select(
          'id, version_id, full_name, email, phone, signature_text, signed_at, form_payload'
        )
        .single()

      if (insErr) return res.status(500).json({ error: insErr.message })

      return res.status(201).json({ success: true, consent: inserted })
    }

    return methodNotAllowed(res, ['GET', 'POST'])
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Consent request failed'
    return res.status(500).json({ error: message })
  }
}
