'use client'

import { certifications } from '@/content/certifications'
import { useLang } from '@/lib/i18n'
import { useLightbox } from '@/components/ui/Lightbox'
import { CoverflowCarousel, type CoverflowRow } from '@/components/ui/CoverflowCarousel'
import { Section } from '@/components/ui/Section'
import { SectionLabel } from '@/components/ui/SectionLabel'

/**
 * Certifications (DESIGN §4.8, v1.1): a coverflow of the open list in content/certifications.ts,
 * newest first, at every width. The centre card opens the lightbox; the caption under the ring
 * shows its title, issuer · period, the certificate number or a verify link, and the scope.
 */
export function Certifications() {
  const { t } = useLang()
  const copy = t.certifications
  const { open, lightbox } = useLightbox()
  const items = certifications.map((cert) => {
    const item = copy.items[cert.id]
    return { ...cert.image, alt: `${item.title} — ${item.issuer}`, caption: item.title }
  })
  const slides = certifications.map((cert, index) => {
    const item = copy.items[cert.id]
    const rows: CoverflowRow[] = []
    if (cert.verifyUrl) {
      rows.push({ label: copy.verify, value: new URL(cert.verifyUrl).host, href: cert.verifyUrl })
    } else if (cert.certificateNo) {
      rows.push({ label: copy.certificateNo, value: cert.certificateNo })
    }
    rows.push({ label: copy.scope, value: item.scope })
    return {
      id: cert.id,
      image: { ...cert.image, alt: items[index].alt },
      caption: { title: item.title, subtitle: `${item.issuer} · ${item.period}`, rows },
    }
  })

  return (
    <Section id="certifications" surface="dark" labelledBy="certifications-heading">
      <SectionLabel className="mb-8">{copy.label}</SectionLabel>
      <h2 id="certifications-heading" className="sr-only">
        {copy.heading}
      </h2>
      <CoverflowCarousel
        slides={slides}
        labels={{
          region: copy.carousel.label,
          frame: copy.carousel.frame,
          previous: copy.carousel.prev,
          next: copy.carousel.next,
          goTo: copy.carousel.goTo,
          slide: copy.carousel.slide,
          openCurrent: copy.carousel.openCurrent,
        }}
        onOpen={(index, trigger) => open(items, index, trigger)}
      />
      {lightbox}
    </Section>
  )
}
