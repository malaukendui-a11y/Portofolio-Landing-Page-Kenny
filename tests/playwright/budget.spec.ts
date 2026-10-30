// TC-018: initial JS budget (CLAUDE.md rule 3) — every script the production build sends
// for `/` on load, summed as encoded (gzip) bytes, must stay within 250 KB. The lazy 3D
// chunk (M3) will be excluded here by name.
import { expect, test } from '@playwright/test'

const BUDGET_BYTES = 250 * 1024

test('initial JS stays within 250 KB gzipped', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one measurement is enough')
  const scripts: { url: string; bytes: number }[] = []
  page.on('requestfinished', async (request) => {
    if (request.resourceType() !== 'script') return
    const sizes = await request.sizes()
    scripts.push({ url: request.url(), bytes: sizes.responseBodySize })
  })

  await page.goto('/', { waitUntil: 'networkidle' })
  const total = scripts.reduce((sum, script) => sum + script.bytes, 0)
  testInfo.annotations.push({
    type: 'initial-js',
    description: `${scripts.length} scripts, ${(total / 1024).toFixed(1)} KB gzipped`,
  })
  console.log(`initial JS: ${scripts.length} scripts, ${(total / 1024).toFixed(1)} KB gzipped`)
  expect(scripts.length).toBeGreaterThan(0)
  expect(total).toBeLessThanOrEqual(BUDGET_BYTES)
})
