// TC-001 (preview renders EN and ID), TC-004 (no third-party requests),
// TC-005 (status → CTA rules), TC-006 (language persists).
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import { selectLang } from './helpers'

test('renders English by default, toggles to Indonesian and persists the choice', async ({
  page,
}) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    const { hostname } = new URL(request.url())
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') externalRequests.push(request.url())
  })

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

  expect(externalRequests, 'fonts and scripts must be self-hosted').toEqual([])
})

test('project cards follow the status → CTA rules', async ({ page }) => {
  await page.goto('/')
  const work = page.locator('#work')
  await expect(work.getByRole('heading', { name: en.projects.items.pintukos.title })).toBeVisible()
  // No project has a public liveUrl, so no "Live demo" anywhere; PintuKos is live as a private
  // deployment and previews its images instead (the only "Preview").
  await expect(work.getByRole('link', { name: en.projects.cta.liveDemo })).toHaveCount(0)
  await expect(
    work.getByRole('button', { name: en.projects.cta.preview, exact: true }),
  ).toHaveCount(1)
  // No repo is shown since M4b (PintuKos private in beta; Trading Compass hidden until its
  // README is real), so no GitHub link.
  await expect(work.getByRole('link', { name: en.projects.cta.github, exact: true })).toHaveCount(0)
  // The thesis has a PDF, so the research card links to it (TC-015).
  const paper = work.getByRole('link', { name: en.projects.cta.readPaper })
  await expect(paper).toHaveCount(1)
  await expect(paper).toHaveAttribute('href', /^\/papers\/.+\.pdf$/)
})
