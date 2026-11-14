/**
 * Coverflow settings (owner, 2026-11-14; DESIGN §4.8). components/ui/CoverflowCarousel reads them;
 * the card width and aspect reach app/globals.css (`.cf-*`) as `--cf-card` and `--cf-aspect`.
 */
export const COVERFLOW = {
  /** Degrees the first neighbour tilts. */
  rotate: 44,
  /** How far the first neighbour recedes, as a fraction of the card width. */
  depth: 0.6,
  /** Viewer distance as a multiple of the card width; smaller is a wider lens. */
  perspective: 3,
  /** Exponent on distance: below 1 the rake eases off as cards travel out. */
  falloff: 0.56,
  /** Opacity lost per step from the centre. */
  fade: 0.1,
  /** Space between cards, as a fraction of the card width. */
  gap: 0.05,
  /** A ring: with four cards the one half a turn away is faded out, so three show at a time. */
  loop: true,
  /** Any CSS length; pitch, depth and perspective all derive from it. */
  cardWidth: 'clamp(148px, 22vw, 260px)',
  /** Card width / height: portrait 3 : 4. Certificates are contained, never cropped. */
  aspect: 3 / 4,
} as const
