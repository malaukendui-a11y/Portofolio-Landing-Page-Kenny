'use client'

import { site } from '@/content/site'
import { useLang } from '@/lib/i18n'

/** Footer (DESIGN §4.10): compact, dark, mono meta. */
export function Footer() {
  const { t } = useLang()
  const links = [
    { href: '#work', label: t.nav.work },
    { href: '#about', label: t.nav.about },
    { href: '#contact', label: t.nav.contact },
  ]
  return (
    <footer className="surface-dark px-gutter-sm py-8 md:px-gutter-md lg:px-gutter">
      <div className="flex flex-col gap-4 font-mono text-meta-sm text-fg-muted md:flex-row md:items-center md:justify-between md:text-meta">
        <p>{t.footer.copyright.replace('{year}', String(site.launchYear))}</p>
        <p>{t.footer.builtWith}</p>
        <p>{t.footer.languageNote}</p>
        <ul className="flex gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="hover:text-fg">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
