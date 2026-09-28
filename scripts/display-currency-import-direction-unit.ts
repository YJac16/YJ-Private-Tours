/**
 * Pricing/checkout/server booking code must not import display currency modules.
 * Only client/src/lib/publicZarText.ts is allowlisted (pure ZAR copy, no FX/UI).
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

export const PUBLIC_ZAR_TEXT_PATH = path.join(root, 'client/src/lib/publicZarText.ts')

/** Path fragments that must not appear in module specifiers (protected code). */
export const FORBIDDEN_SPECIFIER_MARKERS = [
  'displayCurrency',
  'display-currency-fx',
  'formatPublicPrice',
  'DisplayCurrencyContext',
  'useDisplayCurrency',
] as const

/** Also flag client/server FX route modules when imported as dependencies (not fetch URLs). */
export function specifierLooksLikeFxRatesModule(specifier: string): boolean {
  const s = specifier.replace(/\\/g, '/')
  return (
    /(?:^|\/)fx-rates(?:\.[cm]?[jt]s)?$/.test(s) ||
    /(?:^|\/)api\/fx-rates/.test(s)
  )
}

const IMPORT_SPECIFIER_PATTERNS: RegExp[] = [
  /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+\s+from\s+)['"]([^'"]+)['"]/g,
  /import\s+['"]([^'"]+)['"]/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

export function extractModuleSpecifiers(source: string): string[] {
  const found = new Set<string>()
  for (const re of IMPORT_SPECIFIER_PATTERNS) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(source)) !== null) {
      found.add(m[1])
    }
  }
  return [...found]
}

function resolveRelativeImport(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const dir = path.dirname(fromFile)
  let target = path.resolve(dir, specifier)
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target
  for (const ext of ['.ts', '.tsx', '.mts', '.cts']) {
    const withExt = target + ext
    if (fs.existsSync(withExt)) return withExt
  }
  const indexTs = path.join(target, 'index.ts')
  if (fs.existsSync(indexTs)) return indexTs
  return target.endsWith('.ts') || target.endsWith('.tsx') ? target : target + '.ts'
}

export function isAllowlistedPublicZarTextImport(
  specifier: string,
  fromFile: string
): boolean {
  const normalized = specifier.replace(/\\/g, '/')
  if (!/(?:^|\/)publicZarText(?:\.ts)?$/.test(normalized)) return false
  for (const marker of FORBIDDEN_SPECIFIER_MARKERS) {
    if (normalized.includes(marker)) return false
  }
  const resolved = resolveRelativeImport(fromFile, specifier)
  if (!resolved) return false
  return path.normalize(resolved) === path.normalize(PUBLIC_ZAR_TEXT_PATH)
}

export function isForbiddenModuleSpecifier(
  specifier: string,
  fromFile: string
): boolean {
  if (isAllowlistedPublicZarTextImport(specifier, fromFile)) return false

  const normalized = specifier.replace(/\\/g, '/')
  for (const marker of FORBIDDEN_SPECIFIER_MARKERS) {
    if (normalized.includes(marker)) return true
  }
  if (specifierLooksLikeFxRatesModule(normalized)) return true
  return false
}

/** True if any import/require/dynamic import in source hits display currency / FX (except publicZarText). */
export function sourceHasForbiddenDisplayCurrencyImport(
  source: string,
  fromFile: string
): boolean {
  for (const spec of extractModuleSpecifiers(source)) {
    if (isForbiddenModuleSpecifier(spec, fromFile)) return true
  }
  return false
}

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
  PUBLIC_ZAR_TEXT_PATH,
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
    !sourceHasForbiddenDisplayCurrencyImport(src, filePath),
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

function assertPublicZarTextIsolated() {
  assert.ok(fs.existsSync(PUBLIC_ZAR_TEXT_PATH), 'publicZarText.ts must exist')
  const src = fs.readFileSync(PUBLIC_ZAR_TEXT_PATH, 'utf8')
  assert.ok(
    !sourceHasForbiddenDisplayCurrencyImport(src, PUBLIC_ZAR_TEXT_PATH),
    'publicZarText.ts must not import displayCurrency or FX modules'
  )
  assert.equal(
    extractModuleSpecifiers(src).length,
    0,
    'publicZarText.ts should have no module imports'
  )
}

function negativeSelfTest() {
  const catalogFile = path.join(root, 'client/src/data/catalogFloors.ts')

  const mustFlag: { sample: string; fromFile?: string }[] = [
    { sample: "import x from '@/lib/displayCurrency'" },
    { sample: "import x from '../displayCurrency/'" },
    { sample: "import x from './displayCurrency/formatPublicPrice'" },
    {
      sample:
        "export { formatPublicZarAmount } from '../lib/displayCurrency/formatPublicPrice'",
    },
    { sample: "import '../lib/displayCurrency/DisplayCurrencyContext'" },
    { sample: "const fx = require('booking-app/lib/display-currency-fx')" },
    {
      sample:
        "const ctx = await import('../../../client/src/lib/displayCurrency/DisplayCurrencyContext')",
    },
    { sample: "import { parseEcbDailyXml } from '../../lib/display-currency-fx'" },
    { sample: "import handler from '../api/fx-rates.ts'" },
  ]

  for (const { sample, fromFile } of mustFlag) {
    const file = fromFile ?? path.join(root, 'client/src/lib/pricing.ts')
    const hit = extractModuleSpecifiers(sample).some((spec) =>
      isForbiddenModuleSpecifier(spec, file)
    )
    assert.ok(hit, `checker should flag: ${sample}`)
  }

  const mustPass: { sample: string; fromFile: string }[] = [
    {
      sample: "import { formatPublicFromOneGuest } from '../lib/publicZarText'",
      fromFile: catalogFile,
    },
    {
      sample: "import { startingFromCents, formatZar } from '../lib/pricing'",
      fromFile: catalogFile,
    },
  ]

  for (const { sample, fromFile } of mustPass) {
    for (const spec of extractModuleSpecifiers(sample)) {
      assert.ok(
        !isForbiddenModuleSpecifier(spec, fromFile),
        `checker should allow: ${sample} (specifier ${spec})`
      )
    }
  }
}

function main() {
  negativeSelfTest()
  assertPublicZarTextIsolated()
  for (const r of scanRoots) walk(r)
  for (const f of payloadBuilderFiles) {
    assert.ok(fs.existsSync(f), `missing ${f}`)
    scanFile(f)
  }
  console.log('display-currency-import-direction-unit: ok')
}

main()
