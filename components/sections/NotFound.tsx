'use client'

import { useLang } from '@/lib/i18n'
import { ButtonLink } from '@/components/ui/Button'
import { Nav } from '@/components/ui/Nav'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SkipLink } from '@/components/ui/SkipLink'

/**
 * 404 page (PRD F-15) in the site's visual language: the nav over a dark surface, the
 * `//  404` label, a heading, one line and the way back. The whole page is the dark surface so
 * the transparent sticky header reads as it does over a dark section. No motion layer: nothing
 * here reveals, and the links leave the page (plain anchors to `/`, so the home page loads fresh).
 * The button goes to `/`, not `/#top`: the hero starts below the in-flow sticky header, so a
 * native jump to `#top` would stop 80 px down.
 */
export function NotFound() {
  const { t } = useLang()
  return (
    <div className="surface-dark flex flex-1 flex-col">
      <SkipLink />
      <Nav base="/" />
      <main id="main" className="flex flex-1 flex-col">
        <Section
          id="not-found"
          surface="dark"
          labelledBy="not-found-heading"
          className="flex flex-1 flex-col justify-center"
        >
          <SectionLabel reveal={false} className="mb-8">
            {t.notFound.label}
          </SectionLabel>
          <h1
            id="not-found-heading"
            className="max-w-measure font-display text-statement-sm md:text-statement"
          >
            {t.notFound.heading}
          </h1>
          <p className="mt-6 max-w-measure text-body-lg-sm text-fg-muted md:text-body-lg">
            {t.notFound.body}
          </p>
          <ButtonLink href="/" className="mt-10 self-start">
            {t.notFound.cta}
          </ButtonLink>
        </Section>
      </main>
    </div>
  )
}
