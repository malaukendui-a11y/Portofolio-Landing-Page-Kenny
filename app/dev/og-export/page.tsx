import { notFound } from 'next/navigation'
import en from '@/content/en'
import { SectionLabel } from '@/components/ui/SectionLabel'

/**
 * Development only: the OpenGraph card (PRD F-14) in the hero's language (DESIGN §4.2): paper
 * surface with the radial glow, the name at display size, the two roles, one accent dash and the
 * `//  PORTFOLIO` label. `scripts/export-og.mjs` captures it at 1200 × 630 into
 * app/opengraph-image.png and writes `data-alt` to app/opengraph-image.alt.txt. Always English:
 * crawlers and link previews only ever see the English page. The production build answers 404.
 */
export default function OgExportPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <div
      data-og
      data-alt={en.meta.og.alt}
      className="surface-paper hero-glow fixed inset-0 flex flex-col justify-between px-gutter pt-10 pb-12"
    >
      <SectionLabel reveal={false}>{en.meta.og.label}</SectionLabel>
      <h1 className="font-display text-ticker text-fg">{en.hero.name}</h1>
      <div className="flex items-end justify-between gap-8">
        <span aria-hidden="true" className="mb-3 h-1 w-24 bg-accent-600" />
        <ul className="font-display text-h2 text-right text-fg">
          {en.hero.roles.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
