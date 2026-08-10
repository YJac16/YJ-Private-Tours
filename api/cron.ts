import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  shouldSendDriverReminder,
  tomorrowCapeTownYmd,
} from '../booking-app/lib/driver-reminders'
import { drainEmailOutbox } from '../booking-app/lib/email-outbox'
import {
  bookingRowToEmailDetails,
  notifyDriverBooking,
} from '../booking-app/lib/notify'
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
    return useMockStore() || process.env.NODE_ENV !== 'production'
  }
  const auth = req.headers.authorization || ''
  return auth === `Bearer ${secret}`
}

function jobName(req: VercelRequest): string {
  const q = String(req.query.job || '').toLowerCase()
  if (q) return q
  const url = String(req.url || '')
  if (url.includes('email-outbox')) return 'email-outbox'
  if (url.includes('driver-reminders')) return 'driver-reminders'
  return 'email-outbox'
}

async function runEmailOutbox(res: VercelResponse) {
  const sb = useMockStore() ? null : supabaseAdmin()
  const result = await drainEmailOutbox(sb)
  return res.status(200).json({ ok: true, mock: useMockStore(), ...result })
}

async function runDriverReminders(res: VercelResponse) {
  const targetDate = tomorrowCapeTownYmd()
  const nowIso = new Date().toISOString()
  let sent = 0
  let skipped = 0

  if (useMockStore()) {
    const due = mockDb.listBookings(null, targetDate, targetDate).filter((b) =>
      shouldSendDriverReminder({
        status: b.status,
        driverReminderSentAt: (b as { driver_reminder_sent_at?: string | null })
          .driver_reminder_sent_at,
      })
    )
    for (const b of due) {
      await notifyDriverBooking(
        {
          bookingId: b.booking_reference || b.id,
          status: b.status === 'paid' ? 'paid' : 'pending',
          bookingDate: b.booking_date,
          startTime: b.start_time,
          clientName: b.client_name,
          clientEmail: b.client_email,
          clientPhone: b.client_phone,
          tourName: b.tour_name_snapshot,
          vehicleName: b.vehicle_name_snapshot,
          driverName: b.driver_name_snapshot,
          notes: b.notes,
          amountCents: b.grand_total_cents,
          changeNote: 'Day-before reminder',
        },
        'reminder'
      )
      sent += 1
    }
    return res.status(200).json({
      ok: true,
      mock: true,
      targetDate,
      sent,
      skipped,
    })
  }

  const sb = supabaseAdmin()
  const { data, error } = await sb
    .from('bookings')
    .select(
      `
      id, status, booking_date, start_time, client_name, client_email, client_phone,
      notes, booking_reference, grand_total_cents, driver_reminder_sent_at,
      tour_name_snapshot, vehicle_name_snapshot, driver_name_snapshot,
      tour:tours(name, slug),
      vehicle:vehicles(name),
      driver:drivers(name, full_name)
    `
    )
    .eq('booking_date', targetDate)
    .in('status', ['pending', 'paid'])

  if (error) return res.status(500).json({ error: error.message })

  for (const row of data ?? []) {
    if (
      !shouldSendDriverReminder({
        status: row.status,
        driverReminderSentAt: row.driver_reminder_sent_at,
      })
    ) {
      skipped += 1
      continue
    }

    const tour = Array.isArray(row.tour) ? row.tour[0] : row.tour
    const vehicle = Array.isArray(row.vehicle) ? row.vehicle[0] : row.vehicle
    const driver = Array.isArray(row.driver) ? row.driver[0] : row.driver

    await notifyDriverBooking(
      bookingRowToEmailDetails({
        ...row,
        tour: tour || null,
        vehicle: vehicle || null,
        driver: driver || null,
        changeNote: 'Day-before reminder',
      }),
      'reminder',
      { sb }
    )

    await sb
      .from('bookings')
      .update({ driver_reminder_sent_at: nowIso })
      .eq('id', row.id)
    sent += 1
  }

  return res.status(200).json({
    ok: true,
    mock: false,
    targetDate,
    sent,
    skipped,
  })
}

/**
 * Combined cron entry for Hobby plan function limits.
 * - /api/cron?job=email-outbox
 * - /api/cron?job=driver-reminders
 * Rewrites keep legacy paths working.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return methodNotAllowed(res, ['GET', 'POST'])
    }
    if (!authorizeCron(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const job = jobName(req)
    if (job === 'driver-reminders') return runDriverReminders(res)
    if (job === 'email-outbox') return runEmailOutbox(res)

    // Daily combined run (Hobby: one cron/day)
    const email = await (async () => {
      const sb = useMockStore() ? null : supabaseAdmin()
      return drainEmailOutbox(sb)
    })()
    // driver reminders via internal call path
    const remindersRes = {
      statusCode: 200,
      body: null as unknown,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(payload: unknown) {
        this.body = payload
        return this
      },
    }
    await runDriverReminders(remindersRes as unknown as VercelResponse)
    return res.status(200).json({
      ok: true,
      email,
      reminders: remindersRes.body,
    })
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Cron job failed',
    })
  }
}
