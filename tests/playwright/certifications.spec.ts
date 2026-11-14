// v1.1: the certificate coverflow (components/ui/CoverflowCarousel, DESIGN §4.8). TC-105 to TC-116
// in docs/QA-PLAN.md. Runs in every browser project; only the real-touch tests (CDP) are @chromium.
//
// The ring is painted straight to the DOM: `gotoCoverflow` waits for the first paint, which also
// proves the page has hydrated. Side cards are 3D-projected, so points on them come from
// elementFromPoint (at 390 the arrows cover a neighbour's centre) and sizes from offsetWidth.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { certifications } from '../../content/certifications'
import en from '../../content/en'
import id from '../../content/id'
import { COVERFLOW } from '../../lib/coverflow'
import { belowMd, hasNoHorizontalOverflow, selectLang } from './helpers'

type Copy = typeof en

const frame = (page: Page) => page.locator('#certifications .cf-frame')
const cards = (page: Page) => page.locator('#certifications .cf-card')
const current = (page: Page) => page.locator('#certifications .cf-card[aria-current="true"]')
const caption = (page: Page) => page.locator('#certifications .cf-caption-live')
const dialog = (page: Page, copy: Copy = en) =>
  page.getByRole('dialog', { name: copy.lightbox.label })
const openDialogs = (page: Page) => page.locator('dialog[open]')
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const dot = (page: Page, n: number, copy: Copy = en) =>
  button(page, copy.certifications.carousel.goTo.replace('{n}', String(n)))
const title = (index: number, copy: Copy = en) =>
  copy.certifications.items[certifications[index].id].title

/** The selected card's index, 0-based, as a string. */
const currentIndex = (page: Page) => current(page).getAttribute('data-cf-index')

/** Loads `/` and brings the ring on screen; a visible, placed centre card proves the first paint. */
async function gotoCoverflow(page: Page): Promise<void> {
  await page.goto('/')
  await frame(page).scrollIntoViewIfNeeded()
  await expect(current(page)).toBeVisible()
  await expect
    .poll(() => current(page).evaluate((card) => (card as HTMLElement).style.transform))
    .not.toBe('')
}

/** Card width × (1 + gap): one step of the ring, px. */
function pitch(page: Page): Promise<number> {
  return cards(page)
    .first()
    .evaluate((card, gap) => (card as HTMLElement).offsetWidth * (1 + gap), COVERFLOW.gap)
}

/** A point inside the frame where card `index` (its open button, for the centre) is on top. */
async function pointOnCard(page: Page, index: number): Promise<{ x: number; y: number }> {
  const point = await page.evaluate((i) => {
    const card = document.querySelector(`#certifications .cf-card[data-cf-index="${i}"]`)!
    const box = card.getBoundingClientRect()
    const area = document.querySelector('#certifications .cf-frame')!.getBoundingClientRect()
    for (const fy of [0.5, 0.35, 0.65, 0.25, 0.75])
      for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9]) {
        const x = box.left + box.width * fx
        const y = box.top + box.height * fy
        if (x < Math.max(area.left, 0) + 2 || x > Math.min(area.right, innerWidth) - 2) continue
        if (document.elementFromPoint(x, y)?.closest('.cf-card') === card) return { x, y }
      }
    return null
  }, index)
  expect(point, `a point on card ${index}`).not.toBeNull()
  return point!
}

/** A mouse drag of `dx` px from `from`; `hold` ms of stillness before the release. */
async function mouseDrag(
  page: Page,
  from: { x: number; y: number },
  dx: number,
  { steps, hold }: { steps: number; hold: number },
): Promise<void> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + dx, from.y, { steps })
  if (hold) await page.waitForTimeout(hold)
  await page.mouse.up()
}

/** Waits until card `index`'s transform holds still for 300 ms, and returns it. */
async function settledTransform(page: Page, index: number): Promise<string> {
  const read = () =>
    cards(page)
      .nth(index)
      .evaluate((card) => (card as HTMLElement).style.transform)
  let last = ''
  await expect
    .poll(
      async () => {
        const first = await read()
        await page.waitForTimeout(300)
        last = await read()
        return first === last
      },
      { timeout: 10_000, intervals: [0] },
    )
    .toBe(true)
  return last
}

