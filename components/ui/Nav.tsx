'use client'

import { site } from '@/content/site'
import { useLang } from '@/lib/i18n'
import { ButtonLink } from './Button'
import { LangToggle } from './LangToggle'

/** Sticky navigation (DESIGN §4.1). M0: static, no scroll-driven backdrop yet. */
export function Nav() {
  const { t } = useLang()
  const links = [
    { href: '#work', label: t.nav.work },
    { href: '#about', label: t.nav.about },
    { href: '#contact', label: t.nav.contact },
  ]

  return (
    <header className="surface-paper sticky top-0 z-40 px-gutter-sm py-4 md:px-gutter-md lg:px-gutter">
      <nav aria-label={t.nav.menu} className="flex flex-wrap items-center justify-between gap-4">
        <a href="#top" className="text-body-lg text-fg">
          {t.nav.brand}
        </a>
        <ul className="flex items-center gap-6">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-body text-fg hover:text-accent-fg">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <LangToggle />
          {site.cvUrl && (
            <ButtonLink href={site.cvUrl} download>
              {t.nav.downloadCv}
            </ButtonLink>
          )}
        </div>
      </nav>
    </header>
  )
}
