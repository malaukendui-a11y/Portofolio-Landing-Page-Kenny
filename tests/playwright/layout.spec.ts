// M1 layout checks: TC-008 (hero portrait loaded), TC-009 (no horizontal overflow),
// TC-010 (mobile menu open/close), TC-011 (nav backdrop after scroll),
// TC-012 (copy email → toast), TC-013 (WhatsApp prefill), TC-014 (Download CV hidden).
import { expect, test } from '@playwright/test'
import en from '../../content/en'
import { site } from '../../content/site'
import { hasNoHorizontalOverflow } from './helpers'

test('hero portrait is loaded with priority', async ({ page }) => {
  await page.goto('/')
  const portrait = page.locator('#top').getByRole('img', { name: en.hero.portraitAlt })
  await expect(portrait).toBeVisible()
  await expect
    .poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true)
  // `priority`: eager (no lazy attribute) and preloaded from <head>.
  await expect(portrait).not.toHaveAttribute('loading', 'lazy')
  await expect(page.locator('link[rel="preload"][as="image"]').first()).toHaveAttribute(
    'imagesrcset',
    /kenny-hero-crop-color/,
  )
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

test('Download CV renders only when site.cvUrl is set', async ({ page }) => {
  await page.goto('/')
  const links = page.getByRole('link', { name: en.nav.downloadCv })
  if (site.cvUrl) await expect(links.first()).toBeVisible()
  else await expect(links).toHaveCount(0)
})
