import type { Page } from '@playwright/test'
import en from '../../content/en'
import id from '../../content/id'

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
}

/** True when the page cannot be scrolled sideways (DESIGN §8). */
export function hasNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )
}
