'use client'

import { useLang } from '@/lib/i18n'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/**
 * What I Do (DESIGN §4.4) — M1: static stacked cards (sticky stacking is M2).
 * Card anatomy: outlined numeral left (desktop only), title at `statement` size,
 * description, numbered rows with hairline dividers and right-aligned mono indices.
 * Row hover: text shifts right, index turns accent (CSS transition only).
 */
export function Services() {
  const { t } = useLang()
  return (
    <Section id="services" surface="dark" labelledBy="services-heading">
      <SectionLabel className="mb-8">{t.services.label}</SectionLabel>
      <h2 id="services-heading" className="sr-only">
        {t.services.heading}
      </h2>
      <div className="flex flex-col gap-6">
        {t.services.cards.map((card) => (
          <article
            key={card.index}
            className="grid gap-6 rounded-card border border-hairline bg-ink-800 p-6 md:p-10 lg:grid-cols-12 lg:gap-10 lg:p-14"
          >
            <p
              aria-hidden="true"
              className="numeral-outline hidden font-display text-numeral lg:col-span-4 lg:block"
            >
              {card.index}
            </p>
            <div className="lg:col-span-8">
              <p className="font-mono text-meta text-fg-muted lg:hidden">{card.index}</p>
              <h3 className="mt-2 font-display text-statement-sm md:text-statement-md lg:mt-0 lg:text-statement">
                {card.title}
              </h3>
              <p className="mt-4 max-w-measure text-body-lg-sm text-fg-muted md:text-body-lg">
                {card.description}
              </p>
              <ol className="mt-10 max-w-measure border-t border-hairline">
                {card.items.map((item, index) => (
                  <li
                    key={item}
                    className="group flex items-baseline justify-between gap-6 border-b border-hairline py-4"
                  >
                    <span className="text-body transition-transform duration-fast ease-out group-hover:translate-x-2">
                      {item}
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-mono text-meta text-fg-muted transition-colors duration-fast ease-out group-hover:text-accent-fg"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
