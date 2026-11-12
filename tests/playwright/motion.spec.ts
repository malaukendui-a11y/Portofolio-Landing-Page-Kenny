// M2 motion: TC-022 (Lenis + anchor navigation), TC-023 (marquee), TC-024 (reduced-motion
// path), TC-027 (reveals + SplitText). F1: TC-052 (marquee under batched intersection changes).
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import { batchIntersectionChanges, revealAll, scrollOutAndBack, selectLang } from './helpers'

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
  await expect.poll(() => reached(page, id), { timeout: 5_000, intervals: [100] }).toBe(true)
  await expect(page.locator('html')).not.toHaveClass(/lenis-scrolling/)
  await expect(page).toHaveURL(new RegExp(`#${id}$`))
}

/** `#top` means the page top (above the in-flow sticky header), not the hero's top edge. */
async function expectAtTop(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000, intervals: [100] })
    .toBe(0)
  await expect(page.locator('html')).not.toHaveClass(/lenis-scrolling/)
  await expect(page).toHaveURL(/#top$/)
}

/** Loads `/` and waits for hydration: MotionRoot has started Lenis. */
async function gotoWithLenis(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(LENIS)
}

const NAV_SECTIONS = [
  [en.nav.work, 'work'],
  [en.nav.about, 'about'],
  [en.nav.contact, 'contact'],
] as const

/** Clicks a nav link: in the header at 1440, through the menu overlay at 390. */
async function clickNavLink(page: Page, label: string, mobile: boolean): Promise<void> {
  if (mobile) {
    await page.getByRole('button', { name: en.nav.openMenu }).click()
    await page.locator('#mobile-menu').getByRole('link', { name: label }).click()
    await expect(page.locator('#mobile-menu')).toBeHidden()
  } else {
    await page.locator('header').getByRole('link', { name: label, exact: true }).click()
  }
}

test.describe('anchor navigation (Lenis)', () => {
  test('nav links reach their sections and move focus there', async ({ page }, testInfo) => {
    await gotoWithLenis(page)
    const mobile = testInfo.project.name === 'mobile'
    for (const [label, id] of NAV_SECTIONS) {
      await clickNavLink(page, label, mobile)
      await expectAt(page, id)
      await expect(page.locator(`#${id}`)).toBeFocused()
    }
  })

  test('every nav anchor, clicked 20 times in a row, arrives every time', async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000)
    // Count the native safety net in lib/smoothScroll.ts without touching the app: it is
    // the page's only caller of scrollIntoView, so the count shows how often Lenis needed it.
    await page.addInitScript(() => {
      const store = window as unknown as { fallbacks: number }
      store.fallbacks = 0
      const intoView = Element.prototype.scrollIntoView
      Element.prototype.scrollIntoView = function (...args) {
        store.fallbacks += 1
        return intoView.apply(this, args)
      }
    })
    await gotoWithLenis(page)
    const mobile = testInfo.project.name === 'mobile'
    const rounds = 20
    for (let round = 0; round < rounds; round += 1) {
      for (const [label, id] of NAV_SECTIONS) {
        await clickNavLink(page, label, mobile)
        await expectAt(page, id)
      }
      await page.locator('header').getByRole('link', { name: en.nav.brand, exact: true }).click()
      await expectAtTop(page)
    }
    const fallbacks = await page.evaluate(
      () => (window as unknown as { fallbacks: number }).fallbacks,
    )
    testInfo.annotations.push({ type: 'native-fallbacks', description: String(fallbacks) })
    console.log(
      `anchor loop (${testInfo.project.name}): ${rounds * 4} clicks, ${fallbacks} native fallbacks`,
    )
  })

  test('after images load and the page grows, wheeling down reaches the real bottom', async ({
    page,
  }) => {
    await gotoWithLenis(page)
    // Load every lazy image (projects, certificates), as scrolling down would.
    await page.evaluate(() => {
      for (const image of Array.from(document.images)) image.loading = 'eager'
    })
    await expect
      .poll(
        () => page.evaluate(() => Array.from(document.images).every((image) => image.complete)),
        {
          timeout: 15_000,
        },
      )
      .toBe(true)
    // The page then grows after Lenis first measured it (late content, a font swap).
    await page.evaluate(() => {
      document.querySelector('footer')!.style.paddingBottom = '1200px'
    })
    // Keep wheeling, as a visitor would. Each turn is far more than the page, so Lenis aims
    // straight at its limit: a stale limit stops short every time, a current one does not.
    const remaining = () =>
      page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight - window.scrollY,
      )
    await expect
      .poll(
        async () => {
          await page.mouse.wheel(0, 100_000)
          return remaining()
        },
        { timeout: 10_000 },
      )
      .toBeLessThanOrEqual(1)
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

  test('keeps running when an out-and-back arrives batched', async ({ page }) => {
    await batchIntersectionChanges(page)
    await gotoWithLenis(page) // a scroll just before Lenis starts can be undone
    const marquee = page.locator('#contact [data-marquee]')
    await marquee.scrollIntoViewIfNeeded()
    await expect(marquee).not.toHaveAttribute('data-paused')
    await scrollOutAndBack(page, '#contact [data-marquee]')
    await expect(marquee).toBeInViewport()
    await expect(marquee).not.toHaveAttribute('data-paused')
    await expect(track(page, 'contact')).toHaveCSS('animation-play-state', 'running')
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

  test('stacked cards are a plain list', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expectPlainList(page, 'services')
    await expectPlainList(page, 'work')
  })
})

