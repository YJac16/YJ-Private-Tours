/**
 * Pricing/checkout/server booking code must not import display currency modules.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const forbiddenImport =
  /displayCurrency|display-currency|fx-rates|formatPublicZar|formatPublicFrom|useDisplayCurrency/

const scanRoots = [
  path.join(root, 'booking-app/lib'),
  path.join(root, 'client/src/lib/pricing.ts'),
  path.join(root, 'api'),
]

const skipFiles = new Set(['fx-rates.ts'])

function scanFile(filePath: string) {
  const rel = path.relative(root, filePath)
  if (skipFiles.has(path.basename(filePath))) return
  const src = fs.readFileSync(filePath, 'utf8')
  assert.ok(
    !forbiddenImport.test(src),
    `${rel} must not import display currency / FX presentation code`
  )
}

function walk(dir: string) {
  if (!fs.existsSync(dir)) return
  const stat = fs.statSync(dir)
  if (stat.isFile()) {
    if (dir.endsWith('.ts') || dir.endsWith('.tsx')) scanFile(dir)
    return
  }
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const s = fs.statSync(p)
    if (s.isDirectory()) walk(p)
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) scanFile(p)
  }
}

function main() {
  for (const r of scanRoots) walk(r)
  console.log('display-currency-import-direction-unit: ok')
}

main()
