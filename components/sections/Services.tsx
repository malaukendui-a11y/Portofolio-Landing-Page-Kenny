'use client'

import { useLang } from '@/lib/i18n'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/** What I Do (DESIGN §4.4) — M0: plain stacked cards, no sticky behaviour. */
export function Services() {
  const { t } = useLang()
  return (
    <Section id="services" surface="dark" labelledBy="services-heading">
      <SectionLabel className="mb-8">{t.services.label}</SectionLabel>
      <h2 id="services-heading" className="sr-only">
        {t.services.heading}
      </h2>
      <div className="flex flex-col gap-16">
        {t.services.cards.map((card) => (
          <article
            key={card.index}
            className="grid gap-6 border-t border-hairline pt-8 lg:grid-cols-12"
          >
            <p className="font-mono text-meta text-fg-muted lg:col-span-2">{card.index}</p>
            <div className="lg:col-span-10">
              <h3 className="font-display text-h2-sm md:text-h2">{card.title}</h3>
              <p className="mt-4 max-w-measure text-body-lg-sm text-fg-muted md:text-body-lg">
                {card.description}
              </p>
              <ol className="mt-8 max-w-measure">
                {card.items.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-baseline justify-between gap-6 border-b border-hairline py-3"
                  >
                    <span className="text-body">{item}</span>
                    <span aria-hidden="true" className="font-mono text-meta text-fg-muted">
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
