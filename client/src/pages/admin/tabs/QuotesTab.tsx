import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAdminBusiness,
  patchAdminBusiness,
  postAdminBusiness,
  type AdminQuote,
  type Tour,
  type Vehicle,
} from '../../../lib/bookingApi'
import {
  calculatePrice,
  formatZar,
  type PriceBreakdown,
} from '../../../lib/pricing'
import {
  cardClass,
  centsToRands,
  getAdminMeta,
  inputClass,
  labelClass,
  QUOTE_STATUSES,
  randsToCents,
} from '../adminShared'

type Props = {
  pin: string
  tours: Tour[]
  vehicles: Vehicle[]
}

type CustomerForm = {
  name: string
  email: string
  phone: string
  whatsapp: string
  country: string
  notes: string
}

type WizardState = {
  customer: CustomerForm
  enquiry_source: string
  selectedTourIds: string[]
  vehicle_id: string
  travel_date: string
  pickup: string
  dropoff: string
  adults: number
  children: number
  special_requests: string
  discount_cents: number
  additional_charges_cents: number
  apply_weekend_surcharge: boolean
}

const emptyCustomer = (): CustomerForm => ({
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  country: '',
  notes: '',
})

const emptyWizard = (): WizardState => ({
  customer: emptyCustomer(),
  enquiry_source: 'whatsapp',
  selectedTourIds: [],
  vehicle_id: '',
  travel_date: '',
  pickup: '',
  dropoff: '',
  adults: 2,
  children: 0,
  special_requests: '',
  discount_cents: 0,
  additional_charges_cents: 0,
  apply_weekend_surcharge: false,
})

const ENQUIRY_SOURCES = [
  'whatsapp',
  'instagram',
  'website',
  'email',
  'referral',
  'other',
]

function customerName(q: AdminQuote) {
  const c = q.customer || {}
  return String(c.name || c.full_name || c.client_name || '—')
}

function customerPhone(q: AdminQuote) {
  const c = q.customer || {}
  return String(c.whatsapp || c.phone || c.client_phone || '')
}

