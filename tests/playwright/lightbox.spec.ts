// TC-007: lightbox keyboard flow (PRD F-08) on the certificates, opened from the coverflow's frame
// since v1.1. TC-095 (M4b batch 2): the QA evidence tiles open their lightbox with captions.
import type { Locator } from '@playwright/test'
import { expect, test } from './fixtures'
import { certifications } from '../../content/certifications'
import en from '../../content/en'
import id from '../../content/id'
import { qaArtifacts } from '../../content/qa'
import { selectLang } from './helpers'

type TileGeometry = {
  frame: { width: number; height: number }
  inner: Record<'left' | 'top' | 'right' | 'bottom', number>
  box: Record<'left' | 'top' | 'right' | 'bottom' | 'width' | 'height', number>
  fit: string
  position: string
  natural: { width: number; height: number }
  titleTop: number
}

/**
 * The QA tiles (DESIGN §4.6, M5): each button is a 4:3 frame; its image box is the frame's inner
 * box (nothing it paints is clipped); object-fit contain, centred, so the painted screenshot touches
 * the frame on one axis only and keeps its aspect (from content/qa.ts, not naturalWidth, which is
 * the served candidate); titles in one row start within 1 px of each other.
 */
async function expectFramedTiles(qa: Locator, oneRow: boolean): Promise<void> {
  const images = qa.locator('button img')
  await qa.scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      images.evaluateAll((list: HTMLImageElement[]) =>
        list.every((img) => img.complete && img.naturalWidth > 0),
      ),
    )
    .toBe(true)
  // One synchronous read, so nothing scrolls between the measurements.
  const tiles: TileGeometry[] = await qa.locator('li').evaluateAll((items) =>
    items.map((li) => {
      const button = li.querySelector('button')!
      const img = button.querySelector('img')!
      const frame = button.getBoundingClientRect()
      const border = getComputedStyle(button)
      const box = img.getBoundingClientRect()
      const style = getComputedStyle(img)
      return {
        frame: { width: frame.width, height: frame.height },
        inner: {
          left: frame.left + parseFloat(border.borderLeftWidth),
          top: frame.top + parseFloat(border.borderTopWidth),
          right: frame.right - parseFloat(border.borderRightWidth),
          bottom: frame.bottom - parseFloat(border.borderBottomWidth),
        },
        box: {
          left: box.left,
          top: box.top,
          right: box.right,
          bottom: box.bottom,
          width: box.width,
          height: box.height,
        },
        fit: style.objectFit,
        position: style.objectPosition,
        natural: { width: img.naturalWidth, height: img.naturalHeight },
        titleTop: li.querySelector('h3')!.getBoundingClientRect().top,
      }
    }),
  )
  expect(tiles).toHaveLength(qaArtifacts.length)
  tiles.forEach((tile, n) => {
    const label = qaArtifacts[n].id
    expect(
      Math.abs(tile.frame.height - (tile.frame.width * 3) / 4),
      `${label}: 4:3 frame`,
    ).toBeLessThanOrEqual(1)
    expect([tile.fit, tile.position], `${label}: contained, centred`).toEqual([
      'contain',
      '50% 50%',
    ])
    for (const edge of ['left', 'top', 'right', 'bottom'] as const)
      expect(
        Math.abs(tile.box[edge] - tile.inner[edge]),
        `${label}: image box ${edge}`,
      ).toBeLessThanOrEqual(0.5)
    const scale = Math.min(
      tile.box.width / tile.natural.width,
      tile.box.height / tile.natural.height,
    )
    const painted = { width: tile.natural.width * scale, height: tile.natural.height * scale }
    expect(painted.width, `${label}: fits across`).toBeLessThanOrEqual(tile.box.width + 0.5)
    expect(painted.height, `${label}: fits down`).toBeLessThanOrEqual(tile.box.height + 0.5)
    expect(
      Math.min(tile.box.width - painted.width, tile.box.height - painted.height),
      `${label}: touches one axis`,
    ).toBeLessThanOrEqual(0.5)
    const { width, height } = qaArtifacts[n].image
    expect(
      Math.abs(painted.width / painted.height - width / height),
      `${label}: aspect`,
    ).toBeLessThanOrEqual(0.01)
    test.info().annotations.push({
      type: 'qa-tile',
      description: `${label}: ${Math.round(tile.box.width - painted.width)} × ${Math.round(tile.box.height - painted.height)} px letterbox`,
    })
  })
  if (oneRow) {
    const tops = tiles.map((tile) => tile.titleTop)
    expect(Math.max(...tops) - Math.min(...tops), `title tops ${tops}`).toBeLessThanOrEqual(1)
  }
}

