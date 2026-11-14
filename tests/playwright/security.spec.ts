// M5 security (PRD §8): TC-098 the headers on every kind of response, TC-099 a walk through the
// site under the Content-Security-Policy with no violation and no console error (every browser
// project), TC-100 the same walk with the 3D lens, which must still reach `ready` and hand the
// name over in phase. The header literal comes from lib/security-headers.ts, as next.config.ts does.
import type { ConsoleMessage, Locator, Page } from '@playwright/test'
import { expect, test, type WebGL2Support } from './fixtures'
import id from '../../content/id'
import { site } from '../../content/site'
import { LOADER_MAX_MS } from '../../lib/loader'
import { DUR } from '../../lib/motion'
import { CSP_PRODUCTION, PERMISSIONS_POLICY } from '../../lib/security-headers'
import { selectLang, tickerPhaseOffset } from './helpers'

declare global {
  interface Window {
    __cspViolations: string[]
  }
}

const MISSING = '/this-page-does-not-exist'

// TC-098
test('every kind of response carries the CSP and the security headers', async ({ request }) => {
  const directives = new Map(
    CSP_PRODUCTION.split('; ').map((directive) => {
      const [name, ...sources] = directive.split(' ')
      return [name, sources] as const
    }),
  )
  // The production policy: blob: for troika's worker, never 'unsafe-eval', no hash or nonce
  // (either would switch 'unsafe-inline' off), and nothing that upgrades http://localhost.
  expect(directives.get('script-src')).toEqual(["'self'", "'unsafe-inline'", 'blob:'])
  expect(directives.get('worker-src')).toEqual(["'self'", 'blob:'])
  expect(directives.get('object-src')).toEqual(["'none'"])
  expect(directives.get('frame-ancestors')).toEqual(["'none'"])
  expect(CSP_PRODUCTION).not.toMatch(/unsafe-eval|sha256-|nonce-|upgrade-insecure-requests|report-/)

  for (const [path, status] of [
    ['/', 200],
    [MISSING, 404],
    ['/sitemap.xml', 200],
    ['/robots.txt', 200],
    [site.cvUrl!, 200],
  ] as const) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(status)
    const headers = response.headers()
    expect(headers['content-security-policy'], path).toBe(CSP_PRODUCTION)
    expect(headers['x-content-type-options'], path).toBe('nosniff')
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy'], path).toBe(PERMISSIONS_POLICY)
    expect(headers['x-frame-options'], path).toBe('DENY')
  }
})

type Logged = { text: string; url: string }

/** Console errors (worker messages included), page errors and failed responses. */
function watch(page: Page) {
  const errors: Logged[] = []
  const logs: string[] = []
  const pageErrors: string[] = []
  const failed: string[] = []
  const workers: string[] = []
  page.on('console', (message: ConsoleMessage) => {
    logs.push(message.text())
    if (message.type() === 'error')
      errors.push({ text: message.text(), url: message.location().url })
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(response.url())
  })
  page.on('worker', (worker) => workers.push(worker.url()))
  return { errors, logs, pageErrors, failed, workers }
}

/** Collects every securitypolicyviolation of each document the page loads. */
async function recordViolations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__cspViolations = []
    document.addEventListener(
      'securitypolicyviolation',
      (event) =>
        window.__cspViolations.push(
          `${event.effectiveDirective} blocked ${event.blockedURI || '(inline)'} at ${event.sourceFile}:${event.lineNumber}`,
        ),
      true,
    )
  })
}

const violationsOf = (page: Page) => page.evaluate(() => window.__cspViolations)

/** Opens a lightbox from its trigger by keyboard, waits for its image, closes it with Esc. */
async function openAndClose(page: Page, trigger: Locator): Promise<void> {
  await trigger.scrollIntoViewIfNeeded()
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: id.lightbox.label })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: id.lightbox.close })).toBeFocused()
  await expect
    .poll(() =>
      dialog
        .getByRole('img')
        .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
}

/**
 * The walk of TC-099 / TC-100: a first visit with the loader, the switch to Indonesian, the three
 * lightboxes, a drag and the pause button on the polaroid line, back to top, then the 404.
 * `atTop` runs at the top after the loader (`arrival`) and after back-to-top (`return`); the 3D
 * test checks the lens there.
 */
