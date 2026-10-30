import { useLayoutEffect, type RefObject } from 'react'
import { gsap, refreshScrollTriggers, STACK } from './motion'
import { useReducedMotion } from './useReducedMotion'

/** Same condition as the `stack-card` utility in globals.css. */
export const STACK_QUERY = '(min-width: 64rem) and (prefers-reduced-motion: no-preference)'

/**
 * Sticky stacked cards (DESIGN §4.4 / §4.5, PRD F-06). CSS makes each child of the
 * container sticky; this scrubs card n to 0.96 scale and 55 % opacity while card n+1
 * travels from the bottom of the viewport to its sticky top, and back on the way up.
 * Below 1024 px and under reduced motion nothing runs and the cards stay a plain list.
 */
export function useStackedCards(containerRef: RefObject<HTMLElement | null>): void {
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || reduced) return
    const mm = gsap.matchMedia()
    mm.add(STACK_QUERY, () => {
      const cards = gsap.utils.toArray<HTMLElement>(container.children)
      gsap.set(cards, { willChange: 'transform, opacity' })
      cards.slice(0, -1).forEach((card, index) => {
        const next = cards[index + 1]
        gsap.to(card, {
          scale: STACK.scale,
          opacity: STACK.opacity,
          // Scroll-linked: the change tracks the next card's position one to one.
          ease: 'none',
          scrollTrigger: {
            trigger: next,
            start: 'top bottom',
            end: () => `top ${parseFloat(getComputedStyle(next).top)}px`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
      })
    })
    // Late fonts change card heights; re-measure once they are in.
    document.fonts.ready.then(refreshScrollTriggers)
    return () => mm.revert()
  }, [containerRef, reduced])
}
