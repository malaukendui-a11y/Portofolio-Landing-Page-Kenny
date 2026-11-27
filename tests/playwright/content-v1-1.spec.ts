// v1.1 content refresh (the owner's copy deck, 26 Nov 2026; docs/QA-PLAN.md TC-118 onwards):
// TC-118 (junior roles and per-language title), TC-119 (intro accents), TC-120 (services items),
// TC-121 (QA evidence statement and the database checks), TC-122 (footer credit), TC-124 (this
// portfolio's card), TC-125 (the PintuKos and Malau sentences), TC-128 (the test count, no PR
// count).
// Literals here are the owner's approved strings: a silent copy change fails these tests.
import { readFileSync } from 'node:fs'
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import { projects } from '../../content/projects'
import { selectLang } from './helpers'

const languages = [
  { copy: en, toggle: 'EN' },
  { copy: id, toggle: 'ID' },
] as const

// TC-118: the roles (English word order in both languages, owner decision), the title and the
// JSON-LD job title follow the copy deck.
test('the hero names the junior roles and the title follows the language', async ({ page }) => {
  for (const { copy } of languages) {
    expect(copy.hero.roles).toEqual(['Junior QA Engineer', 'Junior Software Engineer'])
    expect(copy.meta.title).toBe('Ananda Kenny — Junior QA & Software Engineer')
  }
  await page.goto('/')
  for (const { copy, toggle } of languages) {
    if (copy === id) {
      await selectLang(page, toggle)
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    await expect(page).toHaveTitle(copy.meta.title)
    for (const role of copy.hero.roles) {
      await expect(
        page.locator('#top').getByText(role, { exact: true }).filter({ visible: true }),
      ).toHaveCount(1)
    }
  }
  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '{}',
  )
  expect(jsonLd.jobTitle).toBe('Junior QA Engineer')
})

