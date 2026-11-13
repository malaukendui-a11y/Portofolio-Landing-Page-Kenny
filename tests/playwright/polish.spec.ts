// M4a polish (PRD F-14, F-15, §8 SEO): sitemap, robots, canonical, JSON-LD, OpenGraph image,
// per-language title and description, the 404 page, Experience rows. TC-075 to TC-084.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import en from '../../content/en'
import id from '../../content/id'
import { site } from '../../content/site'
import { siteUrl } from '../../lib/seo'
import { selectLang, tabsToLinks } from './helpers'

/** Next writes the root URL without its trailing slash; compare URLs in normalised form. */
const normalise = (url: string | null) => (url === null ? null : new URL(url).href)

/** Every `<meta name="description">` carries `description` (React may append a second one). */
async function expectDescription(page: Page, description: string) {
  await expect
    .poll(() =>
      page
        .locator('meta[name="description"]')
        .evaluateAll((metas) => [...new Set(metas.map((meta) => meta.getAttribute('content')))]),
    )
    .toEqual([description])
}

// TC-079
test('the title and description follow the language, also after a reload', async ({
  page,
  request,
}) => {
  // The server renders English: that is what crawlers and link previews read.
  expect(await (await request.get('/')).text()).toContain(`<title>${en.meta.title}</title>`)

  await page.goto('/')
  await expect(page).toHaveTitle(en.meta.title)
  await expect(page.locator('title')).toHaveCount(1)
  await expectDescription(page, en.meta.description)

  await selectLang(page, 'ID')
  await expect(page).toHaveTitle(id.meta.title)
  await expectDescription(page, id.meta.description)

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page).toHaveTitle(id.meta.title)
  await expectDescription(page, id.meta.description)

  // When Next's metadata boundary commits after LangHtmlSync ran, React puts the server's title
  // back and appends an English description; LangHtmlSync must switch both again.
  await page.evaluate(
    ({ title, description }) => {
      document.querySelector('title')!.textContent = title
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = description
      document.head.append(meta)
    },
    { title: en.meta.title, description: en.meta.description },
  )
  await expect(page).toHaveTitle(id.meta.title)
  await expectDescription(page, id.meta.description)

  await selectLang(page, 'EN')
  await expect(page).toHaveTitle(en.meta.title)
  await expectDescription(page, en.meta.description)
})

