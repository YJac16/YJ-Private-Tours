import { useEffect, useState } from 'react'
import { fetchCatalog, type Catalog, type Tour } from '../lib/bookingApi'

let cached: Catalog | null = null
let inflight: Promise<Catalog> | null = null

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

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cached) return

    let cancelled = false
    loadCatalog()
      .then((data) => {
        if (!cancelled) {
          setCatalog(data)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load pricing')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const tourBySlug = (slug: string): Tour | undefined =>
    catalog?.tours.find((t) => t.slug === slug)

  return { catalog, loading, error, tourBySlug }
}
