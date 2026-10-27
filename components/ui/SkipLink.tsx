'use client'

import { useLang } from '@/lib/i18n'

export function SkipLink() {
  const { t } = useLang()
  return (
    <a
      href="#main"
      className="sr-only rounded-pill bg-ink-900 px-6 py-3 text-text-on-dark focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
    >
      {t.nav.skipToContent}
    </a>
  )
}
