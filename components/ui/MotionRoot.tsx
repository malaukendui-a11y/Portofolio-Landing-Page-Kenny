'use client'

import { useLayoutEffect } from 'react'
import { scrollToHash, startSmoothScroll, stopSmoothScroll } from '@/lib/smoothScroll'
import { useReducedMotion } from '@/lib/useReducedMotion'

/**
 * Page-wide motion that belongs to no single section (DESIGN §3.4): Lenis smooth
 * scroll and in-page anchor links routed through it. Renders nothing. Under reduced
 * motion nothing is created and anchors stay native.
 */
export function MotionRoot() {
  const reduced = useReducedMotion()

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
