'use client'

import { site } from '@/content/site'
import { useLang } from '@/lib/i18n'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { AvailabilityBadge } from './AvailabilityBadge'

/**
 * Hero (DESIGN §4.2) — M0 renders the identity block as static HTML.
 * Ticker, portrait and the glass element arrive in M1–M3.
 */
export function Hero() {
  const { t } = useLang()
  const socials = [
    site.linkedin ? { href: site.linkedin, label: t.hero.socials.linkedin } : null,
    { href: site.github.url, label: t.hero.socials.github },
    { href: site.whatsapp.url, label: t.hero.socials.whatsapp },
  ].filter((social) => social !== null)

  return (
    <section
      id="top"
      aria-labelledby="hero-name"
      className="surface-paper flex min-h-[80vh] flex-col justify-between gap-12 px-gutter-sm py-section-sm md:px-gutter-md lg:px-gutter"
    >
      <div className="flex justify-end">
        <AvailabilityBadge label={t.hero.availability} />
      </div>

      <h1
        id="hero-name"
        className="font-display text-statement-sm md:text-statement-md lg:text-statement"
      >
        {t.hero.name}
      </h1>

      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <ul className="flex flex-col gap-1 text-body">
          {socials.map((social) => (
            <li key={social.href}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg hover:text-accent-fg"
              >
                <span aria-hidden="true">— </span>
                {social.label}
              </a>
            </li>
          ))}
        </ul>
        <ul className="font-display text-h2-sm md:text-right md:text-h2">
          {t.hero.roles.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
      </div>

      <SectionLabel>{t.hero.scrollCue}</SectionLabel>
    </section>
  )
}
