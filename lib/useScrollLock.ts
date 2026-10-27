import { useEffect } from 'react'

/** Locks body scroll while `locked` (lightbox, mobile menu — PRD F-08, DESIGN §9). */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}
