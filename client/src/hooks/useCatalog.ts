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
    if (cached) {
      setCatalog(cached)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    loadCatalog()
      .then((data) => {
        if (!active) return
        setCatalog(data)
        setError(null)
      })
      .catch((e) => {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Could not load pricing')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const tourBySlug = (slug: string): Tour | undefined =>
    catalog?.tours.find((t) => t.slug === slug)

  return { catalog, loading, error, tourBySlug }
}
