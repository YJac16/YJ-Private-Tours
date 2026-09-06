import { useEffect } from 'react'

const SITE = 'https://khayrcapeexperiences.com'
const DEFAULT_OG = `${SITE}/cape-town-og.jpg`

export type PageMetaProps = {
  title: string
  description: string
  path: string
  ogImage?: string
  ogType?: 'website' | 'article'
}

function upsertMeta(
  selector: string,
  attrs: Record<string, string>,
  createTag: 'meta' | 'link' = 'meta'
) {
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement(createTag)
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v))
    document.head.appendChild(el)
    return
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v))
}

export default function PageMeta({
  title,
  description,
  path,
  ogImage = DEFAULT_OG,
  ogType = 'website',
}: PageMetaProps) {
  const canonical = `${SITE}${path.startsWith('/') ? path : `/${path}`}`

  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const descEl = document.querySelector('meta[name="description"]')
    const prevDesc = descEl?.getAttribute('content') ?? null
    upsertMeta('meta[name="description"]', { name: 'description', content: description })

    const canonEl = document.querySelector('link[rel="canonical"]')
    const prevCanon = canonEl?.getAttribute('href') ?? null
    upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: canonical }, 'link')

    const ogPairs: Array<[string, string]> = [
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[property="og:url"]', canonical],
      ['meta[property="og:image"]', ogImage],
      ['meta[property="og:type"]', ogType],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
      ['meta[name="twitter:image"]', ogImage],
    ]

    const prevOg: Array<{ selector: string; content: string | null }> = []
    ogPairs.forEach(([selector, content]) => {
      const el = document.querySelector(selector)
      prevOg.push({ selector, content: el?.getAttribute('content') ?? null })
      const prop: Record<string, string> = selector.includes('og:')
        ? {
            property: selector.match(/property="([^"]+)"/)?.[1] || 'og:title',
            content,
          }
        : {
            name: selector.match(/name="([^"]+)"/)?.[1] || 'twitter:title',
            content,
          }
      upsertMeta(selector, prop)
    })

    return () => {
      document.title = prevTitle
      if (descEl && prevDesc !== null) {
        descEl.setAttribute('content', prevDesc)
      }
      if (canonEl && prevCanon !== null) {
        canonEl.setAttribute('href', prevCanon)
      }
      prevOg.forEach(({ selector, content }) => {
        const el = document.querySelector(selector)
        if (el && content !== null) el.setAttribute('content', content)
      })
    }
  }, [title, description, canonical, ogImage, ogType])

  return null
}

export { SITE, DEFAULT_OG }
