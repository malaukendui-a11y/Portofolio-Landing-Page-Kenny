import type { Metadata } from 'next'
import en from '@/content/en'
import { NotFound } from '@/components/sections/NotFound'
import { LangHtmlSync } from '@/components/ui/LangHtmlSync'

// English on the server like every page; LangHtmlSync switches the title on the client. No
// canonical: the layout's points at the home page, and Next already marks a 404 `noindex`.
export const metadata: Metadata = {
  title: en.notFound.title,
  alternates: { canonical: null },
}

export default function NotFoundPage() {
  return (
    <>
      <LangHtmlSync page="notFound" />
      <NotFound />
    </>
  )
}
