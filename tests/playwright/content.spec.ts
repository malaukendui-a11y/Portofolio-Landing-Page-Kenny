// M4b content (PRD §6, §12): TC-088 (status → CTA matrix for `ctasFor`), TC-089 (project cards
// from the owner's data), TC-090 (the PintuKos lightbox in both languages). M4b batch 2:
// TC-094 (the PintuKos invite-only app link), TC-097 (one Node major for the laptop, CI and
// Vercel).
import { readFileSync } from 'node:fs'
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

// TC-088: PRD §6.1 / CLAUDE.md rule 2 as data, without a browser. A live project without a URL
// previews its images; one with a public URL links the demo; one with `access: 'private'` links
// the app as invite only and keeps its preview (M4b batch 2); GitHub only for a public repo.
test('ctasFor: the status → CTA matrix, including an invite-only app', () => {
  test.skip(test.info().project.name !== 'desktop', 'no browser involved')
  const app = 'https://app.example.test/'
  expect(ctasFor({ ...base, images: [image] })).toEqual([{ kind: 'preview', primary: true }])
  expect(ctasFor(base)).toEqual([])
  // Without `access` a live URL is a public demo, as before M4b batch 2.
  expect(ctasFor({ ...base, liveUrl: 'https://example.test', images: [image] })).toEqual([
    { kind: 'liveDemo', href: 'https://example.test', primary: true },
  ])
  // Invite only: the app link first (primary), then the preview (secondary) when there are images.
  expect(ctasFor({ ...base, liveUrl: app, access: 'private', images: [image] })).toEqual([
    { kind: 'liveDemoPrivate', href: app, primary: true },
    { kind: 'preview', primary: false },
  ])
  expect(ctasFor({ ...base, liveUrl: app, access: 'private' })).toEqual([
    { kind: 'liveDemoPrivate', href: app, primary: true },
  ])
  // `access` means nothing without a URL, or outside `live`.
  expect(ctasFor({ ...base, access: 'private', images: [image] })).toEqual([
    { kind: 'preview', primary: true },
  ])
  expect(
    ctasFor({ ...base, status: 'in-qa', liveUrl: app, access: 'private', images: [image] }),
  ).toEqual([{ kind: 'preview', primary: true }])
  // A public repo still follows, as a secondary CTA.
  expect(
    ctasFor({
      ...base,
      liveUrl: app,
      access: 'private',
      images: [image],
      repoUrl: 'https://github.com/a/b',
      repoPublic: true,
    }),
  ).toEqual([
    { kind: 'liveDemoPrivate', href: app, primary: true },
    { kind: 'preview', primary: false },
    { kind: 'github', href: 'https://github.com/a/b', primary: false },
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

  // The owner's data (M4b batch 2): PintuKos links its app (invite only) and previews its boards;
  // only the thesis links a PDF.
  expect(
    Object.fromEntries(
      projects.map((project) => [project.id, ctasFor(project).map((c) => c.kind)]),
    ),
  ).toEqual({
    pintukos: ['liveDemoPrivate', 'preview'],
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
    // The CTA row (the invite-only app link, then "Preview") is TC-094's, below.
    await expect(
      pk.getByRole('button', { name: copy.projects.cta.preview, exact: true }),
    ).toHaveCount(1)

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

// TC-094 (M4b batch 2): PintuKos links its app, labelled invite only, and keeps "Preview" beside
// it. The card's controls are the cover (a button), the app link and "Preview", in that order;
// no "Live demo", no GitHub. The link is never followed: it is the one external href (TC-004).
test('the PintuKos card links its app as invite only and keeps the preview', async ({ page }) => {
  await page.goto('/')
  for (const copy of [en, id]) {
    if (copy === id) {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const pk = card(page, copy, 'pintukos')
    const controls = pk.locator('a, button')
    await expect(controls).toHaveCount(3)
    await expect(controls.nth(0)).toHaveAccessibleName(
      copy.projects.openScreenshots.replace('{title}', copy.projects.items.pintukos.title),
    )

    const app = controls.nth(1)
    await expect(app).toHaveRole('link')
    await expect(app).toHaveAccessibleName(copy.projects.cta.liveDemoPrivate)
    await expect(app).toHaveAttribute('href', 'https://app.pintukos.my.id/')
    await expect(app).toHaveAttribute('target', '_blank')
    await expect(app).toHaveAttribute('rel', /\bnoopener\b/)
    await expect(app).toHaveAttribute('rel', /\bnoreferrer\b/)

    const preview = controls.nth(2)
    await expect(preview).toHaveRole('button')
    await expect(preview).toHaveAccessibleName(copy.projects.cta.preview)

    await expect(pk.locator('a')).toHaveCount(1)
    await expect(pk.getByRole('link', { name: copy.projects.cta.liveDemo })).toHaveCount(0)
    await expect(pk.getByRole('link', { name: copy.projects.cta.github })).toHaveCount(0)
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
      // The caption repeats the alt, so screen readers get it once, from the image.
      await expect(dialog.locator('figcaption > span').first()).toHaveAttribute(
        'aria-hidden',
        'true',
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

/** The lightbox caption's text span and its geometry against the image and the viewport. */
function captionState(page: Page) {
  return page.locator('dialog[open] figure').evaluate((figure) => {
    const image = figure.querySelector('img')!.getBoundingClientRect()
    const caption = figure.querySelector('figcaption')!
    const text = caption.firstElementChild as HTMLElement
    return {
      visible: getComputedStyle(text).visibility === 'visible',
      bottom: Math.ceil(caption.getBoundingClientRect().bottom),
      imageBottom: Math.ceil(image.bottom),
      innerHeight,
    }
  })
}

// TC-090, the edges: a board still loading shows no caption text (it would wrap in a narrow
// column, then jump); on a short laptop window the two-line caption stays on screen under a
// height-bound board (the image leaves it room).
test('the lightbox caption waits for its board and stays on screen on a short window', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'height-bound boards only happen on wide windows')
  await page.setViewportSize({ width: 1280, height: 600 })
  // Hold board 02 (never shown before the lightbox steps to it) until released.
  let release: () => void = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(/\/_next\/image\?url=%2Fimages%2Fprojects%2Fpintukos-02/, async (route) => {
    await held
    await route.continue()
  })
  await page.goto('/')
  const cover = page.getByRole('button', {
    name: en.projects.openScreenshots.replace('{title}', en.projects.items.pintukos.title),
  })
  await cover.scrollIntoViewIfNeeded()
  await cover.click()
  const dialog = page.getByRole('dialog', { name: en.lightbox.label })
  await expect.poll(async () => (await captionState(page)).visible).toBe(true)
  for (let n = 1; n <= 4; n += 1) {
    if (n > 1) await page.keyboard.press('ArrowRight')
    if (n === 2) {
      // Board 02 is held: its caption text is hidden while it loads, then shows.
      await expect(dialog.getByRole('img')).toHaveAttribute('src', /pintukos-02/)
      expect((await captionState(page)).visible).toBe(false)
      release()
    }
    await expect.poll(async () => (await captionState(page)).visible).toBe(true)
    const state = await captionState(page)
    expect(state.bottom, `board ${n}: caption bottom ≤ viewport`).toBeLessThanOrEqual(
      state.innerHeight,
    )
    expect(state.bottom).toBeGreaterThan(state.imageBottom)
  }
})

// TC-097 (M4b batch 2): one Node major for the laptop, CI and Vercel. `engines.node` is
// `<major>.x` (Vercel picks Node by it; `engine-strict` makes pnpm refuse any other major), CI's
// setup-node uses the same major, and so does the Node running this suite. A new major is a
// deliberate commit that changes all three.
test('one Node major in package.json engines, CI and this machine', () => {
  test.skip(test.info().project.name !== 'desktop', 'no browser involved')
  const engines: string = JSON.parse(readFileSync('package.json', 'utf8')).engines.node
  expect(engines).toMatch(/^\d+\.x$/)
  const major = engines.split('.')[0]
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
  expect(ci.match(/node-version:\s*(\S+)/)?.[1], 'ci.yml node-version').toBe(major)
  expect(process.versions.node.split('.')[0], 'the Node running the suite').toBe(major)
})
