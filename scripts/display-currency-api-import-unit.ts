/**
 * api/fx-rates must not import from client/ (Vercel ESM bundle).
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

function main() {
  const src = fs.readFileSync(path.join(process.cwd(), 'api/fx-rates.ts'), 'utf8')
  assert.ok(!/\bclient\//.test(src), 'api/fx-rates.ts must not import from client/')
  assert.ok(
    src.includes('booking-app/lib/display-currency-fx'),
    'api/fx-rates.ts should use booking-app/lib/display-currency-fx'
  )
  console.log('display-currency-api-import-unit: ok')
}

main()