// TC-119: the intro statement's two accented phrases, in each language.
test('the intro statement accents the two owner phrases', async ({ page }) => {
  const accents = {
    en: ['learning software engineering', 'test everything like a user would'],
    id: ['sedang mendalami software engineering', 'menguji semuanya seperti pengguna'],
  }
  expect(en.intro.statement.filter((part) => part.accent).map((part) => part.text)).toEqual(
    accents.en,
  )
  expect(id.intro.statement.filter((part) => part.accent).map((part) => part.text)).toEqual(
    accents.id,
  )
  await page.goto('/')
  for (const { copy, toggle } of languages) {
    if (copy === id) {
      await selectLang(page, toggle)
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const statement = page.locator('#intro-statement')
    await statement.scrollIntoViewIfNeeded()
    // The line reveal splits the statement and reverts it when done (motion.spec TC-027).
    await expect(statement.locator('div')).toHaveCount(0, { timeout: 10_000 })
    await expect(statement).toHaveText(copy.intro.statement.map((part) => part.text).join(''))
    await expect(statement.locator('.text-accent-fg')).toHaveText(
      copy === en ? accents.en : accents.id,
    )
  }
})

// TC-120: service 01 no longer lists API testing (not on the owner's CV); 02 has seven items, 03
// has five.
test('the service cards list the owner’s items', async ({ page }) => {
  await page.goto('/')
  for (const { copy, toggle } of languages) {
    if (copy === id) {
      await selectLang(page, toggle)
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const cards = page.locator('#services article')
    await expect(cards).toHaveCount(3)
    const counts = [6, 7, 5]
    for (const [index, card] of copy.services.cards.entries()) {
      expect(card.items).toHaveLength(counts[index])
      // Each row is the item, then its aria-hidden mono index.
      await expect(cards.nth(index).locator('li > span:first-child')).toHaveText([...card.items])
    }
    for (const item of await cards.nth(0).locator('li > span:first-child').allTextContents()) {
      expect(item).not.toMatch(/API/)
    }
  }
})

// TC-121: the Kopra statement with the owner's numbers, and the PintuKos database checks.
test('the QA evidence states the Kopra numbers and the database checks', async ({ page }) => {
  expect(en.qa.paragraph).toContain('693 database checks')
  expect(id.qa.paragraph).toContain('693 cek database')
  await page.goto('/')
  for (const { copy, toggle } of languages) {
    if (copy === id) {
      await selectLang(page, toggle)
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const qa = page.locator('#qa')
    await expect(qa.getByText(copy.qa.statement, { exact: true })).toHaveCount(1)
    await expect(qa.getByText(copy.qa.paragraph, { exact: true })).toHaveCount(1)
  }
})

// TC-122: the footer credits Claude Code.
test('the footer names the tools, Claude Code included', async ({ page }) => {
  expect(en.footer.builtWith).toBe('Built with Next.js, GSAP & React Three Fiber, with Claude Code')
  expect(id.footer.builtWith).toBe(
    'Dibangun dengan Next.js, GSAP & React Three Fiber, bersama Claude Code',
  )
  await page.goto('/')
  for (const { copy, toggle } of languages) {
    if (copy === id) {
      await selectLang(page, toggle)
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    await expect(
      page.locator('footer').getByText(copy.footer.builtWith, { exact: true }),
    ).toHaveCount(1)
  }
})

/** Width × height of a WebP file, from its VP8 frame header or VP8X canvas. */
function webpSize(file: string) {
  const bytes = readFileSync(file)
  expect(bytes.subarray(0, 4).toString('latin1'), file).toBe('RIFF')
  expect(bytes.subarray(8, 12).toString('latin1'), file).toBe('WEBP')
  const chunk = bytes.subarray(12, 16).toString('latin1')
  if (chunk === 'VP8X')
    return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 }
  if (chunk === 'VP8 ')
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff }
  throw new Error(`${file}: unexpected chunk ${chunk}`)
}

// TC-124: "This portfolio" is the second card: live, Preview (its three boards) then GitHub (its
// public repository, the first one linked; PRD §6.1, rule 2), in both languages.
test('this portfolio is the second project, with Preview and GitHub', async ({ page }) => {
  const portfolio = projects.find((project) => project.id === 'portfolio')!
  expect(projects.map((project) => project.id).indexOf('portfolio')).toBe(1)
  expect(portfolio.images).toHaveLength(3)
  for (const image of portfolio.images) {
    expect(webpSize(`public${image.src}`)).toEqual({ width: 1600, height: 900 })
    expect([image.width, image.height]).toEqual([1600, 900])
  }
  await page.goto('/')
  for (const { copy, toggle } of languages) {
    const lang = copy === en ? 'en' : 'id'
    if (copy === id) {
      await selectLang(page, toggle)
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const card = page.locator('#work article').nth(1)
    await expect(card.getByRole('heading', { level: 3 })).toHaveText(
      copy.projects.items.portfolio.title,
    )
    await expect(card.getByText(copy.projects.items.portfolio.description)).toBeVisible()
    await expect(card.getByText(copy.projects.items.portfolio.role)).toBeVisible()
    await expect(card.getByText(copy.projects.status.live, { exact: true })).toBeVisible()
    // The CTA row, in order: exactly Preview (a lightbox button), then GitHub (an external link).
    const row = card.locator('div:has(> a), div:has(> button)').last()
    await expect(row.locator('> a, > button')).toHaveText([
      copy.projects.cta.preview,
      copy.projects.cta.github,
    ])
    const github = card.getByRole('link', { name: copy.projects.cta.github, exact: true })
    await expect(github).toHaveAttribute('href', portfolio.repoUrl!)
    await expect(github).toHaveAttribute('target', '_blank')
    await expect(github).toHaveAttribute('rel', /\bnoopener\b/)

    // Preview opens the three boards, captioned with their alt text in this language.
    await card.getByRole('button', { name: copy.projects.cta.preview, exact: true }).click()
    const dialog = page.getByRole('dialog', { name: copy.lightbox.label })
    const counter = (n: number) =>
      copy.lightbox.counter.replace('{current}', String(n)).replace('{total}', '3')
    for (const [index, image] of portfolio.images.entries()) {
      await expect(dialog).toContainText(counter(index + 1))
      await expect(dialog.getByRole('img')).toHaveAttribute('alt', image.alt[lang])
      await page.keyboard.press('ArrowRight')
    }
    await expect(dialog).toContainText(counter(1))
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  }
})

// TC-125: the owner's PintuKos and Malau sentences (v1.1 content), in both languages.
test('the PintuKos and Malau cards carry the owner’s new sentences', async ({ page }) => {
  expect(en.projects.items.pintukos.description).toMatch(
    / Private beta; a demo is available on request\.$/,
  )
  expect(id.projects.items.pintukos.description).toMatch(
    / Beta privat; demo tersedia atas permintaan\.$/,
  )
  expect(en.projects.items['malau-website'].description).toContain('a 22-page SRS and the PRD')
  expect(id.projects.items['malau-website'].description).toContain('SRS 22 halaman, dan PRD')
  await page.goto('/')
  for (const { copy, toggle } of languages) {
    if (copy === id) {
      await selectLang(page, toggle)
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    for (const project of ['pintukos', 'malau-website'] as const) {
      await expect(
        page.locator('#work').getByText(copy.projects.items[project].description, { exact: true }),
      ).toHaveCount(1)
    }
  }
})

// TC-128: the copy states the distinct test count from `playwright test --list` (180 when this
// landed), never the run count, and counts no pull requests (DECISIONS 2026-11-27).
test('the intro and the portfolio card state the test count, not a PR count', async ({ page }) => {
  const prCount = /\d+\s+(?:reviewed\s+)?pull requests?\b|\d+\s+reviewed\b/i
  await page.goto('/')
  for (const { copy, toggle } of languages) {
    if (copy === id) {
      await selectLang(page, toggle)
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const shown = [
      page.locator('#about p').getByText(copy.intro.paragraph, { exact: true }),
      page
        .locator('#work article')
        .nth(1)
        .getByText(copy.projects.items.portfolio.description, { exact: true }),
    ]
    for (const text of shown) {
      await expect(text).toHaveCount(1)
      const content = (await text.textContent()) ?? ''
      expect(content).toContain('180+')
      expect(content).not.toContain('600+')
      expect(content).not.toMatch(prCount)
    }
  }
})
