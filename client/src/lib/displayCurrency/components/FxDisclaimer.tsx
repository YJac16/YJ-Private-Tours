import { useDisplayCurrency } from '../DisplayCurrencyContext'
import { FX_DISCLAIMER } from '../constants'

type Props = {
  className?: string
}

export default function FxDisclaimer({ className = '' }: Props) {
  const { showFxDisclaimer } = useDisplayCurrency()
  if (!showFxDisclaimer) return null
  return (
    <p
      className={`text-xs leading-snug text-brand-green/75 ${className}`}
      style={{ fontSize: 'max(12px, 0.75rem)' }}
    >
      {FX_DISCLAIMER}
    </p>
  )
}
