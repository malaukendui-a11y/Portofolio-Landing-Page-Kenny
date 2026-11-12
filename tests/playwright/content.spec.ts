// M4b content (PRD §6, §12): TC-088 (status → CTA matrix for `ctasFor`), TC-089 (project cards
// from the owner's data), TC-090 (the PintuKos lightbox in both languages).
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import {
  ctasFor,
  projects,
  type Project,
  type ProjectId,
  type ProjectImage,
} from '../../content/projects'
import { selectLang } from './helpers'

const base: Project = {
  id: 'pintukos',
  kind: 'product',
  status: 'live',
  year: '2026',
  liveUrl: null,
  repoUrl: null,
  repoPublic: false,
  pdfUrl: null,
  stack: [],
  images: [],
}
const image: ProjectImage = { src: '/x.webp', width: 1600, height: 900, alt: { en: 'x', id: 'x' } }
const pintukos = projects.find((project) => project.id === 'pintukos')!

// TC-088: PRD §6.1 / CLAUDE.md rule 2 as data, without a browser. A live project without a
// public URL previews its images; one with a URL links the demo; GitHub only for a public repo.
test('ctasFor: a live project without a public URL previews its images', () => {
  test.skip(test.info().project.name !== 'desktop', 'no browser involved')
  expect(ctasFor({ ...base, images: [image] })).toEqual([{ kind: 'preview', primary: true }])
  expect(ctasFor(base)).toEqual([])
  expect(ctasFor({ ...base, liveUrl: 'https://example.test', images: [image] })).toEqual([
    { kind: 'liveDemo', href: 'https://example.test', primary: true },
  ])
  expect(
    ctasFor({ ...base, images: [image], repoUrl: 'https://github.com/a/b', repoPublic: true }),
  ).toEqual([
    { kind: 'preview', primary: true },
    { kind: 'github', href: 'https://github.com/a/b', primary: false },
  ])
  // A known but private repo never shows.
  expect(ctasFor({ ...base, images: [image], repoUrl: 'https://github.com/a/b' })).toEqual([
    { kind: 'preview', primary: true },
  ])

  // The owner's data (M4b): only PintuKos previews, only the thesis links a PDF.
  expect(
    Object.fromEntries(
      projects.map((project) => [project.id, ctasFor(project).map((c) => c.kind)]),
    ),
  ).toEqual({
    pintukos: ['preview'],
    'trading-compass': [],
    'malau-website': [],
    'kos-kontrakan-landing': [],
    'crypto-research': ['readPaper'],
  })
})

/** The project card whose heading is the project's title in `copy`. */
function card(page: Page, copy: typeof en, project: ProjectId) {
  return page.locator('#work article').filter({
    has: page.getByRole('heading', { name: copy.projects.items[project].title, exact: true }),
  })
}

