import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  shouldSendDriverReminder,
  tomorrowCapeTownYmd,
} from '../booking-app/lib/driver-reminders'
import { bookingRowToEmailDetails, notifyDriverBooking } from '../booking-app/lib/notify'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
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
    // Allow in mock/dev when no secret configured
    return useMockStore() || process.env.NODE_ENV !== 'production'
  }
  const auth = req.headers.authorization || ''
  return auth === `Bearer ${secret}`
}

/**
 * Day-before driver reminders.
 * Vercel Cron: GET/POST /api/driver-reminders daily (Africa/Johannesburg tomorrow).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return methodNotAllowed(res, ['GET', 'POST'])
    }
    if (!authorizeCron(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const targetDate = tomorrowCapeTownYmd()
    const nowIso = new Date().toISOString()
    let sent = 0
    let skipped = 0

    if (useMockStore()) {
      const due = mockDb.listBookings(null, targetDate, targetDate).filter((b) =>
        shouldSendDriverReminder({
          status: b.status,
          booking_date: b.booking_date,
          reminder_sent_at: b.reminder_sent_at,
        })
      )
      for (const b of due) {
        void notifyDriverBooking(
          bookingRowToEmailDetails({
            ...b,
            changeNote: 'Tour is tomorrow — please confirm vehicle and pickup.',
          }),
          'reminder'
        )
        mockDb.markReminderSent(b.id, nowIso)
        sent += 1
      }
      return res.status(200).json({
        ok: true,
        target_date: targetDate,
        sent,
        skipped: 0,
        mock: true,
      })
    }

    const sb = supabaseAdmin()
    const { data, error } = await sb
      .from('bookings')
      .select(
        `
        id, status, booking_date, start_time, client_name, client_email, client_phone,
        notes, booking_reference, grand_total_cents, final_price_cents, reminder_sent_at,
        tour:tours(name), vehicle:vehicles(name), driver:drivers(name, full_name)
      `
      )
      .eq('booking_date', targetDate)
      .in('status', ['pending', 'paid'])
      .is('reminder_sent_at', null)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    for (const row of data ?? []) {
      if (
        !shouldSendDriverReminder({
          status: row.status,
          booking_date: row.booking_date,
          reminder_sent_at: row.reminder_sent_at,
        })
      ) {
        skipped += 1
        continue
      }
      void notifyDriverBooking(
        bookingRowToEmailDetails({
          ...row,
          changeNote: 'Tour is tomorrow — please confirm vehicle and pickup.',
        }),
        'reminder'
      )
      const { error: upErr } = await sb
        .from('bookings')
        .update({ reminder_sent_at: nowIso })
        .eq('id', row.id)
        .is('reminder_sent_at', null)
      if (upErr) {
        console.error('[reminders] mark failed', row.id, upErr.message)
        skipped += 1
        continue
      }
      await sb.from('booking_status_history').insert({
        booking_id: row.id,
        from_status: row.status,
        to_status: row.status,
        changed_by: 'system',
        reason: 'reminder_sent',
        meta: { target_date: targetDate },
      })
      sent += 1
    }

    return res.status(200).json({
      ok: true,
      target_date: targetDate,
      sent,
      skipped,
    })
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Driver reminders failed',
    })
  }
}
