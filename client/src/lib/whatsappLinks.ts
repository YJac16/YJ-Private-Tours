/** E.164 without + — matches +27 82 327 7446 */
export const WA_PHONE_E164 = '27823277446'

export function whatsappWithMessage(message: string): string {
  return `https://wa.me/${WA_PHONE_E164}?text=${encodeURIComponent(message)}`
}
