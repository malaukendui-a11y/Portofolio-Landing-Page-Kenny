// v1.1 Tools & stack, the logo cloud (DESIGN §4.4a; docs/QA-PLAN.md TC-129 … TC-135): one card with
// the real GitHub contribution graph and two logo rows that run in opposite directions. Literals come
// from the owner's copy deck through content/en.ts and content/id.ts; the data from content/stack.ts,
// content/stack-icons.ts and content/github-contributions.json.
import { readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import contributions from '../../content/github-contributions.json'
import { site } from '../../content/site'
import { stackRows, stackTools, toolsInRow } from '../../content/stack'
import { stackIcons } from '../../content/stack-icons'
import type { Copy } from '../../content/types'
import { graphLayout } from '../../lib/stackGraph'
import { hasNoHorizontalOverflow, revealAll, selectLang } from './helpers'

const languages = [
  { copy: en, toggle: 'EN' },
  { copy: id, toggle: 'ID' },
] as const

/** "7 May 2026" / "7 Mei 2026", written out here independently of the component. */
function day(iso: string, copy: Copy): string {
  const [year, month, date] = iso.split('-').map(Number)
  return `${date} ${copy.stack.months[month - 1]} ${year}`
}

/** 328 / 1,234 / 1.234: numbers as each language writes them. */
function num(value: number, copy: Copy): string {
  return new Intl.NumberFormat(copy === id ? 'id-ID' : 'en-US').format(value)
}

function caption(count: number, iso: string, copy: Copy): string {
  const template =
    count === 0 ? copy.stack.dayNone : count === 1 ? copy.stack.dayOne : copy.stack.dayMany
  return template.replace('{n}', num(count, copy)).replace('{date}', day(iso, copy))
}

async function openStack(page: Page): Promise<Locator> {
  await page.goto('/')
  const section = page.locator('#stack')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByRole('heading', { level: 2 })).toBeVisible()
  return section
}

/**
 * Each row's marquee track: its animation (name, duration, play state, direction), its horizontal
 * offset now, and the tiles in one copy (which set the duration: tiles × 2.5 s).
 */
function tracks(section: Locator) {
  return section.locator('.stack-row > .marquee-track').evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element)
      return {
        name: style.animationName,
        duration: style.animationDuration,
        state: style.animationPlayState,
        direction: style.animationDirection,
        x: new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform).m41,
        at: performance.now(),
        tiles: element.firstElementChild?.querySelectorAll('.stack-tile').length ?? 0,
      }
    }),
  )
}

/**
 * Each row's speed in px/s over about `ms` (negative = to the left), timed with the page's own clock
 * read together with the offset: under load the real gap can be far longer than the wait.
 */
async function speeds(page: Page, section: Locator, ms: number): Promise<number[]> {
  const before = await tracks(section)
  await page.waitForTimeout(ms)
  const after = await tracks(section)
  return after.map((track, index) => {
    const moved = track.x - before[index].x
    return moved === 0 ? 0 : (moved / (track.at - before[index].at)) * 1000
  })
}

/** Scrolls the logo rows themselves on screen: off screen they pause (as the name ticker does). */
async function showRows(section: Locator): Promise<void> {
  await section.locator('.stack-row').last().scrollIntoViewIfNeeded()
  await expect
    .poll(async () => (await tracks(section)).map((track) => track.state))
    .toEqual(['running', 'running'])
}

