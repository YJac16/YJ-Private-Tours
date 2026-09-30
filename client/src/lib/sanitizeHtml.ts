const ALLOWED = new Set([
  'p',
  'strong',
  'em',
  'b',
  'i',
  'br',
  'ul',
  'ol',
  'li',
  'a',
  'h2',
  'h3',
])

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

/** http(s) or a same-origin path. Rejects javascript:, data:, and protocol-relative URLs. */
export function safeConsentHref(raw: string): string | null {
  const trimmed = raw.trim().replace(/[\u0000-\u001F\s]+/g, '')
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/\\')) return null
  if (trimmed.startsWith('/')) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {
    return null
  }
  return null
}

/**
 * Allowlist sanitizer for stored consent HTML. No DOM, so prerender can use it.
 * Drops scripts, styles, comments, and every attribute except a safe anchor href.
 */
export function sanitizeConsentHtml(html: string): string {
  if (!html) return ''
  let source = html.replace(/<!--[\s\S]*?-->/g, '')
  source = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  source = source.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  return source.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (full, rawTag, attrs) => {
    const tag = String(rawTag).toLowerCase()
    if (!ALLOWED.has(tag)) return ''
    if (tag === 'br') return '<br>'
    if (full.startsWith('</')) return `</${tag}>`
    if (tag !== 'a') return `<${tag}>`
    const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(String(attrs))
    const rawHref = hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || ''
    const href = safeConsentHref(rawHref)
    if (!href) return '<a>'
    return `<a href="${escapeAttr(href)}" rel="noopener noreferrer">`
  })
}
