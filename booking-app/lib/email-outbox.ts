/**
 * Phase 6 notification outbox: enqueue + drain with retry & dedupe.
 * Persists to Supabase when configured; falls back to in-memory for mock/dev.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { useMockStore } from './mock-store'

export type OutboxAudience = 'driver' | 'guest' | 'ops'
export type OutboxStatus = 'pending' | 'sent' | 'failed'

export type OutboxRow = {
  id: string
  dedupe_key: string
  audience: OutboxAudience
  kind: string
  to_email: string
  subject: string
  body_text: string
  body_html: string | null
  payload: Record<string, unknown>
  status: OutboxStatus
  attempts: number
  next_attempt_at: string
  last_error: string | null
  provider_id: string | null
  created_at: string
  sent_at: string | null
}

export type EnqueueInput = {
  dedupeKey: string
  audience: OutboxAudience
  kind: string
  toEmail: string
  subject: string
  bodyText: string
  bodyHtml?: string | null
  payload?: Record<string, unknown>
}

export const OUTBOX_MAX_ATTEMPTS = 5
const BATCH_SIZE = 25

const memory: OutboxRow[] = []

function uuid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `outbox-${Date.now()}-${Math.random()}`
}

export function backoffMinutes(attempts: number): number {
  return Math.min(60, Math.pow(2, Math.max(0, attempts - 1)))
}

export function resetOutboxMemoryForTests() {
  memory.length = 0
}

export function listOutboxMemory(): OutboxRow[] {
  return [...memory]
}

function insertMemory(input: EnqueueInput): { inserted: boolean; row: OutboxRow } {
  const existing = memory.find((r) => r.dedupe_key === input.dedupeKey)
  if (existing) return { inserted: false, row: existing }
  const now = new Date().toISOString()
  const row: OutboxRow = {
    id: uuid(),
    dedupe_key: input.dedupeKey,
    audience: input.audience,
    kind: input.kind,
    to_email: input.toEmail,
    subject: input.subject,
    body_text: input.bodyText,
    body_html: input.bodyHtml ?? null,
    payload: input.payload ?? {},
    status: 'pending',
    attempts: 0,
    next_attempt_at: now,
    last_error: null,
    provider_id: null,
    created_at: now,
    sent_at: null,
  }
  memory.push(row)
  return { inserted: true, row }
}

export async function enqueueNotification(
  input: EnqueueInput,
  sb?: SupabaseClient | null
): Promise<{ inserted: boolean; id: string }> {
  const to = String(input.toEmail || '').trim()
  if (!to) {
    return { inserted: false, id: '' }
  }

  if (!sb || useMockStore()) {
    const { inserted, row } = insertMemory(input)
    return { inserted, id: row.id }
  }

  const { data, error } = await sb
    .from('notification_outbox')
    .insert({
      dedupe_key: input.dedupeKey,
      audience: input.audience,
      kind: input.kind,
      to_email: to,
      subject: input.subject,
      body_text: input.bodyText,
      body_html: input.bodyHtml ?? null,
      payload: input.payload ?? {},
      status: 'pending',
      next_attempt_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle()

  if (error) {
    // Unique violation = duplicate (already enqueued)
    if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
      const { data: existing } = await sb
        .from('notification_outbox')
        .select('id')
        .eq('dedupe_key', input.dedupeKey)
        .maybeSingle()
      return { inserted: false, id: existing?.id || '' }
    }
    console.error('[outbox] enqueue failed', error.message)
    const { inserted, row } = insertMemory(input)
    return { inserted, id: row.id }
  }

  return { inserted: Boolean(data?.id), id: data?.id || '' }
}

async function sendResendEmail(row: {
  to_email: string
  subject: string
  body_text: string
  body_html: string | null
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    return { ok: false, error: 'RESEND_API_KEY not set' }
  }
  const from =
    process.env.EMAIL_FROM || 'KhayrCape Bookings <onboarding@resend.dev>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [row.to_email],
        subject: row.subject,
        html: row.body_html || undefined,
        text: row.body_text,
      }),
    })
    const text = await res.text()
    let parsed: { id?: string; message?: string } = {}
    try {
      parsed = text ? JSON.parse(text) : {}
    } catch {
      /* ignore */
    }
    if (!res.ok) {
      return {
        ok: false,
        error: parsed.message || text || `Resend HTTP ${res.status}`,
      }
    }
    if (!parsed.id) {
      return { ok: false, error: 'Resend response missing id' }
    }
    return { ok: true, id: parsed.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Resend error' }
  }
}