// TC-129: the section sits right after What I do, names the 23 tools once for assistive tech (every
// other copy of a logo is aria-hidden) and labels both rows in either language.
test('the stack section follows Services and names every tool once', async ({ page }) => {
  const section = await openStack(page)
  const order = await page
    .locator('main > section')
    .evaluateAll((sections) => sections.map((element) => element.id))
  expect(order.slice(order.indexOf('services'), order.indexOf('services') + 3)).toEqual([
    'services',
    'stack',
    'work',
  ])

  expect(stackTools).toHaveLength(23)
  const named = await section
    .locator('svg[role="img"]')
    .evaluateAll((svgs) => svgs.map((svg) => svg.getAttribute('aria-label')))
  expect(named).toEqual(stackRows.flatMap((row) => toolsInRow(row).map((tool) => tool.name)))
  for (const tool of stackTools) {
    await expect(section.getByRole('img', { name: tool.name, exact: true })).toHaveCount(1)
  }
  // Every other logo (the repeats and the loop's second copy) is out of the accessibility tree.
  const exposed = await section
    .locator('.stack-tile svg:not([role="img"])')
    .evaluateAll((svgs) => svgs.filter((svg) => !svg.closest('[aria-hidden="true"]')).length)
  expect(exposed).toBe(0)
  expect(await section.locator('.stack-tile').count()).toBeGreaterThan(2 * stackTools.length)

  // The logos really draw: the sprite answers as SVG with a symbol per tool, and every exposed tile's
  // <use> has geometry once the sprite has loaded (a broken reference would leave blank tiles).
  const sprite = await page.request.get('/stack-logos.svg')
  expect(sprite.status()).toBe(200)
  expect(sprite.headers()['content-type']).toContain('image/svg+xml')
  const spriteText = await sprite.text()
  for (const tool of stackTools) expect(spriteText, tool.id).toContain(`<symbol id="${tool.id}"`)
  await expect
    .poll(() =>
      section.locator('svg[role="img"] use').evaluateAll(
        (uses) =>
          uses.filter((use) => {
            const box = (use as SVGGraphicsElement).getBBox()
            return box.width > 0 && box.height > 0
          }).length,
      ),
    )
    .toBe(stackTools.length)

  for (const { copy, toggle } of languages) {
    if (copy === id) await selectLang(page, toggle)
    // SectionLabel prints an aria-hidden "//  " before the label: match the paragraph, not exact text.
    const label = section.locator('p').filter({ hasText: copy.stack.label })
    await expect(label).toHaveCount(1)
    await expect(label).toBeVisible()
    expect((await label.textContent())?.endsWith(copy.stack.label)).toBe(true)
    await expect(section.getByRole('heading', { level: 2, name: copy.stack.heading })).toBeVisible()
    for (const name of copy.stack.rows) {
      await expect(section.getByRole('group', { name, exact: true })).toHaveCount(1)
    }
  }
})

// TC-130: one square per day of the snapshot, the summary and the accessible name carry its total and
// date, the five levels are five colours, and the caption follows the pointer and comes back to the hint.
test('the contribution graph shows the snapshot and captions the hovered day', async ({ page }) => {
  const section = await openStack(page)
  const { days, total, asOf, handle } = contributions
  const cells = section.locator('.stack-cells [data-date]')
  await expect(cells).toHaveCount(days.length)
  expect(await cells.first().getAttribute('data-date')).toBe(days[0].date)
  expect(await cells.last().getAttribute('data-date')).toBe(days.at(-1)?.date)

  const colours = await section.locator('.stack-cells').evaluate((grid) =>
    [0, 1, 2, 3, 4].map((level) => {
      const cell = grid.querySelector(`[data-level="${level}"]`)
      return cell ? getComputedStyle(cell).backgroundColor : null
    }),
  )
  expect(colours.filter(Boolean)).toHaveLength(5)
  expect(new Set(colours).size).toBe(5)

  const active = days.find((d) => d.count > 1)!
  const single = days.find((d) => d.count === 1)!
  const empty = days.find((d) => d.count === 0)!
  const line = section.locator('[data-stack-caption]')
  for (const { copy, toggle } of languages) {
    if (copy === id) await selectLang(page, toggle)
    const summary =
      `${copy.stack.summary.replace('{total}', num(total, copy))} · ` +
      copy.stack.asOf.replace('{date}', day(asOf, copy))
    await expect(section.getByText(summary, { exact: true })).toBeVisible()
    await expect(
      section.getByRole('img', {
        name: copy.stack.graphLabel
          .replace('{handle}', handle)
          .replace('{total}', num(total, copy))
          .replace('{date}', day(asOf, copy)),
        exact: true,
      }),
    ).toHaveCount(1)
    await expect(section.getByText(copy.stack.less, { exact: true })).toBeVisible()
    await expect(section.getByText(copy.stack.more, { exact: true })).toBeVisible()

    await expect(line).toHaveText(copy.stack.hint)
    for (const target of [active, single, empty]) {
      await section.locator(`[data-date="${target.date}"]`).hover()
      await expect(line).toHaveText(caption(target.count, target.date, copy))
    }
    await page.mouse.move(2, 2)
    await expect(line).toHaveText(copy.stack.hint)
  }
  // "Sep", never en-GB's "Sept".
  await selectLang(page, 'EN')
  await expect(section.locator('.stack-months')).not.toContainText('Sept')
  await expect(
    section.getByRole('link', { name: `@${site.github.handle}`, exact: true }),
  ).toHaveAttribute('rel', 'noopener noreferrer')
})

