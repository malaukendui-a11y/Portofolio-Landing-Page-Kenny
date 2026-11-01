/**
 * Loader contract (PRD F-12), shared by the pre-paint script in app/layout.tsx, the
 * overlay (components/ui/Loader) and the hero entrance. The overlay shows once per
 * session, holds at least 600 ms and at most 1.5 s from navigation start, and leaves
 * as soon as fonts and the hero portrait are in. Never under reduced motion.
 */
export const LOADER_SESSION_KEY = 'loader-seen'
export const LOADER_MIN_MS = 600
export const LOADER_MAX_MS = 1500

/**
 * Runs before first paint (inline in <head>): flags <html data-loader> so CSS shows
 * the overlay from the very first frame, unless this session has seen it, storage is
 * blocked, or the user prefers reduced motion. It also sets `--loader-cap` to what is
 * left of the 1.5 s cap, so the CSS failsafe counts from navigation start rather than
 * from whenever the overlay is first styled.
 */
export const LOADER_PREPAINT_SCRIPT = `try{if(!sessionStorage.getItem('${LOADER_SESSION_KEY}')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var h=document.documentElement;h.setAttribute('data-loader','');h.style.setProperty('--loader-cap',Math.max(0,${LOADER_MAX_MS}-performance.now())+'ms')}}catch(e){}`

const exitListeners = new Set<() => void>()

/** Subscribe to the moment the overlay starts leaving; returns the unsubscribe. */
export function onLoaderExit(listener: () => void): () => void {
  exitListeners.add(listener)
  return () => exitListeners.delete(listener)
}

export function emitLoaderExit(): void {
  exitListeners.forEach((listener) => listener())
}
