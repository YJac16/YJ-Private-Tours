/**
 * @deprecated — source of truth is client/src/seo/routes.ts.
 * Build runs scripts/export-seo-manifest.ts instead. This wrapper keeps legacy invocations working.
 */
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

execSync(
  'npx tsx --tsconfig tsconfig.prerender.json ../scripts/export-seo-manifest.ts',
  { cwd: path.join(ROOT, 'client'), stdio: 'inherit' }
)
