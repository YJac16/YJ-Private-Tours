import { EUROZONE_REGIONS } from './constants'
import type { DisplayCurrencyCode } from './types'

function regionFromTag(tag: string): string | null {
  const t = tag.trim()
  if (!t) return null
  try {
    const locale = new Intl.Locale(t)
    return locale.region?.toUpperCase() ?? null
  } catch {
    const parts = t.split('-')
    if (parts.length >= 2) {
      const r = parts[parts.length - 1]
      if (/^[A-Za-z]{2}$/.test(r)) return r.toUpperCase()
    }
    return null
  }
}

export function defaultDisplayCurrencyFromLocales(
  languages: readonly string[] | null | undefined
): DisplayCurrencyCode {
  const list = languages?.length ? [...languages] : ['en']
  for (const tag of list) {
    const region = regionFromTag(tag)
    if (region === 'ZA') return 'ZAR'
    if (region === 'GB') return 'GBP'
    if (region === 'US') return 'USD'
    if (region && EUROZONE_REGIONS.has(region)) return 'EUR'
  }
  return 'USD'
}
