// M1 layout checks: TC-008 (hero portrait loaded), TC-009 (no horizontal overflow),
// TC-010 (mobile menu open/close), TC-011 (nav backdrop after scroll),
// TC-012 (copy email → toast), TC-013 (WhatsApp prefill), TC-014 (Download CV, since M4b batch 2
// also in Reach Out), TC-102 (contact links on screen without scrolling, M5).
import { readFileSync } from 'node:fs'
import type { Locator } from '@playwright/test'
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import { site } from '../../content/site'
import { LOADER_MAX_MS } from '../../lib/loader'
import { DUR } from '../../lib/motion'
import { belowMd, hasNoHorizontalOverflow, selectLang } from './helpers'

const HERO_FILE = 'public/images/portrait/kenny-hero-formal@2x.webp'

test('hero portrait is the formal cutout, loaded with priority', async ({ page, request }) => {
  await page.goto('/')
  const portrait = page.locator('#top').getByRole('img', { name: en.hero.portraitAlt })
  await expect(portrait).toBeVisible()
  await expect(portrait).toHaveAttribute('id', 'hero-portrait')
  await expect(portrait).toHaveAttribute('src', /kenny-hero-formal/)
  // The declared size is the file's own (next/image reserves the box from it).
  await expect(portrait).toHaveAttribute('width', '1070')
  await expect(portrait).toHaveAttribute('height', '1600')
  await expect
    .poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true)
  // next/image serves a smaller candidate (naturalWidth reports it), with the file's aspect.
  const aspect = await portrait.evaluate(
    (img: HTMLImageElement) => img.naturalWidth / img.naturalHeight,
  )
  expect(Math.abs(aspect - 1070 / 1600)).toBeLessThan(0.005)
  // `priority`: eager (no lazy attribute) and preloaded from <head>.
  await expect(portrait).not.toHaveAttribute('loading', 'lazy')
  await expect(page.locator('link[rel="preload"][as="image"]').first()).toHaveAttribute(
    'imagesrcset',
    /kenny-hero-formal/,
  )
  // The crop variants it replaces are gone from the build.
  for (const variant of ['color', 'color-soft', 'bw']) {
    const url = `/images/portrait/kenny-hero-crop-${variant}@2x.webp`
    expect((await request.get(url)).status(), url).toBe(404)
  }

  await selectLang(page, 'ID')
  await expect(page.locator('#hero-portrait')).toHaveAttribute('alt', id.hero.portraitAlt)
})

test('the hero portrait file is a 1070 × 1600 WebP with alpha', () => {
  test.skip(test.info().project.name !== 'desktop', 'a file check, once')
  const bytes = readFileSync(HERO_FILE)
  expect(bytes.toString('latin1', 0, 4)).toBe('RIFF')
  expect(bytes.toString('latin1', 8, 12)).toBe('WEBP')
  // Extended format: the canvas size sits in the VP8X chunk (24-bit, minus one), alpha flag 0x10.
  expect(bytes.toString('latin1', 12, 16)).toBe('VP8X')
  expect([1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3)]).toEqual([1070, 1600])
  expect(bytes[20] & 0x10, 'alpha flag').toBe(0x10)
})

// TC-008, M4b batch 2 (checklist C-01): the re-exported portrait fades in above the shoulder tips,
// so no straight edge shows at shoulder height. The outermost three columns' alpha over rows
// 900–1100 peaks at 6 (the batch-1 file: 210). Read from the static file, decoded by the browser.
test('the hero portrait has no opaque side edge at shoulder height', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'a file check, once')
  await page.goto('/')
  const peak = await page.evaluate(async () => {
    const img = new Image()
    img.src = '/images/portrait/kenny-hero-formal@2x.webp'
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const context = canvas.getContext('2d')!
    context.drawImage(img, 0, 0)
    let max = 0
    for (const x of [0, 1, 2, canvas.width - 3, canvas.width - 2, canvas.width - 1]) {
      const { data } = context.getImageData(x, 900, 1, 201)
      for (let i = 3; i < data.length; i += 4) max = Math.max(max, data[i])
    }
    return { max, width: canvas.width, height: canvas.height }
  })
  expect([peak.width, peak.height]).toEqual([1070, 1600])
  expect(peak.max, 'side-edge alpha at shoulder height').toBeLessThanOrEqual(8)
})

test('no horizontal overflow at the top or the bottom of the page', async ({ page }) => {
  await page.goto('/')
  expect(await hasNoHorizontalOverflow(page)).toBe(true)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(300)
  expect(await hasNoHorizontalOverflow(page)).toBe(true)
})

