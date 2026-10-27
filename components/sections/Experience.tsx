'use client'

import type { TimelineEntry } from '@/content/types'
import { useLang } from '@/lib/i18n'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

function Entry({ entry }: { entry: TimelineEntry }) {
  return (
    <article className="grid gap-4 border-t border-hairline pt-6 md:grid-cols-12">
      <p className="font-mono text-meta text-fg-muted md:col-span-3">{entry.period || ' '}</p>
      <div className="md:col-span-9">
        <h3 className="font-display text-h3-sm md:text-h3">{entry.title}</h3>
        <p className="mt-1 text-body text-fg-muted">
          {entry.org} · {entry.location}
        </p>
        {entry.description && <p className="mt-4 max-w-measure text-body">{entry.description}</p>}
        <ul className="mt-4 max-w-measure list-disc pl-5 text-body">
          {entry.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

/** Experience & Education timeline (DESIGN §4.7). */
export function Experience() {
  const { t } = useLang()
  return (
    <Section id="experience" surface="dark" labelledBy="experience-heading">
      <SectionLabel className="mb-8">{t.experience.label}</SectionLabel>
      <h2 id="experience-heading" className="mb-6 font-display text-h2-sm md:text-h2">
        {t.experience.heading}
      </h2>
      <Entry entry={t.experience.work} />
      <h2 className="mt-16 mb-6 font-display text-h2-sm md:text-h2">
        {t.experience.educationHeading}
      </h2>
      <Entry entry={t.experience.education} />
    </Section>
  )
}
