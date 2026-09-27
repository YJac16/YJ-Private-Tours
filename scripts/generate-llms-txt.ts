import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tourSummaryLines } from '../client/src/seo/prerender/renderRouteBody.tsx'
import {
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  SITE,
} from '../client/src/seo/siteConfig.ts'
import { siteLowestFromLabel } from '../client/src/data/catalogFloors.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'client', 'dist')

const lines = [
  `# ${BUSINESS_NAME}`,
  '',
  `${BUSINESS_NAME} offers private, Muslim-friendly tours of Cape Town and the Western Cape with a registered local guide.`,
  'Halal-friendly options and cultural sensitivity are part of how we host guests.',
  '',
  `Site: ${SITE}`,
  `WhatsApp / phone: ${BUSINESS_PHONE}`,
  `Email: ${BUSINESS_EMAIL}`,
  '',
  `Pricing floor (per guest, vehicle at booking): ${siteLowestFromLabel()}`,
  '',
  '## Key pages',
  `- Home: ${SITE}/`,
  `- Book: ${SITE}/book`,
  `- Gallery: ${SITE}/gallery`,
  `- Terms: ${SITE}/terms`,
  `- Privacy: ${SITE}/privacy`,
  `- Cookies: ${SITE}/cookies`,
  '',
  '## Private experiences',
  ...tourSummaryLines(),
  '',
]

if (!fs.existsSync(DIST)) {
  console.error('generate-llms-txt: client/dist missing — run vite build first')
  process.exit(1)
}

fs.writeFileSync(path.join(DIST, 'llms.txt'), lines.join('\n'), 'utf8')
console.log('generate-llms-txt: wrote client/dist/llms.txt')
