import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

/** Everything is crawlable except the development-only export routes under /dev/. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/dev/' },
    sitemap: new URL('/sitemap.xml', siteUrl).href,
  }
}
