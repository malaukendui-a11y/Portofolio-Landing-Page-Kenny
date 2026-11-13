// M3, the 3D hero (PRD F-03 / F-04, DESIGN §6, CLAUDE.md rules 3–5, 8, 10): TC-053 … TC-069.
// Untagged tests run in `desktop` / `mobile` and check the paths without a canvas. `@3d` tests run
// in the `desktop-3d` project (playwright.config.ts) with WebGL2, on SwiftShader in headless
// Chromium: they skip locally when WebGL2 is missing and fail in CI, so CI can never pass
// without having rendered the scene. An init script records every `data-three` change with its
// time, counts WebGL2 draw calls and WebGL context requests, and notes when the loader left.
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import type { Page } from '@playwright/test'
import en from '../../content/en'
import id from '../../content/id'
import { expect, test, type WebGL2Support } from './fixtures'
import {
  batchIntersectionChanges,
  expectDesktopPointer,
  hasNoHorizontalOverflow,
  selectLang,
  tickerPhaseOffset,
  wide,
} from './helpers'

declare global {
  interface Window {
    __three: Array<[number, string | null]>
    __draws: number
    __contexts: number
    __loaderGone: number | null
    __canvasAt: number | null
    __suspendedSeen: boolean
    __lose?: WEBGL_lose_context
    __lostAt?: number
  }
}

test.use({ three: true })

const LAYER = '[data-three]'
const TICKER = '#top [data-marquee]'
const FALLBACK_IMG = '#top .glass-fallback'
const MB = 1024 * 1024
const KB = 1024

async function instrument(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Init scripts run before <html> exists: everything below reads the DOM lazily.
    window.__three = []
    window.__draws = 0
    window.__contexts = 0
    window.__loaderGone = null
    window.__canvasAt = null
    window.__suspendedSeen = false
    let sawLoader = false
    const proto = WebGL2RenderingContext.prototype as unknown as Record<string, unknown>
    for (const name of [
      'drawArrays',
      'drawElements',
      'drawArraysInstanced',
      'drawElementsInstanced',
      'drawRangeElements',
    ]) {
      const original = proto[name] as (...args: unknown[]) => unknown
      proto[name] = function (this: unknown, ...args: unknown[]) {
        window.__draws += 1
        return original.apply(this, args)
      }
    }
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type === 'webgl' || type === 'webgl2') window.__contexts += 1
      return (getContext as (...args: unknown[]) => unknown).call(this, type, ...rest)
    } as typeof getContext
    new MutationObserver(() => {
      const value = document.querySelector('[data-three]')?.getAttribute('data-three') ?? null
      const last = window.__three[window.__three.length - 1]
      if (!last || last[1] !== value) window.__three.push([performance.now(), value])
      // The loader's departure: `<html data-loader>` seen, then gone.
      const loader = document.documentElement?.hasAttribute('data-loader') ?? false
      if (loader) sawLoader = true
      if (window.__loaderGone === null && sawLoader && !loader) {
        window.__loaderGone = performance.now()
      }
      if (window.__canvasAt === null && document.querySelector('[data-three] canvas')) {
        window.__canvasAt = performance.now()
      }
      if (document.querySelector('#top [data-marquee][data-suspended]')) {
        window.__suspendedSeen = true
      }
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-three', 'data-loader', 'data-suspended'],
    })
  })
}

/** Collects console errors, THREE warnings and page errors. */
function watchConsole(page: Page) {
  const errors: string[] = []
  const threeWarnings: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (/THREE\.|Shader Error/.test(message.text())) threeWarnings.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  return { errors, threeWarnings, pageErrors }
}

/** Mount tests need WebGL2: skip locally without it, fail in CI. */
function requireWebGL2(webgl2: WebGL2Support): void {
  test.info().annotations.push({ type: 'webgl2', description: webgl2.renderer ?? 'unavailable' })
  if (process.env.CI) expect(webgl2.available, 'CI must provide WebGL2 (SwiftShader)').toBe(true)
  test.skip(!webgl2.available, 'this browser has no WebGL2')
}

/** Loads `/` and waits until the WebGL ticker has taken over from the HTML marquee. */
async function gotoReady(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'ready', { timeout: 30_000 })
  await expect(page.locator(TICKER)).toHaveAttribute('data-suspended', '')
}

