/**
 * Build-time export of route SEO metadata (single source: client/src/seo/routes.ts).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { allPrerenderRoutes } from '../client/src/seo/routes.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'client', 'seo-manifest.json')

const manifest = allPrerenderRoutes()
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2))
console.log(`export-seo-manifest: wrote ${manifest.length} routes to ${OUT}`)
