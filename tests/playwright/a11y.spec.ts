// TC-002: axe scan, zero serious/critical violations in both languages.
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const lang of ['en', 'id'] as const) {
  test(`has no serious or critical accessibility violations (${lang})`, async ({ page }) => {
    await page.goto('/')
    if (lang === 'id') {
      await page.getByRole('button', { name: 'ID', exact: true }).click()
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(
      blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`),
      'serious/critical axe violations',
    ).toEqual([])
  })
}
