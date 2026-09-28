import { useId } from 'react'
import { HiOutlineChevronDown } from 'react-icons/hi'
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
      className={`relative inline-flex items-center shrink-0 ${className}`}
      htmlFor={selectId}
    >
      <span className="sr-only">Display currency</span>
      <select
        id={selectId}
        value={currency}
        onChange={(e) => setCurrency(e.target.value as DisplayCurrencyCode)}
        className={
          compact
            ? 'text-[11px] font-semibold text-brand-green/80 bg-transparent border border-brand-green/25 rounded-md pl-1.5 pr-5 py-0.5 cursor-pointer max-w-[4.75rem] appearance-none'
            : 'text-xs font-semibold text-brand-green bg-white/90 border border-brand-cream-dark rounded-lg pl-2 pr-6 py-1.5 cursor-pointer shadow-sm appearance-none'
        }
        aria-label="Display currency"
      >
        {DISPLAY_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
      <HiOutlineChevronDown
        className={`pointer-events-none absolute text-current ${
          compact ? 'right-1 size-3' : 'right-1.5 size-3.5'
        }`}
        aria-hidden
      />
    </label>
  )
}
