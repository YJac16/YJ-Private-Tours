export const SITE = 'https://khayrcapeexperiences.com'
export const DEFAULT_OG = `${SITE}/cape-town-og.jpg`
export const BUSINESS_NAME = 'KhayrCape Experiences'
export const BUSINESS_PHONE = '+27823277446'
export const BUSINESS_EMAIL = 'hello.khayrcapeexperiences@gmail.com'

/** Public guide registration (number only — never ID numbers or card images). */
export const guideRegistration = {
  number: 'WC16134',
  label: 'Registered South African tourist guide · WC16134',
} as const

export const GUIDE_REGISTRATION_NUMBER = guideRegistration.number
export const GUIDE_REGISTRATION_LABEL = guideRegistration.label

/** Public CIPC company registration for footer / legal entity display. */
export const COMPANY_REGISTRATION_LABEL =
  'KhayrCape Experiences (Pty) Ltd · Reg. No. 2026/776333/07'

export function guideRegistrationCredentialJsonLd(): Record<string, unknown> {
  return {
    '@type': 'EducationalOccupationalCredential',
    name: 'Registered Tourist Guide',
    credentialID: guideRegistration.number,
  }
}
