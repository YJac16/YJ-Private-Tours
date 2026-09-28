import { useDisplayCurrency } from '../DisplayCurrencyContext'
import {
  formatPublicFromLabel,
  formatPublicFromOneGuest,
  formatPublicPayLabel,
  formatPublicZarAmount,
} from '../formatPublicPrice'

type PublicPriceProps = {
  zarCents: number
  /** Prefix for primary line, e.g. "From" or "Total:" */
  prefix?: string
  className?: string
  primaryClassName?: string
  approxClassName?: string
  /** Hermanus-style short "From ZAR …" without guest note */
  variant?: 'from' | 'from-one-guest' | 'amount' | 'pay'
}

export function PublicPrice({
  zarCents,
  prefix = 'From',
  className = '',
  primaryClassName = '',
  approxClassName = 'text-xs text-brand-green/70 tabular-nums',
  variant = 'from',
}: PublicPriceProps) {
  const { approxLineForZarCents } = useDisplayCurrency()
  const primary =
    variant === 'amount'
      ? formatPublicZarAmount(zarCents)
      : variant === 'pay'
        ? formatPublicPayLabel(zarCents)
        : variant === 'from-one-guest'
          ? formatPublicFromOneGuest(zarCents)
          : formatPublicFromLabel(zarCents, prefix)
  const approx = approxLineForZarCents(zarCents)

  return (
    <span className={className}>
      <span className={primaryClassName}>{primary}</span>
      {approx && (
        <span className={`block ${approxClassName}`}>{approx}</span>
      )}
    </span>
  )
}

type InlineProps = {
  zarCents: number
  prefix?: string
  className?: string
}

/** Primary + approx in a block (book totals, cards). */
export function PublicPriceBlock({
  zarCents,
  prefix = 'From',
  className = '',
}: InlineProps) {
  return (
    <PublicPrice
      zarCents={zarCents}
      prefix={prefix}
      className={className}
      primaryClassName="font-semibold tabular-nums"
    />
  )
}

export default PublicPrice

export function PublicPriceInline({
  zarCents,
  className = '',
}: {
  zarCents: number
  className?: string
}) {
  const { approxLineForZarCents } = useDisplayCurrency()
  const primary = formatPublicZarAmount(zarCents)
  const approx = approxLineForZarCents(zarCents)
  return (
    <span className={className}>
      <span className="font-bold tabular-nums">{primary}</span>
      {approx && (
        <span className="block text-[11px] font-normal text-brand-green/70 tabular-nums">
          {approx}
        </span>
      )}
    </span>
  )
}

export function usePublicPayLabel(zarCents: number | null | undefined): string {
  if (zarCents == null) return 'Pay with Yoco'
  return formatPublicPayLabel(zarCents)
}

export function usePublicFromTourLabel(
  zarCents: number,
  prefix = 'From'
): { primary: string; approx: string | null } {
  const { approxLineForZarCents } = useDisplayCurrency()
  return {
    primary: formatPublicFromLabel(zarCents, prefix),
    approx: approxLineForZarCents(zarCents),
  }
}
