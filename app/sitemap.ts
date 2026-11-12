import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

/**
 * One URL: the site is a single route with a client-side language switch, so there are no
 * per-language URLs (PRD F-02). `BUILD_TIME` is set in next.config.ts: with Cache Components a
 * `new Date()` here would make the route dynamic and change `lastmod` on every request.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl.href, lastModified: process.env.BUILD_TIME }]
}
