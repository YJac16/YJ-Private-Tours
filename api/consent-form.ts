import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { methodNotAllowed } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Public read of the current informed consent form (no auth). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  try {
    if (useMockStore()) {
      return res.status(200).json({
        form: {
          id: 'mock-consent',
          version: '1.0',
          title: 'Informed Consent',
          body_html:
            '<p>Mock consent form for local development. Guests acknowledge POPIA and tour risks at checkout.</p>',
        },
      })
    }

    const sb = supabaseAdmin()
    const { data: form, error } = await sb
      .from('consent_form_versions')
      .select('id, version, title, body_html, effective_at, is_current')
      .eq('is_current', true)
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ form })
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Could not load consent form',
    })
  }
}
