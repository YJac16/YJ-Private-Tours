import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  cancelBooking,
  expireStalePendingBookings,
  isRefundEligible,
} from '../booking-app/lib/booking-lifecycle'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import { createYocoCheckout } from '../booking-app/lib/yoco'
import { getAuthContext, isAuthError, requireAuth } from './_lib/authUser'
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

async function handleConsent(req: VercelRequest, res: VercelResponse) {
  const auth = await getAuthContext(req)
  if (!auth) return res.status(401).json({ error: 'Sign in required' })
  const sb = supabaseAdmin()

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
}

const BOOKING_SELECT = `
  id, booking_date, start_time, status, trip_status, payment_status,
  client_name, client_email, client_phone, notes, driver_id, client_user_id,
  guest_count, adult_count, child_count, passenger_count,
  grand_total_cents, final_price_cents,
  pickup_address, special_requests, booking_reference,
  cancel_reason, cancelled_at, cancelled_by,
  refund_status, refund_amount_cents, refunded_at, refund_external_id,
  reschedule_requested_at, reschedule_note, yoco_payment_reference,
  tour:tours(id, name, slug),
  vehicle:vehicles(id, name, slug),
  driver:drivers(id, name, full_name)
`

function ownsBooking(
  booking: { client_user_id?: string | null; client_email?: string | null },
  userId: string,
  email: string | null,
  isAdmin: boolean
) {
  if (isAdmin) return true
  if (booking.client_user_id && booking.client_user_id === userId) return true
  if (
    email &&
    booking.client_email &&
    booking.client_email.toLowerCase() === email.toLowerCase()
  ) {
    return true
  }
  return false
}

