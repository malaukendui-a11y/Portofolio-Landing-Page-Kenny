'use client'

import { useEffect } from 'react'
import { useLang } from '@/lib/i18n'

/**
 * Keeps `<html lang>`, the document title and the meta description in the selected language
 * (PRD F-02, F-14). Renders nothing. The server renders English, which is what crawlers and link
 * previews see; this switches the open tab.
 *
 * It re-applies whenever `<head>` changes: Next renders the metadata inside a Suspense boundary,
 * and when that boundary commits React resets the first `<title>` to the server text and appends
 * a description whose content it no longer finds. That commit can land after this effect ran.
 */
export function LangHtmlSync() {
  const { lang, t } = useLang()
  useEffect(() => {
    const { title, description } = t.meta
    const apply = () => {
      document.documentElement.lang = lang
      if (document.title !== title) document.title = title
      for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="description"]')) {
        if (meta.content !== description) meta.content = description
      }
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [lang, t])
  return null
}
