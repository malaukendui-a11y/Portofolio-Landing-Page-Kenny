'use client'

import { useLang } from '@/lib/i18n'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/** QA Evidence (DESIGN §4.6) — paper surface. Document previews land in M1/M4. */
export function QAEvidence() {
  const { t } = useLang()
  return (
    <Section id="qa" surface="paper" labelledBy="qa-heading">
      <SectionLabel className="mb-8">{t.qa.label}</SectionLabel>
      <h2 id="qa-heading" className="sr-only">
        {t.qa.heading}
      </h2>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="max-w-measure font-display text-h2-sm md:text-h2">{t.qa.statement}</p>
          <p className="mt-6 max-w-[60ch] text-body-lg-sm text-fg-muted md:text-body-lg">
            {t.qa.paragraph}
          </p>
        </div>
        <ul className="grid gap-6 sm:grid-cols-3 lg:col-span-6">
          {t.qa.artifacts.map((artifact) => (
            <li
              key={artifact.title}
              className="rounded-card border border-hairline bg-paper-50 p-6"
            >
              <h3 className="font-display text-h3-sm md:text-h3">{artifact.title}</h3>
              <p className="mt-2 font-mono text-meta-sm text-fg-muted md:text-meta">
                {artifact.caption}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
