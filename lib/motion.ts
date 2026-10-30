/**
 * GSAP entry point (DESIGN §3.4). Registers ScrollTrigger and SplitText once and
 * exposes the motion tokens in the units GSAP wants (seconds, ease names). The CSS
 * equivalents live in app/globals.css (`--ease-*`, `--duration-*`); a Playwright
 * check keeps the two in step. Import gsap and its plugins from here, never from
 * `gsap/all`, so only what we use reaches the bundle.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
  // The mobile address bar resizing the viewport must not re-measure every trigger.
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export { gsap, ScrollTrigger, SplitText }

/** `ease-out` (reveals, hovers) and `ease-expo` (hero entrance, card stacking, loader). */
export const EASE = { out: 'power3.out', expo: 'expo.out' } as const

/** `dur-fast` / `dur-base` / `dur-slow`, plus the reduced-motion fade (DESIGN §3.4). */
export const DUR = { fast: 0.25, base: 0.6, slow: 1, reduced: 0.2 } as const

/** `stagger` between lines and list items. */
export const STAGGER = 0.06

/** `marquee-speed`: seconds per full loop (the CSS animation reads the same tokens). */
export const MARQUEE = { desktop: 40, mobile: 28 } as const

/** Travel in px: block reveals rise 24, the hero portrait rises 40 (PRD M2 brief). */
export const TRAVEL = { reveal: 24, portrait: 40 } as const

/** Reveals fire once when the element's top crosses 85 % of the viewport height. */
export const REVEAL_LINE = 0.85
export const REVEAL_START = `top ${REVEAL_LINE * 100}%`

/** Stacked cards (DESIGN §4.4 / §4.5): what card n becomes as card n+1 arrives. */
export const STACK = { scale: 0.96, opacity: 0.55 } as const

let refreshTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Re-measures every ScrollTrigger once things that change layout have settled
 * (lazy images, late fonts). Debounced so a burst of image loads costs one refresh.
 */
export function refreshScrollTriggers(): void {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150)
}
