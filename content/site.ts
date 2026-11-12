/**
 * Site-wide facts and flags — PRD Appendix A, §7 F-10/F-11, §12.
 * Nullable fields are owner inputs still pending (PRD §12); components must
 * hide the related control while the value is null.
 */
import type { Lang } from './types'

export const site = {
  name: 'Ananda Kenny Esqiel Bisaratua',
  brand: 'Ananda Kenny',
  /**
   * Production URL until the custom domain (PRD §12.8). `NEXT_PUBLIC_SITE_URL` overrides it at
   * build time (lib/seo.ts), so M5 switches domains without a code change.
   */
  url: 'https://portofolio-landing-page-kenny.vercel.app',
  /** OpenGraph locales (`og:locale` / `og:locale:alternate`) per language. */
  ogLocale: { en: 'en_ID', id: 'id_ID' } satisfies Record<Lang, string>,
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
  /**
   * PRD §12.4 (M4b): the English CV under /public/cv, named by month (`kenny-cv-YYYY-MM-en.pdf`);
   * a new version gets a new file name. The CV controls render only while this is set.
   */
  cvUrl: '/cv/kenny-cv-2026-11-en.pdf' as string | null,
  /** `countryCode` is ISO 3166-1 alpha-2, for structured data (JSON-LD `addressCountry`). */
  location: { city: 'East Jakarta', country: 'Indonesia', countryCode: 'ID' },
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
