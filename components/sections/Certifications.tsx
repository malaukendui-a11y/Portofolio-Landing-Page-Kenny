'use client'

import Image from 'next/image'
import { certifications } from '@/content/certifications'
import { useLang } from '@/lib/i18n'
import { useLightbox } from '@/components/ui/Lightbox'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ArrowUpRightIcon } from '@/components/ui/icons'

/**
 * Certifications (DESIGN §4.8, v1.1): open list from content/certifications.ts,
 * newest first, up to four cards per row. Each card: certificate image at its
 * natural aspect (opens the lightbox), issuer badge, period, title, scope and
 * the certificate number or a verify link.
 */
export function Certifications() {
  const { t } = useLang()
  const { open, lightbox } = useLightbox()
  const items = certifications.map((cert) => {
    const copy = t.certifications.items[cert.id]
    return { ...cert.image, alt: `${copy.title} — ${copy.issuer}`, caption: copy.title }
  })

  return (
    <Section id="certifications" surface="dark" labelledBy="certifications-heading">
      <SectionLabel className="mb-8">{t.certifications.label}</SectionLabel>
      <h2 id="certifications-heading" className="sr-only">
        {t.certifications.heading}
      </h2>
      <ul className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-4">
        {certifications.map((cert, index) => {
          const copy = t.certifications.items[cert.id]
          return (
            <li
              key={cert.id}
              className="flex h-full flex-col rounded-card border border-hairline bg-ink-800 p-4"
            >
              <button
                type="button"
                onClick={() => open(items, index)}
                aria-label={t.certifications.openCertificate.replace('{title}', copy.title)}
                className="block w-full overflow-hidden rounded-image border border-ink-700 bg-ink-900"
              >
                <Image
                  src={cert.image.src}
                  width={cert.image.width}
                  height={cert.image.height}
                  alt={items[index].alt}
                  sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 100vw"
                  className="h-auto w-full transition-opacity duration-fast ease-out hover:opacity-90"
                />
              </button>
              <div className="flex flex-1 flex-col px-2 pt-5 pb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-pill border border-hairline px-3 py-1.5 font-mono text-label-sm uppercase">
                    {copy.issuer}
                  </span>
                  <span className="font-mono text-meta-sm text-fg-muted md:text-meta">
                    {copy.period}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-h3-sm md:text-h3">{copy.title}</h3>
                <p className="mt-2 text-body text-fg-muted">{copy.scope}</p>
                <p className="mt-auto pt-5 font-mono text-meta-sm text-fg-muted">
                  {cert.verifyUrl ? (
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-fg hover:text-accent-fg"
                    >
                      {t.certifications.verify}
                      <ArrowUpRightIcon size={16} />
                    </a>
                  ) : (
                    cert.certificateNo && `${t.certifications.certificateNo} ${cert.certificateNo}`
                  )}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      {lightbox}
    </Section>
  )
}