export default function QuotesTab({ pin, tours, vehicles }: Props) {
  const [quotes, setQuotes] = useState<AdminQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [wizard, setWizard] = useState<WizardState>(emptyWizard)
  const [busy, setBusy] = useState(false)
  const [previewQuote, setPreviewQuote] = useState<AdminQuote | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminBusiness(pin, 'quotes')
      const list = (data.quotes as AdminQuote[]) || []
      setQuotes(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }, [pin])

  useEffect(() => {
    load()
  }, [load])

  const primaryTour = tours.find((t) => t.id === wizard.selectedTourIds[0])
  const vehicle = vehicles.find((v) => v.id === wizard.vehicle_id)

  const weekendSurcharge = useMemo(() => {
    if (!wizard.apply_weekend_surcharge || !primaryTour) return 0
    return getAdminMeta(primaryTour).weekend_price_cents || 0
  }, [wizard.apply_weekend_surcharge, primaryTour])

  const breakdown: PriceBreakdown | null = useMemo(() => {
    if (!primaryTour || !vehicle) return null
    return calculatePrice(primaryTour, vehicle, wizard.adults, wizard.children, {
      surcharge_cents: weekendSurcharge,
      discount_cents: wizard.discount_cents,
      additional_charges_cents: wizard.additional_charges_cents,
    })
  }, [
    primaryTour,
    vehicle,
    wizard.adults,
    wizard.children,
    weekendSurcharge,
    wizard.discount_cents,
    wizard.additional_charges_cents,
  ])

  const filtered = quotes.filter((q) => {
    if (statusFilter && q.status !== statusFilter) return false
    const qSearch = search.trim().toLowerCase()
    if (!qSearch) return true
    const hay = [
      q.quote_number,
      customerName(q),
      customerPhone(q),
      q.enquiry_source,
      q.travel_date,
      q.status,
      tours.find((t) => t.id === q.tour_id)?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(qSearch)
  })

  const openWizard = () => {
    setWizard(emptyWizard())
    setStep(1)
    setPreviewQuote(null)
    setWizardOpen(true)
  }

  const buildQuotePayload = (status: string) => {
    const tourId = wizard.selectedTourIds[0] || null
    const line_items = wizard.selectedTourIds.map((id) => {
      const t = tours.find((x) => x.id === id)
      return { tour_id: id, name: t?.name || id }
    })
    return {
      status,
      customer: {
        name: wizard.customer.name,
        email: wizard.customer.email,
        phone: wizard.customer.phone,
        whatsapp: wizard.customer.whatsapp || wizard.customer.phone,
        country: wizard.customer.country,
        notes: wizard.customer.notes,
      },
      enquiry_source: wizard.enquiry_source,
      tour_id: tourId,
      vehicle_id: wizard.vehicle_id || null,
      travel_date: wizard.travel_date || null,
      pickup: wizard.pickup || null,
      dropoff: wizard.dropoff || null,
      adults: wizard.adults,
      children: wizard.children,
      special_requests: wizard.special_requests || null,
      discount_cents: wizard.discount_cents,
      additional_charges_cents: wizard.additional_charges_cents,
      pricing_snapshot: breakdown,
      grand_total_cents: breakdown?.grand_total_cents ?? null,
      line_items,
      notes: wizard.customer.notes || null,
    }
  }

  const saveDraft = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await postAdminBusiness(pin, {
        resource: 'quotes',
        action: 'create_quote',
        quote: buildQuotePayload('draft'),
      })
      const quote = res.quote as AdminQuote
      setPreviewQuote(quote)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft')
    } finally {
      setBusy(false)
    }
  }

  const sendWhatsApp = async () => {
    setBusy(true)
    setError(null)
    try {
      let quote = previewQuote
      if (!quote) {
        const res = await postAdminBusiness(pin, {
          resource: 'quotes',
          action: 'create_quote',
          quote: buildQuotePayload('sent'),
        })
        quote = res.quote as AdminQuote
      } else {
        const res = await patchAdminBusiness(pin, {
          resource: 'quotes',
          action: 'set_status',
          id: quote.id,
          status: 'sent',
        })
        quote = res.quote as AdminQuote
      }
      setPreviewQuote(quote)
      await load()

      const phone = String(
        quote.customer?.whatsapp ||
          quote.customer?.phone ||
          wizard.customer.whatsapp ||
          wizard.customer.phone ||
          ''
      ).replace(/\D/g, '')
      const total = formatZar(Number(quote.grand_total_cents) || 0)
      const name = customerName(quote) || 'there'
      const pdfNote = quote.pdf_url
        ? `\n\nQuotation PDF: ${quote.pdf_url}\n`
        : '\n\nPlease find your personalised quotation details in this message (ask us for a PDF if needed).\n'
      const msg = encodeURIComponent(
        `Hi ${name},\n\n` +
          `Thank you for your enquiry with Khayr Cape Experiences.\n` +
          pdfNote +
          `\nShould you wish to proceed simply reply to this message and we will send your secure payment link.\n\n` +
          `We look forward to welcoming you to Cape Town.\n\n` +
          `Kind regards,\n` +
          `Yaseen Jacobs\n` +
          `Founder\n` +
          `Khayr Cape Experiences\n\n` +
          `Quote: ${quote.quote_number}\n` +
          `Total: ${total}`
      )
      if (phone) {
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
      } else {
        setError('No WhatsApp number on the quote. Draft saved as Sent.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send quote')
    } finally {
      setBusy(false)
    }
  }

  const convertToBooking = async (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId)
    const start_time = window.prompt(
      'Start time for this booking (HH:MM)',
      '08:00'
    )
    if (!start_time?.trim()) return
    const driver_id = window.prompt(
      'Driver ID (UUID from Drivers tab) — required for availability check'
    )
    if (!driver_id?.trim()) return

    setBusy(true)
    setError(null)
    try {
      await postAdminBusiness(pin, {
        resource: 'quotes',
        action: 'convert_quote',
        quote_id: quoteId,
        driver_id: driver_id.trim(),
        start_time: start_time.trim().slice(0, 5),
        vehicle_id: quote?.vehicle_id || undefined,
        tour_id: quote?.tour_id || undefined,
      })
      await load()
      setWizardOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Convert failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className={`${labelClass} flex-1 min-w-48`}>
          Search
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, WhatsApp, quote #, tour…"
          />
        </label>
        <label className={`${labelClass} min-w-40`}>
          Status
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={openWizard}
          className="min-h-11 rounded-lg bg-brand-green px-4 font-semibold text-brand-cream"
        >
          New Quote
        </button>
        <button
          type="button"
          onClick={load}
          className="min-h-11 rounded-lg border border-brand-cream-dark px-4 text-brand-green"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-brand-green/70">Loading quotes…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-cream-dark bg-brand-cream">
          <table className="w-full text-sm text-left text-brand-green">
            <thead className="bg-brand-cream-dark/40 text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Quote</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-t border-brand-cream-dark">
                  <td className="px-3 py-2 font-medium">{q.quote_number}</td>
                  <td className="px-3 py-2">
                    <div>{customerName(q)}</div>
                    <div className="text-xs text-brand-green/70">
                      {customerPhone(q)}
                    </div>
                  </td>
                  <td className="px-3 py-2">{q.travel_date || '—'}</td>
                  <td className="px-3 py-2">
                    {formatZar(Number(q.grand_total_cents) || 0)}
                  </td>
                  <td className="px-3 py-2 capitalize">{q.status}</td>
                  <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="underline text-xs"
                      onClick={() => {
                        setPreviewQuote(q)
                        setWizardOpen(true)
                        setStep(4)
                      }}
                    >
                      View
                    </button>
                    {!q.booking_id && (
                      <button
                        type="button"
                        className="underline text-xs text-brand-gold"
                        disabled={busy}
                        onClick={() => convertToBooking(q.id)}
                      >
                        Convert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-brand-green/70">
                    No quotes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-2xl my-8 rounded-xl bg-brand-cream-light border border-brand-cream-dark shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-cream-dark px-4 py-3">
              <h2 className="font-bold text-brand-green">
                {previewQuote && step === 4 && !wizard.customer.name
                  ? `Quote ${previewQuote.quote_number}`
                  : `New quote · Step ${step} of 4`}
              </h2>
              <button
                type="button"
                className="text-sm underline text-brand-green/80"
                onClick={() => setWizardOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-4">
              {step === 1 && (
                <div className="space-y-3">
                  <label className={labelClass}>
                    Full name
                    <input
                      className={inputClass}
                      value={wizard.customer.name}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          customer: { ...w.customer, name: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className={labelClass}>
                    Email
                    <input
                      type="email"
                      className={inputClass}
                      value={wizard.customer.email}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          customer: { ...w.customer, email: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className={labelClass}>
                    Phone
                    <input
                      className={inputClass}
                      value={wizard.customer.phone}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          customer: { ...w.customer, phone: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className={labelClass}>
                    WhatsApp
                    <input
                      className={inputClass}
                      value={wizard.customer.whatsapp}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          customer: { ...w.customer, whatsapp: e.target.value },
                        }))
                      }
                      placeholder="Include country code, e.g. 2782…"
                    />
                  </label>
                  <label className={labelClass}>
                    Country
                    <input
                      className={inputClass}
                      value={wizard.customer.country}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          customer: { ...w.customer, country: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className={labelClass}>
                    Enquiry source
                    <select
                      className={inputClass}
                      value={wizard.enquiry_source}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          enquiry_source: e.target.value,
                        }))
                      }
                    >
                      {ENQUIRY_SOURCES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Notes
                    <textarea
                      rows={2}
                      className={`${inputClass} py-2`}
                      value={wizard.customer.notes}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          customer: { ...w.customer, notes: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-semibold text-brand-green">
                      Experiences
                    </legend>
                    {tours.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-sm text-brand-green"
                      >
                        <input
                          type="checkbox"
                          checked={wizard.selectedTourIds.includes(t.id)}
                          onChange={(e) => {
                            setWizard((w) => {
                              const ids = e.target.checked
                                ? [...w.selectedTourIds, t.id]
                                : w.selectedTourIds.filter((id) => id !== t.id)
                              return { ...w, selectedTourIds: ids }
                            })
                          }}
                        />
                        {t.name}
                      </label>
                    ))}
                  </fieldset>
                  <label className={labelClass}>
                    Vehicle
                    <select
                      className={inputClass}
                      value={wizard.vehicle_id}
                      onChange={(e) =>
                        setWizard((w) => ({ ...w, vehicle_id: e.target.value }))
                      }
                    >
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.capacity_min}–{v.capacity_max})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Travel date
                    <input
                      type="date"
                      className={inputClass}
                      value={wizard.travel_date}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          travel_date: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className={labelClass}>
                      Adults
                      <input
                        type="number"
                        min={1}
                        className={inputClass}
                        value={wizard.adults}
                        onChange={(e) =>
                          setWizard((w) => ({
                            ...w,
                            adults: Number(e.target.value) || 1,
                          }))
                        }
                      />
                    </label>
                    <label className={labelClass}>
                      Children
                      <input
                        type="number"
                        min={0}
                        className={inputClass}
                        value={wizard.children}
                        onChange={(e) =>
                          setWizard((w) => ({
                            ...w,
                            children: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className={labelClass}>
                    Pickup
                    <input
                      className={inputClass}
                      value={wizard.pickup}
                      onChange={(e) =>
                        setWizard((w) => ({ ...w, pickup: e.target.value }))
                      }
                    />
                  </label>
                  <label className={labelClass}>
                    Drop-off
                    <input
                      className={inputClass}
                      value={wizard.dropoff}
                      onChange={(e) =>
                        setWizard((w) => ({ ...w, dropoff: e.target.value }))
                      }
                    />
                  </label>
                  <label className={labelClass}>
                    Special requests
                    <textarea
                      rows={2}
                      className={`${inputClass} py-2`}
                      value={wizard.special_requests}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          special_requests: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  {!breakdown ? (
                    <p className="text-sm text-red-800">
                      Select at least one tour and a vehicle to calculate price.
                    </p>
                  ) : (
                    <div className={cardClass}>
                      <p className="font-semibold text-brand-green">Live pricing</p>
                      <ul className="text-sm space-y-1 text-brand-green/90">
                        <li>Vehicle: {formatZar(breakdown.vehicle_price_cents)}</li>
                        <li>
                          Guests ({breakdown.passenger_count} ×{' '}
                          {formatZar(breakdown.price_per_person_cents)}):{' '}
                          {formatZar(breakdown.passenger_total_cents)}
                        </li>
                        {weekendSurcharge > 0 && (
                          <li>Weekend surcharge: {formatZar(weekendSurcharge)}</li>
                        )}
                        {wizard.discount_cents > 0 && (
                          <li>Discount: −{formatZar(wizard.discount_cents)}</li>
                        )}
                        {wizard.additional_charges_cents > 0 && (
                          <li>
                            Additional: {formatZar(wizard.additional_charges_cents)}
                          </li>
                        )}
                        <li className="font-bold text-brand-green pt-1">
                          Total: {formatZar(breakdown.grand_total_cents)}
                        </li>
                      </ul>
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-sm text-brand-green">
                    <input
                      type="checkbox"
                      checked={wizard.apply_weekend_surcharge}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          apply_weekend_surcharge: e.target.checked,
                        }))
                      }
                    />
                    Apply weekend surcharge from admin_meta
                    {primaryTour && getAdminMeta(primaryTour).weekend_price_cents
                      ? ` (${formatZar(getAdminMeta(primaryTour).weekend_price_cents || 0)})`
                      : ' (none set)'}
                  </label>
                  <label className={labelClass}>
                    Discount (R)
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={centsToRands(wizard.discount_cents)}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          discount_cents: randsToCents(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className={labelClass}>
                    Additional charges (R)
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={centsToRands(wizard.additional_charges_cents)}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          additional_charges_cents: randsToCents(e.target.value),
                        }))
                      }
                    />
                  </label>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div
                    id="quote-print"
                    className="rounded-xl border border-brand-cream-dark bg-brand-cream p-6 space-y-3 text-brand-green print:border-0"
                  >
                    <p className="text-xs uppercase tracking-wide text-brand-gold font-semibold">
                      Khayr Cape Experiences
                    </p>
                    <h3 className="text-xl font-bold">
                      Quotation{' '}
                      {previewQuote?.quote_number || '(unsaved draft)'}
                    </h3>
                    <p className="text-sm capitalize">
                      Status: {previewQuote?.status || 'draft'}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-semibold">Guest</p>
                        <p>
                          {previewQuote
                            ? customerName(previewQuote)
                            : wizard.customer.name || '—'}
                        </p>
                        <p>
                          {previewQuote
                            ? customerPhone(previewQuote)
                            : wizard.customer.whatsapp || wizard.customer.phone}
                        </p>
                        <p>
                          {previewQuote
                            ? String(previewQuote.customer?.email || '')
                            : wizard.customer.email}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Trip</p>
                        <p>
                          {(wizard.selectedTourIds.length
                            ? wizard.selectedTourIds
                            : previewQuote?.tour_id
                              ? [previewQuote.tour_id]
                              : []
                          )
                            .map((id) => tours.find((t) => t.id === id)?.name || id)
                            .join(', ') || '—'}
                        </p>
                        <p>
                          Date:{' '}
                          {previewQuote?.travel_date || wizard.travel_date || 'TBC'}
                        </p>
                        <p>Pickup: {previewQuote?.pickup || wizard.pickup || '—'}</p>
                        <p>
                          Drop-off: {previewQuote?.dropoff || wizard.dropoff || '—'}
                        </p>
                        <p>
                          Guests:{' '}
                          {previewQuote
                            ? `${previewQuote.adults} adults, ${previewQuote.children} children`
                            : `${wizard.adults} adults, ${wizard.children} children`}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold border-t border-brand-cream-dark pt-3">
                      Total:{' '}
                      {formatZar(
                        Number(
                          previewQuote?.grand_total_cents ??
                            breakdown?.grand_total_cents ??
                            0
                        )
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 print:hidden">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={saveDraft}
                      className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream disabled:opacity-60"
                    >
                      Save draft
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={sendWhatsApp}
                      className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-green disabled:opacity-60"
                    >
                      Send WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="rounded-lg border border-brand-cream-dark px-4 py-2 text-sm font-semibold text-brand-green"
                    >
                      Print
                    </button>
                    {(previewQuote?.id || previewQuote) && previewQuote?.id && (
                      <button
                        type="button"
                        disabled={busy || Boolean(previewQuote.booking_id)}
                        onClick={() => convertToBooking(previewQuote.id)}
                        className="rounded-lg border border-brand-green px-4 py-2 text-sm font-semibold text-brand-green disabled:opacity-60"
                      >
                        Convert to booking
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2 border-t border-brand-cream-dark print:hidden">
                <button
                  type="button"
                  disabled={step <= 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="rounded-lg border border-brand-cream-dark px-4 py-2 text-sm disabled:opacity-40"
                >
                  Back
                </button>
                {step < 4 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(4, s + 1))}
                    className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
