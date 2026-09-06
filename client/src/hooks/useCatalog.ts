import { useCallback, useEffect, useState } from 'react'
import { fetchCatalog, type Catalog, type Tour } from '../lib/bookingApi'

const AUTO_RETRIES = 1
const RETRY_DELAY_MS = 1200

let cached: Catalog | null = null
let inflight: Promise<Catalog> | null = null

export function invalidateCatalogCache() {
  cached = null
  inflight = null
}

function loadCatalog(): Promise<Catalog> {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = fetchCatalog()
      .then((data) => {
        cached = data
        return data
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    invalidateCatalogCache()
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    if (cached) {
      setCatalog(cached)
      setLoading(false)
      setError(null)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    ;(async () => {
      let lastError = 'Could not load pricing'

      for (let tryNum = 0; tryNum <= AUTO_RETRIES; tryNum++) {
        if (!active) return
        if (tryNum > 0) {
          invalidateCatalogCache()
          await sleep(RETRY_DELAY_MS)
          if (!active) return
        }

        try {
          const data = await loadCatalog()
          if (!active) return
          setCatalog(data)
          setError(null)
          setLoading(false)
          return
        } catch (e) {
          lastError =
            e instanceof Error ? e.message : 'Could not load pricing'
        }
      }

      if (!active) return
      setError(lastError)
      setLoading(false)
    })()

    return () => {
      active = false
    }
  }, [attempt])

  const tourBySlug = (slug: string): Tour | undefined =>
    catalog?.tours.find((t) => t.slug === slug)

  return { catalog, loading, error, retry, tourBySlug }
}
