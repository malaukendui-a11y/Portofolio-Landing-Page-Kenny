// TC-016: full-page screenshots for the owner's layout review (CLAUDE.md §7),
// written to test-results/screenshots/<project>-<lang>.png.
import { expect, test } from '@playwright/test'
import { selectLang } from './helpers'

// Full-page capture under combined mobile emulation (isMobile + DPR 2.6) drops the
// hero portrait from the bitmap although it is loaded and laid out; capture the same
// 390 px layout without the emulation flags instead (the layout tests keep them).
test.use({ isMobile: false, hasTouch: false, deviceScaleFactor: 1 })

for (const lang of ['en', 'id'] as const) {
  test(`full-page screenshot (${lang})`, async ({ page }, testInfo) => {
    await page.goto('/')
    if (lang === 'id') {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    // Force lazy images to load now (they only start near the viewport), then wait.
    await page.evaluate(() => {
      for (const img of Array.from(document.images)) {
        if (img.offsetParent !== null) img.loading = 'eager'
      }
    })
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Array.from(document.images)
              .filter((img) => img.offsetParent !== null)
              .every((img) => img.complete && img.naturalWidth > 0),
          ),
        { timeout: 20_000 },
      )
      .toBe(true)
    // CSS-pixel scale keeps the mobile capture (DPR 2.6) at a sane bitmap size.
    await page.screenshot({
      path: `test-results/screenshots/${testInfo.project.name}-${lang}.png`,
      fullPage: true,
      scale: 'css',
    })
  })
}
