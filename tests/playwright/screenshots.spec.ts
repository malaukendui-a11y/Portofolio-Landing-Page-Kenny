// TC-016: screenshots for the owner's review (CLAUDE.md §7), written to
// test-results/screenshots/: full pages per viewport and language, plus M2 motion frames
// at 1440 (hero after the entrance, Services and Projects mid-stack).
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { revealAll, selectLang } from './helpers'

// Full-page capture under combined mobile emulation (isMobile + DPR 2.6) drops the
// hero portrait from the bitmap although it is loaded and laid out; capture the same
// 390 px layout without the emulation flags instead (the layout tests keep them).
test.use({ isMobile: false, hasTouch: false, deviceScaleFactor: 1 })

const shot = (name: string) => `test-results/screenshots/${name}.png`

for (const lang of ['en', 'id'] as const) {
  test(`full-page screenshot (${lang})`, async ({ page }, testInfo) => {
    test.slow() // scrolls through every reveal and waits for every lazy image
    await page.goto('/')
    if (lang === 'id') {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    // Play every once-only reveal, then force lazy images to load and wait for them.
    await revealAll(page)
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
    // CSS-pixel scale keeps the mobile capture at a sane bitmap size; the marquee is
    // frozen on its first frame so captures are comparable run to run.
    await page.screenshot({
      path: shot(`${testInfo.project.name}-${lang}`),
      fullPage: true,
      scale: 'css',
      animations: 'disabled',
    })
  })
}

/** Scrolls so card n+1 is `fraction` of the way from the viewport bottom to its sticky top. */
async function midStack(page: Page, section: string, index: number, fraction: number) {
  await page.evaluate(
    ({ section, index, fraction }) => {
      const next = document.querySelectorAll<HTMLElement>(`#${section} article`)[index + 1]
      const stickyTop = parseFloat(getComputedStyle(next).top)
      const goal = window.innerHeight + (stickyTop - window.innerHeight) * fraction
      window.scrollTo(0, window.scrollY + next.getBoundingClientRect().top - goal)
    },
    { section, index, fraction },
  )
  await page.waitForTimeout(400)
}

// TC-071 (M3): the hero with the WebGL marquee and the glass lens, once the lens has faded in.
// No `animations: 'disabled'`: it would call play() on the suspended HTML marquee, detaching it
// from animation-play-state for good. It does not freeze WebGL anyway.
test('1440: hero with the 3D lens @3d', async ({ page, webgl2 }) => {
  test.slow()
  test.skip(!webgl2.available && !process.env.CI, 'this browser has no WebGL2')
  await page.goto('/')
  await expect(page.locator('[data-three]')).toHaveAttribute('data-three', 'ready', {
    timeout: 30_000,
  })
  await expect(page.locator('#top [data-marquee]')).toHaveAttribute('data-suspended', '')
  await page.waitForTimeout(1_000) // the lens fade (dur-base)
  await page.screenshot({ path: shot('desktop-motion-hero-3d') })
})

test.describe('motion frames', () => {
  test.use({ showLoader: true })

  test('1440: hero after the entrance, Services and Projects mid-stack', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'stacking and the WebGL-free hero frame at 1440')
    await page.goto('/')
    await expect(page.locator('.loader-overlay')).toBeHidden({ timeout: 5_000 })
    await expect(page.locator('#hero-portrait')).toHaveCSS('opacity', '1')
    await page.screenshot({ path: shot('desktop-motion-hero') })

    await revealAll(page)
    await midStack(page, 'services', 0, 0.6)
    await page.screenshot({ path: shot('desktop-motion-services') })
    await midStack(page, 'work', 2, 0.6)
    await page.screenshot({ path: shot('desktop-motion-work') })
  })
})
