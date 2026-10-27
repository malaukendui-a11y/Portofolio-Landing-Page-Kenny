// TC-001 (preview renders EN and ID), TC-004 (no third-party requests),
// TC-005 (status → CTA rules).
import { expect, test } from '@playwright/test'
import en from '../../content/en'
import id from '../../content/id'

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

  await page.getByRole('button', { name: 'ID', exact: true }).click()
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
  // No project is live yet, so no "Live demo" anywhere.
  await expect(work.getByRole('link', { name: en.projects.cta.liveDemo })).toHaveCount(0)
  // Only Trading Compass has a public repo.
  await expect(work.getByRole('link', { name: en.projects.cta.github })).toHaveCount(1)
})
