import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { mockDb, useMockStore } from '../booking-app/lib/mock-store'
import {
  calculatePrice,
  type PricingTour,
  type PricingVehicle,
} from '../booking-app/lib/pricing'
import { checkAdminPin } from './_lib/adminAuth'
import { methodNotAllowed, readJson } from './_lib/http'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

function formatDocNumber(prefix: string, value: number) {
  return `${prefix}-${String(value).padStart(6, '0')}`
}

async function allocateNumber(
  sb: ReturnType<typeof supabaseAdmin>,
  prefix: string
): Promise<string> {
  const { data: row, error } = await sb
    .from('document_counters')
    .select('prefix, next_value')
    .eq('prefix', prefix)
    .maybeSingle()

  if (error) throw new Error(error.message)

  let next = 1
  if (!row) {
    const { error: insertErr } = await sb
      .from('document_counters')
      .insert({ prefix, next_value: 2 })
    if (insertErr) throw new Error(insertErr.message)
  } else {
    next = Number(row.next_value) || 1
    const { error: updateErr } = await sb
      .from('document_counters')
      .update({ next_value: next + 1 })
      .eq('prefix', prefix)
      .eq('next_value', next)
    if (updateErr) throw new Error(updateErr.message)
  }

  return formatDocNumber(prefix, next)
}

async function buildPricingSnapshot(
  sb: ReturnType<typeof supabaseAdmin>,
  tourId: string | null | undefined,
  vehicleId: string | null | undefined,
  adults: number,
  children: number
) {
  if (!tourId || !vehicleId) return null

  const [{ data: tour }, { data: vehicle }] = await Promise.all([
    sb
      .from('tours')
      .select(
        'id, slug, price_per_person_cents, base_price_cents, additional_guest_price_cents, max_guests, name'
      )
      .eq('id', tourId)
      .maybeSingle(),
    sb
      .from('vehicles')
      .select(
        'id, slug, name, capacity_min, capacity_max, vehicle_price_cents, vehicle_surcharge_cents, is_luxury'
      )
      .eq('id', vehicleId)
      .maybeSingle(),
  ])

  if (!tour || !vehicle) return null

  const pricingTour = {
    ...tour,
    price_per_person_cents:
      tour.price_per_person_cents ?? tour.additional_guest_price_cents ?? 0,
  } as PricingTour

  const pricingVehicle = {
    ...vehicle,
    vehicle_price_cents:
      vehicle.vehicle_price_cents ?? vehicle.vehicle_surcharge_cents ?? 0,
  } as PricingVehicle

  return calculatePrice(pricingTour, pricingVehicle, adults, children)
}

async function getBusinessSettings(sb: ReturnType<typeof supabaseAdmin>) {
  const { data, error } = await sb
    .from('app_settings')
    .select('value')
    .eq('key', 'business')
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.value as Record<string, unknown>) || mockDb.getBusinessSettings()
}