/** Card n's scale (from the computed matrix) and opacity. */
function cardState(page: Page, section: string, index: number) {
  return page
    .locator(`#${section} article`)
    .nth(index)
    .evaluate((card) => {
      const style = getComputedStyle(card)
      return { scale: new DOMMatrix(style.transform).a, opacity: Number(style.opacity) }
    })
}

/** Scrolls so card n+1's top sits `fraction` of the way from the viewport bottom to its sticky top. */
async function bringNextCard(page: Page, section: string, index: number, fraction: number) {
  await page.evaluate(
    ({ section, index, fraction }) => {
      const next = document.querySelectorAll<HTMLElement>(`#${section} article`)[index + 1]
      const stickyTop = parseFloat(getComputedStyle(next).top)
      const from = window.innerHeight
      const goal = from + (stickyTop - from) * fraction
      window.scrollTo(0, window.scrollY + next.getBoundingClientRect().top - goal)
    },
    { section, index, fraction },
  )
}

/** Every card in normal flow, untransformed and opaque after scrolling through. */
async function expectPlainList(page: Page, section: string) {
  const cards = page.locator(`#${section} article`)
  await cards.last().scrollIntoViewIfNeeded()
  for (const card of await cards.all()) {
    await expect(card).not.toHaveCSS('position', 'sticky')
    await expect(card).toHaveCSS('transform', 'none')
    await expect(card).toHaveCSS('opacity', '1')
  }
}

