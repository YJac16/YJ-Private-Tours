import { useId } from 'react'
import { useDisplayCurrency } from '../DisplayCurrencyContext'
import { DISPLAY_CURRENCIES, type DisplayCurrencyCode } from '../types'

type Props = {
  className?: string
  /** Smaller control for mobile sticky bar */
  compact?: boolean
  id?: string
}

export default function DisplayCurrencySwitcher({
  className = '',
  compact = false,
  id,
}: Props) {
  const autoId = useId()
  const selectId = id ?? autoId
  const { currency, setCurrency, fxRatesAvailable } = useDisplayCurrency()

  if (!fxRatesAvailable) return null

  return (
    <label
      className={`inline-flex items-center shrink-0 ${className}`}
      htmlFor={selectId}
    >
      <span className="sr-only">Display currency</span>
      <select
        id={selectId}
        value={currency}
        onChange={(e) => setCurrency(e.target.value as DisplayCurrencyCode)}
        className={
          compact
            ? 'text-[11px] font-semibold text-brand-green/80 bg-transparent border border-brand-green/25 rounded-md pl-1 pr-6 py-0.5 cursor-pointer max-w-[4.75rem] appearance-none bg-[length:0.65rem] bg-[right_0.2rem_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23355%27 d=%27M3 4.5 6 8 9 4.5%27/%3E%3C/svg%3E")]'
            : 'text-xs font-semibold text-brand-green bg-white/90 border border-brand-cream-dark rounded-lg pl-2 pr-7 py-1.5 cursor-pointer shadow-sm appearance-none bg-[length:0.65rem] bg-[right_0.45rem_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23355%27 d=%27M3 4.5 6 8 9 4.5%27/%3E%3C/svg%3E")]'
        }
        aria-label="Display currency"
      >
        {DISPLAY_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  )
}