// TC-075
test('sitemap.xml lists the canonical URL with a build-time lastmod', async ({ request }) => {
  const testStart = Date.now()
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
  // Build time, not request time: earlier than this test and the same on the next request.
  expect(time).toBeLessThan(testStart)
  await new Promise((resolve) => setTimeout(resolve, 20))
  const again = (await (await request.get('/sitemap.xml')).text()).match(
    /<lastmod>([^<]+)<\/lastmod>/,
  )?.[1]
  expect(again).toBe(lastmod)
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

/** The `content` of `<meta property|name="key">` in the page's head. */
const metaContent = (page: Page, key: string) =>
  page.locator(`meta[property="${key}"], meta[name="${key}"]`).first().getAttribute('content')

// TC-077
test('the OpenGraph image is a 1200 × 630 PNG shared by the Twitter card', async ({
  page,
  request,
}) => {
  await page.goto('/')
  const image = await metaContent(page, 'og:image')
  expect(image, 'og:image').toBeTruthy()
  const imageUrl = new URL(image!)
  // Absolute on the canonical origin (metadataBase), with Next's content-hash query.
  expect(imageUrl.origin).toBe(siteUrl.origin)
  expect(`${imageUrl.pathname}${imageUrl.search}`).toMatch(/^\/opengraph-image\.png\?[\w.-]+$/)

  // Served by this build (never request the production host: rule 10, TC-004).
  const response = await request.get(`${imageUrl.pathname}${imageUrl.search}`)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('image/png')
  const bytes = await response.body()
  expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG')
  expect({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }).toEqual({
    width: 1200,
    height: 630,
  })
  expect(bytes.length, 'og image ≤ 300 KB').toBeLessThanOrEqual(300 * 1024)

  expect(await metaContent(page, 'og:image:width')).toBe('1200')
  expect(await metaContent(page, 'og:image:height')).toBe('630')
  expect(await metaContent(page, 'og:image:type')).toBe('image/png')
  expect(await metaContent(page, 'og:image:alt')).toBe(en.meta.og.alt)
  expect(await metaContent(page, 'og:type')).toBe('website')
  expect(await metaContent(page, 'og:site_name')).toBe(site.brand)
  expect(await metaContent(page, 'og:locale')).toBe(site.ogLocale.en)
  expect(await metaContent(page, 'og:locale:alternate')).toBe(site.ogLocale.id)
  expect(await metaContent(page, 'og:title')).toBe(en.meta.title)
  expect(await metaContent(page, 'og:description')).toBe(en.meta.description)
  expect(normalise(await metaContent(page, 'og:url'))).toBe(siteUrl.href)
  expect(await metaContent(page, 'twitter:card')).toBe('summary_large_image')
  expect(await metaContent(page, 'twitter:image')).toBe(image)
})

// TC-078: the 404 page (PRD F-15).
test.describe('404 page', () => {
  const missing = '/this-page-does-not-exist'

  test('answers 404 with the site look, in English and Indonesian', async ({ page, request }) => {
    // The server title is the 404's own (what link previews and no-JS clients see); the client
    // would hide a missing one by setting the same title after hydration.
    expect(await (await request.get(missing)).text()).toContain(
      `<title>${en.notFound.title}</title>`,
    )

    const response = await page.goto(missing)
    expect(response?.status()).toBe(404)
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toHaveText(en.notFound.heading)
    await expect(page.getByText(en.notFound.body)).toBeVisible()
    await expect(page.getByRole('link', { name: en.notFound.cta })).toHaveAttribute('href', '/')
    await expect(page).toHaveTitle(en.notFound.title)
    await expect(page.locator('title')).toHaveCount(1)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
    // The nav leads to the home page's sections, not to anchors on this page. The CV link is
    // root-relative already (it is in the DOM at both sizes, shown from md up).
    expect(
      await page
        .locator('header nav a')
        .evaluateAll((links) => links.map((a) => a.getAttribute('href'))),
    ).toEqual(['/', '/#work', '/#about', '/#contact', site.cvUrl])

    await selectLang(page, 'ID')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    await expect(heading).toHaveText(id.notFound.heading)
    await expect(page.getByText(id.notFound.body)).toBeVisible()
    await expect(page.getByRole('link', { name: id.notFound.cta })).toBeVisible()
    await expect(page).toHaveTitle(id.notFound.title)
  })

  test('works from the keyboard and leads back to the top of the home page', async ({
    page,
    browserName,
  }) => {
    test.skip(
      !tabsToLinks(browserName),
      'this WebKit, like Safari by default, does not Tab to links',
    )
    await page.goto(missing)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: en.nav.skipToContent })).toBeFocused()
    const home = page.getByRole('link', { name: en.notFound.cta })
    for (let presses = 0; presses < 12; presses++) {
      if (await home.evaluate((link) => link === document.activeElement)) break
      await page.keyboard.press('Tab')
    }
    await expect(home).toBeFocused()
    expect(await home.evaluate((link) => link.matches(':focus-visible'))).toBe(true)
    await page.keyboard.press('Enter')
    await page.waitForURL((url) => url.pathname === '/' && url.hash === '')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.hero.name)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })
})

// TC-082: an empty period or description renders no empty paragraph; the owner's periods
// (PRD §12.6, M4b) show in both languages. The education description is still empty, so the
// empty-paragraph rule keeps running on live data.
test('the Experience timeline shows both periods and has no empty paragraphs', async ({ page }) => {
  expect(en.experience.education.period).toBe('2021 — Jan 2026')
  expect(id.experience.education.period).toBe('2021 — Jan 2026')
  await page.goto('/')
  const timeline = page.locator('#experience')
  for (const copy of [en, id]) {
    if (copy === id) {
      await selectLang(page, 'ID')
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    }
    const empty = await timeline
      .locator('p')
      .evaluateAll((paragraphs) => paragraphs.filter((p) => !p.textContent?.trim()).length)
    expect(empty).toBe(0)
    for (const entry of [copy.experience.work, copy.experience.education]) {
      await expect(timeline.getByText(entry.period, { exact: true })).toBeVisible()
      await expect(timeline.getByRole('heading', { name: entry.title })).toBeVisible()
    }
  }
})

// TC-084
test('the OpenGraph export route does not exist in production', async ({ request }) => {
  expect((await request.get('/dev/og-export')).status()).toBe(404)
})

// TC-083
test('titles are set and descriptions fit a search snippet in both languages', () => {
  for (const copy of [en, id]) {
    expect(copy.meta.title.length).toBeGreaterThan(0)
    expect(copy.meta.description.length).toBeGreaterThan(0)
    expect(copy.meta.description.length, copy.meta.description).toBeLessThanOrEqual(155)
  }
})
