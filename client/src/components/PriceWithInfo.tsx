import { useId, useState } from 'react'
import { HiOutlineInformationCircle } from 'react-icons/hi'
import {
  HERMANUS_PRICE_INFO_TEXT,
  PRICE_INFO_TEXT,
} from '../lib/experienceTypes'
import type { PricingTour, PricingVehicle } from '../lib/pricing'
import {
  formatStartingFromNote,
  formatStartingFromPerGuest,
} from '../lib/pricing'

type Props = {
  tour: PricingTour
  vehicles?: PricingVehicle[]
  className?: string
  showVehicleNote?: boolean
  compact?: boolean
  tone?: 'default' | 'onDark'
}

export default function PriceWithInfo({
  tour,
  vehicles = [],
  className = '',
  showVehicleNote = true,
  compact = false,
  tone = 'default',
}: Props) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const infoText =
    tour.slug === 'hermanus' ? HERMANUS_PRICE_INFO_TEXT : PRICE_INFO_TEXT
  const onDark = tone === 'onDark'

  return (
    <div className={className}>
      <div className="flex items-start gap-1.5">
        <p
          className={`font-semibold ${
            onDark ? 'text-white' : 'text-brand-green'
          } ${compact ? 'text-sm' : 'text-base'}`}
        >
          {formatStartingFromPerGuest(tour, vehicles)}
        </p>
        <button
          type="button"
          className={`mt-0.5 transition-colors shrink-0 ${
            onDark
              ? 'text-brand-gold-light hover:text-white'
              : 'text-brand-gold hover:text-brand-green'
          }`}
          aria-expanded={open}
          aria-controls={tipId}
          aria-label="How pricing works"
          onClick={() => setOpen((v) => !v)}
        >
          <HiOutlineInformationCircle className="text-lg" />
        </button>
      </div>
      {showVehicleNote && (
        <p
          className={`text-xs mt-0.5 ${
            onDark ? 'text-white/75' : 'text-brand-green/75'
          }`}
        >
          {formatStartingFromNote(tour)}
        </p>
      )}
      {open && (
        <p
          id={tipId}
          role="note"
          className={`mt-2 text-xs leading-relaxed rounded-lg px-3 py-2 border ${
            onDark
              ? 'text-white/90 bg-black/40 border-white/20'
              : 'text-brand-green/90 bg-brand-cream-dark/40 border-brand-cream-dark'
          }`}
        >
          {infoText}
        </p>
      )}
    </div>
  )
}
