import { useCallback, useEffect, useState } from 'react'
import { fetchAdminBusiness, type AdminInvoice } from '../../../lib/bookingApi'
import { formatZar } from '../../../lib/pricing'
import { cardClass, inputClass, labelClass } from '../adminShared'

type Props = { pin: string }

function customerName(inv: AdminInvoice) {
  const c = inv.customer || {}
  return String(c.name || c.full_name || c.client_name || '—')
}

export default function InvoicesTab({ pin }: Props) {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminInvoice | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminBusiness(pin, 'invoices')
      const list = (data.invoices as AdminInvoice[]) || []
      setInvoices(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [pin])

  useEffect(() => {
    load()
  }, [load])

  const filtered = invoices.filter((inv) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [
      inv.invoice_number,
      customerName(inv),
      inv.payment_status,
      inv.booking_reference,
      inv.yoco_reference,
      inv.travel_date,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q)
  })

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 items-end">
        <label className={`${labelClass} flex-1 min-w-48`}>
          Search
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Invoice #, customer, status…"
          />
        </label>
        <button
          type="button"
          onClick={load}
          className="min-h-11 rounded-lg border border-brand-cream-dark px-4 text-brand-green"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-brand-green/70">Loading invoices…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-cream-dark bg-brand-cream">
          <table className="w-full text-sm text-left text-brand-green">
            <thead className="bg-brand-cream-dark/40 text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Travel</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-t border-brand-cream-dark">
                  <td className="px-3 py-2 font-medium">{inv.invoice_number}</td>
                  <td className="px-3 py-2">{customerName(inv)}</td>
                  <td className="px-3 py-2">{formatZar(inv.amount_cents || 0)}</td>
                  <td className="px-3 py-2 capitalize">{inv.payment_status}</td>
                  <td className="px-3 py-2">{inv.travel_date || '—'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="underline text-xs"
                      onClick={() => setSelected(inv)}
                    >
                      View / Print
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-brand-green/70">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-xl my-8 rounded-xl bg-brand-cream-light border border-brand-cream-dark shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-cream-dark px-4 py-3">
              <h2 className="font-bold text-brand-green">Invoice</h2>
              <button
                type="button"
                className="text-sm underline"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div
                id="invoice-print"
                className={`${cardClass} print:shadow-none`}
              >
                <p className="text-xs uppercase tracking-wide text-brand-gold font-semibold">
                  Khayr Cape Experiences
                </p>
                <h3 className="text-xl font-bold">{selected.invoice_number}</h3>
                <p className="text-sm">Guest: {customerName(selected)}</p>
                <p className="text-sm">
                  Booking ref: {selected.booking_reference || '—'}
                </p>
                <p className="text-sm">Travel: {selected.travel_date || '—'}</p>
                <p className="text-sm">
                  Yoco ref: {selected.yoco_reference || '—'}
                </p>
                <p className="text-lg font-bold pt-2">
                  Amount: {formatZar(selected.amount_cents || 0)}
                </p>
                <p className="text-sm capitalize">
                  Payment status: {selected.payment_status}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 print:hidden">
                <p className="text-sm text-brand-green self-center capitalize">
                  Status: {selected.payment_status}
                </p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