/** Dispatches ArrowRight on the frame in the page and returns card 2's transform 50 ms later. */
function transformAfter50ms(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const ring = document.querySelector<HTMLElement>('#certifications .cf-frame')!
    const card = document.querySelector<HTMLElement>('#certifications .cf-card[data-cf-index="1"]')!
    ring.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 50))
    return card.style.transform
  })
}

/** Frames per second the page paints at, over half a second (as polaroid.spec.ts). */
function frameRate(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let frames = 0
        const start = performance.now()
        const tick = (now: number) => {
          frames += 1
          if (now - start < 500) requestAnimationFrame(tick)
          else resolve((frames * 1000) / (now - start))
        }
        requestAnimationFrame(tick)
      }),
  )
}

test.describe('certificate coverflow', () => {
  // TC-105
  test('renders four slides with the newest in the centre, captioned', async ({ page }) => {
    const labels = en.certifications.carousel
    await gotoCoverflow(page)
    const region = page.getByRole('region', { name: labels.label })
    await expect(region).toHaveAttribute('aria-roledescription', 'carousel')
    const ring = page.getByRole('group', { name: labels.frame, exact: true })
    await expect(ring).toHaveClass(/\bcf-frame\b/)
    await expect(ring).toHaveAttribute('tabindex', '0')

    await expect(cards(page)).toHaveCount(4)
    for (let n = 0; n < 4; n++) {
      const card = cards(page).nth(n)
      await expect(card).toHaveAttribute('role', 'group')
      await expect(card).toHaveAttribute('aria-roledescription', 'slide')
      await expect(card).toHaveAttribute(
        'aria-label',
        labels.slide.replace('{n}', String(n + 1)).replace('{count}', '4'),
      )
    }
    // Newest first: RevoU, selected and the only card with the open button.
    expect(certifications[0].id).toBe('revou-intro-software-engineering')
    await expect(current(page)).toHaveCount(1)
    expect(await currentIndex(page)).toBe('0')
    await expect(page.locator('#certifications .cf-open')).toHaveCount(1)
    await expect(current(page).locator('.cf-open')).toHaveAttribute(
      'aria-label',
      labels.openCurrent,
    )

    await expect(caption(page).locator('h3')).toHaveText(title(0))
    await expect(caption(page).locator('p')).toHaveText('RevoU Coding Camp · September 2026')
    await expect(caption(page).locator('dt')).toHaveText(['No.', en.certifications.scope])
    await expect(caption(page).locator('dd')).toHaveText([
      'CCSE-210926-01-1-00047',
      en.certifications.items['revou-intro-software-engineering'].scope,
    ])

    await expect(dot(page, 1)).toHaveAttribute('aria-current', 'true')
    for (const n of [2, 3, 4]) await expect(dot(page, n)).not.toHaveAttribute('aria-current')

    // Portrait 3:4 from layout boxes (transforms ignored), certificates whole, no shadow.
    const sizes = await cards(page).evaluateAll((list) =>
      list.map((card) => [(card as HTMLElement).offsetWidth, (card as HTMLElement).offsetHeight]),
    )
    for (const [w, h] of sizes) expect(Math.abs(h - (w * 4) / 3)).toBeLessThanOrEqual(1)
    const styles = await cards(page).evaluateAll((list) =>
      list.map((card) => ({
        shadow: getComputedStyle(card).boxShadow,
        shot: getComputedStyle(card.querySelector('.cf-shot')!).objectFit,
        backdrop: getComputedStyle(card.querySelector('.cf-backdrop')!).objectFit,
        filter: getComputedStyle(card.querySelector('.cf-backdrop')!).filter,
      })),
    )
    for (const style of styles) {
      expect(style.shadow).toBe('none')
      expect(style.shot).toBe('contain')
      expect(style.backdrop).toBe('cover')
      expect(style.filter).toContain('blur(22px)')
    }

    // Dots: muted-on-dark at full opacity (WCAG 1.4.11), the current one a wider pill.
    const marks = await page.locator('#certifications .cf-dot').evaluateAll((list) =>
      list.map((element) => {
        const mark = getComputedStyle(element, '::before')
        return { color: mark.backgroundColor, opacity: mark.opacity, width: parseFloat(mark.width) }
      }),
    )
    for (const mark of marks.slice(1)) {
      expect(mark).toMatchObject({ color: 'rgb(167, 160, 158)', opacity: '1' })
      expect(marks[0].width).toBeGreaterThan(mark.width)
    }
  })

  // TC-106
  test('the frame takes Tab, ←/→ step, and Enter opens the centre card', async ({ page }) => {
    const labels = en.certifications.carousel
    await gotoCoverflow(page)
    await button(page, labels.prev).focus()
    await page.keyboard.press('Shift+Tab')
    await expect(frame(page)).toBeFocused()
    expect(await frame(page).evaluate((element) => element.matches(':focus-visible'))).toBe(true)
    await expect(frame(page)).toHaveCSS('outline-style', 'solid')
    await expect(frame(page)).toHaveCSS('outline-width', '2px')
    await expect(frame(page)).toHaveCSS('outline-color', 'rgb(217, 99, 75)')
    await expect(frame(page)).toHaveCSS('outline-offset', '2px')

    const before = await page.evaluate(() => window.scrollY)
    await page.keyboard.press('ArrowRight')
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await expect(caption(page).locator('h3')).toHaveText(title(1))
    await expect(dot(page, 2)).toHaveAttribute('aria-current', 'true')
    expect(await page.evaluate(() => window.scrollY)).toBe(before)
    await page.keyboard.press('ArrowLeft')
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')

    // Enter's keypress must not reach the dialog's Close button, which has focus by then.
    await page.keyboard.press('Enter')
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page).getByRole('button', { name: en.lightbox.close })).toBeFocused()
    await page.waitForTimeout(300)
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page)).toContainText('1 / 4')
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    await expect(frame(page)).toBeFocused()
  })

  // TC-107
  test('the arrow buttons and the dots move the ring, which loops', async ({ page }) => {
    const labels = en.certifications.carousel
    await gotoCoverflow(page)
    for (const control of [
      button(page, labels.prev),
      button(page, labels.next),
      ...[1, 2, 3, 4].map((n) => dot(page, n)),
    ]) {
      const box = (await control.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    await button(page, labels.next).click()
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await expect(dot(page, 2)).toHaveAttribute('aria-current', 'true')
    await dot(page, 4).click()
    await expect(current(page)).toHaveAttribute('data-cf-index', '3')
    await expect(caption(page).locator('h3')).toHaveText(title(3))
    // Loop on: from the last certificate, Next comes round to the newest.
    await button(page, labels.next).click()
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')
    await button(page, labels.prev).click()
    await expect(current(page)).toHaveAttribute('data-cf-index', '3')
  })

  // TC-108
  test('a mouse drag of 1.1 cards, held still, advances exactly one card', async ({ page }) => {
    await gotoCoverflow(page)
    const step = await pitch(page) // 273 px at 1440, so the drag is the brief's 300 px
    await mouseDrag(page, await pointOnCard(page, 0), -1.1 * step, { steps: 12, hold: 150 })
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await expect(frame(page)).toHaveAttribute('data-drag', '0')
    await page.waitForTimeout(300)
    await expect(openDialogs(page)).toHaveCount(0)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    // The press focused the frame, and it still has focus: the keys work straight away.
    await expect(frame(page)).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(current(page)).toHaveAttribute('data-cf-index', '2')
    // Nothing in the frame starts a text selection.
    const select = await frame(page).evaluate((element) => {
      const style = getComputedStyle(element) as CSSStyleDeclaration & {
        webkitUserSelect?: string
      }
      return style.userSelect || style.webkitUserSelect
    })
    expect(select).toBe('none')
  })

  // TC-109
  test('a click on the centre card opens it; a side card only turns to the centre', async ({
    page,
  }) => {
    await gotoCoverflow(page)
    await button(page, en.certifications.carousel.openCurrent).click()
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page)).toContainText('1 / 4')
    await expect(dialog(page).getByRole('img')).toHaveAttribute('src', /cert-revou/)
    await expect(dialog(page).locator('figcaption > span').first()).toHaveText(title(0))
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    // Back on the frame, in WebKit too, where a click does not focus (2026-11-13 Safari fix).
    await expect(frame(page)).toBeFocused()

    const neighbour = await pointOnCard(page, 1)
    await page.mouse.click(neighbour.x, neighbour.y)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await page.waitForTimeout(300)
    await expect(openDialogs(page)).toHaveCount(0)

    // The frame's padding is not a card: nothing happens.
    const area = (await frame(page).boundingBox())!
    await page.mouse.click(area.x + area.width / 2, area.y + 10)
    await page.waitForTimeout(300)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await expect(openDialogs(page)).toHaveCount(0)
  })

  // TC-111
  test('vertical scrolling and pinch-zoom stay the browser’s; no sideways scroll', async ({
    page,
    viewport,
  }) => {
    await gotoCoverflow(page)
    await expect(frame(page)).toHaveCSS('touch-action', 'pan-y pinch-zoom')
    if (belowMd(viewport)) expect(await hasNoHorizontalOverflow(page)).toBe(true)
  })

  // TC-112
  test('the blurred backdrops are hidden from assistive tech and request at most 128 px', async ({
    page,
  }) => {
    await gotoCoverflow(page)
    // Loaded as they are (no switch to eager, which can re-select a larger cached candidate).
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Array.from(
              document.querySelectorAll<HTMLImageElement>('#certifications .cf-frame img'),
            ).every((img) => img.complete && img.naturalWidth > 0),
          ),
        { timeout: 15_000 },
      )
      .toBe(true)
    const backdrops = page.locator('#certifications .cf-backdrop')
    await expect(backdrops).toHaveCount(4)
    const found = await backdrops.evaluateAll((list) =>
      list.map((img) => ({
        hidden: img.getAttribute('aria-hidden'),
        alt: img.getAttribute('alt'),
        src: (img as HTMLImageElement).currentSrc,
      })),
    )
    for (const backdrop of found) {
      expect(backdrop.hidden).toBe('true')
      expect(backdrop.alt).toBe('')
      const width = Number(new URL(backdrop.src).searchParams.get('w'))
      expect(Number.isFinite(width) && width > 0, backdrop.src).toBe(true)
      expect(width, backdrop.src).toBeLessThanOrEqual(128)
    }
  })

  // TC-113
  test('switching to Indonesian keeps the card and translates every label', async ({ page }) => {
    const labels = id.certifications.carousel
    await gotoCoverflow(page)
    await button(page, en.certifications.carousel.next).click()
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await selectLang(page, 'ID')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await expect(current(page)).toHaveAttribute('aria-label', '2 dari 4')
    await expect(page.getByRole('region', { name: labels.label })).toBeVisible()
    await expect(page.getByRole('group', { name: labels.frame, exact: true })).toHaveCount(1)
    for (const name of [labels.prev, labels.next, labels.openCurrent])
      await expect(button(page, name)).toHaveCount(1)
    await expect(dot(page, 2, id)).toHaveAttribute('aria-current', 'true')
    await expect(caption(page).locator('h3')).toHaveText(title(1, id))
    await expect(caption(page).locator('dt')).toHaveText(['No.', id.certifications.scope])
  })

  // TC-114: PolaroidLine's pointer rules, cross-engine with dispatched events and the mouse.
  test('a cancelled touch on a side card is not a click', async ({ page }) => {
    await gotoCoverflow(page)
    await cards(page)
      .nth(1)
      .evaluate((card) => {
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
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')
    await expect(openDialogs(page)).toHaveCount(0)
  })

  test('a press that leaves the frame ends there', async ({ page }) => {
    await gotoCoverflow(page)
    const box = (await frame(page).boundingBox())!
    const x = box.x + box.width / 2
    await page.mouse.move(x, box.y + box.height / 2)
    await page.mouse.down()
    // Straight up and out: no movement across, so it never became a drag.
    await page.mouse.move(x, Math.max(1, box.y - 20), { steps: 4 })
    await page.mouse.up()
    await page.mouse.move(x - 160, box.y + box.height / 2, { steps: 8 })
    await expect(frame(page)).toHaveAttribute('data-drag', '0')
    await page.waitForTimeout(400)
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')
    await expect(openDialogs(page)).toHaveCount(0)
  })

  test('a drag whose release was lost ends on the next mouse move', async ({ page }) => {
    await gotoCoverflow(page)
    // The mouse's pointerId differs per engine (1 in Chromium and WebKit, 0 in Gecko): remember
    // the real press's, so the dispatched move reads as the same pointer.
    await frame(page).evaluate((element) => {
      element.addEventListener(
        'pointerdown',
        (event) =>
          element.setAttribute('data-test-pointer', String((event as PointerEvent).pointerId)),
        { once: true, capture: true },
      )
    })
    const start = await pointOnCard(page, 0)
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    await page.mouse.move(start.x - 40, start.y, { steps: 4 })
    await expect(frame(page)).toHaveAttribute('data-drag', '1')
    await frame(page).evaluate((element) => {
      const pointerId = Number(element.getAttribute('data-test-pointer'))
      const init = { bubbles: true, composed: true, pointerId, pointerType: 'mouse', buttons: 0 }
      element.dispatchEvent(new PointerEvent('pointermove', init))
    })
    await expect(frame(page)).toHaveAttribute('data-drag', '0')
    await page.mouse.up()
    await page.waitForTimeout(300)
    await expect(openDialogs(page)).toHaveCount(0)
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')
  })
})

