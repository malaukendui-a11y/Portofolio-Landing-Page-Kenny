import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import en from '@/content/en'
import { site } from '@/content/site'
import { LangHtmlSync } from '@/components/ui/LangHtmlSync'
import { LOADER_PREPAINT_SCRIPT } from '@/lib/loader'
import { PERSON_JSON_LD, siteUrl } from '@/lib/seo'
import { fontClassNames } from './fonts'
import 'lenis/dist/lenis.css'
import './globals.css'

// Server-rendered metadata is English (crawlers see this); LangHtmlSync switches the title and
// description on the client (PRD F-14). The OpenGraph image is app/opengraph-image.png; Next fills
// og:title/description from title/description and the Twitter card from openGraph.
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: en.meta.title,
  description: en.meta.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: site.brand,
    locale: site.ogLocale.en,
    alternateLocale: [site.ogLocale.id],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // The pre-paint script and LangHtmlSync set attributes on <html> before hydration.
    <html lang="en" className={`${fontClassNames} h-full`} suppressHydrationWarning>
      <head>
        {/* Loader flag (PRD F-12) before first paint; the CSP (M5) must allow its hash. */}
        <script dangerouslySetInnerHTML={{ __html: LOADER_PREPAINT_SCRIPT }} />
        {/* JSON-LD Person (PRD §8 SEO): a data block, never executed; hash noted for the M5 CSP. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: PERSON_JSON_LD }} />
      </head>
      <body className="flex min-h-full flex-col">
        <LangHtmlSync />
        {children}
      </body>
    </html>
  )
}