// v1.1: the certificates are a coverflow; its frame is the trigger. Enter on the focused frame opens
// the centre card (the newest, RevoU), and the dialog must still be open a moment later: the Enter's
// keypress would otherwise click the Close button that the dialog has just focused.
test('certificate lightbox: arrows navigate, Tab stays inside, Esc closes and restores focus', async ({
  page,
}) => {
  await page.goto('/')
  const trigger = page.getByRole('group', { name: en.certifications.carousel.frame })
  await trigger.scrollIntoViewIfNeeded()
  // The first paint() shows the centre card: the page has hydrated and the keys reach React.
  await expect(page.locator('#certifications .cf-card[aria-current="true"]')).toBeVisible()
  await trigger.focus()
  await page.keyboard.press('Enter')

  // The scroll lock is set and released in a React effect, a moment after the native
  // <dialog> opens or closes: retry the reads instead of taking one sample.
  const bodyOverflow = () => page.evaluate(() => document.body.style.overflow)

  const dialog = page.getByRole('dialog', { name: en.lightbox.label })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: en.lightbox.close })).toBeFocused()
  await page.waitForTimeout(300)
  await expect(dialog).toBeVisible()
  await expect.poll(bodyOverflow).toBe('hidden')

  const total = certifications.length
  const counter = (n: number) =>
    en.lightbox.counter.replace('{current}', String(n)).replace('{total}', String(total))
  await expect(dialog).toContainText(counter(1))
  await expect(dialog.getByRole('img')).toHaveAttribute('src', /cert-revou/)
  // A certificate's caption (its title) differs from its alt, so screen readers hear it too.
  await expect(dialog.locator('figcaption > span').first()).not.toHaveAttribute('aria-hidden')

  await page.keyboard.press('ArrowRight')
  await expect(dialog).toContainText(counter(2))
  await expect(dialog.getByRole('img')).toHaveAttribute('src', /cert-gunadarma-designing/)
  await page.keyboard.press('ArrowLeft')
  await expect(dialog).toContainText(counter(1))
  await page.keyboard.press('ArrowLeft')
  await expect(dialog).toContainText(counter(total))

  // Focus stays inside the modal dialog while tabbing.
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(() => document.activeElement?.closest('dialog') !== null),
      `Tab ${i + 1} left the dialog`,
    ).toBe(true)
  }

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect.poll(bodyOverflow).toBe('')
  await expect(trigger).toBeFocused()
})

// TC-095 (M4b batch 2, PRD §12.7, DESIGN §4.6): the QA evidence tiles. Three screenshots from
// PintuKos in order, each tile named by its image's alt (the title); the second opens the lightbox
// (by keyboard) on the E2E report with its caption, which differs from the alt and so stays
// announced.
// Lookups inside the dialog are scoped to it: the caption is also printed under its tile.
// M5: every tile is a 4:3 frame with its screenshot contained whole and centred, so where the tiles
// share a row their titles start at the same height.
test('QA evidence tiles open the lightbox with their captions, in both languages', async ({
  page,
  viewport,
}) => {
  const files = [/pintukos-ci-run/, /pintukos-e2e-report/, /pintukos-uat-sheet/]
  expect(qaArtifacts.map((artifact) => artifact.id)).toEqual(['ci-run', 'e2e-report', 'uat-sheet'])
  await page.goto('/')
  for (const copy of [en, id]) {
    if (copy === id) {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const titles = qaArtifacts.map((artifact) => copy.qa.artifacts[artifact.id].title)
    const qa = page.locator('#qa')
    await expect(qa.locator('li')).toHaveCount(3)
    // A button's children are presentational, so the images are found by CSS, not by role.
    const images = qa.locator('button img')
    await expect(images).toHaveCount(3)
    for (let n = 0; n < 3; n += 1) {
      await expect(images.nth(n)).toHaveAttribute('src', files[n])
      await expect(images.nth(n)).toHaveAttribute('alt', titles[n])
      await expect(qa.getByRole('button', { name: titles[n], exact: true })).toHaveCount(1)
      await expect(qa.getByRole('heading', { name: titles[n], exact: true })).toBeVisible()
    }
    await expectFramedTiles(qa, (viewport?.width ?? 0) >= 640)

    // Opened from the keyboard, so the Close button shows its focus ring. The dialog sits inside
    // the paper section in the DOM but on a dark dim: the ring must be the dark surface's
    // accent-400 (#D9634B), not paper's accent-600, which reads about 2.7:1 there (WCAG 1.4.11).
    // Reached with a real Tab from the first tile: Firefox shows the ring on script focus (the
    // dialog's Close) only when focus came there from the keyboard, as it does for a user.
    const second = qa.getByRole('button', { name: titles[1], exact: true })
    await second.scrollIntoViewIfNeeded()
    await qa.getByRole('button', { name: titles[0], exact: true }).focus()
    await page.keyboard.press('Tab')
    await expect(second).toBeFocused()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: copy.lightbox.label })
    await expect(dialog).toBeVisible()
    const close = dialog.getByRole('button', { name: copy.lightbox.close })
    await expect(close).toBeFocused()
    await expect(close).toHaveCSS('outline-color', 'rgb(217, 99, 75)')

    const counter = (n: number) =>
      copy.lightbox.counter.replace('{current}', String(n)).replace('{total}', '3')
    const caption = dialog.locator('figcaption > span').first()
    for (const [n, index] of [
      [2, 1],
      [3, 2],
      [1, 0],
    ] as const) {
      if (n !== 2) await page.keyboard.press('ArrowRight')
      const artifact = qaArtifacts[index]
      await expect(dialog).toContainText(counter(n))
      await expect(dialog.getByRole('img')).toHaveAttribute('src', files[index])
      await expect(dialog.getByRole('img')).toHaveAttribute('alt', titles[index])
      // Shown once the image has loaded, and not aria-hidden: it differs from the alt.
      await expect(caption).toBeVisible()
      await expect(caption).toHaveText(copy.qa.artifacts[artifact.id].caption)
      await expect(caption).not.toHaveAttribute('aria-hidden')
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(second).toBeFocused()
  }
})
