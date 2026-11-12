/**
 * SEO facts shared by the root metadata, sitemap.ts, robots.ts and the JSON-LD (PRD §8 SEO).
 * Crawlers only ever see the server render, which is English (PRD F-02), so everything here is EN.
 */
import en from '@/content/en'
import { site } from '@/content/site'

/**
 * Canonical origin. `NEXT_PUBLIC_SITE_URL` replaces the default at build time, which is how M5
 * moves to a custom domain without a code change. `||` (not `??`): an empty variable falls back
 * instead of making `new URL('')` throw.
 */
export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || site.url)

/** schema.org `Person` for the site owner. */
export const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  alternateName: site.brand,
  jobTitle: en.hero.roles[0],
  url: siteUrl.href,
  email: site.email,
  sameAs: [site.github.url, ...(site.linkedin ? [site.linkedin] : [])],
  address: {
    '@type': 'PostalAddress',
    addressLocality: site.location.city,
    addressCountry: site.location.countryCode,
  },
}

/**
 * The JSON-LD as the inline script's text, with `<` escaped so no value can close the tag (Next's
 * JSON-LD guide). The M5 CSP note in docs/DECISIONS.md records this text's hash.
 */
export const PERSON_JSON_LD = JSON.stringify(personJsonLd).replace(/</g, '\\u003c')
