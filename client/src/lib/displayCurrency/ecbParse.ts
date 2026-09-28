import type { EcbRatesSnapshot } from './types'

/** Parse ECB daily eurofxref XML into per-EUR rates (includes EUR=1). */
export function parseEcbDailyXml(xml: string, fetchedAt = new Date().toISOString()): EcbRatesSnapshot | null {
  if (!xml || !xml.includes('Cube')) return null
  const perEur: Record<string, number> = { EUR: 1 }
  const re = /currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const code = m[1]
    const rate = Number(m[2])
    if (code && Number.isFinite(rate) && rate > 0) {
      perEur[code] = rate
    }
  }
  if (!perEur.ZAR || perEur.ZAR <= 0) return null
  return { fetchedAt, perEur }
}