// TC-131: Pause / Play stops and restarts both rows (WCAG 2.2.2), says so with aria-pressed and is
// labelled in both languages; hovering a row pauses that row too. Row 1 runs left, row 2 the other way.
test('Pause stops both logo rows and Play starts them again', async ({ page, isMobile }) => {
  // Two languages, two pauses and timed samples: Windows WebKit needs about 23 s alone.
  test.slow()
  const section = await openStack(page)
  // The rows really animate (this is also the motion-allowed control for TC-132's "none"): the
  // `marquee` keyframes, 2.5 s per tile of a copy, row 1 leftwards, row 2 rightwards, at about
  // 30 px/s (a 76 px tile pitch per 2.5 s).
  await expect
    .poll(async () => (await tracks(section)).map((track) => track.name))
    .toEqual(['marquee', 'marquee'])
  await showRows(section)
  const running = await tracks(section)
  expect(running.map((track) => track.direction)).toEqual(['normal', 'reverse'])
  expect(running.map((track) => track.duration)).toEqual(
    running.map((track) => `${track.tiles * 2.5}s`),
  )
  const [left, right] = await speeds(page, section, 1000)
  expect(left).toBeLessThan(-15)
  expect(left).toBeGreaterThan(-45)
  expect(right).toBeGreaterThan(15)
  expect(right).toBeLessThan(45)

  for (const { copy, toggle } of languages) {
    if (copy === id) await selectLang(page, toggle)
    const button = section.getByRole('button', { name: copy.stack.pause, exact: true })
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await button.click()
    const play = section.getByRole('button', { name: copy.stack.play, exact: true })
    await expect(play).toHaveAttribute('aria-pressed', 'true')
    await expect
      .poll(async () => (await tracks(section)).map((track) => track.state))
      .toEqual(['paused', 'paused'])
    expect(await speeds(page, section, 500)).toEqual([0, 0])
    await play.click()
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect
      .poll(async () => (await tracks(section)).map((track) => track.state))
      .toEqual(['running', 'running'])
    const [again] = await speeds(page, section, 500)
    expect(again).toBeLessThan(0)
  }

  if (!isMobile) {
    await section.locator('.stack-row').first().hover()
    await expect
      .poll(async () => (await tracks(section)).map((track) => track.state))
      .toEqual(['paused', 'running'])
    expect((await speeds(page, section, 400))[0]).toBe(0)
    await page.mouse.move(2, 2)
    await expect
      .poll(async () => (await tracks(section)).map((track) => track.state))
      .toEqual(['running', 'running'])
  }
})

