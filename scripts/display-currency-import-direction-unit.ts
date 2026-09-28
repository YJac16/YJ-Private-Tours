/**
 * Pricing/checkout/server booking code must not import display currency modules.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

export const forbiddenDisplayCurrencyImport =
  /displayCurrency|display-currency-fx|display-currency\/|formatPublicZar|formatPublicFrom|useDisplayCurrency/

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

const payloadBuilderFiles = [
  path.join(root, 'booking-app/lib/book-create-request.ts'),
  path.join(root, 'booking-app/lib/yoco.ts'),
  path.join(root, 'booking-app/lib/pricing.ts'),
]

const skipScriptPrefix = 'display-currency-'

function shouldSkip(filePath: string): boolean {
  if (skipPaths.has(filePath)) return true
  for (const skip of skipPaths) {
    if (filePath.startsWith(skip + path.sep)) return true
  }
  const rel = path.relative(path.join(root, 'scripts'), filePath)
  if (!rel.startsWith('..') && path.basename(filePath).startsWith(skipScriptPrefix)) {
    return true
  }
  return false
}

function scanFile(filePath: string) {
  if (shouldSkip(filePath)) return
  const rel = path.relative(root, filePath)
  const src = fs.readFileSync(filePath, 'utf8')
  assert.ok(
    !forbiddenDisplayCurrencyImport.test(src),
    `${rel} must not import display currency / FX presentation code`
  )
}

function walk(target: string) {
  if (!fs.existsSync(target)) return
  const stat = fs.statSync(target)
  if (stat.isFile()) {
    if (
      target.endsWith('.ts') ||
      target.endsWith('.tsx') ||
      target.endsWith('.mjs')
    ) {
      scanFile(target)
    }
    return
  }
  for (const name of fs.readdirSync(target)) {
    walk(path.join(target, name))
  }
}

function negativeSelfTest() {
  const mustMatch = [
    "import x from '../displayCurrency/foo'",
    "from '../../lib/display-currency-fx'",
    "display-currency-fx.ts",
    "formatPublicZarAmount",
    "useDisplayCurrency(",
  ]
  for (const sample of mustMatch) {
    assert.ok(
      forbiddenDisplayCurrencyImport.test(sample),
      `checker should flag: ${sample}`
    )
  }
}

function main() {
  negativeSelfTest()
  for (const r of scanRoots) walk(r)
  for (const f of payloadBuilderFiles) {
    assert.ok(fs.existsSync(f), `missing ${f}`)
    scanFile(f)
  }
  console.log('display-currency-import-direction-unit: ok')
}

main()