async function claimDue(sb: SupabaseClient | null): Promise<OutboxRow[]> {
  const now = new Date().toISOString()
  if (!sb || useMockStore()) {
    return memory
      .filter(
        (r) =>
          (r.status === 'pending' || r.status === 'failed') &&
          r.attempts < OUTBOX_MAX_ATTEMPTS &&
          r.next_attempt_at <= now
      )
      .slice(0, BATCH_SIZE)
  }

  const { data, error } = await sb
    .from('notification_outbox')
    .select('*')
    .in('status', ['pending', 'failed'])
    .lt('attempts', OUTBOX_MAX_ATTEMPTS)
    .lte('next_attempt_at', now)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) {
    console.error('[outbox] claim failed', error.message)
    return memory
      .filter(
        (r) =>
          (r.status === 'pending' || r.status === 'failed') &&
          r.attempts < OUTBOX_MAX_ATTEMPTS &&
          r.next_attempt_at <= now
      )
      .slice(0, BATCH_SIZE)
  }
  return (data ?? []) as OutboxRow[]
}

async function markSent(
  sb: SupabaseClient | null,
  id: string,
  providerId: string,
  priorAttempts: number
) {
  const now = new Date().toISOString()
  const patch = {
    status: 'sent' as const,
    provider_id: providerId,
    sent_at: now,
    last_error: null,
    attempts: priorAttempts + 1,
  }
  if (!sb || useMockStore()) {
    const row = memory.find((r) => r.id === id)
    if (row) Object.assign(row, patch)
    return
  }
  await sb.from('notification_outbox').update(patch).eq('id', id)
}

async function markRetryOrFail(
  sb: SupabaseClient | null,
  id: string,
  attempts: number,
  error: string
) {
  const nextAttempts = attempts + 1
  const next = new Date(
    Date.now() + backoffMinutes(nextAttempts) * 60 * 1000
  ).toISOString()
  const status: OutboxStatus =
    nextAttempts >= OUTBOX_MAX_ATTEMPTS ? 'failed' : 'pending'
  const patch = {
    attempts: nextAttempts,
    last_error: error.slice(0, 2000),
    next_attempt_at: next,
    status,
  }
  if (!sb || useMockStore()) {
    const row = memory.find((r) => r.id === id)
    if (row) Object.assign(row, patch)
    return
  }
  await sb.from('notification_outbox').update(patch).eq('id', id)
}

export type DrainResult = {
  processed: number
  sent: number
  failed: number
}

/**
 * Drain due outbox rows via Resend.
 * Mock mode without RESEND_API_KEY: log and mark sent.
 */
export async function drainEmailOutbox(
  sb?: SupabaseClient | null
): Promise<DrainResult> {
  const client = sb ?? null
  const due = await claimDue(client)
  let sent = 0
  let failed = 0

  for (const row of due) {
    if (!process.env.RESEND_API_KEY && useMockStore()) {
      console.warn(
        `[outbox] mock send ${row.audience}/${row.kind} → ${row.to_email}: ${row.subject}`
      )
      await markSent(client, row.id, `mock-${row.id}`, row.attempts)
      sent += 1
      continue
    }

    const result = await sendResendEmail(row)
    if (result.ok) {
      await markSent(client, row.id, result.id, row.attempts)
      sent += 1
    } else {
      await markRetryOrFail(client, row.id, row.attempts, result.error)
      failed += 1
    }
  }

  return { processed: due.length, sent, failed }
}
