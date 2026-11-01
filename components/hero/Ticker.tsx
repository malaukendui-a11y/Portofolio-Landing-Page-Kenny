'use client'

import { useEffect, useRef } from 'react'

/** Copies per group: enough for one group to outrun a 2560 px viewport at 228 px. */
const UNITS = 3

/**
 * Oversized name marquee (DESIGN §3.2 `display-ticker`, §3.4 `marquee-speed`, §4.2 /
 * §4.9). A CSS animation moves a track of two identical groups by -50 % per loop
 * (40 s desktop, 28 s below md), so the seam is invisible; it runs on the compositor
 * with no per-frame JS. Paused while the tab is hidden or the ticker is off-screen.
 * Under reduced motion the track is static: one group, its middle copy centred
 * (the M1 resting frame). Decorative: the real heading is the visually-hidden
 * <h1> / <h2> beside it.
 */
export function Ticker({
  text,
  direction = 'normal',
  className = '',
}: {
  text: string
  direction?: 'normal' | 'reverse'
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let offscreen = false
    const sync = () => root.toggleAttribute('data-paused', document.hidden || offscreen)
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
