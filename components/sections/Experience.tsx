'use client'

import type { TimelineEntry } from '@/content/types'
import { useLang } from '@/lib/i18n'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/** One timeline entry: mono period column, hairline spine with a marker, content. */
function Entry({ entry }: { entry: TimelineEntry }) {
  return (
    <article className="grid md:grid-cols-[12rem_1fr] lg:grid-cols-[16rem_1fr]">
      <p className="font-mono text-meta text-fg-muted md:pt-1">{entry.period}</p>
      <div className="relative border-l border-hairline pt-1 pb-12 pl-8 before:absolute before:top-2.5 before:-left-[0.3125rem] before:size-2.5 before:rounded-pill before:bg-accent-fg before:content-['']">
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

/** Experience & Education (DESIGN §4.7): two-column timeline with a hairline spine. */
export function Experience() {
  const { t } = useLang()
  return (
    <Section id="experience" surface="dark" labelledBy="experience-heading">
      <SectionLabel className="mb-8">{t.experience.label}</SectionLabel>
      <h2 id="experience-heading" className="mb-10 font-display text-h2-sm md:text-h2">
        {t.experience.heading}
      </h2>
      <Entry entry={t.experience.work} />
      <h2 className="mt-8 mb-10 font-display text-h2-sm md:text-h2">
        {t.experience.educationHeading}
      </h2>
      <Entry entry={t.experience.education} />
    </Section>
  )
}
