// TC-018: initial JS budget (CLAUDE.md rule 3) — every script the production build sends
// for `/` on load, summed as encoded (gzip) bytes, must stay within 250 KB. The fixture keeps
// the 3D layer off here, so its lazy chunk is never requested; three.spec.ts checks, with the
// 3D on, that no 3D code is among the scripts loaded before `load` (TC-055).
//
// @chromium (M5): an encoded-size budget. Each engine fills request.sizes() from a different
// source, so the gate is measured once, in Chromium.
import { expect, test } from './fixtures'

const BUDGET_BYTES = 250 * 1024

test('initial JS stays within 250 KB gzipped @chromium', async ({ page }, testInfo) => {
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