async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value })
    document.dispatchEvent(new Event('visibilitychange'))
  }, hidden)
}

const draws = (page: Page) => page.evaluate(() => window.__draws)
const timeline = (page: Page) => page.evaluate(() => window.__three)
/** The `data-three` values in order (the attribute-less server render left out). */
const states = async (page: Page) =>
  (await timeline(page)).map(([, value]) => value).filter((value) => value !== null)

/** Asserts the static lens is the one showing, loaded and sized. */
async function expectStaticLens(page: Page): Promise<void> {
  const image = page.locator(FALLBACK_IMG)
  await expect(image).toBeVisible()
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true)
  const box = await image.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(0)
  await expect(page.locator('#top canvas')).toHaveCount(0)
}

/** The HTML marquee is on screen and moving (no 3D took it over). */
async function expectHtmlTickerRunning(page: Page): Promise<void> {
  const ticker = page.locator(TICKER)
  await expect(ticker).not.toHaveAttribute('data-suspended')
  await expect(ticker).toHaveCSS('visibility', 'visible')
  await expect(ticker.locator('.marquee-track')).toHaveCSS('animation-play-state', 'running')
}

/** The code points a WOFF font maps (cmap formats 4 and 12). */
function woffCodePoints(font: Buffer): Set<number> {
  if (font.toString('latin1', 0, 4) !== 'wOFF') throw new Error('not a WOFF file')
  let cmap: Buffer | null = null
  for (let i = 0; i < font.readUInt16BE(12); i++) {
    const entry = 44 + i * 20
    if (font.toString('latin1', entry, entry + 4) !== 'cmap') continue
    const offset = font.readUInt32BE(entry + 4)
    const compressed = font.readUInt32BE(entry + 8)
    const data = font.subarray(offset, offset + compressed)
    cmap = compressed < font.readUInt32BE(entry + 12) ? inflateSync(data) : data
  }
  if (!cmap) throw new Error('the font has no cmap')
  const points = new Set<number>()
  for (let i = 0; i < cmap.readUInt16BE(2); i++) {
    const table = cmap.readUInt32BE(4 + i * 8 + 4)
    const format = cmap.readUInt16BE(table)
    if (format === 4) {
      const segX2 = cmap.readUInt16BE(table + 6)
      const ends = table + 14
      const starts = ends + segX2 + 2
      const deltas = starts + segX2
      const ranges = deltas + segX2
      for (let s = 0; s < segX2 / 2; s++) {
        const start = cmap.readUInt16BE(starts + 2 * s)
        const end = cmap.readUInt16BE(ends + 2 * s)
        const delta = cmap.readInt16BE(deltas + 2 * s)
        const range = cmap.readUInt16BE(ranges + 2 * s)
        for (let code = start; code <= end && code !== 0xffff; code++) {
          let glyph =
            range === 0
              ? (code + delta) & 0xffff
              : cmap.readUInt16BE(ranges + 2 * s + range + 2 * (code - start))
          if (range !== 0 && glyph !== 0) glyph = (glyph + delta) & 0xffff
          if (glyph !== 0) points.add(code)
        }
      }
    } else if (format === 12) {
      for (let g = 0; g < cmap.readUInt32BE(table + 12); g++) {
        const group = table + 16 + g * 12
        for (let code = cmap.readUInt32BE(group); code <= cmap.readUInt32BE(group + 4); code++) {
          points.add(code)
        }
      }
    }
  }
  return points
}

// ── Without a canvas ──────────────────────────────────────────────────────────────────────────

test('TC-053 phones get the static lens and download no 3D', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone path')
  await instrument(page)
  const requests: { url: string; type: string; at: number }[] = []
  page.on('request', (request) =>
    requests.push({ url: request.url(), type: request.resourceType(), at: Date.now() }),
  )
  await page.goto('/')
  const loadedAt = Date.now()
  await page.waitForTimeout(3_000)

  await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback')
  await expectStaticLens(page)
  expect(requests.filter((request) => request.url.includes('ticker.woff'))).toEqual([])
  expect(
    requests.filter((request) => request.type === 'script' && request.at > loadedAt),
    'no script after load (the 3D chunk)',
  ).toEqual([])
  expect(await page.evaluate(() => window.__contexts), 'no WebGL context, not even a probe').toBe(0)
  expect(await hasNoHorizontalOverflow(page)).toBe(true)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('TC-054 a desktop under reduced motion keeps the static lens', async ({
    page,
    viewport,
    hasTouch,
  }) => {
    test.skip(!wide(viewport) || hasTouch, 'the desktop reduced-motion path')
    await instrument(page)
    const scripts: number[] = []
    const fonts: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(Date.now())
      if (request.url().includes('ticker.woff')) fonts.push(request.url())
    })
    await page.goto('/')
    const loadedAt = Date.now()
    await page.waitForTimeout(3_000)
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback')
    await expectStaticLens(page)
    expect(scripts.filter((at) => at > loadedAt)).toEqual([])
    expect(fonts).toEqual([])
    expect(await page.evaluate(() => window.__contexts)).toBe(0)
  })
})

