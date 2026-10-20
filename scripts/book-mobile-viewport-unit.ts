/**
 * Mobile /book layout: cookie bar, sticky Continue bar, and experience cards (no overlap).
 * Run: npx tsx scripts/book-mobile-viewport-unit.ts
 *
 * Requires: client devDependencies (vite) and playwright chromium (`npx playwright install chromium`).
 */
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright'
import { mockDb } from '../booking-app/lib/mock-store.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_ROOT = path.join(__dirname, '..', 'client')

const FX_BODY = {
  rates: {
    fetchedAt: new Date().toISOString(),
    perEur: { EUR: 1, ZAR: 20.5, USD: 1.08, GBP: 0.86 },
  },
}

function normalizeBox(box: { x: number; y: number; width: number; height: number }) {
  return {
    left: box.x,
    right: box.x + box.width,
    top: box.y,
    bottom: box.y + box.height,
  }
}

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  const ra = normalizeBox(a)
  const rb = normalizeBox(b)
  return !(
    ra.right <= rb.left ||
    ra.left >= rb.right ||
    ra.bottom <= rb.top ||
    ra.top >= rb.bottom
  )
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume()
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
            resolve()
          } else {
            reject(new Error(`status ${res.statusCode}`))
          }
        })
        req.on('error', reject)
        req.setTimeout(2_000, () => {
          req.destroy()
          reject(new Error('timeout'))
        })
      })
      return
    } catch {
      await new Promise((r) => setTimeout(r, 400))
    }
  }
  throw new Error(`Server did not become ready: ${url}`)
}

function startVite(port: number): ChildProcess {
  return spawn(
    'npx',
    ['vite', '--port', String(port), '--host', '127.0.0.1', '--strictPort'],
    {
      cwd: CLIENT_ROOT,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '0' },
    }
  )
}

async function mockBookApis(page: Page) {
  const catalog = mockDb.catalog()
  await page.route('**/api/catalog**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...catalog, yoco_public_key: null }),
    })
  })
  await page.route('**/api/fx-rates**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FX_BODY),
    })
  })
  await page.route('**/api/consent-form**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ form: null }),
    })
  })
}

async function assertBookLayout(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height })
  await page.goto('/book', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.removeItem('cookie_consent')
    localStorage.setItem('khayrcape_display_currency', 'USD')
  })
  await page.reload({ waitUntil: 'networkidle' })

  const cookie = page.getByRole('dialog', { name: 'Cookie notice' })
  await cookie.waitFor({ state: 'visible', timeout: 15_000 })

  const sticky = page.getByTestId('book-mobile-sticky-bar')
  await sticky.waitFor({ state: 'visible', timeout: 15_000 })

  await page.waitForFunction(() => {
    const dock = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--cookie-dock-height'
      )
    )
    const bar = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--book-mobile-bar-height'
      )
    )
    return dock > 24 && bar > 40
  })

  const cookieBox = await cookie.boundingBox()
  const stickyBox = await sticky.boundingBox()
  assert.ok(cookieBox, `cookie banner missing at ${width}x${height}`)
  assert.ok(stickyBox, `sticky bar missing at ${width}x${height}`)

  assert.ok(
    !rectsOverlap(cookieBox, stickyBox),
    `cookie banner overlaps sticky bar at ${width}x${height}`
  )
  const stickyBottom = stickyBox.y + stickyBox.height
  assert.ok(
    Math.abs(stickyBottom - cookieBox.y) < 2,
    `sticky bar should sit directly above cookie banner at ${width}x${height}`
  )

  const cards = page.locator('fieldset button[type="button"]')
  const count = await cards.count()
  assert.ok(count > 0, 'expected experience cards on step 0')
  const lastCard = cards.nth(count - 1)
  await lastCard.evaluate((el) => {
    const bar = document.querySelector('[data-testid="book-mobile-sticky-bar"]')
    const barRect = bar?.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    if (!barRect) {
      el.scrollIntoView({ block: 'end' })
      return
    }
    const overlap = rect.bottom - barRect.top
    if (overlap > 0) {
      window.scrollBy({ top: overlap + 12, behavior: 'instant' as ScrollBehavior })
    }
  })

  const lastBox = await lastCard.boundingBox()
  assert.ok(lastBox, 'last experience card has no layout box')
  const stickyTop = stickyBox.y
  const lastBottom = lastBox.y + lastBox.height
  assert.ok(
    lastBottom <= stickyTop + 2,
    `last card hidden behind sticky bar at ${width}x${height} (card bottom ${lastBottom}, bar top ${stickyTop})`
  )

  const barHeightVar = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue(
      '--book-mobile-bar-height'
    )
  )
  assert.ok(
    parseFloat(barHeightVar) > 40,
    `--book-mobile-bar-height should reflect measured bar (${barHeightVar})`
  )
}

async function main() {
  const port = 4500 + Math.floor(Math.random() * 500)
  const baseUrl = `http://127.0.0.1:${port}`
  const child = startVite(port)
  child.stderr?.on('data', (chunk) => {
    const text = String(chunk)
    if (text.toLowerCase().includes('error')) {
      console.error(text)
    }
  })

  try {
    await waitForServer(baseUrl)
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ baseURL: baseUrl })
    const page = await context.newPage()
    await mockBookApis(page)

    for (const [width, height] of [
      [360, 640],
      [390, 844],
    ] as const) {
      await assertBookLayout(page, width, height)
    }

    await browser.close()
    console.log('book-mobile-viewport-unit: ok')
  } finally {
    child.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
