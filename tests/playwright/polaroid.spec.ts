// F1: the Reach Out polaroid line (DESIGN §4.9). TC-032 to TC-046 in docs/QA-PLAN.md.
//
// Prints sway every frame, so Playwright's stability check never passes on them: cards are
// clicked and dragged with page.mouse at coordinates. `step()` moves from the current active
// index (as in the ported original), so every button press waits for the counter.
import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import { selectLang } from './helpers'

const labels = en.reachOut.polaroids

const root = (page: Page) => page.locator('.pl-root')
const count = (page: Page) => page.locator('.pl-count')
const next = (page: Page) => page.getByRole('button', { name: labels.next })
const previous = (page: Page) => page.getByRole('button', { name: labels.previous })
const activeIndex = (page: Page) => page.locator('.pl-card[data-on="1"]').getAttribute('data-i')

/** Loads `/` and brings the carousel on screen; a visible card proves the first frame ran. */
async function gotoCarousel(page: Page): Promise<void> {
  await page.goto('/')
  await root(page).scrollIntoViewIfNeeded()
  await expect(page.locator('.pl-card[data-on="1"]')).toBeVisible()
}

/** A point on the card, clamped inside the carousel (a side card is partly clipped at 390). */
async function pointOn(page: Page, card: Locator): Promise<{ x: number; y: number }> {
  const box = (await card.boundingBox())!
  const area = (await root(page).boundingBox())!
  return {
    x: Math.min(area.x + area.width - 4, Math.max(area.x + 4, box.x + box.width / 2)),
    y: box.y + box.height / 2,
  }
}

/** Waits out what is left of `ms` since `start`. */
async function waitUntil(page: Page, start: number, ms: number): Promise<void> {
  const left = start + ms - Date.now()
  if (left > 0) await page.waitForTimeout(left)
}