async function listQuotes(sb: ReturnType<typeof supabaseAdmin>, id?: string) {
  if (id) {
    const { data, error } = await sb.from('quotes').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await sb
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function listInvoices(sb: ReturnType<typeof supabaseAdmin>, id?: string) {
  if (id) {
    const { data, error } = await sb.from('invoices').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await sb
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function listCounters(sb: ReturnType<typeof supabaseAdmin>) {
  const { data, error } = await sb.from('document_counters').select('*').order('prefix')
  if (error) throw new Error(error.message)
  return data ?? []
}

async function buildReports(sb: ReturnType<typeof supabaseAdmin>) {
  const reports: Record<string, unknown> = {
    bookings: { count: 0, revenue_cents: 0, by_status: {} as Record<string, number> },
    quotes: { count: 0, by_status: {} as Record<string, number>, conversion_rate: 0 },
    aov_cents: 0,
    popular_tours: [] as Array<{ id: string; count: number }>,
    popular_vehicles: [] as Array<{ id: string; count: number }>,
  }

  try {
    const { data: bookings } = await sb
      .from('bookings')
      .select(
        'id, status, grand_total_cents, tour_id, vehicle_id, driver_id, pickup_address, booking_date'
      )
    const rows = bookings ?? []
    const byStatus: Record<string, number> = {}
    let revenue = 0
    const tourCounts: Record<string, number> = {}
    const vehicleCounts: Record<string, number> = {}

    for (const b of rows) {
      const st = String(b.status || 'unknown')
      byStatus[st] = (byStatus[st] || 0) + 1
      if (st === 'paid') revenue += Number(b.grand_total_cents) || 0
      if (b.tour_id) tourCounts[b.tour_id] = (tourCounts[b.tour_id] || 0) + 1
      if (b.vehicle_id) {
        vehicleCounts[b.vehicle_id] = (vehicleCounts[b.vehicle_id] || 0) + 1
      }
    }

    const paidCount = byStatus.paid || 0
    reports.bookings = { count: rows.length, revenue_cents: revenue, by_status: byStatus }
    reports.aov_cents = paidCount ? Math.round(revenue / paidCount) : 0
    reports.popular_tours = Object.entries(tourCounts)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    reports.popular_vehicles = Object.entries(vehicleCounts)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  } catch {
    // bookings table may be missing in partial setups
  }

  try {
    const { data: quotes } = await sb.from('quotes').select('id, status, booking_id')
    const rows = quotes ?? []
    const byStatus: Record<string, number> = {}
    let converted = 0
    for (const q of rows) {
      const st = String(q.status || 'unknown')
      byStatus[st] = (byStatus[st] || 0) + 1
      if (q.booking_id) converted += 1
    }
    reports.quotes = {
      count: rows.length,
      by_status: byStatus,
      conversion_rate: rows.length ? converted / rows.length : 0,
    }
  } catch {
    // quotes table may be missing
  }

  return reports
}

function asOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value == null || value === '') return null
  return String(value)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      if (!checkAdminPin(req)) return res.status(401).json({ error: 'Unauthorized' })

      const resource = String(req.query.resource || '')
      const id = req.query.id ? String(req.query.id) : undefined

      if (useMockStore()) {
        if (resource === 'quotes') {
          return res.status(200).json({
            quotes: id ? mockDb.listQuotes().filter((q) => q.id === id) : mockDb.listQuotes(),
          })
        }
        if (resource === 'invoices') {
          return res.status(200).json({
            invoices: id
              ? mockDb.listInvoices().filter((i) => i.id === id)
              : mockDb.listInvoices(),
          })
        }
        if (resource === 'settings') {
          return res.status(200).json({ settings: mockDb.getBusinessSettings() })
        }
        if (resource === 'reports') {
          return res.status(200).json({ reports: mockDb.reports() })
        }
        if (resource === 'counters') {
          return res.status(200).json({ counters: mockDb.listDocumentCounters() })
        }
        return res.status(400).json({
          error: 'Unknown resource. Use quotes|invoices|settings|reports|counters',
        })
      }

      const sb = supabaseAdmin()
      if (resource === 'quotes') {
        const quotes = await listQuotes(sb, id)
        return res.status(200).json({ quotes })
      }
      if (resource === 'invoices') {
        const invoices = await listInvoices(sb, id)
        return res.status(200).json({ invoices })
      }
      if (resource === 'settings') {
        const settings = await getBusinessSettings(sb)
        return res.status(200).json({ settings })
      }
      if (resource === 'reports') {
        const reports = await buildReports(sb)
        return res.status(200).json({ reports })
      }
      if (resource === 'counters') {
        const counters = await listCounters(sb)
        return res.status(200).json({ counters })
      }
      return res.status(400).json({
        error: 'Unknown resource. Use quotes|invoices|settings|reports|counters',
      })
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      const body = await readJson(req)
      if (!checkAdminPin(req, body.pin as string | undefined)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const resource = String(body.resource || req.query.resource || '')
      const action = String(body.action || '')

      if (useMockStore()) {
        if (resource === 'settings' || action === 'update_settings') {
          const settings = mockDb.updateBusinessSettings(
            (body.settings as Record<string, unknown>) || body
          )
          return res.status(200).json({ success: true, settings })
        }

        if (resource === 'counters' || action === 'allocate_number') {
          const prefix = String(body.prefix || 'KCE-Q')
          const number = mockDb.nextDocumentNumber(prefix)
          return res.status(200).json({ success: true, number, prefix })
        }

        if (resource === 'quotes' || action.startsWith('quote')) {
          if (action === 'create' || action === 'create_quote' || (!action && req.method === 'POST')) {
            const quote = mockDb.createQuote(body.quote as Record<string, unknown> || body)
            return res.status(200).json({ success: true, quote })
          }
          if (action === 'update' || action === 'update_quote' || req.method === 'PATCH') {
            const id = String(body.id || (body.quote as { id?: string })?.id || '')
            const quote = mockDb.updateQuote(id, (body.quote as Record<string, unknown>) || body)
            return res.status(200).json({ success: true, quote })
          }
          if (action === 'set_status' || action === 'status') {
            const quote = mockDb.updateQuote(String(body.id), {
              status: String(body.status),
              status_note: body.note != null ? String(body.note) : undefined,
              changed_by: body.changed_by != null ? String(body.changed_by) : undefined,
            })
            return res.status(200).json({ success: true, quote })
          }
          if (action === 'convert' || action === 'quote_to_booking' || action === 'convert_quote') {
            const result = mockDb.convertQuoteToBooking(String(body.quote_id || body.id), {
              driver_id: body.driver_id ? String(body.driver_id) : undefined,
              start_time: body.start_time ? String(body.start_time) : undefined,
            })
            return res.status(200).json({ success: true, ...result })
          }
        }

        if (resource === 'invoices' || action === 'create_invoice') {
          const invoice = mockDb.createInvoice(
            (body.invoice as Record<string, unknown>) || body
          )
          return res.status(200).json({ success: true, invoice })
        }

        return res.status(400).json({ error: 'Unknown action or resource' })
      }

      const sb = supabaseAdmin()

      // —— Settings ——
      if (resource === 'settings' || action === 'update_settings') {
        const next = (body.settings as Record<string, unknown>) || {}
        const current = await getBusinessSettings(sb)
        const merged = { ...current, ...next }
        const { error } = await sb.from('app_settings').upsert({
          key: 'business',
          value: merged,
          updated_at: new Date().toISOString(),
        })
        if (error) throw new Error(error.message)
        return res.status(200).json({ success: true, settings: merged })
      }

      // —— Allocate document number ——
      if (resource === 'counters' || action === 'allocate_number') {
        const prefix = String(body.prefix || 'KCE-Q')
        const number = await allocateNumber(sb, prefix)
        return res.status(200).json({ success: true, number, prefix })
      }

      // —— Quotes ——
      if (resource === 'quotes' || action.startsWith('quote') || action === 'convert') {
        if (
          action === 'create' ||
          action === 'create_quote' ||
          (!action && req.method === 'POST' && resource === 'quotes')
        ) {
          const input = (body.quote as Record<string, unknown>) || body
          const adults = Math.round(Number(input.adults) || 1)
          const children = Math.round(Number(input.children) || 0)
          const tourId = asOptionalString(input.tour_id) ?? null
          const vehicleId = asOptionalString(input.vehicle_id) ?? null

          let quoteNumber = asOptionalString(input.quote_number)
          if (!quoteNumber) {
            const settings = await getBusinessSettings(sb)
            const prefixes = (settings.prefixes as Record<string, string>) || {}
            const prefix = prefixes.quote || 'KCE-Q'
            quoteNumber = await allocateNumber(sb, prefix)
          }

          let pricing_snapshot = input.pricing_snapshot
          if (!pricing_snapshot && tourId && vehicleId) {
            pricing_snapshot = await buildPricingSnapshot(
              sb,
              tourId,
              vehicleId,
              adults,
              children
            )
          }

          const discount = Math.round(Number(input.discount_cents) || 0)
          const additional = Math.round(Number(input.additional_charges_cents) || 0)
          const snapTotal =
            pricing_snapshot && typeof pricing_snapshot === 'object'
              ? Number((pricing_snapshot as { grand_total_cents?: number }).grand_total_cents) ||
                0
              : 0
          const grand_total_cents =
            input.grand_total_cents != null
              ? Math.round(Number(input.grand_total_cents))
              : snapTotal - discount + additional

          const row = {
            quote_number: quoteNumber,
            status: String(input.status || 'draft'),
            customer:
              input.customer && typeof input.customer === 'object' ? input.customer : {},
            adults,
            children,
            tour_id: tourId,
            vehicle_id: vehicleId,
            travel_date: asOptionalString(input.travel_date) ?? null,
            pickup: asOptionalString(input.pickup) ?? null,
            dropoff: asOptionalString(input.dropoff) ?? null,
            special_requests: asOptionalString(input.special_requests) ?? null,
            enquiry_source: asOptionalString(input.enquiry_source) ?? null,
            pricing_snapshot: pricing_snapshot ?? null,
            discount_cents: discount,
            additional_charges_cents: additional,
            grand_total_cents,
            expires_at: asOptionalString(input.expires_at) ?? null,
            created_by: asOptionalString(input.created_by) ?? null,
            pdf_url: asOptionalString(input.pdf_url) ?? null,
            pdf_path: asOptionalString(input.pdf_path) ?? null,
            notes: asOptionalString(input.notes) ?? null,
            line_items: Array.isArray(input.line_items) ? input.line_items : [],
            updated_at: new Date().toISOString(),
          }

          const { data: quote, error } = await sb
            .from('quotes')
            .insert(row)
            .select()
            .single()
          if (error) throw new Error(error.message)

          await sb.from('quote_status_history').insert({
            quote_id: quote.id,
            from_status: null,
            to_status: quote.status,
            changed_by: row.created_by,
            note: 'Created',
          })

          return res.status(200).json({ success: true, quote })
        }

        if (
          action === 'update' ||
          action === 'update_quote' ||
          (req.method === 'PATCH' &&
            resource === 'quotes' &&
            action !== 'set_status' &&
            action !== 'status')
        ) {
          const input = (body.quote as Record<string, unknown>) || body
          const id = String(input.id || body.id || '')
          if (!id) return res.status(400).json({ error: 'Quote id required' })

          const { data: existing, error: fetchErr } = await sb
            .from('quotes')
            .select('*')
            .eq('id', id)
            .single()
          if (fetchErr) throw new Error(fetchErr.message)

          const patch: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          }
          const fields = [
            'customer',
            'adults',
            'children',
            'tour_id',
            'vehicle_id',
            'travel_date',
            'pickup',
            'dropoff',
            'special_requests',
            'enquiry_source',
            'pricing_snapshot',
            'discount_cents',
            'additional_charges_cents',
            'grand_total_cents',
            'expires_at',
            'pdf_url',
            'pdf_path',
            'notes',
            'line_items',
            'booking_id',
          ] as const
          for (const key of fields) {
            if (input[key] !== undefined) patch[key] = input[key]
          }

          const adults = Math.round(Number(patch.adults ?? existing.adults) || 1)
          const children = Math.round(
            Number(patch.children ?? existing.children) || 0
          )
          const tourId = (patch.tour_id ?? existing.tour_id) as string | null
          const vehicleId = (patch.vehicle_id ?? existing.vehicle_id) as
            | string
            | null

          if (
            patch.pricing_snapshot === undefined &&
            (patch.tour_id !== undefined ||
              patch.vehicle_id !== undefined ||
              patch.adults !== undefined ||
              patch.children !== undefined) &&
            tourId &&
            vehicleId
          ) {
            patch.pricing_snapshot = await buildPricingSnapshot(
              sb,
              tourId,
              vehicleId,
              adults,
              children
            )
          }

          if (
            patch.grand_total_cents === undefined &&
            patch.pricing_snapshot &&
            typeof patch.pricing_snapshot === 'object'
          ) {
            const snap = patch.pricing_snapshot as { grand_total_cents?: number }
            const discount = Math.round(
              Number(patch.discount_cents ?? existing.discount_cents) || 0
            )
            const additional = Math.round(
              Number(
                patch.additional_charges_cents ?? existing.additional_charges_cents
              ) || 0
            )
            patch.grand_total_cents =
              (Number(snap.grand_total_cents) || 0) - discount + additional
          }

          let statusChanged = false
          const newStatus = input.status != null ? String(input.status) : null
          if (newStatus && newStatus !== existing.status) {
            patch.status = newStatus
            statusChanged = true
          }

          const { data: quote, error } = await sb
            .from('quotes')
            .update(patch)
            .eq('id', id)
            .select()
            .single()
          if (error) throw new Error(error.message)

          if (statusChanged) {
            await sb.from('quote_status_history').insert({
              quote_id: id,
              from_status: existing.status,
              to_status: newStatus,
              changed_by: asOptionalString(body.changed_by) ?? null,
              note: asOptionalString(body.note) ?? null,
            })
          }

          return res.status(200).json({ success: true, quote })
        }

        if (action === 'set_status' || action === 'status') {
          const id = String(body.id || '')
          const toStatus = String(body.status || '')
          if (!id || !toStatus) {
            return res.status(400).json({ error: 'id and status required' })
          }
          const { data: existing, error: fetchErr } = await sb
            .from('quotes')
            .select('id, status')
            .eq('id', id)
            .single()
          if (fetchErr) throw new Error(fetchErr.message)

          const { data: quote, error } = await sb
            .from('quotes')
            .update({ status: toStatus, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
          if (error) throw new Error(error.message)

          await sb.from('quote_status_history').insert({
            quote_id: id,
            from_status: existing.status,
            to_status: toStatus,
            changed_by: asOptionalString(body.changed_by) ?? null,
            note: asOptionalString(body.note) ?? null,
          })

          return res.status(200).json({ success: true, quote })
        }

        if (
          action === 'convert' ||
          action === 'quote_to_booking' ||
          action === 'convert_quote'
        ) {
          const quoteId = String(body.quote_id || body.id || '')
          if (!quoteId) return res.status(400).json({ error: 'quote_id required' })

          const { data: quote, error: qErr } = await sb
            .from('quotes')
            .select('*')
            .eq('id', quoteId)
            .single()
          if (qErr) throw new Error(qErr.message)
          if (quote.booking_id) {
            return res.status(400).json({
              error: 'Quote already converted',
              booking_id: quote.booking_id,
            })
          }

          const customer =
            (quote.customer as Record<string, unknown>) || ({} as Record<string, unknown>)
          const client_name = String(
            customer.name || customer.full_name || customer.client_name || 'Guest'
          )
          const client_email = String(customer.email || customer.client_email || '')
          const client_phone = customer.phone
            ? String(customer.phone)
            : customer.whatsapp
              ? String(customer.whatsapp)
              : null

          const settings = await getBusinessSettings(sb)
          const prefixes = (settings.prefixes as Record<string, string>) || {}
          const bookingRef = await allocateNumber(sb, prefixes.booking || 'KCE-B')
          const invoiceNumber = await allocateNumber(sb, prefixes.invoice || 'KCE-INV')

          const driverId =
            String(body.driver_id || '') ||
            process.env.DEFAULT_DRIVER_ID ||
            '11111111-1111-1111-1111-111111111111'
          const startTime = String(body.start_time || '08:00').slice(0, 5)
          const travelDate = quote.travel_date || new Date().toISOString().slice(0, 10)

          let tourName: string | null = null
          let vehicleName: string | null = null
          let driverName: string | null = null
          if (quote.tour_id) {
            const { data: t } = await sb
              .from('tours')
              .select('name')
              .eq('id', quote.tour_id)
              .maybeSingle()
            tourName = t?.name ?? null
          }
          if (quote.vehicle_id) {
            const { data: v } = await sb
              .from('vehicles')
              .select('name')
              .eq('id', quote.vehicle_id)
              .maybeSingle()
            vehicleName = v?.name ?? null
          }
          {
            const { data: d } = await sb
              .from('drivers')
              .select('name, full_name')
              .eq('id', driverId)
              .maybeSingle()
            driverName = d?.full_name || d?.name || null
          }

          const snap =
            quote.pricing_snapshot && typeof quote.pricing_snapshot === 'object'
              ? (quote.pricing_snapshot as Record<string, number>)
              : null
          const grand =
            Number(quote.grand_total_cents) ||
            Number(snap?.grand_total_cents) ||
            0

          const { data: booking, error: bErr } = await sb
            .from('bookings')
            .insert({
              booking_date: travelDate,
              start_time: startTime,
              driver_id: driverId,
              tour_id: quote.tour_id,
              vehicle_id: quote.vehicle_id,
              client_name,
              client_email: client_email || `${quote.quote_number}@quote.local`,
              client_phone,
              pickup_address: quote.pickup,
              special_requests: quote.special_requests,
              notes: quote.notes,
              status: 'pending',
              payment_status: 'pending',
              trip_status: 'scheduled',
              guest_count: (quote.adults || 0) + (quote.children || 0),
              adult_count: quote.adults || 1,
              child_count: quote.children || 0,
              passenger_count: (quote.adults || 0) + (quote.children || 0),
              vehicle_price_cents: snap?.vehicle_price_cents ?? null,
              price_per_person_cents: snap?.price_per_person_cents ?? null,
              passenger_total_cents: snap?.passenger_total_cents ?? null,
              grand_total_cents: grand,
              final_price_cents: grand,
              booking_reference: bookingRef,
              driver_name_snapshot: driverName,
              vehicle_name_snapshot: vehicleName,
              tour_name_snapshot: tourName,
            })
            .select()
            .single()
          if (bErr) throw new Error(bErr.message)

          const { data: invoice, error: iErr } = await sb
            .from('invoices')
            .insert({
              invoice_number: invoiceNumber,
              quote_id: quote.id,
              booking_id: booking.id,
              customer: quote.customer,
              amount_cents: grand,
              payment_status: 'pending',
              travel_date: travelDate,
              booking_reference: bookingRef,
            })
            .select()
            .single()
          if (iErr) throw new Error(iErr.message)

          const newStatus = 'awaiting_payment'
          const { data: updatedQuote, error: uErr } = await sb
            .from('quotes')
            .update({
              booking_id: booking.id,
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', quoteId)
            .select()
            .single()
          if (uErr) throw new Error(uErr.message)

          await sb.from('quote_status_history').insert({
            quote_id: quoteId,
            from_status: quote.status,
            to_status: newStatus,
            changed_by: asOptionalString(body.changed_by) ?? null,
            note: 'Converted to booking',
          })

          return res.status(200).json({
            success: true,
            quote: updatedQuote,
            booking,
            invoice,
          })
        }
      }

      // —— Invoices ——
      if (resource === 'invoices' || action === 'create_invoice') {
        const input = (body.invoice as Record<string, unknown>) || body
        let invoiceNumber = asOptionalString(input.invoice_number)
        if (!invoiceNumber) {
          const settings = await getBusinessSettings(sb)
          const prefixes = (settings.prefixes as Record<string, string>) || {}
          invoiceNumber = await allocateNumber(sb, prefixes.invoice || 'KCE-INV')
        }

        const row = {
          invoice_number: invoiceNumber,
          quote_id: asOptionalString(input.quote_id) ?? null,
          booking_id: asOptionalString(input.booking_id) ?? null,
          customer:
            input.customer && typeof input.customer === 'object' ? input.customer : {},
          amount_cents: Math.round(Number(input.amount_cents) || 0),
          payment_status: String(input.payment_status || 'pending'),
          yoco_reference: asOptionalString(input.yoco_reference) ?? null,
          travel_date: asOptionalString(input.travel_date) ?? null,
          pdf_url: asOptionalString(input.pdf_url) ?? null,
          booking_reference: asOptionalString(input.booking_reference) ?? null,
        }

        const { data: invoice, error } = await sb
          .from('invoices')
          .insert(row)
          .select()
          .single()
        if (error) throw new Error(error.message)
        return res.status(200).json({ success: true, invoice })
      }

      return res.status(400).json({ error: 'Unknown action or resource' })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH'])
  } catch (e: unknown) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Admin business failed',
    })
  }
}
