'use client'

import { useLayoutEffect } from 'react'
import {
  DUR,
  EASE,
  gsap,
  REVEAL_LINE,
  REVEAL_START,
  ScrollTrigger,
  STAGGER,
  TRAVEL,
} from '@/lib/motion'
import { scrollToHash, startSmoothScroll, stopSmoothScroll } from '@/lib/smoothScroll'
import { useReducedMotion } from '@/lib/useReducedMotion'

/**
 * Elements marked `data-reveal` (section labels, headings, Intro copy) fade up once
 * when they cross the reveal line; neighbours entering together stagger by 60 ms.
 * Only opacity is animated (not visibility), so a control waiting to be revealed is
 * still focusable and announced. Elements already at or above the line at setup are
 * left alone, so a deep link never flashes or strands content.
 */
function setUpReveals(reduced: boolean): void {
  const elements = gsap.utils.toArray<HTMLElement>('[data-reveal]')
  // Read every position first, then write: one layout pass.
  const line = window.innerHeight * REVEAL_LINE
  const pending = elements.filter((element) => element.getBoundingClientRect().top > line)
  if (pending.length === 0) return

  gsap.set(pending, reduced ? { opacity: 0 } : { opacity: 0, y: TRAVEL.reveal })
  ScrollTrigger.batch(pending, {
    start: REVEAL_START,
    once: true,
    onEnter: (batch) =>
      gsap.to(
        batch,
        reduced
          ? { opacity: 1, duration: DUR.reduced, clearProps: 'opacity' }
          : {
              opacity: 1,
              y: 0,
              duration: DUR.base,
              ease: EASE.out,
              stagger: STAGGER,
              clearProps: 'opacity,transform',
            },
      ),
  })
}

/**
 * Page-wide motion that belongs to no single section (DESIGN §3.4): block reveals,
 * Lenis smooth scroll and in-page anchor links routed through it. Renders nothing.
 * Under reduced motion reveals are a 0.2 s fade, no Lenis is created and anchors
 * stay native.
 */
export function MotionRoot() {
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => setUpReveals(reduced))
    return () => ctx.revert()
  }, [reduced])

  useLayoutEffect(() => {
    if (reduced) return
    startSmoothScroll()

    // One delegated listener for every `#id` link; handlers that already took the
    // click (the mobile menu) call preventDefault first and are left alone.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
      const hash = link?.getAttribute('href')
      if (!hash || hash === '#') return
      event.preventDefault()
      scrollToHash(hash)
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      stopSmoothScroll()
    }
  }, [reduced])

  return null
}
