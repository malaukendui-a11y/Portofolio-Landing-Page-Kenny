import { useLayoutEffect, type RefObject } from 'react'
import { DUR, EASE, gsap, REVEAL_LINE, REVEAL_START, SplitText, STAGGER } from './motion'
import { useReducedMotion } from './useReducedMotion'

/**
 * Line-by-line reveal for a statement (DESIGN §4.3): once fonts are ready the text is
 * split into masked lines that rise into place with the 60 ms stagger when the block
 * crosses the reveal line, once. When the tween ends the split is reverted, so React
 * owns plain DOM again; give the element `key={lang}` so a language switch remounts
 * it instead of reconciling split markup. Reduced motion: a 0.2 s opacity fade.
 * Elements already at or above the reveal line are left untouched.
 */
export function useLineReveal(ref: RefObject<HTMLElement | null>, contentKey: string): void {
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || element.getBoundingClientRect().top <= window.innerHeight * REVEAL_LINE) return

    const ctx = gsap.context(() => {
      gsap.set(element, { opacity: 0 })
    })
    if (reduced) {
      ctx.add(() =>
        gsap.to(element, {
          opacity: 1,
          duration: DUR.reduced,
          clearProps: 'opacity',
          scrollTrigger: { trigger: element, start: REVEAL_START, once: true },
        }),
      )
      return () => ctx.revert()
    }

    let cancelled = false
    let split: SplitText | null = null
    document.fonts.ready.then(() => {
      if (cancelled) return
      ctx.add(() => {
        gsap.set(element, { opacity: 1 })
        split = SplitText.create(element, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          // Re-splits (resize, late font) revert the previous tween automatically.
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 100,
              duration: DUR.base,
              ease: EASE.out,
              stagger: STAGGER,
              scrollTrigger: { trigger: element, start: REVEAL_START, once: true },
              onComplete: () => {
                self.kill()
                self.revert()
              },
            }),
        })
      })
    })
    return () => {
      cancelled = true
      split?.kill()
      ctx.revert()
    }
  }, [ref, reduced, contentKey])
}
