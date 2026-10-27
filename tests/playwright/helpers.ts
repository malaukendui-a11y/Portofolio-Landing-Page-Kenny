import type { Page } from '@playwright/test'
import en from '../../content/en'

/**
 * Switches the language with the EN / ID toggle. On mobile the toggle lives
 * inside the menu overlay, so the menu is opened first and closed with Esc.
 */
export async function selectLang(page: Page, code: 'EN' | 'ID'): Promise<void> {
  const menuButton = page.getByRole('button', { name: en.nav.openMenu })
  const viaMenu = await menuButton.isVisible()
  if (viaMenu) await menuButton.click()
  await page.getByRole('button', { name: code, exact: true }).click()
  if (viaMenu) await page.keyboard.press('Escape')
}

/** True when the page cannot be scrolled sideways (DESIGN §8). */
export function hasNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )
}
