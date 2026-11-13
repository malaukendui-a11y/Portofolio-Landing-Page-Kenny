import { useCallback, useRef } from 'react'

/**
 * Remembers the element that opened an overlay and puts focus back on it when
 * the overlay closes (DESIGN §9: lightbox and mobile menu restore focus).
 *
 * Pass the trigger (the click's `currentTarget`): Safari does not focus a button that is clicked
 * or tapped, so `document.activeElement` is then <body> and focus would return there (found with
 * Playwright's WebKit in M5). Without a trigger, the focused element is remembered.
 */
export function useRestoreFocus(): {
  remember: (trigger?: HTMLElement | null) => void
  restore: () => void
} {
  const previous = useRef<HTMLElement | null>(null)
  const remember = useCallback((trigger?: HTMLElement | null) => {
    previous.current =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
  }, [])
  const restore = useCallback(() => {
    previous.current?.focus()
    previous.current = null
  }, [])
  return { remember, restore }
}