test('TC-059 no WebGL2: the static lens, the HTML marquee, a clean console', async ({
  page,
  viewport,
  hasTouch,
}) => {
  test.skip(!wide(viewport) || hasTouch, 'a desktop that would otherwise mount the 3D')
  await expectDesktopPointer(page)
  await instrument(page)
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type === 'webgl2') return null
      return (getContext as (...args: unknown[]) => unknown).call(this, type, ...rest)
    } as typeof getContext
  })
  const log = watchConsole(page)
  await page.goto('/')
  await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback', { timeout: 10_000 })
  await expectStaticLens(page)
  await expectHtmlTickerRunning(page)
  expect(await states(page)).toEqual(['loading', 'fallback'])
  expect(log.pageErrors).toEqual([])
  expect(log.errors).toEqual([])
})

test.describe('WebGL without a GPU', () => {
  // The renderer name of the CI runner and of headless Chromium.
  test.use({
    webglRenderer:
      'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
  })

  test('TC-074 a software renderer keeps the static lens and loads no 3D', async ({
    page,
    viewport,
    hasTouch,
    webgl2,
  }) => {
    test.skip(!wide(viewport) || hasTouch, 'a desktop that would otherwise mount the 3D')
    // The software path needs a WebGL2 context to name its renderer (Playwright's Windows WebKit
    // runs without accelerated compositing and may have none).
    test.skip(!webgl2.available, 'this browser has no WebGL2')
    await expectDesktopPointer(page)
    await instrument(page)
    const scripts: number[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(Date.now())
    })
    const log = watchConsole(page)
    await page.goto('/')
    const loadedAt = Date.now()
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback', {
      timeout: 10_000,
    })
    await page.waitForTimeout(1_000)
    await expectStaticLens(page)
    await expectHtmlTickerRunning(page)
    expect(await states(page)).toEqual(['loading', 'fallback'])
    expect(
      scripts.filter((at) => at > loadedAt),
      'no 3D chunk',
    ).toEqual([])
    expect(
      await page.evaluate(() =>
        performance
          .getEntriesByType('mark')
          .some((mark) => mark.name === 'three:fallback:software'),
      ),
    ).toBe(true)
    expect(log.pageErrors).toEqual([])
    expect(log.errors).toEqual([])
  })
})

test('TC-068 the ticker font covers the marquee unit in both languages', async ({
  browserName,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'a file check, once')
  expect(browserName).toBe('chromium')
  const points = woffCodePoints(readFileSync('public/fonts/InterDisplay-Medium-ticker.woff'))
  for (const name of [en.hero.name, id.hero.name]) {
    // The marquee unit rule from components/hero/Ticker.tsx.
    const unit = /[—–-]\s*$/.test(name) ? name.trim() : `${name} —`
    const missing = Array.from(unit).filter((char) => !points.has(char.codePointAt(0)!))
    expect(missing, `glyphs missing for "${unit}"`).toEqual([])
  }
})

test('TC-069 the glass export route is not served in production', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one request is enough')
  expect((await request.get('/dev/glass-export')).status()).toBe(404)
})

// ── With the canvas (desktop-3d) ──────────────────────────────────────────────────────────────

