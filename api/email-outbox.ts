import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { drainEmailOutbox } from '../booking-app/lib/email-outbox'
import { useMockStore } from '../booking-app/lib/mock-store'
import { methodNotAllowed } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

function authorizeCron(req: VercelRequest): boolean {
  const cronHeader = req.headers['x-vercel-cron']
  if (cronHeader === '1') return true
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return useMockStore() || process.env.NODE_ENV !== 'production'
  }
  const auth = req.headers.authorization || ''
  return auth === `Bearer ${secret}`
}

/**
 * Drain notification_outbox (Resend retry).
 * Vercel Cron: every 10 minutes.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return methodNotAllowed(res, ['GET', 'POST'])
    }
    if (!authorizeCron(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const sb = useMockStore() ? null : supabaseAdmin()
    const result = await drainEmailOutbox(sb)
    return res.status(200).json({ ok: true, mock: useMockStore(), ...result })
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Outbox drain failed',
    })
  }
}
