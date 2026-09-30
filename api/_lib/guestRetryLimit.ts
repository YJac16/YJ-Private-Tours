const WINDOW_MS = 15 * 60 * 1000
const MAX_HITS = 10

const hits = new Map<string, number[]>()

/** In-memory cap per serverless instance. Key should be IP + booking id. */
export function guestRetryAllowed(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_HITS) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

export function resetGuestRetryLimits(): void {
  hits.clear()
}
