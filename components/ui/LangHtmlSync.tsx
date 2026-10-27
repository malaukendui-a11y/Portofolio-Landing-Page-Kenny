'use client'

import { useEffect } from 'react'
import { useLang } from '@/lib/i18n'

/** Keeps <html lang> in step with the selected language (PRD F-02). Renders nothing. */
export function LangHtmlSync() {
  const { lang } = useLang()
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}
