// M4a polish (PRD F-14, F-15, §8 SEO): sitemap, robots, canonical, JSON-LD, OpenGraph image,
// per-language title and description, the 404 page, Experience rows. TC-075 to TC-084.
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import { site } from '../../content/site'
import { siteUrl } from '../../lib/seo'

/** Next writes the root URL without its trailing slash; compare URLs in normalised form. */
const normalise = (url: string | null) => (url === null ? null : new URL(url).href)

// TC-075
test('sitemap.xml lists the canonical URL with a build-time lastmod', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('xml')
  const xml = await response.text()
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  expect(locs).toEqual([siteUrl.href])
  const lastmod = xml.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]
  expect(lastmod, 'sitemap has a lastmod').toBeTruthy()
  const time = Date.parse(lastmod!)
  expect(Number.isNaN(time), `lastmod "${lastmod}" parses`).toBe(false)
  expect(time).toBeLessThanOrEqual(Date.now())
})

// TC-076
test('robots.txt allows the site, keeps /dev/ out and points at the sitemap', async ({
  request,
}) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  const text = await response.text()
  expect(text).toMatch(/^Allow: \/$/m)
  expect(text).toMatch(/^Disallow: \/dev\/$/m)
  const sitemap = text.match(/^Sitemap: (.+)$/m)?.[1]
  expect(sitemap).toBe(new URL('/sitemap.xml', siteUrl).href)
})

// TC-080
test('the home page has an absolute canonical URL', async ({ page }) => {
  await page.goto('/')
  const canonical = page.locator('link[rel="canonical"]')
  await expect(canonical).toHaveCount(1)
  expect(normalise(await canonical.getAttribute('href'))).toBe(siteUrl.href)
})

/** Every string in a JSON value, with its path, so an empty one can be named. */
function strings(value: unknown, path = '$'): { path: string; value: unknown }[] {
  if (Array.isArray(value))
    return value.flatMap((item, index) => strings(item, `${path}[${index}]`))
  if (value !== null && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) => strings(item, `${path}.${key}`))
  return [{ path, value }]
}

// TC-081
test('JSON-LD describes the owner as a schema.org Person', async ({ page }) => {
  await page.goto('/')
  const scripts = page.locator('script[type="application/ld+json"]')
  await expect(scripts).toHaveCount(1)
  const data = JSON.parse((await scripts.textContent()) ?? '')
  expect(data['@context']).toBe('https://schema.org')
  expect(data['@type']).toBe('Person')
  expect(data.name).toBe(site.name)
  expect(data.alternateName).toBe(site.brand)
  expect(data.jobTitle).toBe(en.hero.roles[0])
  expect(normalise(data.url)).toBe(siteUrl.href)
  expect(data.email).toBe(site.email)
  expect(data.sameAs).toContain(site.github.url)
  expect(data.address).toMatchObject({
    '@type': 'PostalAddress',
    addressLocality: site.location.city,
    addressCountry: 'ID',
  })
  const empty = strings(data).filter(
    (leaf) => leaf.value === null || leaf.value === undefined || leaf.value === '',
  )
  expect(empty.map((leaf) => leaf.path)).toEqual([])
})

// TC-083
test('titles are set and descriptions fit a search snippet in both languages', () => {
  for (const copy of [en, id]) {
    expect(copy.meta.title.length).toBeGreaterThan(0)
    expect(copy.meta.description.length).toBeGreaterThan(0)
    expect(copy.meta.description.length, copy.meta.description).toBeLessThanOrEqual(155)
  }
})
