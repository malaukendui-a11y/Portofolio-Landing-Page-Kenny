import { notFound } from 'next/navigation'
import { GlassExport } from './GlassExport'

/**
 * Development only: renders the glass lens alone for `scripts/export-glass-fallback.mjs`, which
 * captures it to `public/3d/hero-glass-fallback@2x.webp` (DESIGN §6 "Static fallback"). The
 * production build answers 404: the one development route the M3 brief allows.
 */
export default function GlassExportPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <GlassExport />
}