// TC-132: reduced motion has no animation and no Pause button; each of the 23 logos shows once, all
// inside the card, at 390 and 1440. The graph caption still works.
test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  for (const width of [390, 1440]) {
    test(`the logos are a static grid at ${width} px`, async ({ page, isMobile }) => {
      test.skip(isMobile && width !== 390, 'the phone projects measure their own 390 px')
      if (!isMobile) await page.setViewportSize({ width, height: 900 })
      const section = await openStack(page)
      // TC-131 asserts `marquee` with motion allowed, so this "none" tells the two branches apart.
      expect((await tracks(section)).map((track) => track.name)).toEqual(['none', 'none'])
      await expect(section.getByRole('button', { name: en.stack.pause })).toBeHidden()

      const tiles = await section.locator('.stack-tile').evaluateAll((elements) => {
        const card = elements[0].closest('.stack-row')!.parentElement!.getBoundingClientRect()
        return elements
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 0 && rect.height > 0)
          .map(({ element, rect }) => ({
            name: element.getAttribute('title'),
            inside: rect.left >= card.left - 0.5 && rect.right <= card.right + 0.5,
          }))
      })
      expect(tiles.map((tile) => tile.name)).toEqual(
        stackRows.flatMap((row) => toolsInRow(row).map((tool) => tool.name)),
      )
      expect(tiles.every((tile) => tile.inside)).toBe(true)
      expect(await hasNoHorizontalOverflow(page)).toBe(true)

      const target = contributions.days.find((d) => d.count > 0)!
      await section.locator(`[data-date="${target.date}"]`).hover()
      await expect(section.locator('[data-stack-caption]')).toHaveText(
        caption(target.count, target.date, en),
      )
    })
  }
})

// TC-133: no sideways page scroll at 390 … 1920; each copy of a row is at least as wide as the row (no
// gap in the loop, up to 2560 px); a graph too wide for its card scrolls inside it, from the newest week.
test('the section never scrolls the page sideways and the graph opens on the newest week', async ({
  page,
  isMobile,
}) => {
  // Six page loads: WebKit needs more than the default 30 s.
  test.slow()
  const widths = isMobile ? [0] : [390, 768, 1024, 1440, 1920, 2560]
  for (const width of widths) {
    if (width) await page.setViewportSize({ width, height: 900 })
    const section = await openStack(page)
    const label = `${width || 'device'} px`
    expect(await hasNoHorizontalOverflow(page), label).toBe(true)
    // The island sets tabindex and the scroll position after hydration: wait until they match the
    // layout before reading them.
    await expect
      .poll(() =>
        section.locator('.stack-scroller').evaluate((element) => {
          const scrollable = element.scrollWidth > element.clientWidth + 1
          return scrollable === (element.getAttribute('tabindex') === '0')
        }),
      )
      .toBe(true)

    const rows = await section.locator('.stack-row').evaluateAll((elements) =>
      elements.map((row) => ({
        row: row.getBoundingClientRect().width,
        copies: Array.from(row.querySelectorAll('.stack-group')).map(
          (group) => group.getBoundingClientRect().width,
        ),
      })),
    )
    for (const { row, copies } of rows) {
      expect(copies, label).toHaveLength(2)
      for (const copy of copies) expect(copy, label).toBeGreaterThanOrEqual(row)
    }

    const scroller = section.locator('.stack-scroller')
    const state = await scroller.evaluate((element) => ({
      scrollable: element.scrollWidth > element.clientWidth + 1,
      atEnd: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
      tabIndex: element.getAttribute('tabindex'),
      name: element.getAttribute('aria-label'),
    }))
    if (state.scrollable) {
      expect(state, label).toMatchObject({
        atEnd: true,
        tabIndex: '0',
        name: en.stack.scrollRegion,
      })
    } else {
      expect(state, label).toMatchObject({ tabIndex: null, name: null })
    }
    if (width === 390 || width === 0) expect(state.scrollable, label).toBe(true)
    if (width === 1440) expect(state.scrollable, label).toBe(false)
  }
})

// TC-134: the section loads nothing from another origin (the data is in the page, the logos come from
// this origin's /stack-logos.svg) and axe finds nothing in it.
test('the stack section has no third-party requests and no axe violations', async ({ page }) => {
  const origins = new Set<string>()
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol.startsWith('http')) origins.add(url.origin)
  })
  const section = await openStack(page)
  await section.locator('[data-date]').last().hover()
  await revealAll(page)
  await section.scrollIntoViewIfNeeded()
  expect([...origins]).toEqual([new URL(page.url()).origin])

  const results = await new AxeBuilder({ page })
    .include('#stack')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze()
  expect(results.violations).toEqual([])
})

