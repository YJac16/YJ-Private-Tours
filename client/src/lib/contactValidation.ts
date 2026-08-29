export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)
}

/** Plausible international phone: 9–15 digits after stripping formatting. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 15
}
