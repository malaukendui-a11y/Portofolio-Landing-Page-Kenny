import Image from 'next/image'
import type { CSSProperties } from 'react'
import { FALLBACK, LENS } from '@/lib/three/glass'

/** Lens geometry for the `glass-fallback` utility, from the same constants as the 3D lens. */
const LENS_VARS = {
  '--lens-x': `${LENS.x * 100}%`,
  '--lens-d': `${2 * LENS.radiusEm * LENS.exportExtent}em`,
  '--lens-k-mid': LENS.scaleBelow1440,
} as CSSProperties

/**
 * The static lens (DESIGN §6 "Static fallback", PRD F-04): a lens-only image with its own
 * highlights, placed where the 3D lens floats, over the HTML marquee. It shows on phones,
 * tablets, touch screens, under reduced motion, without WebGL and after any 3D failure; on a
 * capable desktop it stays `display: none` (so the lazy image is never fetched) unless the 3D
 * layer reports `fallback`. The box copies the marquee's line box (same top, font size and
 * leading), so the image centres on the ticker line at every width. Absolute: no layout shift.
 */
export function GlassFallback() {
  return (
    <div className="absolute inset-x-0 top-[28%] h-[calc(var(--text-ticker--line-height)*1em)] text-ticker md:top-[30%]">
      <Image
        src={FALLBACK.src}
        width={FALLBACK.width}
        height={FALLBACK.height}
        alt=""
        aria-hidden="true"
        loading="lazy"
        fetchPriority="low"
        // The lens width is 1.05 em of `--text-ticker` = clamp(96px, 15.8vw, 228px).
        sizes="(min-width: 1443px) 240px, (min-width: 608px) 17vw, 101px"
        className="glass-fallback"
        style={LENS_VARS}
      />
    </div>
  )
}
