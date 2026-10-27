// TC-016: full-page screenshots for the owner's layout review (CLAUDE.md §7),
// written to test-results/screenshots/<project>-<lang>.png.
import { expect, test } from '@playwright/test'
import { selectLang } from './helpers'

for (const lang of ['en', 'id'] as const) {
  test(`full-page screenshot (${lang})`, async ({ page }, testInfo) => {
    await page.goto('/')
    if (lang === 'id') {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    // Scroll through once so every lazy image is requested before the capture.
    await page.evaluate(async () => {
      const step = window.innerHeight
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 60))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: `test-results/screenshots/${testInfo.project.name}-${lang}.png`,
      fullPage: true,
    })
  })
}
