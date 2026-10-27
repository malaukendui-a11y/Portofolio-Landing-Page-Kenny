'use client'

import { certifications } from '@/content/certifications'
import { useLang } from '@/lib/i18n'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/** Certifications (DESIGN §4.8). Certificate images + lightbox arrive in M1. */
export function Certifications() {
  const { t } = useLang()
  return (
    <Section id="certifications" surface="dark" labelledBy="certifications-heading">
      <SectionLabel className="mb-8">{t.certifications.label}</SectionLabel>
      <h2 id="certifications-heading" className="sr-only">
        {t.certifications.heading}
      </h2>
      <ul className="grid gap-6 md:grid-cols-3">
        {certifications.map((cert) => {
          const copy = t.certifications.items[cert.id]
          return (
            <li key={cert.id} className="rounded-card border border-hairline bg-ink-800 p-6">
              <p className="font-mono text-meta-sm text-fg-muted md:text-meta">{copy.period}</p>
              <h3 className="mt-3 font-display text-h3-sm md:text-h3">{copy.title}</h3>
              <p className="mt-2 text-body text-fg-muted">{copy.issuer}</p>
              <p className="mt-4 text-body">{copy.scope}</p>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
