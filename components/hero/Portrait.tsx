import Image from 'next/image'

/**
 * Portrait cutout (PRD F-05, DESIGN §4.2 / §4.9): bottom-anchored, height set by
 * the caller in viewport units, width follows the intrinsic ratio. Explicit
 * width/height reserve the box; `priority` only for the hero (CLAUDE.md rule 9).
 */
export function Portrait({
  src,
  width,
  height,
  alt,
  sizes,
  priority = false,
  className = '',
}: {
  src: string
  width: number
  height: number
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      sizes={sizes}
      priority={priority}
      className={`w-auto max-w-none object-contain object-bottom ${className}`}
    />
  )
}
