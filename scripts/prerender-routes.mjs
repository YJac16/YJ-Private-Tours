/**
 * Post-build: inject per-route <title>, meta, canonical, og tags, and JSON-LD
 * into static HTML shells so crawlers see distinct metadata without JS.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'client', 'dist')
const SEO_MANIFEST = path.join(ROOT, 'client', 'seo-manifest.json')

const SITE = 'https://khayrcapeexperiences.com'
const DEFAULT_OG = `${SITE}/cape-town-og.jpg`

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function upsertTag(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement)
  return html
}

function injectRouteMeta(html, route) {
  const canonical = `${SITE}${route.path === '/' ? '/' : route.path}`
  const ogImage = route.ogImage || DEFAULT_OG
  const ogType = route.ogType || 'website'
  let out = html

  out = upsertTag(
    out,
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtml(route.title)}</title>`
  )

  out = upsertTag(
    out,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(route.description)}" />`
  )

  out = upsertTag(
    out,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`
  )

  const ogPairs = [
    ['og:title', route.title],
    ['og:description', route.description],
    ['og:url', canonical],
    ['og:image', ogImage],
    ['og:type', ogType],
  ]

  for (const [prop, content] of ogPairs) {
    out = upsertTag(
      out,
      new RegExp(
        `<meta\\s+property="${prop}"\\s+content="[^"]*"\\s*/?>`,
        'i'
      ),
      `<meta property="${prop}" content="${escapeHtml(content)}" />`
    )
  }

  const twitterPairs = [
    ['twitter:title', route.title],
    ['twitter:description', route.description],
    ['twitter:image', ogImage],
  ]

  for (const [name, content] of twitterPairs) {
    out = upsertTag(
      out,
      new RegExp(
        `<meta\\s+name="${name}"\\s+content="[^"]*"\\s*/?>`,
        'i'
      ),
      `<meta name="${name}" content="${escapeHtml(content)}" />`
    )
  }

  out = out.replace(
    /\s*<script type="application\/ld\+json" data-prerender="1">[\s\S]*?<\/script>/gi,
    ''
  )

  const blocks = route.jsonLd
    ? Array.isArray(route.jsonLd)
      ? route.jsonLd
      : [route.jsonLd]
    : []

  const jsonLdScripts = blocks
    .map(
      (block) =>
        `    <script type="application/ld+json" data-prerender="1">${JSON.stringify(block)}</script>`
    )
    .join('\n')

  if (jsonLdScripts) {
    out = out.replace('</head>', `${jsonLdScripts}\n  </head>`)
  }

  return out
}

function writeRouteHtml(route, templateHtml) {
  const html = injectRouteMeta(templateHtml, route)
  if (route.path === '/') {
    fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8')
    return
  }

  const dir = path.join(DIST, route.path.replace(/^\//, ''))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
}

function main() {
  const indexPath = path.join(DIST, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.error('prerender-routes: client/dist/index.html not found — run vite build first')
    process.exit(1)
  }
  if (!fs.existsSync(SEO_MANIFEST)) {
    console.error('prerender-routes: client/seo-manifest.json not found — run generate-seo-manifest first')
    process.exit(1)
  }

  const routes = JSON.parse(fs.readFileSync(SEO_MANIFEST, 'utf8'))
  const templateHtml = fs.readFileSync(indexPath, 'utf8')

  for (const route of routes) {
    writeRouteHtml(route, templateHtml)
    console.log(`prerender: ${route.path}`)
  }

  console.log(`prerender-routes: wrote ${routes.length} route shells`)
}

main()