async function walk(
  page: Page,
  atTop: (moment: 'arrival' | 'return') => Promise<void> = async () => {},
): Promise<string[]> {
  const violations: string[] = []

  // The pre-paint script ran under the CSP: the overlay shows from the first frame, then leaves.
  await page.goto('/', { waitUntil: 'commit' })
  await expect(page.locator('.loader-overlay')).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute('data-loader', {
    timeout: LOADER_MAX_MS + DUR.slow * 1000 + 2_000,
  })
  await atTop('arrival')

  await selectLang(page, 'ID')
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')

  // The certificate coverflow (v1.1): Enter on its frame opens the centre card.
  await openAndClose(page, page.getByRole('group', { name: id.certifications.carousel.frame }))
  await openAndClose(
    page,
    page.getByRole('button', {
      name: id.projects.openScreenshots.replace('{title}', id.projects.items.pintukos.title),
    }),
  )
  await openAndClose(
    page,
    page
      .locator('#qa')
      .getByRole('button', { name: id.qa.artifacts['e2e-report'].title, exact: true }),
  )

  // The prints sway every frame, so the drag uses coordinates (polaroid.spec.ts).
  const carousel = page.locator('.pl-root')
  await carousel.scrollIntoViewIfNeeded()
  await expect(page.locator('.pl-card[data-on="1"]')).toBeVisible()
  const area = (await carousel.boundingBox())!
  const y = area.y + area.height * 0.4
  const x = area.x + area.width - 30
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - 240, y, { steps: 12 })
  await expect(carousel).toHaveAttribute('data-drag', '1')
  await page.mouse.up()
  await expect(carousel).toHaveAttribute('data-drag', '0')
  await page.getByRole('button', { name: id.reachOut.polaroids.pause }).click()
  await expect(page.getByRole('button', { name: id.reachOut.polaroids.play })).toBeVisible()

  await page.locator('#contact').getByRole('link', { name: id.reachOut.backToTop }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBe(0)
  await atTop('return')

  // Each document has its own list: read the home page's before leaving it.
  violations.push(...(await violationsOf(page)))
  const response = await page.goto(MISSING)
  expect(response?.status()).toBe(404)
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(id.notFound.heading)
  violations.push(...(await violationsOf(page)))
  return violations
}

/**
 * No console error anywhere in the walk, except the browser's own line for the deliberate 404
 * document (Chromium and WebKit log it, Firefox does not), and only for that URL.
 */
function expectQuiet(log: ReturnType<typeof watch>, baseURL: string): void {
  const missing = new URL(MISSING, baseURL).href
  const notFound = (entry: Logged) =>
    /Failed to load resource: .*404/.test(entry.text) && (entry.url === missing || !entry.url)
  expect(log.pageErrors).toEqual([])
  expect(log.errors.filter((entry) => !notFound(entry))).toEqual([])
  expect(log.errors.filter(notFound).length).toBeLessThanOrEqual(1)
  expect(log.failed, 'the only failed response is the 404 visit').toEqual([missing])
}

// TC-099
test.describe('under the CSP', () => {
  test.use({ showLoader: true })
  test.slow()

  test('a walk through the site raises no violation and no console error', async ({
    page,
    baseURL,
  }) => {
    await recordViolations(page)
    const log = watch(page)
    const violations = await walk(page)
    expect(violations, 'Content-Security-Policy violations').toEqual([])
    expectQuiet(log, baseURL!)
  })
})

/** The 3D tests need WebGL2: skip locally without it, fail in CI (three.spec.ts). */
function requireWebGL2(webgl2: WebGL2Support): void {
  test.info().annotations.push({ type: 'webgl2', description: webgl2.renderer ?? 'unavailable' })
  if (process.env.CI) expect(webgl2.available, 'CI must provide WebGL2 (SwiftShader)').toBe(true)
  test.skip(!webgl2.available, 'this browser has no WebGL2')
}

// TC-100. Violations inside troika's blob: worker never reach the page, so the decisive check is
// functional: under the enforced CSP the lens reaches `ready`, from a blob: worker (no fallback to
// the main thread), and the WebGL ticker took the name over in phase (TC-055's measurement).
test.describe('under the CSP with the 3D lens', () => {
  test.use({ three: true, showLoader: true })
  test.slow() // SwiftShader compiles and renders on the CPU

  test('the lens mounts, stays in phase, and the walk stays clean @3d', async ({
    page,
    baseURL,
    webgl2,
  }) => {
    requireWebGL2(webgl2)
    await recordViolations(page)
    const log = watch(page)
    const layer = page.locator('[data-three]')
    const violations = await walk(page, async (moment) => {
      // Back from below the fold, the paused lens resumes (TC-058).
      await expect(layer).toHaveAttribute('data-three', 'ready', { timeout: 30_000 })
      // The handoff: the WebGL copy took the name over where the frozen HTML track stood. Later
      // the WebGL ticker moves on while the HTML track stays frozen, so this is read on arrival.
      if (moment === 'arrival') {
        const phase = await tickerPhaseOffset(page)
        expect(phase.offset, phase.detail).toBeLessThanOrEqual(2)
      }
      const marks = await page.evaluate(() =>
        performance.getEntriesByType('mark').map((mark) => mark.name),
      )
      expect(marks).toContain('three:ready')
      expect(marks.filter((name) => name.startsWith('three:fallback'))).toEqual([])
    })
    expect(
      log.workers.some((url) => url.startsWith('blob:')),
      'troika laid the text out in its blob: worker',
    ).toBe(true)
    expect(log.logs.filter((text) => /web workers not allowed/.test(text))).toEqual([])
    expect(log.logs.filter((text) => /THREE\.|Shader Error/.test(text))).toEqual([])
    expect(violations, 'Content-Security-Policy violations').toEqual([])
    expectQuiet(log, baseURL!)
  })
})
