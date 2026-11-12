'use client'

import Image from 'next/image'
import { useRef, type CSSProperties } from 'react'
import { ctasFor, projects, type Project } from '@/content/projects'
import { useLang } from '@/lib/i18n'
import { refreshScrollTriggers } from '@/lib/motion'
import { useStackedCards } from '@/lib/useStackedCards'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useLightbox, type LightboxItem } from '@/components/ui/Lightbox'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ArrowUpRightIcon, FileTextIcon } from '@/components/ui/icons'

/**
 * Projects (DESIGN §4.5, PRD §6): sticky stacked cards from 1024 px, each 24 px lower
 * than the last (useStackedCards); a plain list below that and under reduced motion.
 * Card grid 7/5 from 1280 px and 6/6 from 1024 px: cover image left (only when the project has
 * images — no placeholder; it opens the lightbox with all of them), meta right: mono year,
 * status badge, title, description, role, stack rows (two ruled columns from 1024 px), CTA row.
 * A stuck card must fit below its sticky top, or its bottom never shows (motion.spec TC-092).
 * CTAs come only from ctasFor; lightbox-backed ones render as real buttons.
 */
export function Projects() {
  const { t, lang } = useLang()
  const { open, lightbox } = useLightbox()
  const stackRef = useRef<HTMLDivElement>(null)
  useStackedCards(stackRef)

  // No `caption`: the lightbox shows each image's own alt (which also says when an image is a
  // design render), so captions differ per image and follow the language.
  const galleryFor = (project: Project): LightboxItem[] =>
    project.images.map((image) => ({
      src: image.src,
      width: image.width,
      height: image.height,
      alt: image.alt[lang],
    }))

  return (
    <Section id="work" surface="dark" labelledBy="projects-heading">
      <SectionLabel className="mb-8">{t.projects.label}</SectionLabel>
      <h2 id="projects-heading" className="sr-only">
        {t.projects.heading}
      </h2>
      <div ref={stackRef} className="flex flex-col gap-6">
        {projects.map((project, index) => {
          const copy = t.projects.items[project.id]
          const ctas = ctasFor(project)
          const gallery = galleryFor(project)
          const cover = project.images[0]
          const hasImages = cover !== undefined
          return (
            <article
              key={project.id}
              style={{ '--stack-index': index } as CSSProperties}
              className="stack-card stack-offset grid gap-8 rounded-card border border-hairline bg-ink-800 p-6 md:p-10 lg:grid-cols-12 lg:gap-10"
            >
              {hasImages && (
                <div className="lg:col-span-6 xl:col-span-7">
                  <button
                    type="button"
                    onClick={() => open(gallery, 0)}
                    aria-label={t.projects.openScreenshots.replace('{title}', copy.title)}
                    className="block w-full overflow-hidden rounded-image border border-ink-700"
                  >
                    <Image
                      src={cover.src}
                      width={cover.width}
                      height={cover.height}
                      alt={cover.alt[lang]}
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      onLoad={refreshScrollTriggers}
                      className="h-auto w-full"
                    />
                  </button>
                </div>
              )}

              <div className={hasImages ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'}>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-mono text-meta text-fg-muted">({project.year})</span>
                  <StatusBadge status={project.status} label={t.projects.status[project.status]} />
                </div>
                <h3 className="mt-6 font-display text-h2-sm md:text-h2">{copy.title}</h3>
                <p className="mt-4 max-w-measure text-body-lg-sm text-fg-muted md:text-body-lg">
                  {copy.description}
                </p>
                <p className="mt-6 font-mono text-meta">
                  <span className="text-fg-muted">{t.projects.roleLabel} · </span>
                  {copy.role}
                </p>
                {project.stack.length > 0 && (
                  <ul
                    aria-label={t.projects.stackLabel}
                    className="mt-6 max-w-measure border-t border-hairline font-mono text-label lg:columns-2 lg:gap-x-10"
                  >
                    {project.stack.map((tag) => (
                      <li key={tag} className="break-inside-avoid border-b border-hairline py-3">
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
                {ctas.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-4">
                    {ctas.map((cta) =>
                      cta.href ? (
                        <ButtonLink
                          key={cta.kind}
                          href={cta.href}
                          external
                          variant={cta.primary ? 'filled' : 'outlined'}
                        >
                          {cta.kind === 'readPaper' || cta.kind === 'readPlan' ? (
                            <FileTextIcon />
                          ) : null}
                          {t.projects.cta[cta.kind]}
                          {cta.kind === 'liveDemo' || cta.kind === 'github' ? (
                            <ArrowUpRightIcon />
                          ) : null}
                        </ButtonLink>
                      ) : (
                        <Button
                          key={cta.kind}
                          variant={cta.primary ? 'filled' : 'outlined'}
                          onClick={() => open(gallery, 0)}
                        >
                          {t.projects.cta[cta.kind]}
                        </Button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
      {lightbox}
    </Section>
  )
}
