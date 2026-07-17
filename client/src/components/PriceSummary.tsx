import type { PriceBreakdown } from '../lib/pricing'
import { formatZar } from '../lib/pricing'

type Props = {
  breakdown: PriceBreakdown | null
  tourName?: string
  vehicleName?: string
  className?: string
  /** Screenshot-style: PPP × people (+ vehicle when present) */
  variant?: 'card' | 'compact'
}

/**
 * Live price panel — updates instantly when guests or vehicle change.
 * Layout inspired by premium group-size booking UIs.
 */
export default function PriceSummary({
  breakdown,
  tourName,
  vehicleName,
  className = '',
  variant = 'card',
}: Props) {
  if (!breakdown) return null

  const showVehicle = breakdown.vehicle_price_cents > 0

  return (
    <div
      className={`rounded-xl bg-[#f3f3f3] border border-brand-cream-dark/40 px-5 py-4 space-y-2.5 ${className}`}
    >
      {tourName && variant === 'card' && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-green/55 mb-1">
          {tourName}
          {vehicleName ? ` · ${vehicleName}` : ''}
        </p>
      )}

      {showVehicle && (
        <div className="flex justify-between gap-3 text-[15px] text-brand-green">
          <span>Vehicle fee:</span>
          <span className="font-bold tabular-nums">
            {formatZar(breakdown.vehicle_price_cents)}
          </span>
        </div>
      )}

      <div className="flex justify-between gap-3 text-[15px] text-brand-green">
        <span>Price per person:</span>
        <span className="font-bold tabular-nums">
          {formatZar(breakdown.price_per_person_cents)}
        </span>
      </div>

      <div className="flex justify-between gap-3 text-[15px] text-brand-green">
        <span>Number of people:</span>
        <span className="font-bold tabular-nums">{breakdown.passenger_count}</span>
      </div>

      {showVehicle && (
        <div className="flex justify-between gap-3 text-[15px] text-brand-green/80">
          <span>Passenger total:</span>
          <span className="font-semibold tabular-nums">
            {formatZar(breakdown.passenger_total_cents)}
          </span>
        </div>
      )}

      <div className="border-t border-brand-cream-dark/50 pt-3 flex justify-between gap-3 items-baseline">
        <span className="font-bold text-lg text-brand-green">Total:</span>
        <span className="font-bold text-xl tabular-nums text-brand-green">
          {formatZar(breakdown.grand_total_cents)}
        </span>
      </div>
    </div>
  )
}
