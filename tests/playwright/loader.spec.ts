// TC-025 (loader, PRD F-12) and TC-026 (hero entrance). These tests opt in to a first
// visit of the session; every other spec starts as a returning visit (fixtures.ts).
// Timing probes poll on a 10 ms interval, not on animation frames, so a busy machine
// delaying frames does not skew the measured times.
import type { Page } from '@playwright/test'
import { LOADER_MAX_MS, LOADER_SESSION_KEY } from '../../lib/loader'
import { DUR } from '../../lib/motion'
import { expect, test } from './fixtures'

test.use({ showLoader: true })

// A fresh browser's first page load waits ~1.5 s for its first frame (Playwright cold
// start, not the page). Warm the worker's browser so the timing tests measure the page.
test.beforeAll(async ({ browser }, workerInfo) => {
  const warm = await browser.newPage({ baseURL: workerInfo.project.use.baseURL })
  await warm.goto('/')
  await warm.close()
})

const POLL = { polling: 10, timeout: 5_000 }
const overlay = (page: Page) => page.locator('.loader-overlay')
const flagged = (page: Page) =>
  page.evaluate(() => document.documentElement.hasAttribute('data-loader'))

/**
 * When JS took over the overlay (`data-loader="js"`), in ms since navigation start, or
 * -1 when hydration landed after the 1.5 s cap and the CSS failsafe ended the hold.
 */
async function takeoverAt(page: Page): Promise<number> {
  const handle = await page.waitForFunction(
    (cap) => {
      const state = document.documentElement?.getAttribute('data-loader')
      if (state === 'js') return performance.now()
      return performance.now() > cap ? -1 : 0
    },
    LOADER_MAX_MS,
    POLL,
  )
  return (await handle.jsonValue()) as number
}

/** When the overlay started leaving: JS exit (pointer-events none) or the CSS fade. */
async function leftAt(page: Page): Promise<number> {
  const handle = await page.waitForFunction(
    () => {
      const node = document.querySelector('.loader-overlay')
      if (!node) return 0
      const style = getComputedStyle(node)
      const leaving = style.pointerEvents === 'none' || Number(style.opacity) < 1
      return leaving ? performance.now() : 0
    },
    undefined,
    POLL,
  )
  return (await handle.jsonValue()) as number
}

/** Holds the hero portrait's response so the loader has to wait for it. */
async function delayPortrait(page: Page, ms: number): Promise<void> {
  await page.route(/kenny-hero-crop-color/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms))
    await route.continue()
  })
}

test('first visit shows the loader, which leaves on its own and never returns this session', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'commit' })
  await expect(overlay(page)).toBeVisible()
  // Gone after at most the 1.5 s hold plus the 1 s exit.
  await expect(overlay(page)).toBeHidden({ timeout: LOADER_MAX_MS + DUR.slow * 1000 + 1_000 })
  expect(await page.evaluate((key) => sessionStorage.getItem(key), LOADER_SESSION_KEY)).toBe('1')
  // Fixed overlay with a fixed-width counter: nothing inside it shifts, and the page stays
  // well under the CLS budget.
  const shifts = await page.evaluate(
    () =>
      new Promise<{ total: number; fromOverlay: number }>((resolve) => {
        type Shift = PerformanceEntry & {
          value: number
          sources: { node?: Node | null }[]
        }
        let total = 0
        let fromOverlay = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Shift[]) {
            total += entry.value
            const inOverlay = entry.sources.some(
              (source) =>
                source.node instanceof Element && source.node.closest('.loader-overlay') !== null,
            )
            if (inOverlay) fromOverlay += entry.value
          }
        }).observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => resolve({ total, fromOverlay }), 100)
      }),
  )
  expect(shifts.fromOverlay).toBe(0)
  expect(shifts.total).toBeLessThan(0.1)

  await page.reload({ waitUntil: 'commit' })
  await page.waitForLoadState('domcontentloaded')
  expect(await flagged(page)).toBe(false)
  await expect(overlay(page)).toBeHidden()
})

test('a key press skips the hold', async ({ page }) => {
  await delayPortrait(page, 4_000)
  await page.goto('/', { waitUntil: 'commit' })
  const tookOver = await takeoverAt(page)
  test.skip(
    tookOver < 0 || tookOver > LOADER_MAX_MS - 300,
    'hydrated too close to the 1.5 s cap to prove a skip',
  )
  await page.keyboard.press('Shift')
  // The exit starts on the key, long before the portrait (held 4 s) or the 1.5 s cap.
  expect(await leftAt(page)).toBeLessThan(LOADER_MAX_MS)
})

test('the hold never exceeds 1.5 s, even while the portrait is still loading', async ({ page }) => {
  await delayPortrait(page, 4_000)
  await page.goto('/', { waitUntil: 'commit' })
  const left = await leftAt(page)
  test.info().annotations.push({ type: 'loader-left-at', description: `${Math.round(left)} ms` })
  // JS exit or CSS failsafe, long before the portrait arrives at 4 s; the tolerance
  // covers a machine starved by the whole suite running in parallel.
  expect(left).toBeLessThan(LOADER_MAX_MS + 500)
})

test('the hero enters as the loader lifts and settles with no leftover styles', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'commit' })
  const tookOver = await takeoverAt(page)
  test.skip(tookOver < 0, 'hydrated after the cap: the CSS failsafe ends the hold, no entrance')
  const portrait = page.locator('#hero-portrait')
  await leftAt(page)
  // Mid-entrance the portrait is still fading in.
  expect(Number(await portrait.evaluate((img) => getComputedStyle(img).opacity))).toBeLessThan(1)
  await expect(overlay(page)).toBeHidden({ timeout: 3_000 })
  await expect(portrait).toHaveCSS('opacity', '1')
  await expect(portrait).toHaveCSS('transform', 'none')
  // Tailwind's centring (`translate` property) is untouched by the entrance.
  await expect(portrait).not.toHaveCSS('translate', 'none')
  await expect(page.locator('[data-hero-stagger]').first()).toHaveCSS('opacity', '1')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('no loader and no entrance', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' })
    await page.waitForLoadState('domcontentloaded')
    expect(await flagged(page)).toBe(false)
    await expect(overlay(page)).toBeHidden()
    await expect(page.locator('#hero-portrait')).toHaveCSS('opacity', '1')
  })
})
