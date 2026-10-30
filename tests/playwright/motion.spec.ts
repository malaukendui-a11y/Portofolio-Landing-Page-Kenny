// M2 motion: TC-022 (Lenis + anchor navigation), TC-023 (marquee), TC-024 (reduced-motion
// path), TC-027 (reveals + SplitText).
import { expect, test, type Page } from '@playwright/test'
import en from '../../content/en'
import id from '../../content/id'
import { revealAll, selectLang } from './helpers'

const statementText = (copy: typeof en) => copy.intro.statement.map((part) => part.text).join('')

const LENIS = /(^|\s)lenis(\s|$)/

/** True once the section's top sits at the viewport top, or the page cannot scroll further. */
async function reached(page: Page, id: string): Promise<boolean> {
  return page.evaluate((sectionId) => {
    const top = document.getElementById(sectionId)!.getBoundingClientRect().top
    const root = document.documentElement
    const atBottom = window.scrollY >= root.scrollHeight - window.innerHeight - 2
    return Math.abs(top) <= 2 || (top > 0 && atBottom)
  }, id)
}

/** Waits for the section to be reached and for Lenis to settle before the next action. */
async function expectAt(page: Page, id: string): Promise<void> {
  await expect.poll(() => reached(page, id), { timeout: 5_000 }).toBe(true)
  await expect(page.locator('html')).not.toHaveClass(/lenis-scrolling/)
  await expect(page).toHaveURL(new RegExp(`#${id}$`))
}

/** Loads `/` and waits for hydration: MotionRoot has started Lenis. */
async function gotoWithLenis(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(LENIS)
}

test.describe('anchor navigation (Lenis)', () => {
  test('nav links reach their sections and move focus there', async ({ page }, testInfo) => {
    await gotoWithLenis(page)
    const mobile = testInfo.project.name === 'mobile'
    for (const [label, id] of [
      [en.nav.work, 'work'],
      [en.nav.about, 'about'],
      [en.nav.contact, 'contact'],
    ] as const) {
      if (mobile) {
        await page.getByRole('button', { name: en.nav.openMenu }).click()
        await page.locator('#mobile-menu').getByRole('link', { name: label }).click()
        await expect(page.locator('#mobile-menu')).toBeHidden()
      } else {
        await page.locator('header').getByRole('link', { name: label, exact: true }).click()
      }
      await expectAt(page, id)
      await expect(page.locator(`#${id}`)).toBeFocused()
    }
  })

  test('footer links, "See my work" and back-to-top reach their sections', async ({ page }) => {
    await gotoWithLenis(page)
    await page.locator('#about').getByRole('link', { name: en.intro.seeWork }).click()
    await expectAt(page, 'work')

    for (const [label, id] of [
      [en.nav.about, 'about'],
      [en.nav.contact, 'contact'],
    ] as const) {
      await page.locator('footer').getByRole('link', { name: label }).click()
      await expectAt(page, id)
    }

    await page.locator('#contact').getByRole('link', { name: en.reachOut.backToTop }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBe(0)
    await expect(page).toHaveURL(/#top$/)
  })
})

test.describe('marquee', () => {
  const track = (page: Page, section: string) =>
    page.locator(`#${section} [data-marquee] > .marquee-track`)
  const translateX = (page: Page, section: string) =>
    track(page, section).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)

  test('hero marquee loops at the token speed; Reach Out runs in reverse', async ({
    page,
  }, testInfo) => {
    await page.goto('/')
    const hero = track(page, 'top')
    await expect(hero).toHaveCSS('animation-name', 'marquee')
    await expect(hero).toHaveCSS(
      'animation-duration',
      testInfo.project.name === 'mobile' ? '28s' : '40s',
    )
    await expect(hero).toHaveCSS('animation-play-state', 'running')
    // The track moves left (a cold browser can take a moment to produce frames).
    const before = await translateX(page, 'top')
    await expect.poll(() => translateX(page, 'top')).toBeLessThan(before)

    await expect(track(page, 'contact')).toHaveCSS('animation-direction', 'reverse')
  })

  test('pauses while the tab is hidden and while off-screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#top [data-marquee]')).not.toHaveAttribute('data-paused')
    // Reach Out is far below the fold at load.
    await expect(page.locator('#contact [data-marquee]')).toHaveAttribute('data-paused')

    const setHidden = (hidden: boolean) =>
      page.evaluate((value) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => value })
        document.dispatchEvent(new Event('visibilitychange'))
      }, hidden)
    await setHidden(true)
    await expect(track(page, 'top')).toHaveCSS('animation-play-state', 'paused')
    await setHidden(false)
    await expect(track(page, 'top')).toHaveCSS('animation-play-state', 'running')

    await page.locator('#contact [data-marquee]').scrollIntoViewIfNeeded()
    await expect(page.locator('#contact [data-marquee]')).not.toHaveAttribute('data-paused')
  })
})

test.describe('reveals', () => {
  test('labels and headings below the fold fade up once on enter', async ({ page }) => {
    await gotoWithLenis(page)
    const label = page.locator('#experience [data-reveal]').first()
    await expect(label).toHaveCSS('opacity', '0')
    await label.scrollIntoViewIfNeeded()
    await expect(label).toHaveCSS('opacity', '1')
    await expect(label).toHaveCSS('transform', 'none')
  })

  test('the Intro statement splits into lines, then reverts to plain markup', async ({ page }) => {
    await gotoWithLenis(page)
    const statement = page.locator('#intro-statement')
    await expect(statement.locator('div').first()).toBeAttached() // split, waiting below the fold
    await statement.scrollIntoViewIfNeeded()
    await expect(statement.locator('div')).toHaveCount(0)
    await expect(statement).toHaveText(statementText(en))
    await expect(statement).toHaveCSS('opacity', '1')
  })

  test('switching language mid-page keeps the statement intact, with no errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await gotoWithLenis(page)
    // Toggle before the reveal (split DOM in place), then scroll through and back.
    await selectLang(page, 'ID')
    await expect(page.locator('#intro-statement')).toHaveText(statementText(id))
    await revealAll(page)
    await selectLang(page, 'EN')
    await expect(page.locator('#intro-statement')).toHaveText(statementText(en))
    expect(errors).toEqual([])
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('reveals are an opacity fade only; the statement is never split', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const statement = page.locator('#intro-statement')
    await expect(statement).toHaveCSS('opacity', '0')
    await expect(statement.locator('div')).toHaveCount(0)
    const label = page.locator('#experience [data-reveal]').first()
    await expect(label).toHaveCSS('transform', 'none')
    await revealAll(page)
    await expect(label).toHaveCSS('opacity', '1')
    await expect(statement).toHaveCSS('opacity', '1')
  })

  test('marquees are static: one copy group, no animation', async ({ page }) => {
    await page.goto('/')
    for (const section of ['top', 'contact']) {
      const marquee = page.locator(`#${section} [data-marquee]`)
      await expect(marquee.locator('.marquee-track')).toHaveCSS('animation-name', 'none')
      await expect(marquee.locator('[data-marquee-copy]')).toBeHidden()
    }
  })

  test('no Lenis; anchors are native jumps', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('html')).not.toHaveClass(LENIS)
    await page.locator('footer').getByRole('link', { name: en.nav.contact }).click()
    await expectAt(page, 'contact')
  })
})
