import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import en from '@/content/en'
import { LangHtmlSync } from '@/components/ui/LangHtmlSync'
import { LOADER_PREPAINT_SCRIPT } from '@/lib/loader'
import { fontClassNames } from './fonts'
import 'lenis/dist/lenis.css'
import './globals.css'

// Default-language metadata. Per-language <title> switching lands in M4 (PRD F-14).
export const metadata: Metadata = {
  title: en.meta.title,
  description: en.meta.description,
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // The pre-paint script and LangHtmlSync set attributes on <html> before hydration.
    <html lang="en" className={`${fontClassNames} h-full`} suppressHydrationWarning>
      <head>
        {/* Loader flag (PRD F-12) before first paint; the CSP (M4) must allow its hash. */}
        <script dangerouslySetInnerHTML={{ __html: LOADER_PREPAINT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <LangHtmlSync />
        {children}
      </body>
    </html>
  )
}
