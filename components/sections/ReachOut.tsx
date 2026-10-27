'use client'

import { site, whatsappHref } from '@/content/site'
import { useLang } from '@/lib/i18n'
import { Portrait } from '@/components/hero/Portrait'
import { Ticker } from '@/components/hero/Ticker'
import { Button, ButtonLink } from '@/components/ui/Button'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useToast } from '@/components/ui/Toast'
import { ArrowUpIcon, ArrowUpRightIcon, CopyIcon } from '@/components/ui/icons'

const FOOTER_PORTRAIT = {
  src: '/images/portrait/kenny-footer-color@2x.webp',
  width: 908,
  height: 1800,
}

/**
 * Reach Out (DESIGN §4.9) — paper mirror of the hero: "Reach Out —" ticker, the
 * footer portrait, left block with email (copy to clipboard + toast), WhatsApp
 * (prefilled wa.me link), location and the two CTA routes; right block with
 * socials and a circular back-to-top control (PRD F-10, F-13).
 */
export function ReachOut() {
  const { t } = useLang()
  const { show, toast } = useToast()
  const waHref = whatsappHref(t.reachOut.whatsapp.prefill)
  const socials = [
    { href: site.github.url, label: t.hero.socials.github },
    site.linkedin ? { href: site.linkedin, label: t.hero.socials.linkedin } : null,
  ].filter((social) => social !== null)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      show(t.reachOut.email.copied)
    } catch {
      // Clipboard blocked: the mailto link beside the button still works.
    }
  }

  const rowLabel = 'font-mono text-label-sm uppercase text-fg-muted md:text-label'

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="surface-paper relative overflow-hidden pt-section-sm md:pt-section-md lg:pt-section"
    >
      <div aria-hidden="true" className="hero-glow absolute inset-0" />

      <div className="relative px-gutter-sm md:px-gutter-md lg:px-gutter">
        <SectionLabel className="mb-8">{t.reachOut.label}</SectionLabel>
      </div>
      <Ticker text={t.reachOut.ticker} className="relative" />

      {/* Mobile stage: the portrait sits between the ticker and the contact blocks. */}
      <div className="relative h-[42svh] md:hidden">
        <Portrait
          {...FOOTER_PORTRAIT}
          alt={t.reachOut.portraitAlt}
          sizes="40vw"
          className="absolute bottom-0 left-1/2 h-[42svh] -translate-x-1/2"
        />
      </div>

      <div className="relative px-gutter-sm pt-10 pb-10 md:px-gutter-md md:pt-16 lg:px-gutter lg:pb-16">
        <div className="grid gap-12 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6 lg:col-span-5">
            <h2 id="contact-heading" className="font-display text-h2-sm md:text-h2">
              {t.reachOut.heading}
            </h2>
            <p className="mt-4 max-w-[60ch] text-body-lg-sm text-fg-muted md:text-body-lg">
              {t.reachOut.intro}
            </p>

            <dl className="mt-10 grid gap-6">
              <div>
                <dt className={rowLabel}>{t.reachOut.email.label}</dt>
                <dd className="mt-2 flex flex-wrap items-center gap-4 text-body-lg">
                  <a href={`mailto:${site.email}`} className="hover:text-accent-fg">
                    {site.email}
                  </a>
                  <Button
                    variant="outlined"
                    onClick={copyEmail}
                    className="min-h-11 px-4 text-meta font-normal"
                  >
                    <CopyIcon size={16} />
                    {t.reachOut.email.copy}
                  </Button>
                </dd>
              </div>
              <div>
                <dt className={rowLabel}>{t.reachOut.whatsapp.label}</dt>
                <dd className="mt-2 text-body-lg">
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
                <dt className={rowLabel}>{t.reachOut.location.label}</dt>
                <dd className="mt-2 text-body-lg">{t.reachOut.location.value}</dd>
              </div>
            </dl>

            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href={`mailto:${site.email}`}>{t.reachOut.ctas.email}</ButtonLink>
              <ButtonLink href={waHref} variant="outlined" external>
                {t.reachOut.ctas.whatsapp}
                <ArrowUpRightIcon />
              </ButtonLink>
            </div>
          </div>

          <div className="flex flex-col gap-8 md:col-span-6 md:items-end lg:col-span-7">
            <div className="md:text-right">
              <p className={rowLabel}>{t.reachOut.socialsLabel}</p>
              <ul className="mt-2 flex flex-wrap gap-6 text-body md:justify-end">
                {socials.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-accent-fg"
                    >
                      {social.label}
                      <ArrowUpRightIcon size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="#top"
              className="group inline-flex items-center gap-4 font-mono text-meta text-fg-muted hover:text-fg"
            >
              {t.reachOut.backToTop}
              <span className="inline-flex size-12 items-center justify-center rounded-pill border border-fg text-fg transition-colors duration-fast ease-out group-hover:bg-fg group-hover:text-surface">
                <ArrowUpIcon />
              </span>
            </a>
          </div>
        </div>
      </div>

      <Portrait
        {...FOOTER_PORTRAIT}
        alt={t.reachOut.portraitAlt}
        sizes="(min-width: 1024px) 24vw, 35vw"
        className="absolute bottom-0 left-[58%] hidden h-[72svh] md:block lg:left-[60%]"
      />
      {toast}
    </section>
  )
}
