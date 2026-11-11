// TC-002: axe scan, zero serious/critical violations in both languages (both viewports).
// Every reveal is played first: axe skips content still at opacity 0.
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'
import { revealAll, selectLang } from './helpers'

for (const lang of ['en', 'id'] as const) {
  test(`has no serious or critical accessibility violations (${lang})`, async ({ page }) => {
    test.slow() // a full-page axe scan after scrolling through every reveal
    await page.goto('/')
    if (lang === 'id') {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    await revealAll(page)
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

// TC-085: the 404 page (PRD F-15), both languages.
for (const lang of ['en', 'id'] as const) {
  test(`the 404 page has no serious or critical accessibility violations (${lang})`, async ({
    page,
  }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
    if (lang === 'id') {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    await revealAll(page) // nothing reveals here; it waits out the toggle's colour transition
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

// TC-070: the same scan with the 3D layer mounted (desktop-3d project): the canvas and the
// static lens are aria-hidden, nothing new takes focus, the <h1> still names the hero.
test('has no serious or critical accessibility violations with the 3D hero (en) @3d', async ({
  page,
  webgl2,
}) => {
  test.slow()
  test.skip(!webgl2.available && !process.env.CI, 'this browser has no WebGL2')
  await page.goto('/')
  await expect(page.locator('[data-three]')).toHaveAttribute('data-three', 'ready', {
    timeout: 30_000,
  })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ananda Kenny')
  await revealAll(page)
  await expect(page.locator('[data-three]')).toHaveAttribute('data-three', 'ready')
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
