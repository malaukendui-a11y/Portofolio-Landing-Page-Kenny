'use client'

import { site } from '@/content/site'
import { formatMonth, useLang } from '@/lib/i18n'

/** `● Open to work · Oct 2026` — driven by site.availability (PRD F-11). */
export function AvailabilityBadge({ label }: { label: string }) {
  const { lang } = useLang()
  if (!site.availability.open) return null
  return (
    <p className="inline-flex items-center gap-2 rounded-pill border border-hairline px-3 py-1.5 font-mono text-meta-sm md:text-meta">
      <span aria-hidden="true" className="size-2 rounded-pill bg-success" />
      {label} · {formatMonth(site.availability.since, lang)}
    </p>
  )
}