test.describe('3D hero', () => {
  test.slow() // SwiftShader compiles and renders on the CPU

  test('TC-055 mounts after load and hands the name over in phase @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await instrument(page)
    await page.addInitScript(() => {
      const store = window as unknown as { __shift: number; __longest: number }
      store.__shift = 0
      store.__longest = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          store.__shift += (entry as unknown as { value: number }).value
        }
      }).observe({ type: 'layout-shift', buffered: true })
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          store.__longest = Math.max(store.__longest, entry.duration)
        }
      }).observe({ type: 'longtask', buffered: true })
    })
    const log = watchConsole(page)
    const fallbackRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('hero-glass-fallback')) fallbackRequests.push(request.url())
    })
    await gotoReady(page)

    const ticker = page.locator(TICKER)
    await expect(ticker).toHaveAttribute('data-paused', '')
    await expect(ticker).toHaveCSS('visibility', 'hidden')
    await expect(page.locator('#top canvas')).toHaveCount(1)
    await expect(page.locator(FALLBACK_IMG)).toHaveCSS('display', 'none')
    expect(fallbackRequests, 'a capable desktop never fetches the static lens').toEqual([])

    // The WebGL copy starts exactly where the frozen HTML track stands (circular, one group).
    const phase = await tickerPhaseOffset(page)
    expect(phase.offset, phase.detail).toBeLessThanOrEqual(2)
    // Last glyph of a unit, WebGL vs HTML: 0.01 px on Windows, 3.2 px on Linux CI (platform glyph
    // positioning); Inter's `cpsp` spacing, which this guards against, puts it at 7.1 px.
    expect(Math.abs(phase.unitDelta), 'WebGL vs HTML glyph advance').toBeLessThanOrEqual(5)

    const metrics = await page.evaluate(() => {
      const store = window as unknown as { __shift: number; __longest: number }
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming
      const ready = window.__three.find(([, value]) => value === 'ready')![0]
      return {
        shift: store.__shift,
        longest: store.__longest,
        loadToReady: Math.round(ready - navigation.loadEventEnd),
        canvasAfterLoad: (window.__canvasAt ?? 0) >= navigation.loadEventEnd,
      }
    })
    test.info().annotations.push({
      type: 'mount',
      description: `load→ready ${metrics.loadToReady} ms, longest task ${Math.round(metrics.longest)} ms`,
    })
    expect(metrics.canvasAfterLoad, 'the canvas mounts after load').toBe(true)
    expect(metrics.shift, 'layout shift through the handoff').toBeLessThan(0.01)
    expect(await hasNoHorizontalOverflow(page)).toBe(true)
    expect(log.threeWarnings).toEqual([])
    expect(log.pageErrors).toEqual([])
    expect(log.errors).toEqual([])
  })

  test('TC-056 the 3D chunk and its assets stay within 1.2 MB, none before load @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    type Entry = { url: string; type: string; start: number; bytes: number; body?: string }
    const entries: Entry[] = []
    const pending: Promise<void>[] = []
    page.context().on('requestfinished', (request) => {
      pending.push(
        (async () => {
          const sizes = await request.sizes()
          const response = await request.response()
          const body =
            request.resourceType() === 'script'
              ? (await response?.body())?.toString('utf8')
              : undefined
          entries.push({
            url: request.url(),
            type: request.resourceType(),
            start: request.timing().startTime,
            bytes: sizes.responseBodySize + sizes.responseHeadersSize,
            body,
          })
        })(),
      )
    })
    await gotoReady(page)
    await page.waitForLoadState('networkidle')
    await Promise.all(pending)
    const loadAt = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming
      return performance.timeOrigin + navigation.loadEventStart
    })
    // Network requests only: troika's blob: workers are not downloads.
    const network = entries.filter((entry) => /^https?:/.test(entry.url))
    const before = network.filter((entry) => entry.start < loadAt)
    const after = network.filter((entry) => entry.start >= loadAt)
    const THREE_MARK = 'WebGLRenderer: Context Lost'
    const sum = (list: Entry[]) => list.reduce((total, entry) => total + entry.bytes, 0)
    const initialJs = before.filter((entry) => entry.type === 'script')

    test.info().annotations.push({
      type: '3d-bytes',
      description: `${after.length} requests after load, ${(sum(after) / KB).toFixed(1)} KB: ${after
        .map((entry) => `${entry.url.split('/').pop()} ${(entry.bytes / KB).toFixed(1)} KB`)
        .join(', ')}`,
    })
    expect(sum(after), 'the 3D chunk and its assets').toBeLessThanOrEqual(1.2 * MB)
    expect(after.some((entry) => entry.url.includes('InterDisplay-Medium-ticker.woff'))).toBe(true)
    expect(
      after.some((entry) => entry.body?.includes(THREE_MARK)),
      'three loads after load',
    ).toBe(true)
    expect(
      initialJs.filter((entry) => entry.body?.includes(THREE_MARK)).map((entry) => entry.url),
      'no three.js in the initial scripts',
    ).toEqual([])
    expect(sum(initialJs), 'initial JS stays within 250 KB').toBeLessThanOrEqual(250 * KB)
  })

  test('TC-057 the WebGL marquee sits on the HTML one, glyph for glyph @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await gotoReady(page)
    await page.waitForTimeout(1_000) // the lens fade
    // Freeze the canvas (a hidden tab stops the frame loop), then put the paused HTML track at
    // the same phase and compare the two renderings outside the lens. A negative control moves
    // the HTML track 2 px and must fail the same comparison.
    await setHidden(page, true)
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'paused')
    const geometry = await page.evaluate(() => {
      const layer = document.querySelector('[data-three]')!
      const root = document.querySelector('#top [data-marquee]') as HTMLElement
      const groups = root.firstElementChild!.children
      const group = groups[1].getBoundingClientRect().left - groups[0].getBoundingClientRect().left
      const band = root.getBoundingClientRect()
      const stage = layer.getBoundingClientRect()
      const size = parseFloat(getComputedStyle(root).fontSize)
      return {
        group,
        fraction: (((-Number(layer.getAttribute('data-phase')) / group) % 1) + 1) % 1,
        band: {
          x: 0,
          y: Math.round(band.top),
          width: Math.round(band.width),
          height: Math.round(band.height),
        },
        lens: {
          x: stage.left + 0.18 * stage.width,
          y: band.top + band.height / 2,
          r: 0.42 * size * 1.4,
        },
      }
    })
    /** Shows only the HTML marquee at `fraction`, or only the canvas, and captures the band. */
    const shoot = async (html: boolean, fraction = geometry.fraction) => {
      await page.evaluate(
        ({ showHtml, at }) => {
          const root = document.querySelector('#top [data-marquee]')!
          const animation = root
            .firstElementChild!.getAnimations()
            .find((item) => (item as CSSAnimation).animationName === 'marquee')!
          animation.currentTime = at * Number(animation.effect!.getTiming().duration)
          root.toggleAttribute('data-suspended', !showHtml)
          const canvas = document.querySelector('[data-three] canvas') as HTMLCanvasElement
          canvas.style.visibility = showHtml ? 'hidden' : ''
        },
        { showHtml: html, at: fraction },
      )
      return (await page.screenshot({ clip: geometry.band })).toString('base64')
    }
    /**
     * Shifts the first capture by every offset up to 3 px in x and y and returns the offset where
     * the two match best, with the share of band pixels outside the lens that still differ by
     * more than 96 / 255 there (`residual`) and at no shift (`direct`).
     */
    const compare = (a: string, b: string) =>
      page.evaluate(
        async ({ a, b, lens, band }) => {
          const load = async (data: string) => {
            const image = new Image()
            image.src = `data:image/png;base64,${data}`
            await image.decode()
            const canvas = document.createElement('canvas')
            canvas.width = image.width
            canvas.height = image.height
            const context = canvas.getContext('2d')!
            context.drawImage(image, 0, 0)
            return context.getImageData(0, 0, canvas.width, canvas.height)
          }
          const one = await load(a)
          const two = await load(b)
          const { width, height } = one
          const R = 3
          const ratioAt = (sx: number, sy: number) => {
            let compared = 0
            let different = 0
            for (let y = R; y < height - R; y++) {
              for (let x = R; x < width - R; x++) {
                const lx = x + band.x - lens.x
                const ly = y + band.y - lens.y
                if (lx * lx + ly * ly < lens.r * lens.r) continue
                const i = (y * width + x) * 4
                const j = ((y + sy) * width + (x + sx)) * 4
                const delta = Math.max(
                  Math.abs(one.data[j] - two.data[i]),
                  Math.abs(one.data[j + 1] - two.data[i + 1]),
                  Math.abs(one.data[j + 2] - two.data[i + 2]),
                )
                compared += 1
                if (delta > 96) different += 1
              }
            }
            return different / compared
          }
          let best = { dx: 0, dy: 0, residual: ratioAt(0, 0) }
          const direct = best.residual
          for (let dy = -R; dy <= R; dy++) {
            for (let dx = -R; dx <= R; dx++) {
              const residual = ratioAt(dx, dy)
              if (residual < best.residual) best = { dx, dy, residual }
            }
          }
          return { ...best, direct }
        },
        { a, b, lens: geometry.lens, band: geometry.band },
      )

    const html = await shoot(true)
    const shifted = await shoot(true, geometry.fraction + 2 / geometry.group)
    const webgl = await shoot(false)
    const aligned = await compare(html, webgl)
    const control = await compare(shifted, webgl)
    const percent = (value: number) => `${(value * 100).toFixed(3)} %`
    test.info().annotations.push({
      type: 'alignment',
      description:
        `in phase: best offset (${aligned.dx}, ${aligned.dy}) px, residual ${percent(aligned.residual)}, ` +
        `${percent(aligned.direct)} at no offset; HTML 2 px off: best offset (${control.dx}, ${control.dy}) px`,
    })
    // Limits in docs/DECISIONS.md (M3 alignment test): the renderings line up within a pixel
    // and match there (glyph positions differ a little by platform: 0.000 % on Windows, about
    // 1 % on Linux), and a 2 px offset is found as one.
    expect(Math.abs(aligned.dx), 'WebGL and HTML marquee in phase (x)').toBeLessThanOrEqual(1)
    expect(
      Math.abs(aligned.dy),
      'WebGL and HTML marquee on the same baseline (y)',
    ).toBeLessThanOrEqual(1)
    expect(aligned.residual, 'same glyphs, size and spacing').toBeLessThan(0.025)
    expect(Math.abs(control.dx), 'negative control: a 2 px shift is found').toBeGreaterThanOrEqual(
      2,
    )
  })

  test('TC-058 pauses off-screen and in a hidden tab, resumes on return @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await instrument(page)
    await gotoReady(page)
    await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/)
    const layer = page.locator(LAYER)

    await page.evaluate(() => document.querySelector('#services')!.scrollIntoView())
    await expect(layer).toHaveAttribute('data-three', 'paused', { timeout: 1_000 })
    const pausedAt = await draws(page)
    await page.waitForTimeout(500)
    expect(await draws(page), 'no frames while paused').toBe(pausedAt)

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(layer).toHaveAttribute('data-three', 'ready', { timeout: 1_000 })
    const resumedAt = await draws(page)
    await expect.poll(() => draws(page)).toBeGreaterThan(resumedAt)

    await setHidden(page, true)
    await expect(layer).toHaveAttribute('data-three', 'paused', { timeout: 1_000 })
    await setHidden(page, false)
    await expect(layer).toHaveAttribute('data-three', 'ready', { timeout: 1_000 })
  })

  test('TC-058 batched intersection changes still end on the latest state @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await instrument(page)
    await batchIntersectionChanges(page)
    await gotoReady(page)
    await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/)
    await page.evaluate(async () => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
      document.querySelector('#services')!.scrollIntoView()
      await frame()
      await frame()
      window.scrollTo(0, 0)
      await frame()
      await frame()
    })
    await page.waitForTimeout(600)
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'ready')
    const now = await draws(page)
    await expect.poll(() => draws(page)).toBeGreaterThan(now)
  })

  test('TC-060 a WebGL context the canvas cannot get falls back quietly, for good @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await instrument(page)
    // The probe (a detached canvas) succeeds; R3F's canvas, in the document, is refused.
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type === 'webgl2' && this.isConnected) return null
        return (getContext as (...args: unknown[]) => unknown).call(this, type, ...rest)
      } as typeof getContext
    })
    const log = watchConsole(page)
    await page.goto('/')
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback', {
      timeout: 15_000,
    })
    expect(await states(page)).toEqual(['loading', 'fallback'])
    await expectStaticLens(page)
    await expectHtmlTickerRunning(page)

    await page.setViewportSize({ width: 900, height: 900 })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(2_000)
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback')
    await expect(page.locator('#top canvas')).toHaveCount(0)
    expect(log.pageErrors).toEqual([])
    expect(log.errors).toEqual([])
  })

  test('TC-061 a 3D chunk that fails to load falls back without an error @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await instrument(page)
    // Scripts requested after `load` are the 3D chunk (TC-053 shows a page loads none
    // otherwise). Every request, retries included, is aborted.
    let loaded = false
    page.once('load', () => (loaded = true))
    const aborted: string[] = []
    await page.route('**/*.js', async (route) => {
      if (!loaded) return route.continue()
      aborted.push(route.request().url())
      return route.abort()
    })
    const log = watchConsole(page)
    await page.goto('/')
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback', {
      timeout: 20_000,
    })
    expect(aborted.length, 'the 3D chunk was requested and refused').toBeGreaterThan(0)
    expect(await states(page)).toEqual(['loading', 'fallback'])
    expect(await page.evaluate(() => window.__suspendedSeen)).toBe(false)
    await expectStaticLens(page)
    await expectHtmlTickerRunning(page)
    expect(log.pageErrors).toEqual([])
    expect(log.errors.filter((text) => !/Failed to load resource/.test(text))).toEqual([])
  })

  test('TC-062 a missing ticker font falls back before any 3D loads @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await instrument(page)
    await page.route('**/InterDisplay-Medium-ticker.woff', (route) =>
      route.fulfill({ status: 404, body: '' }),
    )
    const log = watchConsole(page)
    await page.goto('/')
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback', {
      timeout: 15_000,
    })
    expect(await states(page)).toEqual(['loading', 'fallback'])
    await expectStaticLens(page)
    await expectHtmlTickerRunning(page)
    expect(log.pageErrors).toEqual([])
    expect(log.errors.filter((text) => !/Failed to load resource/.test(text))).toEqual([])
  })

  test('TC-063 a lost context hands the name back at once and falls back after 2 s @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await instrument(page)
    const log = watchConsole(page)
    await gotoReady(page)
    await page.evaluate(() => {
      const canvas = document.querySelector('[data-three] canvas') as HTMLCanvasElement
      window.__lose = canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!
      window.__lostAt = performance.now()
      window.__lose.loseContext()
    })
    await expect(page.locator(TICKER)).not.toHaveAttribute('data-suspended', { timeout: 500 })
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback', {
      timeout: 5_000,
    })
    const window_ = await page.evaluate(() => {
      const fallbackAt = window.__three.find(([, value]) => value === 'fallback')![0]
      return fallbackAt - window.__lostAt!
    })
    expect(window_).toBeGreaterThanOrEqual(1_900)
    expect(window_).toBeLessThanOrEqual(3_500)
    await expectStaticLens(page)
    await expectHtmlTickerRunning(page)
    expect(log.pageErrors).toEqual([])
    expect(log.errors).toEqual([])
  })

  test('TC-063 a context restored within 2 s brings the 3D back on a fresh canvas @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await instrument(page)
    const log = watchConsole(page)
    await gotoReady(page)
    const before = (await states(page)).length
    await page.evaluate(async () => {
      const canvas = document.querySelector('[data-three] canvas') as HTMLCanvasElement
      window.__lose = canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!
      window.__lose.loseContext()
      await new Promise((resolve) => setTimeout(resolve, 500))
      window.__lose.restoreContext()
    })
    await expect
      .poll(async () => (await states(page)).slice(before), { timeout: 30_000 })
      .toEqual(['loading', 'ready'])
    await expect(page.locator('#top canvas')).toHaveCount(1)
    await expect(page.locator(TICKER)).toHaveAttribute('data-suspended', '')
    expect(log.pageErrors).toEqual([])
    expect(log.errors).toEqual([])
  })

  test('TC-064 switching to reduced motion while open swaps in the static lens @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    const log = watchConsole(page)
    await gotoReady(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback')
    await expectStaticLens(page)
    const ticker = page.locator(TICKER)
    await expect(ticker).not.toHaveAttribute('data-suspended')
    await expect(ticker).toHaveCSS('visibility', 'visible')
    await expect(ticker.locator('.marquee-track')).toHaveCSS('animation-name', 'none')

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'ready', { timeout: 30_000 })
    await expect(page.locator('#top canvas')).toHaveCount(1)
    expect(log.pageErrors).toEqual([])
    expect(log.errors).toEqual([])
  })

  test('TC-064 resizing below 1024 px and back swaps the layers both ways @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    const log = watchConsole(page)
    await gotoReady(page)
    await page.setViewportSize({ width: 900, height: 900 })
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'fallback')
    await expectStaticLens(page)
    await expectHtmlTickerRunning(page)
    const track = page.locator(`${TICKER} .marquee-track`)
    const x = () => track.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41)
    const first = await x()
    await expect.poll(x, { message: 'the HTML marquee moves again' }).toBeLessThan(first)

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'ready', { timeout: 30_000 })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.waitForTimeout(1_000)
    await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'ready')
    await expect(page.locator('#top canvas')).toHaveCount(1)
    expect(log.pageErrors).toEqual([])
    expect(log.errors).toEqual([])
  })

  test('TC-065 mounts only after load, without competing with a late portrait @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await instrument(page)
    await page.route(/\/_next\/image\?url=%2Fimages%2Fportrait/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4_000))
      await route.continue()
    })
    await gotoReady(page)
    const order = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming
      return { loadEnd: navigation.loadEventEnd, canvasAt: window.__canvasAt }
    })
    expect(order.loadEnd, 'the held portrait delays load').toBeGreaterThan(3_500)
    expect(order.canvasAt!).toBeGreaterThanOrEqual(order.loadEnd)
  })

  test.describe('first visit', () => {
    test.use({ showLoader: true })

    test('TC-065 mounts only once the loader has left @3d', async ({ page, webgl2 }) => {
      requireWebGL2(webgl2)
      await instrument(page)
      await gotoReady(page)
      const order = await page.evaluate(() => ({
        gone: window.__loaderGone,
        canvasAt: window.__canvasAt,
      }))
      expect(order.gone).not.toBeNull()
      expect(order.canvasAt!).toBeGreaterThan(order.gone!)
    })

    test('TC-065 mounts after the CSS cap lifted the loader (late hydration) @3d', async ({
      page,
      webgl2,
    }) => {
      requireWebGL2(webgl2)
      await instrument(page)
      // Every chunk 2 s late: hydration lands after the 1.5 s cap, which lifts the overlay
      // without the JS exit (and without onLoaderExit).
      await page.route('**/_next/static/chunks/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2_000))
        await route.continue()
      })
      await page.goto('/')
      await expect(page.locator(LAYER)).toHaveAttribute('data-three', 'ready', {
        timeout: 45_000,
      })
      const order = await page.evaluate(() => ({
        gone: window.__loaderGone,
        canvasAt: window.__canvasAt,
      }))
      expect(order.canvasAt!).toBeGreaterThan(order.gone!)
    })
  })

  test('TC-066 nothing leaves localhost with the 3D mounted, in both languages @3d', async ({
    page,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    const external: string[] = []
    await page.context().route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1[:/])/, async (route) => {
      external.push(route.request().url())
      await route.abort()
    })
    await gotoReady(page)
    await page.waitForLoadState('networkidle')
    await selectLang(page, 'ID')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    await page.waitForTimeout(1_000)
    expect(external).toEqual([])
  })

  test('TC-067 the page still works around the 3D layer @3d', async ({ page, webgl2 }) => {
    requireWebGL2(webgl2)
    await gotoReady(page)
    await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/)

    // The canvas takes no pointer: hit testing at the lens finds the page beneath it.
    const lens = await page.evaluate(() => {
      const stage = document.querySelector('[data-three]')!.getBoundingClientRect()
      const band = document.querySelector('#top [data-marquee]')!.getBoundingClientRect()
      const x = stage.left + 0.18 * stage.width
      const y = band.top + band.height / 2
      return { x, y, hit: document.elementFromPoint(x, y)?.tagName }
    })
    expect(lens.hit).not.toBe('CANVAS')
    await page.mouse.click(lens.x, lens.y)
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY')

    // Nothing in the 3D layer takes keyboard focus.
    for (let step = 0; step < 10; step++) {
      await page.keyboard.press('Tab')
      expect(
        await page.evaluate(() => document.activeElement?.closest('[data-three]') !== null),
      ).toBe(false)
    }

    // Hover still works on the hero links above the canvas.
    const social = page.locator('#top a[href*="github"]').first()
    const before = await social.evaluate((link) => getComputedStyle(link).color)
    await social.hover()
    await expect
      .poll(() => social.evaluate((link) => getComputedStyle(link).color))
      .not.toBe(before)

    await page.locator('header').getByRole('link', { name: en.nav.work, exact: true }).click()
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Math.abs(document.getElementById('work')!.getBoundingClientRect().top),
          ),
        { timeout: 5_000 },
      )
      .toBeLessThanOrEqual(2)
    expect(await hasNoHorizontalOverflow(page)).toBe(true)
  })
})