test.describe('polaroid line', () => {
  test('renders six prints with the third one active', async ({ page }) => {
    await gotoCarousel(page)
    await expect(page.locator('.pl-card')).toHaveCount(6)
    await expect(page.locator('.pl-card[data-on="1"]')).toHaveCount(1)
    expect(await activeIndex(page)).toBe('2')
    await expect(count(page)).toHaveText('03 / 06')
    await expect(page.locator('.pl-card[data-on="0"][aria-hidden="true"]')).toHaveCount(5)
    await expect(page.locator('.pl-string')).toHaveAttribute('aria-hidden', 'true')
    await expect(root(page)).toHaveAttribute('aria-roledescription', 'carousel')
    await expect(root(page)).toHaveAttribute('role', 'region')
    await expect(root(page)).toHaveAttribute('aria-label', labels.region)
  })

  test('the arrow buttons step, clamp at both ends and are 44 px targets', async ({ page }) => {
    await gotoCarousel(page)
    for (const button of [next(page), previous(page)]) {
      const box = (await button.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    for (const text of ['04 / 06', '05 / 06', '06 / 06']) {
      await next(page).click()
      await expect(count(page)).toHaveText(text)
    }
    await previous(page).click()
    await expect(count(page)).toHaveText('05 / 06')
    await next(page).click()
    await expect(count(page)).toHaveText('06 / 06')
    await next(page).click()
    await page.waitForTimeout(400)
    await expect(count(page)).toHaveText('06 / 06')
    for (const text of ['05 / 06', '04 / 06', '03 / 06', '02 / 06', '01 / 06']) {
      await previous(page).click()
      await expect(count(page)).toHaveText(text)
    }
    await previous(page).click()
    await page.waitForTimeout(400)
    await expect(count(page)).toHaveText('01 / 06')
  })

  test('clicking a side card centres it', async ({ page }) => {
    await gotoCarousel(page)
    const { x, y } = await pointOn(page, page.locator('.pl-card[data-i="3"]'))
    await page.mouse.click(x, y)
    await expect(count(page)).toHaveText('04 / 06')
    await expect(page.locator('.pl-card[data-i="3"]')).toHaveAttribute('data-on', '1')
  })

  test('ArrowRight on the focused root steps once and does not scroll', async ({ page }) => {
    await gotoCarousel(page)
    // Tab from the last contact control: the DOM order is contact, carousel, socials.
    await page.locator('#contact').getByRole('link', { name: en.reachOut.ctas.whatsapp }).focus()
    await page.keyboard.press('Tab')
    await expect(root(page)).toBeFocused()
    const before = await page.evaluate(() => window.scrollY)
    await page.keyboard.press('ArrowRight')
    await expect(count(page)).toHaveText('04 / 06')
    await page.waitForTimeout(500)
    await expect(count(page)).toHaveText('04 / 06')
    expect(await page.evaluate(() => window.scrollY)).toBe(before)
  })

  test('a 240 px mouse drag changes the active card and settles', async ({ page }) => {
    await gotoCarousel(page)
    const area = (await root(page).boundingBox())!
    const y = area.y + area.height * 0.4
    const startX = area.x + area.width - 30
    await page.mouse.move(startX, y)
    await page.mouse.down()
    await page.mouse.move(startX - 240, y, { steps: 12 })
    await expect(root(page)).toHaveAttribute('data-drag', '1')
    await page.mouse.up()
    await expect(root(page)).toHaveAttribute('data-drag', '0')

    const released = Date.now()
    await expect
      .poll(
        async () => {
          const first = await activeIndex(page)
          await page.waitForTimeout(300)
          const second = await activeIndex(page)
          await page.waitForTimeout(300)
          const third = await activeIndex(page)
          return first === second && second === third && first !== '2'
        },
        { timeout: 1_500, intervals: [0] },
      )
      .toBe(true)
    expect(Date.now() - released).toBeLessThanOrEqual(1_500)
  })

  test('without reduced motion the prints sway', async ({ page }) => {
    await gotoCarousel(page)
    await expect
      .poll(() =>
        page
          .locator('.pl-card[data-on="1"]')
          .evaluate((card) => (card as HTMLElement).style.transform),
      )
      .not.toMatch(/rotate\(0(\.0+)?rad\)/)
  })

  test('autoplay advances by exactly one within 6 s', async ({ page }) => {
    await gotoCarousel(page)
    const start = Date.now()
    await expect(count(page)).toHaveText('03 / 06')
    await expect(count(page)).toHaveText('04 / 06', { timeout: 6_000 })
    await waitUntil(page, start, 6_000)
    await expect(count(page)).toHaveText('04 / 06')
  })

  test('autoplay waits while the mouse rests on the carousel', async ({ page }) => {
    await gotoCarousel(page)
    const area = (await root(page).boundingBox())!
    await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2)
    await page.waitForTimeout(6_000)
    await expect(count(page)).toHaveText('03 / 06')
  })

  test('autoplay waits for keyboard focus, and the status goes live', async ({ page }) => {
    await gotoCarousel(page)
    const status = root(page).locator('[aria-live]')
    await expect(status).toHaveAttribute('aria-live', 'off')
    await page.locator('#contact').getByRole('link', { name: en.reachOut.ctas.whatsapp }).focus()
    await page.keyboard.press('Tab')
    await expect(root(page)).toBeFocused()
    await expect(status).toHaveAttribute('aria-live', 'polite')
    await expect(status).toHaveText('Photo 3 of 6')
    await page.waitForTimeout(6_000)
    await expect(count(page)).toHaveText('03 / 06')
  })

  test('autoplay does not run while the carousel is off-screen', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(6_000)
    await root(page).scrollIntoViewIfNeeded()
    await expect(page.locator('.pl-card[data-on="1"]')).toBeVisible()
    await expect(count(page)).toHaveText('03 / 06')
  })

  test('a vertical swipe on a side card (pointercancel) does not jump', async ({ page }) => {
    await gotoCarousel(page)
    await page.locator('.pl-card[data-i="3"]').evaluate((card) => {
      const init = {
        bubbles: true,
        composed: true,
        pointerId: 7,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: 1,
      }
      card.dispatchEvent(new PointerEvent('pointerdown', init))
      card.dispatchEvent(new PointerEvent('pointercancel', init))
    })
    await page.waitForTimeout(500)
    await expect(count(page)).toHaveText('03 / 06')
  })

  test('releasing the mouse outside the carousel leaves no drag behind', async ({ page }) => {
    await gotoCarousel(page)
    const area = (await root(page).boundingBox())!
    const x = area.x + area.width / 2
    await page.mouse.move(x, area.y + area.height * 0.4)
    await page.mouse.down()
    // Straight up, out of the root: under the 5 px threshold, so nothing captures the pointer.
    await page.mouse.move(x, Math.max(1, area.y - 20), { steps: 4 })
    await page.mouse.up()
    await page.mouse.move(x + 160, area.y + area.height * 0.4, { steps: 8 })
    await expect(root(page)).toHaveAttribute('data-drag', '0')
    await page.waitForTimeout(400)
    await expect(count(page)).toHaveText('03 / 06')
  })

  test('switching language keeps the photo and swaps the copy', async ({ page }) => {
    await gotoCarousel(page)
    await next(page).click()
    await expect(count(page)).toHaveText('04 / 06')
    await selectLang(page, 'ID')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    await expect(count(page)).toHaveText('04 / 06')
    const copy = id.reachOut.polaroids
    await expect(page.getByRole('button', { name: copy.next })).toBeVisible()
    await expect(root(page)).toHaveAttribute('aria-label', copy.region)
    await expect(page.locator('.pl-card[data-on="1"] img')).toHaveAttribute(
      'alt',
      copy.alts['nusa-penida'],
    )
    await expect(root(page).locator('[aria-live]')).toHaveText('Foto 4 dari 6')
  })

  test('a resize keeps the current photo centred', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one resize path is enough')
    await gotoCarousel(page)
    await next(page).click()
    await expect(count(page)).toHaveText('04 / 06')
    await page.setViewportSize({ width: 390, height: 844 })
    await root(page).scrollIntoViewIfNeeded()
    await page.mouse.move(0, 0)
    await expect(count(page)).toHaveText('04 / 06')
    await expect
      .poll(async () => {
        const card = (await page.locator('.pl-card[data-on="1"]').boundingBox())!
        const area = (await root(page).boundingBox())!
        return Math.abs(card.x + card.width / 2 - (area.x + area.width / 2))
      })
      .toBeLessThanOrEqual(8)
    const width = await page
      .locator('.pl-card[data-on="1"]')
      .evaluate((card) => (card as HTMLElement).offsetWidth)
    expect(width).toBe(150)
  })

  test('sits between the ticker and the contact block on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'the order only changes below md')
    await gotoCarousel(page)
    const carousel = (await root(page).boundingBox())!
    const ticker = (await page.locator('#contact [data-marquee]').boundingBox())!
    const heading = (await page.locator('#contact-heading').boundingBox())!
    expect(carousel.y).toBeGreaterThanOrEqual(ticker.y + ticker.height)
    expect(carousel.y + carousel.height).toBeLessThanOrEqual(heading.y)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  })

  test('sends no request to another host while scrolling to #contact', async ({ page }) => {
    const external: string[] = []
    page.on('request', (request) => {
      const { hostname, protocol } = new URL(request.url())
      if (protocol === 'data:') return
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') external.push(request.url())
    })
    await gotoCarousel(page)
    await page.locator('#contact').scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        page
          .locator('.pl-card[data-on="1"] img')
          .evaluate((img) => (img as HTMLImageElement).complete),
      )
      .toBe(true)
    expect(external).toEqual([])
  })
})