async function buildReceipt(
  sb: ReturnType<typeof supabaseAdmin>,
  booking: Record<string, unknown>
) {
  const bookingId = String(booking.id)
  const { data: payment } = await sb
    .from('payments')
    .select('external_id, amount_cents, paid_at, status, currency')
    .eq('booking_id', bookingId)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: settingsRow } = await sb
    .from('app_settings')
    .select('value')
    .eq('key', 'business')
    .maybeSingle()
  const settings = (settingsRow?.value as Record<string, unknown>) || {}

  const prefixes = (settings.prefixes || {}) as Record<string, string>
  const receiptPrefix = prefixes.receipt || 'KCE-R'
  const templates = (settings.pdf_templates || {}) as Record<
    string,
    Record<string, string>
  >
  const tpl = templates.receipt || {}
  const ref = (booking.booking_reference as string | null) || null
  const tour = booking.tour as { name?: string } | null
  const vehicle = booking.vehicle as { name?: string } | null
  const driver = booking.driver as {
    name?: string
    full_name?: string | null
  } | null

  return {
    receipt_number: ref
      ? `${receiptPrefix}-${ref.replace(/^KC-?/i, '')}`
      : `${receiptPrefix}-${bookingId.slice(0, 8).toUpperCase()}`,
    issued_at: payment?.paid_at || new Date().toISOString(),
    booking_id: bookingId,
    booking_reference: ref,
    booking_date: booking.booking_date,
    start_time: booking.start_time,
    client_name: booking.client_name,
    client_email: booking.client_email,
    tour_name: tour?.name || null,
    vehicle_name: vehicle?.name || null,
    driver_name: driver?.full_name || driver?.name || null,
    amount_cents:
      Number(booking.grand_total_cents) ||
      Number(booking.final_price_cents) ||
      Number(payment?.amount_cents) ||
      0,
    currency: payment?.currency || 'ZAR',
    payment_status: booking.payment_status || 'paid',
    yoco_reference:
      (booking.yoco_payment_reference as string | null) ||
      payment?.external_id ||
      null,
    paid_at: payment?.paid_at || null,
    business_name:
      (settings.company_name as string) ||
      (settings.business_name as string) ||
      'KhayrCape Experiences',
    template: {
      header: tpl.header || 'KhayrCape Experiences',
      footer: tpl.footer || 'Thank you for booking with us.',
      terms: tpl.terms || '',
    },
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const resource = String(req.query.resource || '')
    if (resource === 'consent' || String(req.url || '').includes('account-consent')) {
      return handleConsent(req, res)
    }

    const auth = await requireAuth(req, ['client', 'admin'])
    if (isAuthError(auth)) {
      return res.status(auth.status).json({ error: auth.error })
    }

    const email = auth.profile.email || auth.user.email || null
    const isAdmin = auth.role === 'admin'
    const bookingId =
      (req.query.id ? String(req.query.id) : '') ||
      (req.query.booking_id ? String(req.query.booking_id) : '')

    if (req.method === 'GET') {
      if (useMockStore()) {
        if (bookingId) {
          const b = mockDb.getAccountBookingDetail(
            bookingId,
            auth.user.id,
            email,
            isAdmin
          )
          if (!b) return res.status(404).json({ error: 'Booking not found' })
          const history = mockDb.listBookingHistory(bookingId)
          return res.status(200).json({ booking: b, history })
        }
        const status = req.query.status ? String(req.query.status) : ''
        let bookings = mockDb.listAccountBookings(auth.user.id, email)
        if (status === 'upcoming') {
          const today = new Date().toISOString().slice(0, 10)
          bookings = bookings.filter(
            (b) =>
              (b.status === 'pending' || b.status === 'paid') &&
              b.booking_date >= today
          )
        } else if (status === 'past') {
          const today = new Date().toISOString().slice(0, 10)
          bookings = bookings.filter(
            (b) =>
              b.booking_date < today ||
              b.status === 'cancelled' ||
              b.status === 'expired'
          )
        } else if (status === 'cancelled') {
          bookings = bookings.filter(
            (b) => b.status === 'cancelled' || b.status === 'expired'
          )
        }
        return res.status(200).json({ bookings })
      }

      const sb = supabaseAdmin()

      if (bookingId) {
        const { data, error } = await sb
          .from('bookings')
          .select(BOOKING_SELECT)
          .eq('id', bookingId)
          .maybeSingle()
        if (error) return res.status(500).json({ error: error.message })
        if (!data) return res.status(404).json({ error: 'Booking not found' })
        if (!ownsBooking(data, auth.user.id, email, isAdmin)) {
          return res.status(403).json({ error: 'Forbidden' })
        }
        const { data: history } = await sb
          .from('booking_status_history')
          .select('id, from_status, to_status, changed_by, reason, meta, created_at')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false })
        const refund_eligible =
          data.status === 'paid' &&
          isRefundEligible(data.booking_date, data.start_time)
        return res.status(200).json({
          booking: { ...data, refund_eligible },
          history: history ?? [],
        })
      }

      let query = sb
        .from('bookings')
        .select(BOOKING_SELECT)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (email) {
        query = query.or(
          `client_user_id.eq.${auth.user.id},client_email.eq.${email}`
        )
      } else {
        query = query.eq('client_user_id', auth.user.id)
      }

      const status = req.query.status ? String(req.query.status) : ''
      if (status === 'upcoming') {
        const today = new Date().toISOString().slice(0, 10)
        query = query
          .in('status', ['pending', 'paid'])
          .gte('booking_date', today)
      } else if (status === 'cancelled') {
        query = query.in('status', ['cancelled', 'expired'])
      } else if (status === 'past') {
        const today = new Date().toISOString().slice(0, 10)
        query = query.or(
          `booking_date.lt.${today},status.in.(cancelled,expired)`
        )
      }

      const { data, error } = await query
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ bookings: data ?? [] })
    }

    if (req.method === 'POST') {
      const body = await readJson(req)
      const action = String(body.action || '')
      const id = String(body.booking_id || bookingId || '')
      if (!id) return res.status(400).json({ error: 'booking_id required' })

      if (useMockStore()) {
        const detail = mockDb.getAccountBookingDetail(
          id,
          auth.user.id,
          email,
          isAdmin
        )
        if (!detail) return res.status(404).json({ error: 'Booking not found' })

        if (action === 'cancel') {
          const result = mockDb.cancelAccountBooking({
            bookingId: id,
            actor: isAdmin ? 'admin' : 'client',
            reason: body.reason ? String(body.reason) : null,
            requestRefund: body.request_refund !== false,
          })
          if (!result.ok) {
            return res.status(result.status).json({ error: result.error })
          }
          return res.status(200).json(result)
        }

        if (action === 'request_reschedule') {
          const note = body.note ? String(body.note).trim() : ''
          if (!note) {
            return res.status(400).json({ error: 'Reschedule note required' })
          }
          const result = mockDb.requestReschedule(id, note)
          if (!result.ok) {
            return res.status(result.status).json({ error: result.error })
          }
          return res.status(200).json(result)
        }

        if (action === 'retry_payment') {
          const result = mockDb.retryPaymentCheckout(id)
          if (!result.ok) {
            return res.status(result.status).json({ error: result.error })
          }
          return res.status(200).json(result)
        }

        if (action === 'receipt') {
          const result = mockDb.getReceipt(id)
          if (!result.ok) {
            return res.status(result.status).json({ error: result.error })
          }
          return res.status(200).json(result)
        }

        return res.status(400).json({ error: 'Unknown action' })
      }

      const sb = supabaseAdmin()
      const { data: existing, error: findErr } = await sb
        .from('bookings')
        .select(
          'id, client_user_id, client_email, status, booking_date, start_time, grand_total_cents, final_price_cents, booking_reference, client_name, yoco_payment_reference, payment_status'
        )
        .eq('id', id)
        .maybeSingle()
      if (findErr) return res.status(500).json({ error: findErr.message })
      if (!existing) return res.status(404).json({ error: 'Booking not found' })
      if (!ownsBooking(existing, auth.user.id, email, isAdmin)) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      if (action === 'cancel') {
        const result = await cancelBooking(sb, {
          bookingId: id,
          actor: isAdmin ? 'admin' : 'client',
          reason: body.reason ? String(body.reason) : null,
          requestRefund: body.request_refund !== false,
        })
        if (!result.ok) {
          return res.status(result.status).json({ error: result.error })
        }
        return res.status(200).json(result)
      }

      if (action === 'request_reschedule') {
        const note = body.note ? String(body.note).trim() : ''
        if (!note) {
          return res.status(400).json({ error: 'Reschedule note required' })
        }
        if (existing.status !== 'paid' && existing.status !== 'pending') {
          return res
            .status(400)
            .json({ error: 'Only active bookings can request reschedule' })
        }
        if (!isRefundEligible(existing.booking_date, existing.start_time)) {
          return res.status(400).json({
            error:
              'Reschedule requests must be made at least 24 hours before the tour',
          })
        }
        const nowIso = new Date().toISOString()
        const { error: upErr } = await sb
          .from('bookings')
          .update({
            reschedule_requested_at: nowIso,
            reschedule_note: note,
          })
          .eq('id', id)
        if (upErr) return res.status(500).json({ error: upErr.message })
        await sb.from('booking_status_history').insert({
          booking_id: id,
          from_status: existing.status,
          to_status: existing.status,
          changed_by: isAdmin ? 'admin' : 'client',
          reason: 'reschedule_request',
          meta: { note },
        })
        return res.status(200).json({
          ok: true,
          booking_id: id,
          message:
            'Reschedule requested. We will confirm availability and follow up.',
        })
      }

      if (action === 'retry_payment') {
        await expireStalePendingBookings(sb)
        const { data: fresh, error: freshErr } = await sb
          .from('bookings')
          .select(
            'id, status, grand_total_cents, final_price_cents, booking_reference, client_name, client_email'
          )
          .eq('id', id)
          .maybeSingle()
        if (freshErr) return res.status(500).json({ error: freshErr.message })
        if (!fresh) return res.status(404).json({ error: 'Booking not found' })
        if (fresh.status === 'paid') {
          return res.status(400).json({ error: 'Booking is already paid' })
        }
        if (fresh.status !== 'pending') {
          return res.status(400).json({
            error: `Cannot retry payment for status ${fresh.status}`,
          })
        }

        const amount =
          Number(fresh.grand_total_cents) || Number(fresh.final_price_cents) || 0
        if (amount < 100) {
          return res
            .status(400)
            .json({ error: 'Booking amount is invalid for checkout' })
        }

        const { data: bookingTour } = await sb
          .from('bookings')
          .select('tour:tours(name)')
          .eq('id', id)
          .maybeSingle()
        const nestedTour = bookingTour?.tour as
          | { name?: string }
          | { name?: string }[]
          | null
        const tourName = Array.isArray(nestedTour)
          ? nestedTour[0]?.name
          : nestedTour?.name

        const attempt = Date.now()
        const checkout = await createYocoCheckout({
          amountCents: amount,
          bookingId: fresh.id,
          bookingReference: fresh.booking_reference || undefined,
          clientName: fresh.client_name || undefined,
          clientEmail: fresh.client_email || undefined,
          tourName,
          idempotencyKey: `booking-retry-${fresh.id}-${amount}-${attempt}`,
        })

        await sb
          .from('payments')
          .update({ external_id: checkout.id, status: 'pending' })
          .eq('booking_id', fresh.id)
          .eq('status', 'pending')

        const { data: existingPay } = await sb
          .from('payments')
          .select('id')
          .eq('booking_id', fresh.id)
          .limit(1)
          .maybeSingle()
        if (!existingPay) {
          await sb.from('payments').insert({
            booking_id: fresh.id,
            amount_cents: amount,
            currency: 'ZAR',
            status: 'pending',
            external_id: checkout.id,
          })
        }

        await sb
          .from('bookings')
          .update({
            yoco_payment_reference: checkout.id,
            payment_status: 'pending',
          })
          .eq('id', fresh.id)

        await sb.from('booking_status_history').insert({
          booking_id: fresh.id,
          from_status: 'pending',
          to_status: 'pending',
          changed_by: isAdmin ? 'admin' : 'client',
          reason: 'payment_retry',
          meta: { checkout_id: checkout.id },
        })

        return res.status(200).json({
          ok: true,
          booking_id: fresh.id,
          checkout_url: checkout.redirectUrl,
          checkout_id: checkout.id,
          amount_cents: amount,
          booking_reference: fresh.booking_reference || null,
        })
      }

      if (action === 'receipt') {
        if (existing.status !== 'paid') {
          return res.status(400).json({
            error: 'Receipts are only available for paid bookings',
          })
        }
        const { data: full, error: fullErr } = await sb
          .from('bookings')
          .select(BOOKING_SELECT)
          .eq('id', id)
          .maybeSingle()
        if (fullErr) return res.status(500).json({ error: fullErr.message })
        if (!full) return res.status(404).json({ error: 'Booking not found' })
        const receipt = await buildReceipt(sb, full as Record<string, unknown>)
        return res.status(200).json({ ok: true, receipt })
      }

      return res.status(400).json({ error: 'Unknown action' })
    }

    return methodNotAllowed(res, ['GET', 'POST'])
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Account bookings failed',
    })
  }
}
