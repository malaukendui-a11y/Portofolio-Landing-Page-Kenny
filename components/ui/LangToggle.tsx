'use client'

import { LANGS, useLang } from '@/lib/i18n'

/** EN / ID toggle (DESIGN §5). Active language in `fg`, inactive in `fg-muted`. */
export function LangToggle() {
  const { lang, setLang, t } = useLang()
  return (
    <div role="group" aria-label={t.nav.language} className="flex items-center font-mono text-meta">
      {LANGS.map((code, index) => (
        <span key={code} className="flex items-center">
          {index > 0 && (
            <span aria-hidden="true" className="px-1 text-fg-muted">
              /
            </span>
          )}
          <button
            type="button"
            lang={code}
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
            className={`min-h-11 min-w-11 rounded-pill px-1 uppercase transition-colors duration-fast ease-out ${
              lang === code ? 'text-fg underline underline-offset-4' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