test('nav gains the dark backdrop after scrolling past the hero top', async ({ page }) => {
  await page.goto('/')
  const header = page.locator('header')
  await expect(header).not.toHaveClass(/surface-dark-glass/)
  await page.evaluate(() => window.scrollTo(0, 400))
  await expect(header).toHaveClass(/surface-dark-glass/)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(header).not.toHaveClass(/surface-dark-glass/)
})

test('mobile menu opens, traps focus, closes with Esc and restores focus', async ({
  page,
  viewport,
}) => {
  test.skip(!belowMd(viewport), 'the hamburger only exists below md')
  await page.goto('/')
  const open = page.getByRole('button', { name: en.nav.openMenu })
  await expect(open).toHaveAttribute('aria-expanded', 'false')
  await open.click()

  const menu = page.locator('#mobile-menu')
  await expect(menu).toBeVisible()
  await expect(open).toHaveAttribute('aria-expanded', 'true')
  await expect(menu.getByRole('link', { name: en.nav.work })).toBeVisible()
  await expect(menu.getByRole('button', { name: en.nav.closeMenu })).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(open).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')

  // A menu link closes the overlay and navigates to the anchor.
  await open.click()
  await menu.getByRole('link', { name: en.nav.work }).click()
  await expect(menu).toBeHidden()
  await expect(page).toHaveURL(/#work$/)
})

// Clipboard permission names differ per engine: Chromium has both, Playwright's WebKit only
// 'clipboard-read', its Firefox none (an unknown name throws when the context opens).
const CLIPBOARD_PERMISSIONS: Record<string, string[]> = {
  chromium: ['clipboard-read', 'clipboard-write'],
  webkit: ['clipboard-read'],
  firefox: [],
}

test.describe('contact actions', () => {
  test.use({
    permissions: async ({ browserName }, run) => run(CLIPBOARD_PERMISSIONS[browserName] ?? []),
  })

  test('copy email writes the clipboard and shows the toast', async ({ page }) => {
    await page.goto('/#contact')
    await page.getByRole('button', { name: en.reachOut.email.copy }).click()
    await expect(page.getByRole('status')).toContainText(en.reachOut.email.copied)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(site.email)
  })

  test('WhatsApp links carry the prefilled message', async ({ page }) => {
    await page.goto('/')
    const link = page.locator('#contact').getByRole('link', { name: en.reachOut.ctas.whatsapp })
    await expect(link).toHaveAttribute(
      'href',
      `${site.whatsapp.url}?text=${encodeURIComponent(en.reachOut.whatsapp.prefill)}`,
    )
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

// TC-014 (PRD F-09): the nav (desktop), the menu (mobile), Intro and, since M4b batch 2, Reach Out
// link the PDF for download, in both languages, and the build serves it as a PDF. Since v1.1
// content the one CV is Indonesian: every link says so with `hreflang="id"`, and the English file
// it replaced is gone.
test('Download CV links the PDF from the nav, the menu, Intro and Reach Out', async ({
  page,
  request,
  viewport,
}) => {
  expect(site.cvUrl).toMatch(/^\/cv\/.+-id\.pdf$/)
  expect(site.cvLang).toBe('id')
  const cv = site.cvUrl!
  const expectCv = async (link: Locator) => {
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', cv)
    await expect(link).toHaveAttribute('download', '')
    await expect(link).toHaveAttribute('hreflang', 'id')
  }

  await page.goto('/')
  for (const copy of [en, id]) {
    if (copy === id) {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const nav = page.locator('header').getByRole('link', { name: copy.nav.downloadCv })
    if (belowMd(viewport)) {
      // Below md the header has only the hamburger; the CV button lives in the menu.
      await expect(nav).toHaveCount(0)
      await page.getByRole('button', { name: copy.nav.openMenu }).click()
      await expectCv(page.locator('#mobile-menu').getByRole('link', { name: copy.nav.downloadCv }))
      await page.keyboard.press('Escape')
      await expect(page.locator('#mobile-menu')).toBeHidden()
    } else {
      await expectCv(nav)
    }
    const intro = page.locator('#about').getByRole('link', { name: copy.intro.downloadCv })
    await intro.scrollIntoViewIfNeeded()
    await expectCv(intro)

    // Reach Out: the recruiter route (Email me, Download CV), then WhatsApp, which stays last so
    // Tab from it reaches the carousel (polaroid.spec TC-035, TC-039).
    const contact = page.locator('#contact')
    const reachCv = contact.getByRole('link', { name: copy.reachOut.ctas.cv, exact: true })
    await reachCv.scrollIntoViewIfNeeded()
    await expectCv(reachCv)
    await expect(reachCv).toHaveAttribute('href', /\.pdf$/)
    await expect(
      contact.getByRole('link', { name: copy.reachOut.ctas.email }).locator('..').getByRole('link'),
    ).toHaveText([copy.reachOut.ctas.email, copy.reachOut.ctas.cv, copy.reachOut.ctas.whatsapp])
  }

  const response = await request.get(cv)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('application/pdf')
  const body = await response.body()
  expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  expect(body.length, 'CV ≤ 500 KB').toBeLessThanOrEqual(500 * 1024)
  // The English CV of M4b is no longer served.
  expect((await request.get('/cv/kenny-cv-2026-11-en.pdf')).status()).toBe(404)
})

// TC-102 (PRD §3.3 "contact CTA visible without scrolling", DESIGN §4.2): on a first visit, once
// the loader has left and the hero entrance has settled, the hero's contact links sit inside the
// viewport before any scroll: the GitHub and WhatsApp text links in the desktop corner, the same
// links as 44 px icons on a phone. (LinkedIn joins them once `site.linkedin` is set.)
test.describe('first visit', () => {
  test.use({ showLoader: true })

  test('the hero contact links are on screen without scrolling', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' })
    await expect(page.locator('.loader-overlay')).toBeVisible()
    await expect(page.locator('html')).not.toHaveAttribute('data-loader', {
      timeout: LOADER_MAX_MS + DUR.slow * 1000 + 2_000,
    })
    const viewport = page.viewportSize()!
    for (const name of [en.hero.socials.github, en.hero.socials.whatsapp]) {
      const link = page.locator('#top').getByRole('link', { name, exact: true })
      await expect(link).toBeVisible()
      // The entrance starts the list 24 px low and transparent, then clears both.
      const list = link.locator('xpath=ancestor::ul[1]')
      await expect(list).toHaveCSS('opacity', '1')
      await expect(list).toHaveCSS('transform', 'none')
      const box = (await link.boundingBox())!
      expect(await page.evaluate(() => window.scrollY), 'no scroll').toBe(0)
      expect(box.x, name).toBeGreaterThanOrEqual(0)
      expect(box.y, name).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width, name).toBeLessThanOrEqual(viewport.width)
      expect(
        box.y + box.height,
        `${name}: bottom inside ${viewport.height} px`,
      ).toBeLessThanOrEqual(viewport.height)
      test.info().annotations.push({
        type: 'contact-in-view',
        description: `${name}: ${Math.round(viewport.height - box.y - box.height)} px to spare`,
      })
    }
  })
})

// TC-126 (v1.1 content, DESIGN §4.2): the longer junior roles still fit the hero. Desktop at 1440×900
// and 1024×768 (the roles sit bottom right, over the portrait's faded lower edge), the phone at 390
// (under the portrait). Gates: the roles stay inside the viewport and clear of the corner UI (the
// socials, the //INTRO cue, the availability badge, the nav), and wherever they cross the portrait
// they stay legible: ink against the portrait composited over paper-100 keeps WCAG 1.4.3's 3 : 1 for
// large text (32 px / 600) at every sampled pixel. The hero's glow is ignored (paper only). The
// annotation records how many portrait pixels under the roles have alpha > 32, and each role's lines.
test('the hero roles fit beside the portrait and the corner UI', async ({ page, isMobile }) => {
  const css = readFileSync('app/globals.css', 'utf8')
  const token = (name: string) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))![1].trim()
  const colours = { paper: token('color-paper-100'), ink: token('color-text-on-paper') }
  const sizes = isMobile
    ? [page.viewportSize()!]
    : [
        { width: 1440, height: 900 },
        { width: 1024, height: 768 },
      ]
  const notes: string[] = []
  for (const size of sizes) {
    await page.setViewportSize(size)
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    // The entrance has settled: the stagger lists are opaque and in place, the portrait too.
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll('#top [data-hero-stagger], #hero-portrait')].every(
            (element) => {
              const style = getComputedStyle(element)
              return style.opacity === '1' && style.transform === 'none'
            },
          ),
        ),
      )
      .toBe(true)
    await expect
      .poll(() =>
        page
          .locator('#hero-portrait')
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true)

    const fit = await page.evaluate(
      async ({ roles, labels, paper, ink }) => {
        const shown = (element: Element | null | undefined): element is HTMLElement =>
          element instanceof HTMLElement && element.getClientRects().length > 0
        const lists = [...document.querySelectorAll('#top ul')].filter(shown)
        const list = lists.find((ul) => ul.textContent?.includes(roles[0]))!
        const box = list.getBoundingClientRect()

        // Corner UI the roles must not touch.
        const corner: Record<string, DOMRect | undefined> = {
          socials: lists
            .find(
              (ul) =>
                ul.textContent?.includes(labels.github) || ul.querySelector('a[href*="github"]'),
            )
            ?.getBoundingClientRect(),
          cue: [...document.querySelectorAll('#top p')]
            .filter(shown)
            .find((p) => p.textContent?.trim() === labels.cue)
            ?.getBoundingClientRect(),
          badge: [...document.querySelectorAll('#top *')]
            .filter(shown)
            .find(
              (element) =>
                element.childElementCount === 0 && element.textContent?.includes(labels.badge),
            )
            ?.getBoundingClientRect(),
          nav: document.querySelector('header')?.getBoundingClientRect(),
        }
        const touches = Object.entries(corner)
          .filter(
            ([, rect]) =>
              rect !== undefined &&
              rect.left < box.right &&
              rect.right > box.left &&
              rect.top < box.bottom &&
              rect.bottom > box.top,
          )
          .map(([name]) => name)

        // Legibility over the portrait: sample the portrait under every line box of the roles.
        const img = document.getElementById('hero-portrait') as HTMLImageElement
        const frame = img.getBoundingClientRect()
        const source = new Image()
        source.src = img.currentSrc
        await source.decode()
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(frame.width)
        canvas.height = Math.round(frame.height)
        const context = canvas.getContext('2d', { willReadFrequently: true })!
        context.drawImage(source, 0, 0, canvas.width, canvas.height)
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
        const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
        const luminance = ([r, g, b]: number[]) => {
          const linear = (c: number) => {
            const s = c / 255
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
          }
          return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
        }
        const paperRgb = rgb(paper)
        const inkL = luminance(rgb(ink))
        let samples = 0
        let opaque = 0
        let minContrast = Infinity
        const lines: number[] = []
        for (const item of list.querySelectorAll('li')) {
          const range = document.createRange()
          range.selectNodeContents(item)
          const rects = [...range.getClientRects()]
          lines.push(rects.length)
          for (const rect of rects) {
            for (let y = Math.ceil(rect.top); y < rect.bottom; y += 2) {
              for (let x = Math.ceil(rect.left); x < rect.right; x += 2) {
                const px = Math.floor(x - frame.left)
                const py = Math.floor(y - frame.top)
                if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue
                const i = (py * canvas.width + px) * 4
                const alpha = pixels[i + 3] / 255
                if (alpha === 0) continue
                samples++
                if (pixels[i + 3] > 32) opaque++
                const composite = [0, 1, 2].map(
                  (c) => alpha * pixels[i + c] + (1 - alpha) * paperRgb[c],
                )
                minContrast = Math.min(minContrast, (luminance(composite) + 0.05) / (inkL + 0.05))
              }
            }
          }
        }
        return {
          inside: box.left >= 0 && box.right <= innerWidth,
          touches,
          samples,
          opaque,
          minContrast: samples ? Math.round(minContrast * 100) / 100 : null,
          lines,
        }
      },
      {
        roles: en.hero.roles,
        labels: {
          github: en.hero.socials.github,
          cue: en.hero.scrollCue,
          badge: en.hero.availability,
        },
        ...colours,
      },
    )
    const label = `${size.width}×${size.height}`
    notes.push(
      `${label}: ${fit.samples} portrait px under the roles (${fit.opaque} with alpha > 32), ` +
        `min contrast ${fit.minContrast ?? '—'} : 1, lines ${fit.lines.join('/')}`,
    )
    expect(fit.inside, `${label}: roles inside the viewport`).toBe(true)
    expect(fit.touches, `${label}: roles clear of the corner UI`).toEqual([])
    if (fit.minContrast !== null)
      expect(fit.minContrast, `${label}: ink on the portrait`).toBeGreaterThanOrEqual(3)
  }
  test.info().annotations.push({ type: 'hero-roles', description: notes.join('; ') })
  console.log(`hero roles: ${notes.join('; ')}`)
})
