'use client'

import { ctasFor, projects } from '@/content/projects'
import { useLang } from '@/lib/i18n'
import { StatusBadge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/** Projects (DESIGN §4.5, PRD §6). CTAs come only from ctasFor — never hard-coded. */
export function Projects() {
  const { t } = useLang()
  return (
    <Section id="work" surface="dark" labelledBy="projects-heading">
      <SectionLabel className="mb-8">{t.projects.label}</SectionLabel>
      <h2 id="projects-heading" className="sr-only">
        {t.projects.heading}
      </h2>
      <div className="flex flex-col gap-10">
        {projects.map((project) => {
          const copy = t.projects.items[project.id]
          const ctas = ctasFor(project)
          return (
            <article
              key={project.id}
              className="rounded-card border border-hairline bg-ink-800 p-6 md:p-10"
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-mono text-meta text-fg-muted">({project.year})</span>
                <StatusBadge status={project.status} label={t.projects.status[project.status]} />
              </div>
              <h3 className="mt-6 font-display text-h2-sm md:text-h2">{copy.title}</h3>
              <p className="mt-4 max-w-measure text-body-lg-sm text-fg-muted md:text-body-lg">
                {copy.description}
              </p>
              <dl className="mt-6 grid gap-2 font-mono text-meta">
                <div className="flex gap-3">
                  <dt className="text-fg-muted">{t.projects.roleLabel}</dt>
                  <dd>{copy.role}</dd>
                </div>
                {project.stack.length > 0 && (
                  <div className="flex gap-3">
                    <dt className="text-fg-muted">{t.projects.stackLabel}</dt>
                    <dd>{project.stack.join(' · ')}</dd>
                  </div>
                )}
              </dl>
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
                        {t.projects.cta[cta.kind]}
                      </ButtonLink>
                    ) : (
                      // Lightbox-backed CTAs are wired in M1 (PRD F-08).
                      <span key={cta.kind} className="font-mono text-meta text-fg-muted">
                        {t.projects.cta[cta.kind]}
                      </span>
                    ),
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </Section>
  )
}