// TC-110 (CLAUDE.md rule 5): under reduced motion the ring jumps, the caption does not fade and
// a release never throws. The motion controls below show each check can fail.
test.describe('certificate coverflow under reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('the ring jumps, the caption does not fade, a flick does not throw', async ({ page }) => {
    await gotoCoverflow(page)
    const early = await transformAfter50ms(page)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    expect(early).toBe(await settledTransform(page, 1))
    await expect(caption(page).locator('.cf-caption-body')).toHaveCSS('animation-name', 'none')

    // The same fast flick as the motion control, released at once: exactly one card on.
    const step = await pitch(page)
    await mouseDrag(page, await pointOnCard(page, 1), -1.1 * step, { steps: 4, hold: 0 })
    await expect(current(page)).toHaveAttribute('data-cf-index', '2')
    await page.waitForTimeout(300)
    await expect(current(page)).toHaveAttribute('data-cf-index', '2')
  })
})

test.describe('certificate coverflow with motion (controls for TC-110)', () => {
  test('the ring eases, the caption fades in, and a flick throws at most two cards', async ({
    page,
  }) => {
    await gotoCoverflow(page)
    // The ease runs about 45 frames, and the throw needs moves at a real frame rate (as TC-038):
    // measured, not assumed. Playwright's WebKit paints this page at about 4–13 fps.
    const fps = await frameRate(page)
    test.info().annotations.push({ type: 'fps', description: fps.toFixed(0) })
    test.skip(fps < 30, `the page paints at ${fps.toFixed(0)} fps; the controls assume 30 or more`)

    const early = await transformAfter50ms(page)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    expect(early).not.toBe(await settledTransform(page, 1))
    await expect(caption(page).locator('.cf-caption-body')).toHaveCSS(
      'animation-name',
      'cf-caption-in',
    )

    const step = await pitch(page)
    await mouseDrag(page, await pointOnCard(page, 1), -1.1 * step, { steps: 4, hold: 0 })
    // From index 1, 1.1 cards on is 2.1: without a throw it lands on index 2. Thrown, at most two
    // cards more: 3, or 4, which is index 0 on the ring of four.
    await expect(current(page)).toHaveAttribute('data-cf-index', /^[30]$/)
  })
})

