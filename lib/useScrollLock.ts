import { useEffect } from 'react'
import { getLenis } from './smoothScroll'

/**
 * Locks page scroll while `locked` (lightbox, mobile menu — PRD F-08, DESIGN §9).
 * Lenis scrolls the page itself, so it is stopped as well as the body overflow.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    return () => {
      document.body.style.overflow = previous
      getLenis()?.start()
    }
  }, [locked])
}
