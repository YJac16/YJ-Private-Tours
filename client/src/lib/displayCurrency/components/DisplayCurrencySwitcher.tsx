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
  const { currency, setCurrency } = useDisplayCurrency()
  const selectId = id ?? 'display-currency-select'

  return (
    <label
      className={`inline-flex items-center gap-0.5 shrink-0 ${className}`}
      htmlFor={selectId}
    >
      <span className="sr-only">Display currency</span>
      <select
        id={selectId}
        value={currency}
        onChange={(e) => setCurrency(e.target.value as DisplayCurrencyCode)}
        className={
          compact
            ? 'text-[11px] font-semibold text-brand-green/80 bg-transparent border border-brand-green/25 rounded-md pl-1 pr-5 py-0.5 cursor-pointer max-w-[4.5rem]'
            : 'text-xs font-semibold text-brand-green bg-white/90 border border-brand-cream-dark rounded-lg pl-2 pr-7 py-1.5 cursor-pointer shadow-sm'
        }
        aria-label="Display currency"
      >
        {DISPLAY_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
      {!compact && (
        <span className="pointer-events-none -ml-6 text-[10px] text-brand-green/60" aria-hidden>
          ▾
        </span>
      )}
    </label>
  )
}
