// M1 layout checks: TC-008 (hero portrait loaded), TC-009 (no horizontal overflow),
// TC-010 (mobile menu open/close), TC-011 (nav backdrop after scroll),
// TC-012 (copy email → toast), TC-013 (WhatsApp prefill), TC-014 (Download CV).
import { readFileSync } from 'node:fs'
import type { Locator } from '@playwright/test'
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import { site } from '../../content/site'
import { hasNoHorizontalOverflow, selectLang } from './helpers'

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
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'the hamburger only exists below md')
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

test.describe('contact actions', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

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

// TC-014 (PRD F-09): the nav (desktop), the menu (mobile) and Intro link the PDF for download,
// in both languages, and the build serves it as a PDF.
test('Download CV links the PDF from the nav, the menu and Intro', async ({
  page,
  request,
}, testInfo) => {
  expect(site.cvUrl).toMatch(/^\/cv\/.+\.pdf$/)
  const cv = site.cvUrl!
  const expectCv = async (link: Locator) => {
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', cv)
    await expect(link).toHaveAttribute('download', '')
  }

  await page.goto('/')
  for (const copy of [en, id]) {
    if (copy === id) {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const nav = page.locator('header').getByRole('link', { name: copy.nav.downloadCv })
    if (testInfo.project.name === 'mobile') {
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
  }

  const response = await request.get(cv)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('application/pdf')
  const body = await response.body()
  expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  expect(body.length, 'CV ≤ 500 KB').toBeLessThanOrEqual(500 * 1024)
})
