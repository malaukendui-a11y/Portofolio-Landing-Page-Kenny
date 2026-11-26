// TC-001 (preview renders EN and ID), TC-004 (no third-party requests),
// TC-005 (status → CTA rules), TC-006 (language persists).
import { expect, test } from './fixtures'
import en from '../../content/en'
import { projects } from '../../content/projects'
import id from '../../content/id'
import { selectLang } from './helpers'

test('renders English by default, toggles to Indonesian and persists the choice', async ({
  page,
}) => {
  // Origins, not host names: a blob: URL carries the page's own origin. A request the CSP blocks is
  // never sent; the fixture's CSP guard fails the test on it instead.
  const requested: string[] = []
  page.on('request', (request) => requested.push(request.url()))

  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ananda Kenny')
  await expect(page.getByText(en.intro.paragraph)).toBeVisible()

  await selectLang(page, 'ID')
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page.getByText(id.intro.paragraph)).toBeVisible()

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page.getByText(id.intro.paragraph)).toBeVisible()

  const origin = new URL(page.url()).origin
  expect(
    requested.filter((url) => new URL(url).origin !== origin),
    'fonts and scripts must be self-hosted',
  ).toEqual([])
})

test('project cards follow the status → CTA rules', async ({ page }) => {
  await page.goto('/')
  const work = page.locator('#work')
  await expect(work.getByRole('heading', { name: en.projects.items.pintukos.title })).toBeVisible()
  // No project has a public liveUrl, so no "Live demo" anywhere. PintuKos is live behind a login:
  // it links its app as invite only (the one such link, M4b batch 2) and previews its images;
  // since v1.1 content this portfolio previews its boards too (two "Preview" buttons).
  await expect(work.getByRole('link', { name: en.projects.cta.liveDemo })).toHaveCount(0)
  const app = work.getByRole('link', { name: en.projects.cta.liveDemoPrivate, exact: true })
  await expect(app).toHaveCount(1)
  await expect(app).toHaveAttribute('href', 'https://app.pintukos.my.id/')
  await expect(
    work.getByRole('button', { name: en.projects.cta.preview, exact: true }),
  ).toHaveCount(2)
  // One GitHub link in the cards since v1.1 content: this portfolio's public repository (PintuKos
  // stays private in beta, Trading Compass hidden until its README is real). The hero and Reach
  // Out also link the GitHub profile; those are not project CTAs.
  const github = work.getByRole('link', { name: en.projects.cta.github, exact: true })
  await expect(github).toHaveCount(1)
  await expect(github).toHaveAttribute(
    'href',
    projects.find((project) => project.id === 'portfolio')!.repoUrl!,
  )
  await expect(github).toHaveAttribute('target', '_blank')
  await expect(github).toHaveAttribute('rel', /\bnoopener\b/)
  // The thesis has a PDF, so the research card links to it (TC-015).
  const paper = work.getByRole('link', { name: en.projects.cta.readPaper })
  await expect(paper).toHaveCount(1)
  await expect(paper).toHaveAttribute('href', /^\/papers\/.+\.pdf$/)
})