// TC-115: Playwright's cross-browser touch input is a tap; the phone projects run these.
test.describe('certificate coverflow under touch', () => {
  test.beforeEach(async ({ hasTouch }) => {
    test.skip(!hasTouch, 'needs touch emulation')
  })

  test('a tap on the centre card opens it, a tap on a side card turns it', async ({ page }) => {
    await gotoCoverflow(page)
    await button(page, en.certifications.carousel.openCurrent).tap()
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page)).toContainText('1 / 4')
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    await expect(frame(page)).toBeFocused()

    const neighbour = await pointOnCard(page, 1)
    await page.touchscreen.tap(neighbour.x, neighbour.y)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await page.waitForTimeout(300)
    await expect(openDialogs(page)).toHaveCount(0)
  })
})

// TC-116: real touch through CDP (the phone project has hasTouch): the browser makes its own pan
// and zoom decisions and fires its own pointer events, which dispatched PointerEvents cannot. CDP
// exists only in Chromium, hence @chromium (docs/DECISIONS.md 2026-11-13).
test.describe('certificate coverflow under real touch', () => {
  test.beforeEach(async ({ hasTouch }) => {
    test.skip(!hasTouch, 'needs touch emulation')
  })

  type Point = { x: number; y: number; id: number }

  async function touch(page: Page) {
    const cdp = await page.context().newCDPSession(page)
    return (type: 'touchStart' | 'touchMove' | 'touchEnd', touchPoints: Point[]) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints })
  }

  test('a vertical swipe from a side card scrolls the page and turns nothing @chromium', async ({
    page,
  }) => {
    await gotoCoverflow(page)
    const { x, y } = await pointOnCard(page, 1)
    const before = await page.evaluate(() => window.scrollY)
    const send = await touch(page)
    await send('touchStart', [{ x, y, id: 0 }])
    for (let step = 1; step <= 8; step++) {
      await send('touchMove', [{ x, y: y - step * 30, id: 0 }])
      await page.waitForTimeout(16)
    }
    await send('touchEnd', [])
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before)
    await page.waitForTimeout(500)
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')
    await expect(openDialogs(page)).toHaveCount(0)
  })

  test('a pinch on the ring zooms the page and leaves the ring alone @chromium', async ({
    page,
  }) => {
    await gotoCoverflow(page)
    const area = (await frame(page).boundingBox())!
    const y = area.y + area.height / 2
    const middle = area.x + area.width / 2
    const send = await touch(page)
    await send('touchStart', [
      { x: middle - 30, y, id: 0 },
      { x: middle + 30, y, id: 1 },
    ])
    for (let step = 1; step <= 15; step++) {
      await send('touchMove', [
        { x: middle - 30 - step * 8, y, id: 0 },
        { x: middle + 30 + step * 8, y, id: 1 },
      ])
      await page.waitForTimeout(16)
    }
    await send('touchEnd', [])
    await expect.poll(() => page.evaluate(() => window.visualViewport!.scale)).toBeGreaterThan(1)
    await page.waitForTimeout(800)
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')
  })

  // A second finger landing on the ring sends the frame a non-primary pointerdown. One landing on
  // an arrow (a sibling of the frame) sends it nothing, but the page zooms and the first finger's
  // coordinates with it (they grew to x ≈ 600 at scale 5 before the scale check).
  for (const [where, fraction] of [
    ['on the ring', 0.25],
    ['on the Previous arrow', 0.5],
  ] as const) {
    test(`a second finger landing ${where} during a drag ends it without a throw @chromium`, async ({
      page,
    }) => {
      await gotoCoverflow(page)
      const box = (await frame(page).boundingBox())!
      const y = box.y + box.height / 2
      const start = box.x + box.width / 2
      const other = { x: box.x + 30, y: box.y + box.height * fraction }
      const send = await touch(page)
      await send('touchStart', [{ x: start, y, id: 0 }])
      for (let step = 1; step <= 4; step++) {
        await send('touchMove', [{ x: start + step * 6, y, id: 0 }])
        await page.waitForTimeout(16)
      }
      await expect(frame(page)).toHaveAttribute('data-drag', '1')
      const moved = start + 24
      await send('touchStart', [
        { x: moved, y, id: 0 },
        { ...other, id: 1 },
      ])
      for (let step = 1; step <= 15; step++) {
        await send('touchMove', [
          { x: moved + step * 8, y, id: 0 },
          { x: other.x - step, y: other.y, id: 1 },
        ])
        await page.waitForTimeout(16)
      }
      await send('touchEnd', [])
      await expect(frame(page)).toHaveAttribute('data-drag', '0')
      await page.waitForTimeout(800)
      // The 24 px before the second finger landed is all the ring ever saw: under half a card.
      await expect(current(page)).toHaveAttribute('data-cf-index', '0')
    })
  }
})