// TC-089: the cards built from the owner's data, in both languages.
test('project cards show the owner’s statuses, stacks and CTAs', async ({ page }) => {
  await page.goto('/')
  for (const copy of [en, id]) {
    if (copy === id) {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const pk = card(page, copy, 'pintukos')
    await expect(pk.getByText(copy.projects.status.live, { exact: true })).toBeVisible()
    await expect(pk.getByText(copy.projects.items.pintukos.description)).toBeVisible()
    await expect(pk.getByText(copy.projects.items.pintukos.role)).toBeVisible()
    // The cover is the first image (a button's children are presentational: CSS locator).
    const cover = pk.locator('button img')
    await expect(cover).toHaveAttribute('src', /pintukos-01-overview/)
    await expect(cover).toHaveAttribute('alt', pintukos.images[0].alt[copy === en ? 'en' : 'id'])
    await expect(
      pk.getByRole('list', { name: copy.projects.stackLabel }).getByRole('listitem'),
    ).toHaveText(['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Vitest', 'Playwright'])
    await expect(
      pk.getByRole('button', { name: copy.projects.cta.preview, exact: true }),
    ).toHaveCount(1)
    await expect(pk.locator('a')).toHaveCount(0)

    // Trading Compass: in QA, no images, repo hidden, so no control at all.
    const tc = card(page, copy, 'trading-compass')
    await expect(tc.getByText(copy.projects.status['in-qa'], { exact: true })).toBeVisible()
    await expect(tc.locator('a, button')).toHaveCount(0)

    // Kos & Kontrakan landing: in development, four tags, nothing to open yet.
    const kos = card(page, copy, 'kos-kontrakan-landing')
    await expect(
      kos.getByText(copy.projects.status['in-development'], { exact: true }),
    ).toBeVisible()
    await expect(
      kos.getByRole('list', { name: copy.projects.stackLabel }).getByRole('listitem'),
    ).toHaveText(['Vite', 'React', 'TypeScript', 'Tailwind CSS'])
    await expect(kos.locator('a, button')).toHaveCount(0)
  }
})

// TC-090: the PintuKos boards in the lightbox: four images, the counter, and captions that are
// each image's alt (with the design-render disclosure) in the current language.
test('the PintuKos lightbox shows the four boards with captions in both languages', async ({
  page,
}) => {
  expect(pintukos.images).toHaveLength(4)
  const files = [
    /pintukos-01-overview/,
    /pintukos-02-payment-flow/,
    /pintukos-03-owner-tools/,
    /pintukos-04-design-system/,
  ]
  await page.goto('/')
  for (const copy of [en, id]) {
    const lang = copy === en ? 'en' : 'id'
    if (lang === 'id') {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const counter = (n: number) =>
      copy.lightbox.counter.replace('{current}', String(n)).replace('{total}', '4')
    const cover = page.getByRole('button', {
      name: copy.projects.openScreenshots.replace('{title}', copy.projects.items.pintukos.title),
    })
    await cover.scrollIntoViewIfNeeded()
    await cover.click()

    const dialog = page.getByRole('dialog', { name: copy.lightbox.label })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: copy.lightbox.close })).toBeFocused()
    for (let n = 1; n <= 4; n += 1) {
      if (n > 1) await page.keyboard.press('ArrowRight')
      const alt = pintukos.images[n - 1].alt[lang]
      await expect(dialog).toContainText(counter(n))
      await expect(dialog.getByRole('img')).toHaveAttribute('src', files[n - 1])
      await expect(dialog.getByRole('img')).toHaveAttribute('alt', alt)
      await expect(dialog.locator('figcaption')).toContainText(alt)
      await expect(dialog.locator('figcaption')).toContainText(
        lang === 'en' ? 'design render, sample data' : 'render desain, data contoh',
      )
    }
    await expect
      .poll(() =>
        dialog
          .getByRole('img')
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true)
    // A long caption wraps within the image's width and never squeezes the counter.
    const fit = await dialog.locator('figure').evaluate((figure) => {
      const image = figure.querySelector('img')!.getBoundingClientRect()
      const caption = figure.querySelector('figcaption')!
      const count = caption.lastElementChild as HTMLElement
      return {
        captionWithinImage: caption.getBoundingClientRect().width <= image.width + 1,
        counterOneLine: count.offsetHeight <= parseFloat(getComputedStyle(count).lineHeight) + 1,
      }
    })
    expect(fit).toEqual({ captionWithinImage: true, counterOneLine: true })
    // Wraps from the last board to the first.
    await page.keyboard.press('ArrowRight')
    await expect(dialog).toContainText(counter(1))
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(cover).toBeFocused()
  }

  // The card's "Preview" CTA opens the same gallery (here in ID).
  const preview = page
    .locator('#work')
    .getByRole('button', { name: id.projects.cta.preview, exact: true })
  await preview.click()
  const dialog = page.getByRole('dialog', { name: id.lightbox.label })
  await expect(dialog).toContainText(
    id.lightbox.counter.replace('{current}', '1').replace('{total}', '4'),
  )
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(preview).toBeFocused()
})
