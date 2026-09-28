import { siteLowestFromCents } from '../../../data/catalogFloors'
import DisplayCurrencySwitcher from './DisplayCurrencySwitcher'
import { PublicPrice } from './PublicPrice'

type Props = {
  className?: string
}

/** Homepage hero starting price with optional FX line and currency switcher. */
export default function PublicHeroFromPrice({ className = '' }: Props) {
  const cents = siteLowestFromCents()
  return (
    <div className={`space-y-2 ${className}`}>
      <PublicPrice
        zarCents={cents}
        variant="from-one-guest"
        primaryClassName="font-semibold"
        approxClassName="text-xs text-white/85 tabular-nums mt-0.5"
      />
      <div className="flex justify-center">
        <DisplayCurrencySwitcher className="text-white/95 [&_select]:text-white/95 [&_select]:border-white/30 [&_select]:bg-black/40" />
      </div>
    </div>
  )
}
