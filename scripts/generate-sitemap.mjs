/**
 * Write sitemap.xml into client/dist after build (and client/public for dev parity).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SITE = 'https://khayrcapeexperiences.com'
const today = new Date().toISOString().slice(0, 10)

const URLS = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/book', changefreq: 'weekly', priority: '0.9' },
  { loc: '/gallery', changefreq: 'monthly', priority: '0.7' },
  { loc: '/experience/hermanus', changefreq: 'weekly', priority: '0.9' },
  { loc: '/experience/city', changefreq: 'monthly', priority: '0.8' },
  { loc: '/experience/peninsula', changefreq: 'monthly', priority: '0.8' },
  { loc: '/experience/sunset', changefreq: 'monthly', priority: '0.8' },
  { loc: '/experience/winelands', changefreq: 'monthly', priority: '0.8' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.4' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.4' },
  { loc: '/cookies', changefreq: 'yearly', priority: '0.3' },
]

const body = URLS
  .map(
    (u) => `  <url>
    <loc>${SITE}${u.loc === '/' ? '/' : u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

const targets = [
  path.join(ROOT, 'client', 'public', 'sitemap.xml'),
  path.join(ROOT, 'client', 'dist', 'sitemap.xml'),
]

for (const target of targets) {
  const dir = path.dirname(target)
  if (!fs.existsSync(dir)) continue
  fs.writeFileSync(target, xml, 'utf8')
  console.log(`generate-sitemap: ${target}`)
}
