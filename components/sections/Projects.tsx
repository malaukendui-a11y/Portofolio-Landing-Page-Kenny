'use client'

import Image from 'next/image'
import { ctasFor, projects, type Project } from '@/content/projects'
import { useLang } from '@/lib/i18n'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useLightbox, type LightboxItem } from '@/components/ui/Lightbox'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ArrowUpRightIcon, FileTextIcon } from '@/components/ui/icons'

/**
 * Projects (DESIGN §4.5, PRD §6) — M1: static stacked cards (sticky stacking is M2).
 * Card grid 7/5: screenshots left (only when the project has images — no placeholder),
 * meta right: mono year, status badge, title, description, role, stack rows, CTA row.
 * CTAs come only from ctasFor; lightbox-backed ones render as real buttons.
 */
export function Projects() {
  const { t, lang } = useLang()
  const { open, lightbox } = useLightbox()

  const galleryFor = (project: Project, title: string): LightboxItem[] =>
    project.images.map((image) => ({
      src: image.src,
      width: image.width,
      height: image.height,
      alt: image.alt[lang],
      caption: title,
    }))

  return (
    <Section id="work" surface="dark" labelledBy="projects-heading">
      <SectionLabel className="mb-8">{t.projects.label}</SectionLabel>
      <h2 id="projects-heading" className="sr-only">
        {t.projects.heading}
      </h2>
      <div className="flex flex-col gap-6">
        {projects.map((project) => {
          const copy = t.projects.items[project.id]
          const ctas = ctasFor(project)
          const gallery = galleryFor(project, copy.title)
          const cover = project.images[0]
          const hasImages = cover !== undefined
          return (
            <article
              key={project.id}
              className="grid gap-8 rounded-card border border-hairline bg-ink-800 p-6 md:p-10 lg:grid-cols-12 lg:gap-10"
            >
              {hasImages && (
                <div className="lg:col-span-7">
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
                      className="h-auto w-full"
                    />
                  </button>
                </div>
              )}

              <div className={hasImages ? 'lg:col-span-5' : 'lg:col-span-12'}>
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
                    className="mt-6 max-w-measure border-t border-hairline font-mono text-label"
                  >
                    {project.stack.map((tag) => (
                      <li key={tag} className="border-b border-hairline py-3">
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
