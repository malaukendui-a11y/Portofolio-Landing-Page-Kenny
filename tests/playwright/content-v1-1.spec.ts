// v1.1 content refresh (the owner's copy deck, 26 Nov 2026; docs/QA-PLAN.md TC-118 onwards):
// TC-118 (junior roles and per-language title), TC-119 (intro accents), TC-120 (services items),
// TC-121 (QA evidence statement and the database checks), TC-122 (footer credit).
// Literals here are the owner's approved strings: a silent copy change fails these tests.
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
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
