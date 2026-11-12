'use client'

import Image from 'next/image'
import { qaArtifacts } from '@/content/qa'
import { useLang } from '@/lib/i18n'
import { useLightbox } from '@/components/ui/Lightbox'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/**
 * QA Evidence (DESIGN §4.6) — paper surface. Left: the Bank Mandiri statement and where the
 * evidence comes from. Right: a 3-up grid of the PintuKos evidence screenshots (PRD §12.7, M4b
 * batch 2) at their natural aspect; a tile's name is its image's alt (the title), and the
 * lightbox shows its caption. Rendered only while `content/qa.ts` has artifacts, no placeholders.
 */
export function QAEvidence() {
  const { t } = useLang()
  const { open, lightbox } = useLightbox()
  const items = qaArtifacts.map((artifact) => {
    const copy = t.qa.artifacts[artifact.id]
    return { ...artifact.image, alt: copy.title, caption: copy.caption }
  })

  return (
    <Section id="qa" surface="paper" labelledBy="qa-heading">
      <SectionLabel className="mb-8">{t.qa.label}</SectionLabel>
      <h2 id="qa-heading" className="sr-only">
        {t.qa.heading}
      </h2>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className={qaArtifacts.length > 0 ? 'lg:col-span-5' : 'lg:col-span-8'}>
          <p className="max-w-measure font-display text-statement-sm md:text-statement-md lg:text-statement">
            {t.qa.statement}
          </p>
          <p className="mt-8 max-w-[60ch] text-body-lg-sm text-fg-muted md:text-body-lg">
            {t.qa.paragraph}
          </p>
        </div>
        {qaArtifacts.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-3 lg:col-span-7">
            {qaArtifacts.map((artifact, index) => {
              const copy = t.qa.artifacts[artifact.id]
              return (
                <li key={artifact.id}>
                  <button
                    type="button"
                    onClick={() => open(items, index)}
                    className="block w-full overflow-hidden rounded-image border border-hairline bg-paper-50"
                  >
                    <Image
                      src={artifact.image.src}
                      width={artifact.image.width}
                      height={artifact.image.height}
                      alt={copy.title}
                      // A tile is about 17vw wide from 1024 px (240 px at 1440), 30vw from 640 px
                      // and the full column below.
                      sizes="(min-width: 1024px) 17vw, (min-width: 640px) 30vw, calc(100vw - 40px)"
                      className="h-auto w-full"
                    />
                  </button>
                  <h3 className="mt-4 font-display text-h3-sm text-balance md:text-h3">
                    {copy.title}
                  </h3>
                  <p className="mt-1 font-mono text-meta-sm text-fg-muted md:text-meta">
                    {copy.caption}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {lightbox}
    </Section>
  )
}
