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
}

export default function PriceWithInfo({
  tour,
  vehicles = [],
  className = '',
  showVehicleNote = true,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const infoText =
    tour.slug === 'hermanus' ? HERMANUS_PRICE_INFO_TEXT : PRICE_INFO_TEXT

  return (
    <div className={className}>
      <div className="flex items-start gap-1.5">
        <p
          className={`font-semibold text-brand-green ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          {formatStartingFromPerGuest(tour, vehicles)}
        </p>
        <button
          type="button"
          className="mt-0.5 text-brand-gold hover:text-brand-green transition-colors shrink-0"
          aria-expanded={open}
          aria-controls={tipId}
          aria-label="How pricing works"
          onClick={() => setOpen((v) => !v)}
        >
          <HiOutlineInformationCircle className="text-lg" />
        </button>
      </div>
      {showVehicleNote && (
        <p className="text-xs text-brand-green/75 mt-0.5">
          {formatStartingFromNote(tour)}
        </p>
      )}
      {open && (
        <p
          id={tipId}
          role="note"
          className="mt-2 text-xs leading-relaxed text-brand-green/90 bg-brand-cream-dark/40 border border-brand-cream-dark rounded-lg px-3 py-2"
        >
          {infoText}
        </p>
      )}
    </div>
  )
}
