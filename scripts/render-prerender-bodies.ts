import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  allPrerenderBodyPaths,
  renderRouteBody,
} from '../client/src/seo/prerender/renderRouteBody.tsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'client', 'prerender-bodies.json')

const bodies: Record<string, string> = {}
for (const routePath of allPrerenderBodyPaths()) {
  bodies[routePath] = renderRouteBody(routePath)
  console.log(`render-prerender-bodies: ${routePath} (${bodies[routePath].length} chars)`)
}

fs.writeFileSync(OUT, JSON.stringify(bodies))
console.log(`render-prerender-bodies: wrote ${Object.keys(bodies).length} bodies`)