// TC-135: the generated logo module matches content/stack.ts, every logo says where it came from and
// under which licence, and the contribution snapshot passes the export script's own rules.
test('the stack data is complete and the snapshot is consistent', () => {
  test.skip(test.info().project.name !== 'desktop', 'data only: one run is enough')
  expect(Object.keys(stackIcons)).toEqual(stackTools.map((tool) => tool.id))
  expect(new Set(stackTools.map((tool) => tool.id)).size).toBe(23)
  for (const tool of stackTools) {
    const icon = stackIcons[tool.id]
    expect(icon.viewBox, tool.id).toMatch(/^-?\d+(\.\d+)? -?\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/)
    expect(icon.body, tool.id).toMatch(/^<(path|rect|g|circle)\b/)
    expect(icon.body, tool.id).not.toMatch(/<script|<foreignObject|<image|\bon\w+=|href=/i)
    expect(icon.source.length, tool.id).toBeGreaterThan(0)
    expect(['CC0-1.0', 'CC-BY-3.0', 'MIT', 'own work'], tool.id).toContain(icon.license)
  }
  expect(stackIcons['google-stitch'].license).toBe('own work')
  // Simple Icons is CC0 as a package, but these two logos keep their own licence; both are credited in
  // THIRD_PARTY_NOTICES.md (Git: CC BY 3.0, Jason Long; JavaScript: MIT).
  expect(stackIcons.git.license).toBe('CC-BY-3.0')
  expect(stackIcons.javascript.license).toBe('MIT')
  const notices = readFileSync('THIRD_PARTY_NOTICES.md', 'utf8')
  for (const credit of ['Simple Icons', 'devicon', 'Jason Long', 'CC BY 3.0', 'logo.js'])
    expect(notices, credit).toContain(credit)

  const { handle, asOf, total, days } = contributions
  expect(handle).toBe(site.github.handle)
  expect(asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(days.length).toBeGreaterThanOrEqual(365)
  expect(days.length).toBeLessThanOrEqual(371)
  expect(days.at(-1)!.date <= asOf).toBe(true)
  expect(days.reduce((sum, d) => sum + d.count, 0)).toBe(total)
  for (const [index, d] of days.entries()) {
    expect([0, 1, 2, 3, 4], d.date).toContain(d.level)
    expect(d.count === 0, d.date).toBe(d.level === 0)
    if (index > 0) {
      const gap =
        Date.parse(`${d.date}T00:00:00Z`) - Date.parse(`${days[index - 1].date}T00:00:00Z`)
      expect(gap, d.date).toBe(86_400_000)
    }
  }

  // Month labels: columns start on a Sunday, and no two labels sit closer than two columns. The
  // snapshot starts on Sunday 23 Nov 2025 (Nov at column 0, Dec at 2); a snapshot starting in the
  // last week of a month (Sunday 30 Nov 2025) gives the column to the newer month (Dec at 1).
  const snapshot = graphLayout(days)
  expect(snapshot.lead).toBe(new Date(`${days[0].date}T00:00:00Z`).getUTCDay())
  expect(snapshot.weeks).toBe(Math.ceil((snapshot.lead + days.length) / 7))
  const synthetic = (start: string, length: number) =>
    Array.from({ length }, (_, index) => ({
      date: new Date(Date.parse(`${start}T00:00:00Z`) + index * 86_400_000)
        .toISOString()
        .slice(0, 10),
    }))
  const late = graphLayout(synthetic('2025-11-30', 371))
  expect(late.months[0]).toEqual({ week: 1, month: 11 })
  for (const layout of [snapshot, late, graphLayout(synthetic('2025-11-26', 367))]) {
    const columns = layout.months.map((label) => label.week)
    for (let index = 1; index < columns.length; index++)
      expect(columns[index] - columns[index - 1]).toBeGreaterThanOrEqual(2)
    expect(Math.max(...columns)).toBeLessThan(layout.weeks - 2)
  }
})
