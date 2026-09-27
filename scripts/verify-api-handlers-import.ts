/**
 * Post-build sanity: every api/*.ts handler imports; booking-app/lib files exist.
 * Run: npx tsx scripts/verify-api-handlers-import.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

process.env.BOOKING_MOCK = '1'

const root = path.join(process.cwd())
const apiDir = path.join(root, 'api')
const libDir = path.join(root, 'booking-app/lib')

const requiredLib = [
  'booking-lifecycle.ts',
  'notify.ts',
  'pricing.ts',
  'mock-store.ts',
  'yoco.ts',
  'email-outbox.ts',
  'driver-reminders.ts',
  'seasonalVisibility.ts',
]

async function main() {
  for (const name of requiredLib) {
    const p = path.join(libDir, name)
    assert.ok(fs.existsSync(p), `missing ${p}`)
  }

  const entries = fs
    .readdirSync(apiDir)
    .filter((f) => f.endsWith('.ts') && !f.startsWith('_'))

  assert.ok(entries.length >= 8, 'expected api handlers')

  for (const file of entries) {
    const mod = await import(path.join(apiDir, file))
    assert.ok(
      typeof mod.default === 'function',
      `${file} must default-export a handler`
    )
  }

  const apiSources = entries
    .map((f) => fs.readFileSync(path.join(apiDir, f), 'utf8'))
    .join('\n')
  assert.ok(
    !/import\s*\(\s*['"]\.\.\/booking-app\/lib/.test(apiSources),
    'api handlers must not dynamic-import booking-app/lib (use static imports for bundling)'
  )

  console.log(`verify-api-handlers-import: ok (${entries.length} handlers)`)
}

void main().catch((e) => {
  console.error(e)
  process.exit(1)
})
