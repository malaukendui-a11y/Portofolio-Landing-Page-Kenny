'use client'

import { useLayoutEffect, useRef } from 'react'
import { useLang } from '@/lib/i18n'
import { emitLoaderExit, LOADER_MAX_MS, LOADER_MIN_MS, LOADER_SESSION_KEY } from '@/lib/loader'
import { DUR, EASE, gsap } from '@/lib/motion'

const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

/**
 * Loader (PRD F-12, DESIGN §3.4 `dur-slow` / `ease-expo`): a fixed ink overlay with
 * the brand and a percentage tied to the fonts and the hero portrait. Server-rendered
 * but only visible when the pre-paint script set <html data-loader> (first visit of
 * the session, no reduced-motion preference). It holds for at least 600 ms and at most
 * 1.5 s from navigation start, leaves as soon as both assets are in, and any click,
 * key, wheel or touch skips it. The hero stays fully painted underneath, so the
 * portrait's LCP is unaffected; the hero entrance starts as the overlay lifts.
 */
export function Loader() {
  const { t } = useLang()
  const rootRef = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const html = document.documentElement
    const root = rootRef.current
    if (!root || !html.hasAttribute('data-loader')) return
    try {
      sessionStorage.setItem(LOADER_SESSION_KEY, '1')
    } catch {
      // Storage blocked: the loader may show again on reload, which is harmless.
    }

    const elapsed = performance.now()
    if (elapsed >= LOADER_MAX_MS) {
      // Hydrated late: the CSS failsafe is already fading the overlay out. Let it finish.
      const timer = setTimeout(
        () => html.removeAttribute('data-loader'),
        LOADER_MAX_MS + DUR.base * 1000 - elapsed,
      )
      return () => clearTimeout(timer)
    }
    html.setAttribute('data-loader', 'js')

    const ctx = gsap.context(() => {}, root)
    const progress = { value: 0 }
    const render = () => {
      if (countRef.current) countRef.current.textContent = String(Math.round(progress.value))
    }
    const advanceTo = (value: number) =>
      ctx.add(() =>
        gsap.to(progress, {
          value,
          duration: DUR.fast,
          ease: EASE.out,
          onUpdate: render,
          overwrite: true,
        }),
      )

    let ready = 0
    const markReady = () => advanceTo(++ready * 50)
    const fonts = document.fonts.ready.then(markReady)
    const portrait = document.getElementById('hero-portrait') as HTMLImageElement | null
    const image = (portrait ? portrait.decode().catch(() => undefined) : Promise.resolve()).then(
      markReady,
    )
    const minHold = new Promise((resolve) => setTimeout(resolve, LOADER_MIN_MS - elapsed))

    let exited = false
    const exit = () => {
      if (exited) return
      exited = true
      clearTimeout(maxTimer)
      SKIP_EVENTS.forEach((type) => window.removeEventListener(type, exit))
      ctx.add(() => {
        gsap.set(root, { pointerEvents: 'none' })
        gsap.to(progress, { value: 100, duration: DUR.fast, ease: EASE.out, onUpdate: render })
        gsap.to(root, {
          yPercent: -100,
          duration: DUR.slow,
          ease: EASE.expo,
          onComplete: () => html.removeAttribute('data-loader'),
        })
      })
      emitLoaderExit()
    }

    Promise.all([fonts, image, minHold]).then(exit)
    const maxTimer = setTimeout(exit, LOADER_MAX_MS - elapsed)
    SKIP_EVENTS.forEach((type) => window.addEventListener(type, exit, { passive: true }))
    return () => {
      exited = true
      clearTimeout(maxTimer)
      SKIP_EVENTS.forEach((type) => window.removeEventListener(type, exit))
      ctx.revert()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="loader-overlay surface-dark fixed inset-0 z-50 flex-col justify-between px-gutter-sm py-4 md:px-gutter-md lg:px-gutter lg:pb-10"
    >
      <p className="text-body-lg text-fg">{t.nav.brand}</p>
      <p className="self-end font-display text-ticker leading-none tabular-nums">
        <span ref={countRef}>0</span>
        <span className="font-mono text-label text-fg-muted">%</span>
      </p>
    </div>
  )
}
