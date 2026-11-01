/**
 * Reduced-motion gate (DESIGN §3.4, CLAUDE.md rule 5). Every animation branches on
 * this: under `prefers-reduced-motion: reduce` reveals become a 0.2 s opacity fade,
 * marquees are static, stacked cards stay a plain list and Lenis is not created.
 *
 * The server snapshot is `true`, so the server render and hydration take the static
 * path; motion opts in only once the client confirms the user has no preference.
 */
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** Live value for code outside React (event handlers, module setup). */
export function prefersReducedMotion(): boolean {
  return typeof window === 'undefined' || window.matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => true)
}
