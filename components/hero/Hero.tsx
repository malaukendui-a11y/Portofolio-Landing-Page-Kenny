'use client'

import { site } from '@/content/site'
import { useLang } from '@/lib/i18n'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { GithubIcon, LinkedinIcon, MessageCircleIcon } from '@/components/ui/icons'
import { AvailabilityBadge } from './AvailabilityBadge'
import { Portrait } from './Portrait'
import { Ticker } from './Ticker'

const HERO_PORTRAIT = {
  src: '/images/portrait/kenny-hero-crop-color@2x.webp',
  width: 1324,
  height: 1600,
}

/**
 * Hero (DESIGN §4.2), static M1 version. Layers back to front: paper surface with
 * the radial glow, the clipped name ticker, the bottom-anchored portrait, then the
 * UI (availability, socials, roles, the //INTRO cue). No WebGL, no motion.
 */
export function Hero() {
  const { t } = useLang()
  const socials = [
    site.linkedin
      ? { href: site.linkedin, label: t.hero.socials.linkedin, Icon: LinkedinIcon }
      : null,
    { href: site.github.url, label: t.hero.socials.github, Icon: GithubIcon },
    { href: site.whatsapp.url, label: t.hero.socials.whatsapp, Icon: MessageCircleIcon },
  ].filter((social) => social !== null)

  const roles = (
    <ul className="font-display text-h2-sm md:text-right md:text-h2">
      {t.hero.roles.map((role) => (
        <li key={role}>{role}</li>
      ))}
    </ul>
  )

  return (
    <section
      id="top"
      aria-labelledby="hero-name"
      className="surface-paper relative overflow-hidden"
    >
      <h1 id="hero-name" className="sr-only">
        {t.hero.name}
      </h1>
      <div aria-hidden="true" className="hero-glow absolute inset-0" />

      <div className="relative flex justify-end px-gutter-sm pt-2 md:px-gutter-md lg:px-gutter">
        <AvailabilityBadge label={t.hero.availability} />
      </div>

      {/* Stage: ticker behind, portrait in front, desktop corner UI over both. */}
      <div className="relative min-h-[58svh] md:min-h-[calc(100svh-10rem)]">
        <Ticker text={t.hero.name} className="absolute inset-x-0 top-[28%] md:top-[30%]" />
        <Portrait
          {...HERO_PORTRAIT}
          alt={t.hero.portraitAlt}
          priority
          sizes="(min-width: 1024px) 45vw, 70vw"
          className="absolute bottom-0 left-1/2 h-[55svh] -translate-x-1/2 md:left-[56%] md:h-[86svh]"
        />
        <div className="absolute inset-x-gutter-md bottom-8 hidden items-end justify-between md:flex lg:inset-x-gutter">
          <div className="flex flex-col gap-10">
            <ul className="flex flex-col gap-1 text-body">
              {socials.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg transition-colors duration-fast ease-out hover:text-accent-fg"
                  >
                    <span aria-hidden="true">— </span>
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
            <SectionLabel>{t.hero.scrollCue}</SectionLabel>
          </div>
          {roles}
        </div>
      </div>

      {/* Mobile: roles under the portrait, socials as icons, then the cue. */}
      <div className="relative flex flex-col gap-6 px-gutter-sm pt-6 pb-8 md:hidden">
        {roles}
        <div className="flex items-center justify-between">
          <ul className="flex gap-2">
            {socials.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex size-11 items-center justify-center rounded-pill border border-hairline text-fg transition-colors duration-fast ease-out hover:text-accent-fg"
                >
                  <social.Icon />
                </a>
              </li>
            ))}
          </ul>
          <SectionLabel>{t.hero.scrollCue}</SectionLabel>
        </div>
      </div>
    </section>
  )
}
