import { BUSINESS_EMAIL, BUSINESS_MAILTO } from '../lib/contactLinks'
import { WA_PHONE_E164 } from '../lib/whatsappLinks'

const WA_HREF = `https://wa.me/${WA_PHONE_E164}`
const WA_DISPLAY = '+27 82 327 7446'

type Props = {
  className?: string
  /** Short line for booking/checkout sidebars */
  compact?: boolean
}

/**
 * WhatsApp-primary public contact — shows hello@ as a mailto only (no inbox promises).
 */
export default function PublicContactLinks({ className = '', compact = false }: Props) {
  if (compact) {
    return (
      <p className={`text-sm text-brand-green/75 ${className}`}>
        <a
          href={WA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-green underline underline-offset-2"
        >
          WhatsApp {WA_DISPLAY}
        </a>
        <span className="text-brand-green/45"> · </span>
        <a href={BUSINESS_MAILTO} className="underline underline-offset-2 text-brand-green/85">
          {BUSINESS_EMAIL}
        </a>
      </p>
    )
  }

  return (
    <p className={`text-sm text-brand-green/75 ${className}`}>
      Fastest on{' '}
      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-brand-green underline underline-offset-2"
      >
        WhatsApp
      </a>
      . Business email:{' '}
      <a href={BUSINESS_MAILTO} className="underline underline-offset-2 text-brand-green/85">
        {BUSINESS_EMAIL}
      </a>
    </p>
  )
}
