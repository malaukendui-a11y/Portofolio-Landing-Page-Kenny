'use client'

import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { marqueePhase, setMarqueePhase } from '@/lib/marquee'

/** Copies per group: enough for one group to outrun a 2560 px viewport at 228 px. */
const UNITS = 3

/** Lets the hero hand the marquee to its WebGL copy and take it back (M3). */
export type TickerHandle = {
  readonly root: HTMLDivElement | null
  /** Pauses and hides the marquee at once; returns its phase (fraction of one group). */
  suspend(): number
  /** Shows the marquee again from `fraction` of one group and lets it run. */
  resume(fraction: number): void
}

/**
 * Oversized name marquee (DESIGN §3.2 `display-ticker`, §3.4 `marquee-speed`, §4.2 /
 * §4.9). A CSS animation moves a track of two identical groups by -50 % per loop
 * (40 s desktop, 28 s below md), so the seam is invisible; it runs on the compositor
 * with no per-frame JS. Paused while the tab is hidden or the ticker is off-screen.
 * Under reduced motion the track is static: one group, its middle copy centred
 * (the M1 resting frame). Decorative: the real heading is the visually-hidden
 * <h1> / <h2> beside it.
 *
 * The hero passes a `ref` so its 3D layer can take over (M3): `suspend()` pauses and hides
 * the marquee while the WebGL copy shows the name, `resume()` brings it back at the WebGL
 * copy's phase. Without a ref (Reach Out) nothing changes.
 */
export function Ticker({
  text,
  direction = 'normal',
  className = '',
  ref,
}: {
  text: string
  direction?: 'normal' | 'reverse'
  className?: string
  ref?: Ref<TickerHandle>
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const suspended = useRef(false)
  const syncRef = useRef<() => void>(() => {})

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let offscreen = false
    const sync = () =>
      root.toggleAttribute('data-paused', suspended.current || document.hidden || offscreen)
    syncRef.current = sync
    const observer = new IntersectionObserver((entries) => {
      // A busy main thread delivers several changes in one callback, oldest first: read the newest.
      offscreen = !entries[entries.length - 1].isIntersecting
      sync()
    })
    observer.observe(root)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      get root() {
        return rootRef.current
      },
      suspend() {
        const root = rootRef.current
        const track = root?.firstElementChild
        if (!root || !track) return 0
        suspended.current = true
        root.setAttribute('data-paused', '')
        root.setAttribute('data-suspended', '')
        // The pause lands on the next style update: force it so the phase read is the frozen one.
        void getComputedStyle(track).animationPlayState
        return marqueePhase(track)
      },
      resume(fraction) {
        const root = rootRef.current
        const track = root?.firstElementChild
        if (!root || !track) return
        setMarqueePhase(track, fraction)
        suspended.current = false
        root.removeAttribute('data-suspended')
        syncRef.current()
      },
    }),
    [],
  )

  // "Reach Out —" already carries its dash; the name gets one between copies.
  const unit = /[—–-]\s*$/.test(text) ? text.trim() : `${text} —`
  const group = (copy: boolean) => (
    <span className="marquee-group" data-marquee-copy={copy || undefined}>
      {Array.from({ length: UNITS }, (_, index) => (
        <span key={index}>{unit}</span>
      ))}
    </span>
  )

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-marquee={direction}
      className={`overflow-hidden font-display text-ticker whitespace-nowrap text-fg select-none ${className}`}
    >
      <div className="marquee-track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  )
}
