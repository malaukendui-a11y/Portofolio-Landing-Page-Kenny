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

/** Card `index`'s inline transform, as this engine serialises it. */
function transformOf(page: Page, index: number): Promise<string> {
  return cards(page)
    .nth(index)
    .evaluate((card) => (card as HTMLElement).style.transform)
}

/**
 * A synthetic mouse flick on the frame from rest: `steps` moves adding up to `dx` px, each `gap` ms
 * after the last (busy-waited: constructed events carry their creation time as `timeStamp`, so the
 * velocity does not depend on the frame rate), then a release at once.
 */
function flick(page: Page, dx: number, { steps, gap }: { steps: number; gap: number }) {
  return page.evaluate(
    ({ dx, steps, gap }) => {
      const ring = document.querySelector<HTMLElement>('#certifications .cf-frame')!
      const box = ring.getBoundingClientRect()
      const x = box.left + box.width / 2
      const init = {
        bubbles: true,
        composed: true,
        pointerId: 99,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: 1,
        clientY: box.top + box.height / 2,
      }
      ring.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: x }))
      for (let k = 1; k <= steps; k++) {
        const start = performance.now()
        while (performance.now() - start < gap) {
          // busy-wait: a timer would let the frame rate decide the gap
        }
        ring.dispatchEvent(
          new PointerEvent('pointermove', { ...init, clientX: x + (dx * k) / steps }),
        )
      }
      ring.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0, clientX: x + dx }))
    },
    { dx, steps, gap },
  )
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

    // Three cards show; the one half a turn away (card 3) is hidden, from screen readers too.
    for (const n of [0, 1, 3]) await expect(cards(page).nth(n)).toHaveCSS('visibility', 'visible')
    await expect(cards(page).nth(2)).toBeHidden()
    const slide = (n: number) => labels.slide.replace('{n}', String(n)).replace('{count}', '4')
    await expect(page.getByRole('group', { name: slide(3), exact: true })).toHaveCount(0)
    await expect(page.getByRole('group', { name: slide(2), exact: true })).toHaveCount(1)

    // The caption is quiet until the visitor is in the carousel, then polite.
    await expect(caption(page)).toHaveAttribute('aria-live', 'off')
    await ring.focus()
    await expect(caption(page)).toHaveAttribute('aria-live', 'polite')

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

    // Window listeners run after React's (on the document): they see whether the keys were taken.
    await page.evaluate(() => {
      const seen: [string, boolean][] = []
      ;(window as unknown as { __keys: typeof seen }).__keys = seen
      window.addEventListener('keydown', (event) => seen.push([event.key, event.defaultPrevented]))
    })
    const keys = () => page.evaluate(() => (window as unknown as { __keys: unknown }).__keys)
    await page.keyboard.press('ArrowRight')
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await expect(caption(page).locator('h3')).toHaveText(title(1))
    await expect(dot(page, 2)).toHaveAttribute('aria-current', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')
    expect(await keys()).toEqual([
      ['ArrowRight', true],
      ['ArrowLeft', true],
    ])
    // Alt + ← is the browser's Back: dispatched (a real one could navigate), not taken.
    const taken = await frame(page).evaluate((element) => {
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        altKey: true,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(event)
      return event.defaultPrevented
    })
    expect(taken).toBe(false)
    await page.waitForTimeout(300)
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

    // A screen reader activating the frame itself (a click with detail 0) opens the centre card.
    await frame(page).evaluate((element) =>
      element.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }),
      ),
    )
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page)).toContainText('1 / 4')
    await page.keyboard.press('Escape')
    await expect(frame(page)).toBeFocused()
  })

  // TC-106: the open button (tabIndex -1, reached by a screen reader) shows its ring on the card
  // and hands its focus to the frame when it leaves with the centre card.
  test('the open button is ringed on the card and hands focus back to the frame', async ({
    page,
  }) => {
    await gotoCoverflow(page)
    // Keyboard first, so the script focus below counts as :focus-visible in every engine.
    await button(page, en.certifications.carousel.prev).focus()
    await page.keyboard.press('Shift+Tab')
    await expect(frame(page)).toBeFocused()
    await current(page).locator('.cf-open').focus()
    await expect(current(page)).toHaveCSS('outline-style', 'solid')
    await expect(current(page)).toHaveCSS('outline-color', 'rgb(217, 99, 75)')
    await page.keyboard.press('ArrowRight')
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
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
    const rest = await transformOf(page, 0) // the centre pose, as this engine writes it
    await button(page, en.certifications.carousel.openCurrent).click()
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page)).toContainText('1 / 4')
    await expect(dialog(page).getByRole('img')).toHaveAttribute('src', /cert-revou/)
    await expect(dialog(page).locator('figcaption > span').first()).toHaveText(title(0))
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    // Back on the frame: the press focused it (mousedown), so this holds in every engine.
    await expect(frame(page)).toBeFocused()

    // The trigger path itself (the 2026-11-13 Safari fix): nothing focused, a click with no press,
    // as Safari's tap leaves it; focus must come back to the frame, not <body>.
    await frame(page).evaluate((element) => {
      ;(element as HTMLElement).blur()
      element.querySelector<HTMLElement>('.cf-open')!.click()
    })
    await expect(dialog(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(frame(page)).toBeFocused()

    const neighbour = await pointOnCard(page, 1)
    await page.mouse.click(neighbour.x, neighbour.y)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    // A press in the frame's padding while the ring turns: not a card, so nothing opens, and it
    // must not stop the ring between two cards (the original cancelled the settle on press).
    const area = (await frame(page).boundingBox())!
    await page.mouse.click(area.x + area.width / 2, area.y + 10)
    await expect.poll(() => transformOf(page, 1), { timeout: 20_000 }).toBe(rest)
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
    // The title reads the same in both languages; the subtitle and the scope do not.
    const item = id.certifications.items['gunadarma-designing-software']
    await expect(caption(page).locator('h3')).toHaveText(item.title)
    await expect(caption(page).locator('p')).toHaveText(`${item.issuer} · ${item.period}`)
    await expect(caption(page).locator('dt')).toHaveText(['No.', id.certifications.scope])
    await expect(caption(page).locator('dd').last()).toHaveText(item.scope)
  })

  // TC-114: PolaroidLine's pointer rules, cross-engine with dispatched events and the mouse.
  test('a cancelled touch drag settles where it is, with no throw and no click', async ({
    page,
  }) => {
    await gotoCoverflow(page)
    const step = await pitch(page)
    // Two quick moves, then a cancel within the throw window: a throw would carry two cards.
    const dragging = await frame(page).evaluate(async (element, step) => {
      const box = element.getBoundingClientRect()
      const x = box.left + box.width / 2
      const init = {
        bubbles: true,
        composed: true,
        pointerId: 7,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: 1,
        clientY: box.top + box.height / 2,
      }
      element.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: x }))
      element.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x - 0.3 * step }))
      element.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x - 0.45 * step }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      const state = (element as HTMLElement).dataset.drag
      element.dispatchEvent(new PointerEvent('pointercancel', init))
      return state
    }, step)
    expect(dragging).toBe('1')
    await expect(frame(page)).toHaveAttribute('data-drag', '0')
    await page.waitForTimeout(500)
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')
    await expect(openDialogs(page)).toHaveCount(0)
  })

  test('a press that leaves the frame ends there', async ({ page }) => {
    await gotoCoverflow(page)
    const rest = await transformOf(page, 0)
    const box = (await frame(page).boundingBox())!
    const start = await pointOnCard(page, 0)
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    // Straight up and out, no movement across: not a drag. One more move outside: Playwright's
    // WebKit fires the leave on a later move (polaroid.spec.ts).
    await page.mouse.move(start.x, Math.max(1, box.y - 20), { steps: 4 })
    await page.mouse.move(start.x, Math.max(1, box.y - 40))
    // Back in, the button still down, 60 px across: the press ended, so this is not a drag.
    await page.mouse.move(start.x - 60, start.y, { steps: 6 })
    await expect(frame(page)).toHaveAttribute('data-drag', '0')
    await page.waitForTimeout(400)
    await expect(current(page)).toHaveAttribute('data-cf-index', '0')
    expect(await transformOf(page, 0)).toBe(rest)
    // Released outside, so no click lands on the open button the press began on.
    await page.mouse.move(start.x, Math.max(1, box.y - 20), { steps: 4 })
    await page.mouse.up()
    await page.waitForTimeout(300)
    await expect(openDialogs(page)).toHaveCount(0)
  })

  // A press that moved past 4 px is a drag, and the click it ends with is not a click: for a touch
  // that click can arrive a task or more after the pointerup (tap recognition), so the drag's flag
  // must outlive it (it lasts until the next press).
  for (const late of [false, true]) {
    test(`a drag swallows its own click (${late ? 'a task later' : 'same task'})`, async ({
      page,
    }) => {
      await gotoCoverflow(page)
      await current(page)
        .locator('.cf-open')
        .evaluate(async (open, late) => {
          const box = open.getBoundingClientRect()
          const x = box.left + box.width / 2
          const init = {
            bubbles: true,
            composed: true,
            pointerId: 8,
            pointerType: 'touch',
            isPrimary: true,
            button: 0,
            buttons: 1,
            clientY: box.top + box.height / 2,
          }
          open.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: x }))
          open.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x + 6 }))
          // Held still, so the release does not throw and the ring stays on card 1.
          await new Promise((resolve) => setTimeout(resolve, 150))
          open.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0, clientX: x + 6 }))
          if (late) await new Promise((resolve) => setTimeout(resolve, 50))
          open.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
          )
        }, late)
      await page.waitForTimeout(300)
      await expect(openDialogs(page)).toHaveCount(0)
      await expect(current(page)).toHaveAttribute('data-cf-index', '0')
    })
  }

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
    const rest = await transformOf(page, 0)
    // 50 ms after ArrowRight, card 2 already has the centre pose card 1 had at rest.
    expect(await transformAfter50ms(page)).toBe(rest)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await expect(caption(page).locator('.cf-caption-body')).toHaveCSS('animation-name', 'none')

    // A fast flick of 1.1 cards from rest: exactly one card on (thrown, it would be three).
    await gotoCoverflow(page)
    await flick(page, -1.1 * (await pitch(page)), { steps: 4, gap: 12 })
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await page.waitForTimeout(300)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
  })
})

// The controls run at any frame rate: the first reads 50 ms in, before an ease can finish; the
// flick times its own moves.
test.describe('certificate coverflow with motion (controls for TC-110)', () => {
  test('the ring eases, the caption fades in, and a flick throws two cards at most', async ({
    page,
  }) => {
    await gotoCoverflow(page)
    const rest = await transformOf(page, 0)
    expect(await transformAfter50ms(page)).not.toBe(rest)
    await expect(current(page)).toHaveAttribute('data-cf-index', '1')
    await expect(caption(page).locator('.cf-caption-body')).toHaveCSS(
      'animation-name',
      'cf-caption-in',
    )

    // 1.1 cards in four moves 12 ms apart: about 23 cards a second, a carry of about four cards
    // before the clamp. Clamped to two: round(1.1 + 2) = 3. With no throw, 1; with no clamp, 1 again
    // (round(5.2) = 5 is index 1 on a ring of four).
    await gotoCoverflow(page)
    await flick(page, -1.1 * (await pitch(page)), { steps: 4, gap: 12 })
    await expect(current(page)).toHaveAttribute('data-cf-index', '3')
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
