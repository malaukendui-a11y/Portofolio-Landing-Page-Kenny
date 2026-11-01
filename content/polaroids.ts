/**
 * Reach Out polaroid line — DESIGN §4.9. Language-neutral data only; alt text and the
 * carousel's labels live in content/en.ts and content/id.ts under `reachOut.polaroids`,
 * keyed by PolaroidId (same pattern as certifications). Order here is display order.
 */

export type PolaroidId =
  'comprehensive-exam' | 'graduation' | 'working-laptop' | 'nusa-penida' | 'touring' | 'portrait'

export interface Polaroid {
  id: PolaroidId
  /** Path under /public/images/polaroids */
  src: string
  width: number
  height: number
}

export const polaroids: readonly Polaroid[] = [
  {
    id: 'comprehensive-exam',
    src: '/images/polaroids/polaroid-01-comprehensive-exam.webp',
    width: 1200,
    height: 1200,
  },
  {
    id: 'graduation',
    src: '/images/polaroids/polaroid-02-graduation.webp',
    width: 1200,
    height: 1200,
  },
  {
    id: 'working-laptop',
    src: '/images/polaroids/polaroid-03-working-laptop.webp',
    width: 1200,
    height: 1200,
  },
  {
    id: 'nusa-penida',
    src: '/images/polaroids/polaroid-04-nusa-penida.webp',
    width: 1200,
    height: 1200,
  },
  {
    id: 'touring',
    src: '/images/polaroids/polaroid-05-touring.webp',
    width: 1200,
    height: 1200,
  },
  {
    id: 'portrait',
    src: '/images/polaroids/polaroid-06-portrait.webp',
    width: 1200,
    height: 1200,
  },
]
