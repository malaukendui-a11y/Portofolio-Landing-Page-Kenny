import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import en from '@/content/en'
import { LangHtmlSync } from '@/components/ui/LangHtmlSync'
import { fontClassNames } from './fonts'
import './globals.css'

// Default-language metadata. Per-language <title> switching lands in M4 (PRD F-14).
export const metadata: Metadata = {
  title: en.meta.title,
  description: en.meta.description,
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${fontClassNames} h-full`}>
      <body className="flex min-h-full flex-col">
        <LangHtmlSync />
        {children}
      </body>
    </html>
  )
}