test.describe('stacked cards', () => {
  test('at 1440, card n scales and dims as card n+1 arrives, and recovers', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'stacking starts at 1024 px')
    await gotoWithLenis(page)
    for (const section of ['services', 'work']) {
      await expect(page.locator(`#${section} article`).first()).toHaveCSS('position', 'sticky')

      await bringNextCard(page, section, 0, 0.5)
      await expect
        .poll(async () => {
          const { scale, opacity } = await cardState(page, section, 0)
          return scale < 1 && scale > 0.96 && opacity < 1 && opacity > 0.55
        })
        .toBe(true)

      await bringNextCard(page, section, 0, 1)
      await expect
        .poll(async () => {
          const { scale, opacity } = await cardState(page, section, 0)
          return Math.abs(scale - 0.96) < 0.005 && Math.abs(opacity - 0.55) < 0.02
        })
        .toBe(true)

      // Scrolling back up restores card n.
      await bringNextCard(page, section, 0, 0)
      await expect
        .poll(async () => {
          const { scale, opacity } = await cardState(page, section, 0)
          return scale === 1 && opacity === 1
        })
        .toBe(true)
    }
    // Projects step down 24 px per card.
    const tops = await page
      .locator('#work article')
      .evaluateAll((cards) => cards.map((card) => parseFloat(getComputedStyle(card).top)))
    expect(tops.slice(1).map((top, i) => top - tops[i])).toEqual(tops.slice(1).map(() => 24))
  })

  // TC-031, WCAG 2.2 SC 2.4.11: focus moving backwards lands in a card the later ones cover.
  test('Shift+Tab into a covered card uncovers the focused control', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'stacking starts at 1024 px')
    const focusState = () =>
      page.evaluate(() => {
        const focused = document.activeElement as HTMLElement
        const rect = focused.getBoundingClientRect()
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        )
        return {
          topmost: hit !== null && focused.contains(hit),
          inViewport:
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth,
        }
      })
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(viewport)
      await gotoWithLenis(page)
      const lastControl = page.locator('#work article').last().locator('a, button').last()
      await lastControl.focus()
      await expect(lastControl).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(lastControl).not.toBeFocused()
      await expect
        .poll(focusState, { message: `${viewport.width}x${viewport.height}` })
        .toEqual({ topmost: true, inViewport: true })
    }
  })

  // TC-092: a stuck card taller than the space below its sticky top never shows its bottom
  // (stack rows, the CTA row) while the cards stack, and focus there would stay obscured
  // (WCAG 2.2 SC 2.4.11). Every project card must fit, in both languages.
  test('every project card fits below its sticky top', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'stacking starts at 1024 px')
    await page.goto('/')
    const margins: string[] = []
    for (const lang of ['en', 'id'] as const) {
      if (lang === 'id') {
        await selectLang(page, 'ID')
        await expect(page.locator('html')).toHaveAttribute('lang', 'id')
      }
      for (const viewport of [
        { width: 1440, height: 900 },
        { width: 1366, height: 768 },
        { width: 1280, height: 800 },
        { width: 1024, height: 768 },
      ]) {
        await page.setViewportSize(viewport)
        await page.evaluate(() => document.fonts.ready)
        const cards = page.locator('#work article')
        await expect(cards.first()).toHaveCSS('position', 'sticky')
        // px of each card below the fold while it is stuck (top = its sticky offset).
        const overflow = await cards.evaluateAll((articles: HTMLElement[]) =>
          articles.map((card) =>
            Math.ceil(parseFloat(getComputedStyle(card).top) + card.offsetHeight - innerHeight),
          ),
        )
        const label = `${lang} ${viewport.width}×${viewport.height}`
        margins.push(`${label}: ${-Math.max(...overflow)} px to spare`)
        expect(
          overflow.filter((px) => px > 0),
          `${label}: px below the fold per card ${overflow}`,
        ).toEqual([])
      }
    }
    testInfo.annotations.push({ type: 'card-fit', description: margins.join('; ') })
    console.log(`card fit: ${margins.join('; ')}`)
  })

  test('below 1024 px the cards are a plain list', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'the 390 px layout')
    await page.goto('/')
    await expectPlainList(page, 'services')
    await expectPlainList(page, 'work')
  })
})

// TC-029: hover states (DESIGN §4.4 rows, §5 pill buttons). Tailwind's `hover:` sits behind
// `@media (hover: hover)`, which the touch emulation of the mobile project does not match.
test.describe('hover', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a fine pointer')
  })

  test('pill buttons invert over dur-fast and the arrow slides', async ({ page }) => {
    await page.goto('/')
    const contact = page.locator('#contact')
    const filled = contact.getByRole('link', { name: en.reachOut.ctas.email })
    await expect(filled).toHaveCSS('transition-duration', '0.25s')
    await expect(filled).toHaveCSS('background-color', 'rgb(18, 17, 17)')
    await filled.hover()
    await expect(filled).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(filled).toHaveCSS('color', 'rgb(18, 17, 17)')

    const outlined = contact.getByRole('link', { name: en.reachOut.ctas.whatsapp })
    const arrow = outlined.locator('[data-arrow]')
    await expect(arrow).toHaveCSS('translate', 'none')
    await outlined.hover()
    await expect(outlined).toHaveCSS('background-color', 'rgb(18, 17, 17)')
    await expect(outlined).toHaveCSS('color', 'rgb(230, 227, 222)')
    await expect(arrow).toHaveCSS('translate', '3px -3px')
  })

  test('service rows indent 8 px and the index turns accent', async ({ page }) => {
    await page.goto('/')
    const row = page.locator('#services li').first()
    const [text, index] = [row.locator('span').first(), row.locator('span').last()]
    await row.hover()
    await expect(text).toHaveCSS('translate', '8px')
    await expect(index).toHaveCSS('color', 'rgb(217, 99, 75)')
  })
})
