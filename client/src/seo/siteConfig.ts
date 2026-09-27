export const SITE = 'https://khayrcapeexperiences.com'
export const DEFAULT_OG = `${SITE}/cape-town-og.jpg`
export const BUSINESS_NAME = 'KhayrCape Experiences'
export const BUSINESS_PHONE = '+27823277446'
export const BUSINESS_EMAIL = 'hello.khayrcapeexperiences@gmail.com'

/** South African registered tourist guide number (public on site only — never ID numbers). */
export const GUIDE_REGISTRATION_NUMBER = 'WC16134'
export const GUIDE_REGISTRATION_LABEL = `Registered tourist guide (${GUIDE_REGISTRATION_NUMBER})`

export function guideRegistrationCredentialJsonLd(): Record<string, unknown> {
  return {
    '@type': 'EducationalOccupationalCredential',
    name: 'Registered Tourist Guide',
    credentialID: GUIDE_REGISTRATION_NUMBER,
  }
}

/** Shown on experience and book flows — confirmation timing only (not payment/refund terms). */
export const TOUR_CONFIRMATION_NOTICE =
  "Private tours are confirmed on request. We'll confirm your date and time after you book."
