import { expect, type Page, type ViewportSize } from '@playwright/test'
import en from '../../content/en'
import id from '../../content/id'

/**
 * Layout conditions keyed on the viewport, not on a project name, so every browser project at
 * that size runs the test (M5): Chromium, Firefox and WebKit at 1440 and 390. In the Chromium
 * `desktop` and `mobile` projects they give the same answers the old name checks did.
 */
/** Below Tailwind's md breakpoint (48rem): the header shows only the hamburger, marquees run at 28 s. */
export const belowMd = (viewport: ViewportSize | null): boolean => (viewport?.width ?? 0) < 768
/** From Tailwind's lg breakpoint (64rem): stacked cards, the 3D gate's viewport condition. */
export const wide = (viewport: ViewportSize | null): boolean => (viewport?.width ?? 0) >= 1024

/**
 * Whether Tab moves focus to links. Safari skips links on Tab unless the visitor turns on "Press
 * Tab to highlight each item", and Playwright's WebKit on Windows and macOS does the same; its
 * Linux build (CI) tabs to links like Chromium and Firefox. A browser setting, not the site's.
 */
export const tabsToLinks = (browserName: string): boolean =>
  browserName !== 'webkit' || process.platform === 'linux'

/**
 * The desktop paths assume a mouse: the 3D gate needs `(pointer: fine)` and Tailwind's `hover:`
 * needs `(hover: hover)`. Headless Chromium forces both; Firefox and WebKit report their own, so a
 * desktop test states them first and a harness without them fails here, by name, not later.
 */
export async function expectDesktopPointer(page: Page): Promise<void> {
  const media = await page.evaluate(() => ({
    fine: matchMedia('(pointer: fine)').matches,
    hover: matchMedia('(hover: hover)').matches,
  }))
  expect(media, 'the browser reports a mouse: (pointer: fine) and (hover: hover)').toEqual({
    fine: true,
    hover: true,
  })
}

/**
 * Switches the language with the EN / ID toggle. On mobile the toggle lives
 * inside the menu overlay, so the menu is opened first and closed with Esc.
 */
export async function selectLang(page: Page, code: 'EN' | 'ID'): Promise<void> {
  // The button is labelled in the current language.
  const menuButton = page
    .getByRole('button', { name: en.nav.openMenu })
    .or(page.getByRole('button', { name: id.nav.openMenu }))
  const viaMenu = await menuButton.isVisible()
  if (viaMenu) await menuButton.click()
  await page.getByRole('button', { name: code, exact: true }).click()
  if (viaMenu) await page.keyboard.press('Escape')
}

/**
 * Scrolls through the whole page so every once-only reveal fires, waits until they
 * have all finished (labels/headings opaque, the Intro statement's split reverted),
 * then returns to the top. Use before full-page captures and axe scans, which would
 * otherwise see below-the-fold content at opacity 0.
 */
export async function revealAll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6)
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
  })
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('[data-reveal]')).every(
        (element) => getComputedStyle(element).opacity === '1',
      ) && document.querySelector('#intro-statement div') === null,
    undefined,
    { timeout: 10_000 },
  )
  await page.evaluate(() => window.scrollTo(0, 0))
  // Back at the top the nav's backdrop fades out (observer, then a CSS transition) and the
  // stacked cards recover; a scan during either reads blended colours and fails on contrast.
  await page.waitForFunction(
    () =>
      !document.querySelector('header')?.classList.contains('surface-dark-glass') &&
      document.getAnimations().every((animation) => !(animation instanceof CSSTransition)) &&
      Array.from(document.querySelectorAll('.stack-card')).every(
        (card) => getComputedStyle(card).opacity === '1',
      ),
    undefined,
    { timeout: 10_000 },
  )
}

/**
 * On a busy main thread an IntersectionObserver delivers several changes in one callback, oldest
 * first. This reproduces it: callbacks are held until 200 ms pass without a new change. Call
 * before `goto`.
 */
export async function batchIntersectionChanges(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const Real = window.IntersectionObserver
    window.IntersectionObserver = class extends Real {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        let held: IntersectionObserverEntry[] = []
        let timer = 0
        super((entries, observer) => {
          held.push(...entries)
          window.clearTimeout(timer)
          timer = window.setTimeout(() => {
            const batch = held
            held = []
            callback(batch, observer)
          }, 200)
        }, options)
      }
    }
  })
}

/** Scrolls `selector` off-screen and back within a batch, then waits for it to be delivered. */
export async function scrollOutAndBack(page: Page, selector: string): Promise<void> {
  await page.evaluate(async (target) => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
    window.scrollTo(0, 0)
    await frame()
    await frame()
    document.querySelector(target)!.scrollIntoView({ block: 'center' })
    await frame()
    await frame()
  }, selector)
  await page.waitForTimeout(500)
}

/**
 * Where the WebGL ticker stands against the frozen HTML track, in px on the circle of one copy group
 * (TC-055): 0 when the WebGL copy took the name over exactly where the HTML marquee stood.
 * `unitDelta` is the last glyph of a unit, WebGL against HTML.
 */
export async function tickerPhaseOffset(
  page: Page,
): Promise<{ offset: number; unitDelta: number; detail: string }> {
  const phase = await page.evaluate(() => {
    const track = document.querySelector('#top [data-marquee]')!.firstElementChild!
    const groups = track.children
    const layer = document.querySelector('[data-three]')!
    return {
      group: groups[1].getBoundingClientRect().left - groups[0].getBoundingClientRect().left,
      html: new DOMMatrix(getComputedStyle(track).transform).m41,
      webgl: Number(layer.getAttribute('data-phase')),
      unitDelta: Number(layer.getAttribute('data-unit-delta')),
    }
  })
  const distance = Math.abs(phase.webgl - phase.html) % phase.group
  return {
    offset: Math.min(distance, phase.group - distance),
    unitDelta: phase.unitDelta,
    detail: JSON.stringify(phase),
  }
}

/** True when the page cannot be scrolled sideways (DESIGN §8). */
export function hasNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )
}
