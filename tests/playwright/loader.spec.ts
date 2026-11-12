// TC-025 (loader, PRD F-12) and TC-026 (hero entrance). These tests opt in to a first
// visit of the session; every other spec starts as a returning visit (fixtures.ts).
// Timing probes poll on a 10 ms interval, not on animation frames, so a busy machine
// delaying frames does not skew the measured times.
import type { Page } from '@playwright/test'
import { LOADER_MAX_MS, LOADER_SESSION_KEY } from '../../lib/loader'
import { DUR } from '../../lib/motion'
import { expect, saveDataScript, test } from './fixtures'

test.use({ showLoader: true })

// A fresh browser's first page load waits ~1.5 s for its first frame (Playwright cold
// start, not the page). Warm the worker's browser so the timing tests measure the page.
// The warm-up page bypasses the fixture, so it keeps the 3D layer off itself.
test.beforeAll(async ({ browser }, workerInfo) => {
  const warm = await browser.newPage({ baseURL: workerInfo.project.use.baseURL })
  await warm.addInitScript(saveDataScript)
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

/**
 * Records, in the page, the exact moment the overlay starts leaving by either route,
 * independent of how late a busy main thread gets to observe it: the JS exit (its
 * inline `pointer-events: none`, caught by a MutationObserver as it is written; also
 * kept as `jsExitAt`) or the CSS cap (its fade's start time plus delay, read on
 * `animationstart`).
 */
async function recordLeaving(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const store = window as unknown as { leftAt?: number; jsExitAt?: number }
    const mark = (time: number) => {
      if (store.leftAt === undefined || time < store.leftAt) store.leftAt = time
    }
    new MutationObserver(() => {
      const node = document.querySelector<HTMLElement>('.loader-overlay')
      if (node?.style.pointerEvents === 'none' && store.jsExitAt === undefined) {
        store.jsExitAt = performance.now()
        mark(store.jsExitAt)
      }
    }).observe(document, { attributes: true, attributeFilter: ['style'], subtree: true })
    document.addEventListener(
      'animationstart',
      (event) => {
        if (event.animationName !== 'loader-failsafe') return
        const animation = (event.target as Element)
          .getAnimations()
          .find((item) => (item as CSSAnimation).animationName === 'loader-failsafe')
        const delay = Number(animation?.effect?.getTiming().delay ?? 0)
        if (animation?.startTime != null) mark(Number(animation.startTime) + delay)
      },
      true,
    )
  })
}

async function leftAt(page: Page): Promise<number> {
  const handle = await page.waitForFunction(
    () => (window as unknown as { leftAt?: number }).leftAt,
    undefined,
    POLL,
  )
  return (await handle.jsonValue()) as number
}

/** Records the lowest inline opacity GSAP gives the hero portrait (the entrance's from-state). */
async function recordPortraitOpacity(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const store = window as unknown as { portraitMin?: number }
    new MutationObserver((records) => {
      for (const record of records) {
        const node = record.target as HTMLElement
        if (node.id !== 'hero-portrait' || node.style.opacity === '') continue
        store.portraitMin = Math.min(store.portraitMin ?? 1, Number(node.style.opacity))
      }
    }).observe(document, { attributes: true, attributeFilter: ['style'], subtree: true })
  })
}

/**
 * Holds the hero portrait's response so the loader has to wait for it. Matched by folder,
 * not by file name (the hero is the only image under /images/portrait, as in three.spec.ts),
 * so a renamed portrait cannot silently stop the hold. Returns how many requests were held:
 * each test checks it, so the hold is proven to have happened.
 */
async function delayPortrait(page: Page, ms: number): Promise<() => number> {
  let held = 0
  await page.route(/\/_next\/image\?url=%2Fimages%2Fportrait%2F/, async (route) => {
    held += 1
    await new Promise((resolve) => setTimeout(resolve, ms))
    await route.continue()
  })
  return () => held
}

test('first visit shows the loader, which leaves on its own and never returns this session', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'commit' })
  await expect(overlay(page)).toBeVisible()
  // First in <body>, ahead of the hero, so it exists before any content can paint.
  const overlayFirst = await page.evaluate(
    () =>
      document
        .querySelector('.loader-overlay')!
        .compareDocumentPosition(document.getElementById('top')!) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  )
  expect(overlayFirst).toBeTruthy()
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
  const held = await delayPortrait(page, 4_000)
  await recordLeaving(page)
  await page.goto('/', { waitUntil: 'commit' })
  const tookOver = await takeoverAt(page)
  test.skip(
    tookOver < 0 || tookOver > LOADER_MAX_MS - 300,
    'hydrated too close to the 1.5 s cap to prove a skip',
  )
  await page.keyboard.press('Shift')
  // The exit starts on the key, long before the portrait (held 4 s) or the 1.5 s cap.
  expect(await leftAt(page)).toBeLessThan(LOADER_MAX_MS)
  expect(held(), 'the hero portrait request was held').toBeGreaterThan(0)
})

