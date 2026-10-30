// M2 motion: TC-022 (Lenis + anchor navigation) and TC-024 (reduced-motion path).
import { expect, test, type Page } from '@playwright/test'
import en from '../../content/en'

const LENIS = /(^|\s)lenis(\s|$)/

/** True once the section's top sits at the viewport top, or the page cannot scroll further. */
async function reached(page: Page, id: string): Promise<boolean> {
  return page.evaluate((sectionId) => {
    const top = document.getElementById(sectionId)!.getBoundingClientRect().top
    const root = document.documentElement
    const atBottom = window.scrollY >= root.scrollHeight - window.innerHeight - 2
    return Math.abs(top) <= 2 || (top > 0 && atBottom)
  }, id)
}

/** Waits for the section to be reached and for Lenis to settle before the next action. */
async function expectAt(page: Page, id: string): Promise<void> {
  await expect.poll(() => reached(page, id), { timeout: 5_000 }).toBe(true)
  await expect(page.locator('html')).not.toHaveClass(/lenis-scrolling/)
  await expect(page).toHaveURL(new RegExp(`#${id}$`))
}

/** Loads `/` and waits for hydration: MotionRoot has started Lenis. */
async function gotoWithLenis(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(LENIS)
}

test.describe('anchor navigation (Lenis)', () => {
  test('nav links reach their sections and move focus there', async ({ page }, testInfo) => {
    await gotoWithLenis(page)
    const mobile = testInfo.project.name === 'mobile'
    for (const [label, id] of [
      [en.nav.work, 'work'],
      [en.nav.about, 'about'],
      [en.nav.contact, 'contact'],
    ] as const) {
      if (mobile) {
        await page.getByRole('button', { name: en.nav.openMenu }).click()
        await page.locator('#mobile-menu').getByRole('link', { name: label }).click()
        await expect(page.locator('#mobile-menu')).toBeHidden()
      } else {
        await page.locator('header').getByRole('link', { name: label, exact: true }).click()
      }
      await expectAt(page, id)
      await expect(page.locator(`#${id}`)).toBeFocused()
    }
  })

  test('footer links, "See my work" and back-to-top reach their sections', async ({ page }) => {
    await gotoWithLenis(page)
    await page.locator('#about').getByRole('link', { name: en.intro.seeWork }).click()
    await expectAt(page, 'work')

    for (const [label, id] of [
      [en.nav.about, 'about'],
      [en.nav.contact, 'contact'],
    ] as const) {
      await page.locator('footer').getByRole('link', { name: label }).click()
      await expectAt(page, id)
    }

    await page.locator('#contact').getByRole('link', { name: en.reachOut.backToTop }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBe(0)
    await expect(page).toHaveURL(/#top$/)
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('no Lenis; anchors are native jumps', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('html')).not.toHaveClass(LENIS)
    await page.locator('footer').getByRole('link', { name: en.nav.contact }).click()
    await expectAt(page, 'contact')
  })
})