// On a busy main thread an IntersectionObserver delivers several changes in one callback,
// oldest first. Found under the full suite: focus scrolled the carousel out and back within
// 40 ms, and the loop read "out" and stopped while the carousel was on screen.
test.describe('polaroid line when intersection changes arrive batched', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const Real = window.IntersectionObserver
      window.IntersectionObserver = class extends Real {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          let held: IntersectionObserverEntry[] = []
          let timer = 0
          super((entries, observer) => {
            held.push(...entries)
            window.clearTimeout(timer)
            timer = window.setTimeout(() => {
              const batch = held
              held = []
              callback(batch, observer)
            }, 200)
          }, options)
        }
      }
    })
  })

  /** Scrolls the carousel out and back, then waits for the batch to be delivered. */
  async function outAndBack(page: Page): Promise<void> {
    await page.evaluate(async () => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
      window.scrollTo(0, 0)
      await frame()
      await frame()
      document.querySelector('.pl-root')!.scrollIntoView({ block: 'center' })
      await frame()
      await frame()
    })
    await page.waitForTimeout(500)
  }

  test('the frame loop keeps running', async ({ page }) => {
    await gotoCarousel(page)
    await page.waitForTimeout(500)
    await outAndBack(page)
    await next(page).focus()
    await page.keyboard.press('Enter')
    await expect(count(page)).toHaveText('04 / 06')
  })

  test('autoplay keeps running', async ({ page }) => {
    await gotoCarousel(page)
    await page.waitForTimeout(500)
    await outAndBack(page)
    await expect(count(page)).toHaveText('04 / 06', { timeout: 6_000 })
  })
})

test.describe('polaroid line under reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('hangs still with no autoplay, and stays operable', async ({ page }) => {
    await gotoCarousel(page)
    await page.waitForTimeout(6_000)
    await expect(count(page)).toHaveText('03 / 06')
    const transforms = await page
      .locator('.pl-card')
      .evaluateAll((cards) =>
        cards.map((card) => (card as HTMLElement).style.transform).filter(Boolean),
      )
    expect(transforms.length).toBeGreaterThan(0)
    // Written as rotate(0.0000rad); the browser serialises the inline style as rotate(0rad).
    for (const transform of transforms) expect(transform).toMatch(/rotate\(0(\.0+)?rad\)/)
    const transition = await page
      .locator('.pl-print')
      .first()
      .evaluate((print) => getComputedStyle(print).transitionProperty)
    expect(transition).toBe('none')
    await expect(root(page).locator('[aria-live]')).toHaveAttribute('aria-live', 'polite')
    await next(page).click()
    await expect(count(page)).toHaveText('04 / 06')
  })
})