test('the hold never exceeds 1.5 s, even while the portrait is still loading', async ({ page }) => {
  const held = await delayPortrait(page, 4_000)
  await recordLeaving(page)
  await page.goto('/', { waitUntil: 'commit' })
  if ((await takeoverAt(page)) > 0) {
    // JS taking over the hold must not disarm the CSS cap.
    const running = await overlay(page).evaluate((node) =>
      node.getAnimations().map((animation) => (animation as CSSAnimation).animationName),
    )
    expect(running).toContain('loader-failsafe')
  }
  const left = await leftAt(page)
  test.info().annotations.push({ type: 'loader-left-at', description: `${Math.round(left)} ms` })
  // JS exit or CSS cap, long before the portrait arrives at 4 s. The target is 1.5 s;
  // the tolerance covers a first frame delayed by the whole suite running in parallel
  // (docs/DECISIONS.md, loader cap).
  expect(left).toBeLessThan(LOADER_MAX_MS + 500)
  expect(held(), 'the hero portrait request was held').toBeGreaterThan(0)
})

test('without any JS, the CSS cap alone lifts the overlay at 1.5 s', async ({ page }) => {
  // No hydration at all: every script chunk fails (the pre-paint script is inline).
  await page.route(/\/_next\/static\/.*\.js/, (route) => route.abort())
  await page.goto('/', { waitUntil: 'commit' })
  await expect(overlay(page)).toBeVisible()
  // Hidden once the fade is over (visibility), about 1.5 s + 0.6 s after navigation.
  await expect(overlay(page)).toBeHidden({ timeout: LOADER_MAX_MS + DUR.base * 1000 + 2_000 })
  const state = await page.evaluate(() => {
    const node = document.querySelector<HTMLElement>('.loader-overlay')!
    const style = getComputedStyle(node)
    const fade = node
      .getAnimations()
      .find((animation) => (animation as CSSAnimation).animationName === 'loader-failsafe')
    const delay = Number(fade?.effect?.getTiming().delay ?? 0)
    return {
      flag: document.documentElement.getAttribute('data-loader'),
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      fadeStartsAt: fade?.startTime == null ? null : Number(fade.startTime) + delay,
      blocksClicks:
        document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.loader-overlay') !==
        null,
    }
  })
  expect(state.flag, 'JS never took over').toBe('')
  expect(state.opacity).toBe('0')
  expect(state.pointerEvents).toBe('none')
  expect(state.blocksClicks).toBe(false)
  expect(state.fadeStartsAt).toBeLessThan(LOADER_MAX_MS + 500)
})

type TraceEvent = {
  name: string
  ph: string
  id2?: { local?: string }
  args?: { data?: { displayName?: string; compositeFailed?: number } }
}

test("the cap's fade runs on the compositor, independent of the main thread", async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'compositing does not depend on the viewport')
  const held = await delayPortrait(page, 4_000)
  await browser.startTracing(page, {
    categories: ['blink.animations', 'devtools.timeline', 'disabled-by-default-devtools.timeline'],
  })
  await page.goto('/', { waitUntil: 'commit' })
  await expect(overlay(page)).toBeVisible()
  await expect(overlay(page)).toBeHidden({ timeout: LOADER_MAX_MS + DUR.slow * 1000 + 2_000 })
  const { traceEvents } = JSON.parse((await browser.stopTracing()).toString()) as {
    traceEvents: TraceEvent[]
  }
  // Chrome logs every CSS animation it starts, and why it could not composite one.
  const animations = traceEvents.filter((event) => event.name === 'Animation')
  const idOf = (name: string) =>
    animations.find((event) => event.ph === 'b' && event.args?.data?.displayName === name)?.id2
      ?.local
  const compositeFailures = (id: string | undefined) =>
    animations.filter((event) => event.id2?.local === id && event.args?.data?.compositeFailed)
  const [fade, release] = [idOf('loader-failsafe'), idOf('loader-release')]
  expect(fade).toBeDefined()
  expect(release).toBeDefined()
  // Control: the discrete half (visibility) cannot be composited, and the trace says so …
  expect(compositeFailures(release).length).toBeGreaterThan(0)
  // … while the opacity fade never reports a failure.
  expect(compositeFailures(fade)).toEqual([])
  expect(held(), 'the hero portrait request was held').toBeGreaterThan(0)
})

test('the hero enters as the loader lifts and settles with no leftover styles', async ({
  page,
}) => {
  await recordLeaving(page)
  await recordPortraitOpacity(page)
  await page.goto('/', { waitUntil: 'commit' })
  await expect(overlay(page)).toBeHidden({ timeout: 5_000 })
  const { jsExitAt, portraitMin } = await page.evaluate(() => {
    const store = window as unknown as { jsExitAt?: number; portraitMin?: number }
    return { jsExitAt: store.jsExitAt, portraitMin: store.portraitMin }
  })
  test.skip(
    jsExitAt === undefined,
    'the CSS cap lifted the overlay before JS could: no slide, no entrance by design',
  )
  // The entrance ran: GSAP started the portrait from a lower opacity …
  expect(portraitMin).toBeLessThan(1)
  // … and left nothing behind.
  const portrait = page.locator('#hero-portrait')
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
