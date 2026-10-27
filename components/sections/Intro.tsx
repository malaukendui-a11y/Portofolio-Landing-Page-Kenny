'use client'

import { site } from '@/content/site'
import { useLang } from '@/lib/i18n'
import { ButtonLink } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/** Intro (DESIGN §4.3): statement with accented phrases, short bio, two CTAs. */
export function Intro() {
  const { t } = useLang()
  return (
    <Section id="about" surface="dark" labelledBy="intro-statement">
      <SectionLabel className="mb-8">{t.intro.label}</SectionLabel>
      <h2
        id="intro-statement"
        className="max-w-measure font-display text-statement-sm md:text-statement-md lg:text-statement"
      >
        {t.intro.statement.map((part, index) =>
          part.accent ? (
            <span key={index} className="text-accent-fg">
              {part.text}
            </span>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </h2>
      <p className="mt-8 max-w-[60ch] text-body-lg-sm text-fg-muted md:text-body-lg">
        {t.intro.paragraph}
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <ButtonLink href="#work" variant="accent">
          {t.intro.seeWork}
        </ButtonLink>
        {site.cvUrl && (
          <ButtonLink href={site.cvUrl} variant="outlined" download>
            {t.intro.downloadCv}
          </ButtonLink>
        )}
      </div>
    </Section>
  )
}
