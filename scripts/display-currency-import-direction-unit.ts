/**
 * Pricing/checkout/server booking code must not import display currency modules.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const forbiddenImport =
  /displayCurrency|display-currency\/|formatPublicZar|formatPublicFrom|useDisplayCurrency|from ['"].*displayCurrency/

const scanRoots = [
  path.join(root, 'booking-app/lib'),
  path.join(root, 'client/src/lib/pricing.ts'),
  path.join(root, 'client/src/data/catalogFloors.ts'),
  path.join(root, 'client/src/lib/experienceTypes.ts'),
  path.join(root, 'client/src/seo'),
  path.join(root, 'client/src/pages/admin'),
  path.join(root, 'client/src/pages/AccountPage.tsx'),
  path.join(root, 'client/src/pages/AccountBookingDetailPage.tsx'),
  path.join(root, 'client/src/pages/AccountReceiptPage.tsx'),
  path.join(root, 'client/src/pages/Checkout.tsx'),
  path.join(root, 'scripts'),
  path.join(root, 'api'),
]

const skipPaths = new Set([
  path.join(root, 'booking-app/lib/display-currency-fx.ts'),
  path.join(root, 'client/src/lib/displayCurrency'),
  path.join(root, 'api/fx-rates.ts'),
])

const skipScriptPrefix = 'display-currency-'

function shouldSkip(filePath: string): boolean {
  if (skipPaths.has(filePath)) return true
  for (const skip of skipPaths) {
    if (filePath.startsWith(skip + path.sep)) return true
  }
  const rel = path.relative(path.join(root, 'scripts'), filePath)
  if (rel.startsWith('..')) return false
  if (path.basename(filePath).startsWith(skipScriptPrefix)) return true
  return false
}

function scanFile(filePath: string) {
  if (shouldSkip(filePath)) return
  const rel = path.relative(root, filePath)
  const src = fs.readFileSync(filePath, 'utf8')
  assert.ok(
    !forbiddenImport.test(src),
    `${rel} must not import display currency / FX presentation code`
  )
}

function walk(target: string) {
  if (!fs.existsSync(target)) return
  const stat = fs.statSync(target)
  if (stat.isFile()) {
    if (target.endsWith('.ts') || target.endsWith('.tsx')) scanFile(target)
    return
  }
  for (const name of fs.readdirSync(target)) {
    const p = path.join(target, name)
    const s = fs.statSync(p)
    if (s.isDirectory()) walk(p)
    else if (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.mjs')) scanFile(p)
  }
}

function main() {
  for (const r of scanRoots) walk(r)
  console.log('display-currency-import-direction-unit: ok')
}

main()
