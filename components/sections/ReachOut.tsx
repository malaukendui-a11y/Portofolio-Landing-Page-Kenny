'use client'

import { site, whatsappHref } from '@/content/site'
import { useLang } from '@/lib/i18n'
import { ButtonLink } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/** Reach Out (DESIGN §4.9) — M0: contact facts and the two CTA routes. Ticker/portrait in M1–M2. */
export function ReachOut() {
  const { t } = useLang()
  const waHref = whatsappHref(t.reachOut.whatsapp.prefill)
  const socials = [
    { href: site.github.url, label: t.hero.socials.github },
    site.linkedin ? { href: site.linkedin, label: t.hero.socials.linkedin } : null,
  ].filter((social) => social !== null)

  return (
    <Section id="contact" surface="paper" labelledBy="contact-heading">
      <SectionLabel className="mb-8">{t.reachOut.label}</SectionLabel>
      <h2
        id="contact-heading"
        className="font-display text-statement-sm md:text-statement-md lg:text-statement"
      >
        {t.reachOut.heading}
      </h2>
      <p className="mt-6 max-w-[60ch] text-body-lg-sm text-fg-muted md:text-body-lg">
        {t.reachOut.intro}
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <dl className="grid gap-6 lg:col-span-7">
          <div>
            <dt className="font-mono text-label-sm uppercase text-fg-muted md:text-label">
              {t.reachOut.email.label}
            </dt>
            <dd className="mt-1 text-body-lg">
              <a href={`mailto:${site.email}`} className="hover:text-accent-fg">
                {site.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-mono text-label-sm uppercase text-fg-muted md:text-label">
              {t.reachOut.whatsapp.label}
            </dt>
            <dd className="mt-1 text-body-lg">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-fg"
              >
                {site.whatsapp.display}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-mono text-label-sm uppercase text-fg-muted md:text-label">
              {t.reachOut.location.label}
            </dt>
            <dd className="mt-1 text-body-lg">{t.reachOut.location.value}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-8 lg:col-span-5">
          <div className="flex flex-wrap gap-4">
            <ButtonLink href={`mailto:${site.email}`}>{t.reachOut.ctas.email}</ButtonLink>
            <ButtonLink href={waHref} variant="outlined" external>
              {t.reachOut.ctas.whatsapp}
            </ButtonLink>
          </div>
          <div>
            <p className="font-mono text-label-sm uppercase text-fg-muted md:text-label">
              {t.reachOut.socialsLabel}
            </p>
            <ul className="mt-2 flex flex-wrap gap-6 text-body">
              {socials.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-fg"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <a href="#top" className="font-mono text-meta text-fg-muted hover:text-fg">
            {t.reachOut.backToTop} ↑
          </a>
        </div>
      </div>
    </Section>
  )
}
