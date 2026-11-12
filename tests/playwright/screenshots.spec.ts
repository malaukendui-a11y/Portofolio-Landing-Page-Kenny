// TC-016: screenshots for the owner's review (CLAUDE.md §7), written to
// test-results/screenshots/: full pages per viewport and language, M2 motion frames at 1440
// (hero after the entrance, Services and Projects mid-stack), and the M4b captures (the PintuKos
// card stuck and covered, the project and QA lightboxes, the QA section, the hero's shoulders).
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
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

// TC-086 (M4a): the 404 page for the owner's review, at 1440 and 390.
test('404 page screenshot', async ({ page }, testInfo) => {
  await page.goto('/this-page-does-not-exist')
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: shot(`${testInfo.project.name}-404`),
    fullPage: true,
    scale: 'css',
    animations: 'disabled',
  })
})

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

    // M4b: the PintuKos card at its sticky top (just stuck, nothing over it yet; TC-092), at
    // 1440 and on a 1366 × 768 laptop; then the next card halfway over it.
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(viewport)
      // Measure in flow: from the section top, before anything sticks.
      await page.evaluate(() => document.getElementById('work')!.scrollIntoView())
      await page.waitForTimeout(400)
      await page.evaluate(() => {
        const card = document.querySelector<HTMLElement>('#work article')!
        const stickyTop = parseFloat(getComputedStyle(card).top)
        window.scrollTo(0, window.scrollY + card.getBoundingClientRect().top - stickyTop)
      })
      await page.waitForTimeout(400)
      await page.screenshot({ path: shot(`desktop-motion-work-pintukos-${viewport.width}`) })
    }
    await midStack(page, 'work', 0, 0.6)
    await page.screenshot({ path: shot('desktop-motion-work-pintukos-covered') })
  })
})

// M4b (TC-016): the PintuKos lightbox at 1440 and 390, in EN and ID.
for (const lang of ['en', 'id'] as const) {
  test(`PintuKos lightbox (${lang})`, async ({ page }, testInfo) => {
    const copy = lang === 'en' ? en : id
    await page.goto('/')
    if (lang === 'id') {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const cover = page.getByRole('button', {
      name: copy.projects.openScreenshots.replace('{title}', copy.projects.items.pintukos.title),
    })
    await cover.scrollIntoViewIfNeeded()
    await cover.click()
    const image = page.getByRole('dialog', { name: copy.lightbox.label }).getByRole('img')
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true)
    await page.screenshot({ path: shot(`${testInfo.project.name}-lightbox-pintukos-${lang}`) })
  })
}

// M4b (owner checklist C-01): the formal portrait's shoulders (rows ~950–1060 of 1600), magnified 2×
// against the paper and the glow. Since batch 2 the file's side edges fade in above the shoulder
// tips (outermost columns' alpha ≤ 6, was 210; layout.spec guards it).
test.describe('hero shoulders', () => {
  test.use({ deviceScaleFactor: 2 })

  test('hero portrait shoulder crop', async ({ page }, testInfo) => {
    await page.goto('/')
    const portrait = page.locator('#hero-portrait')
    await expect
      .poll(() =>
        portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true)
    await page.evaluate(() => document.fonts.ready)
    const box = (await portrait.boundingBox())!
    const pad = 48
    const x = Math.max(0, box.x - pad)
    const clip = {
      x,
      y: box.y + box.height * 0.55,
      width: Math.min(box.x + box.width + pad, page.viewportSize()!.width) - x,
      height: box.height * 0.14,
    }
    await page.screenshot({
      path: shot(`${testInfo.project.name}-hero-shoulders`),
      clip,
      animations: 'disabled',
    })
  })
})

/** Waits until every image inside `selector` has loaded (lazy ones are switched to eager). */
async function imagesLoaded(page: Page, selector: string) {
  await page.evaluate((sel) => {
    for (const img of Array.from(document.querySelectorAll<HTMLImageElement>(`${sel} img`))) {
      img.loading = 'eager'
    }
  }, selector)
  await expect
    .poll(
      () =>
        page.evaluate((sel) => {
          const images = Array.from(document.querySelectorAll<HTMLImageElement>(`${sel} img`))
          return images.length > 0 && images.every((img) => img.complete && img.naturalWidth > 0)
        }, selector),
      { timeout: 20_000 },
    )
    .toBe(true)
}

// M4b batch 2 (TC-016): the QA evidence section and its lightbox on the E2E report, at 1440 and
// 390, in EN and ID.
for (const lang of ['en', 'id'] as const) {
  test(`QA evidence section and lightbox (${lang})`, async ({ page }, testInfo) => {
    const copy = lang === 'en' ? en : id
    await page.goto('/')
    if (lang === 'id') {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const qa = page.locator('#qa')
    await qa.scrollIntoViewIfNeeded()
    await imagesLoaded(page, '#qa')
    await expect
      .poll(() =>
        qa.evaluate((section) =>
          Array.from(section.querySelectorAll('[data-reveal]')).every(
            (element) => getComputedStyle(element).opacity === '1',
          ),
        ),
      )
      .toBe(true)
    // An element capture scrolls under the sticky header, which would be painted mid-section.
    await qa.screenshot({
      path: shot(`${testInfo.project.name}-qa-${lang}`),
      animations: 'disabled',
      style: 'header { visibility: hidden !important; }',
    })

    const tile = qa.getByRole('button', {
      name: copy.qa.artifacts['e2e-report'].title,
      exact: true,
    })
    await tile.click()
    const image = page.getByRole('dialog', { name: copy.lightbox.label }).getByRole('img')
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true)
    await page.screenshot({ path: shot(`${testInfo.project.name}-lightbox-qa-${lang}`) })
  })
}

// M4b batch 2 (TC-016, TC-092): in ID the PintuKos CTA row is widest ("Buka aplikasi · hanya
// undangan" + "Pratinjau"): the card just stuck at its sticky top on a 1280 × 800 window (the row
// wraps there) and on 1024 × 768 (5/7 split, one row).
test('ID: the PintuKos card stuck at 1280 and 1024', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stacking starts at 1024 px')
  await page.goto('/')
  await selectLang(page, 'ID')
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport)
    // Measure in flow: from the section top, before anything sticks.
    await page.evaluate(() => document.getElementById('work')!.scrollIntoView())
    await page.waitForTimeout(400)
    await imagesLoaded(page, '#work article:first-of-type')
    await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>('#work article')!
      const stickyTop = parseFloat(getComputedStyle(card).top)
      window.scrollTo(0, window.scrollY + card.getBoundingClientRect().top - stickyTop)
    })
    await page.waitForTimeout(400)
    await page.screenshot({ path: shot(`desktop-motion-work-pintukos-id-${viewport.width}`) })
  }
})
