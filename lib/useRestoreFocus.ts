import { useCallback, useRef } from 'react'

/**
 * Remembers the element that opened an overlay and puts focus back on it when
 * the overlay closes (DESIGN §9: lightbox and mobile menu restore focus).
 */
export function useRestoreFocus(): { remember: () => void; restore: () => void } {
  const previous = useRef<HTMLElement | null>(null)
  const remember = useCallback(() => {
    previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }, [])
  const restore = useCallback(() => {
    previous.current?.focus()
    previous.current = null
  }, [])
  return { remember, restore }
}
