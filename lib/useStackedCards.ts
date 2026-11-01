import { useLayoutEffect, type RefObject } from 'react'
import { gsap, refreshScrollTriggers, STACK } from './motion'
import { getLenis } from './smoothScroll'
import { useReducedMotion } from './useReducedMotion'

/** Same condition as the `stack-card` utility in globals.css. */
export const STACK_QUERY = '(min-width: 64rem) and (prefers-reduced-motion: no-preference)'

/** True when something else is painted over the element's centre. Off-screen is not covered. */
function isCovered(element: Element): boolean {
  const { left, top, width, height } = element.getBoundingClientRect()
  const hit = document.elementFromPoint(left + width / 2, top + height / 2)
  return hit !== null && !element.contains(hit)
}

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
      const triggers = cards.slice(0, -1).map((card, index) => {
        const next = cards[index + 1]
        return gsap.to(card, {
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
        }).scrollTrigger
      })

      // Keyboard focus moving backwards can land in a card the later ones cover (WCAG 2.2
      // SC 2.4.11). The browser sees it inside the viewport and does not scroll, so jump to
      // where the next card is about to enter: this card is fully uncovered there.
      const uncoverFocus = (event: FocusEvent) => {
        const focused = event.target as HTMLElement
        if (!focused.matches(':focus-visible') || !isCovered(focused)) return
        const start = triggers[cards.findIndex((card) => card.contains(focused))]?.start
        if (start === undefined) return
        const lenis = getLenis()
        if (lenis) lenis.scrollTo(start, { immediate: true })
        else window.scrollTo({ top: start, behavior: 'instant' })
      }
      container.addEventListener('focusin', uncoverFocus)
      return () => container.removeEventListener('focusin', uncoverFocus)
    })
    // Late fonts change card heights; re-measure once they are in.
    document.fonts.ready.then(refreshScrollTriggers)
    return () => mm.revert()
  }, [containerRef, reduced])
}
