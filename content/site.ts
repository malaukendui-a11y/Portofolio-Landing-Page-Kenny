/**
 * Site-wide facts and flags — PRD Appendix A, §7 F-10/F-11, §12.
 * Nullable fields are owner inputs still pending (PRD §12); components must
 * hide the related control while the value is null.
 */
import type { Lang } from './types'

export const site = {
  name: 'Ananda Kenny Esqiel Bisaratua',
  brand: 'Ananda Kenny',
  defaultLang: 'en' as Lang,
  email: 'malaukendui@gmail.com',
  whatsapp: {
    display: '+62 877-2005-2003',
    number: '6287720052003',
    url: 'https://wa.me/6287720052003',
  },
  github: {
    handle: 'malaukendui-a11y',
    url: 'https://github.com/malaukendui-a11y',
  },
  /** PRD §12.5 — pending. */
  linkedin: null as string | null,
  /** PRD §12.4 — pending. Versioned filename under /public/cv. */
  cvUrl: null as string | null,
  location: { city: 'East Jakarta', country: 'Indonesia' },
  /** PRD F-11: a single flag drives the "Open to work" badge. `since` = YYYY-MM. */
  availability: { open: true, since: '2026-10' },
  /** Used for the footer copyright. */
  launchYear: 2026,
} as const

export type Site = typeof site

/** wa.me deep link with a language-specific prefilled message (PRD F-10). */
export function whatsappHref(prefill: string): string {
  return `${site.whatsapp.url}?text=${encodeURIComponent(prefill)}`
}
