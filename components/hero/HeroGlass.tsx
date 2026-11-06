'use client'

import dynamic from 'next/dynamic'
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import type { HeroCanvasProps } from '@/components/three/HeroCanvas'
import { afterLoader } from '@/lib/loader'
import { MOUNT, TICKER_FONT_URL } from '@/lib/three/glass'
import { blockedBy, probeWebGL2, useCapabilities, useHydrated } from '@/lib/useCapabilities'
import { GlassFallback } from './GlassFallback'
import type { TickerHandle } from './Ticker'

type ThreeState = 'loading' | 'ready' | 'paused' | 'fallback'

type Targets = {
  ticker: TickerHandle
  hero: HTMLElement
  stage: HTMLElement
  glow: HTMLElement
}

/** Stands in for the 3D chunk when it fails to load: reports it instead of throwing. */
function ChunkFailed({ onFallback }: Pick<HeroCanvasProps, 'onFallback'>) {
  useEffect(() => onFallback('chunk'), [onFallback])
  return null
}

// The only way into the 3D code (CLAUDE.md rule 3): a lazy client-only chunk.
const HeroCanvas = dynamic<HeroCanvasProps>(
  () => import('@/components/three/HeroCanvas').catch(() => ({ default: ChunkFailed })),
  { ssr: false, loading: () => null },
)

/** Anything the canvas throws becomes the static lens instead of an error page. */
class CanvasBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function whenLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') resolve()
    else window.addEventListener('load', () => resolve(), { once: true })
  })
}

function whenIdle(): { promise: Promise<void>; cancel: () => void } {
  let cancel = () => {}
  const promise = new Promise<void>((resolve) => {
    // Missing in older Safari.
    const requestIdle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined
    if (requestIdle) {
      const handle = requestIdle(() => resolve())
      cancel = () => window.cancelIdleCallback(handle)
    } else {
      const handle = window.setTimeout(resolve, MOUNT.idleFallback)
      cancel = () => window.clearTimeout(handle)
    }
  })
  return { promise, cancel }
}

/**
 * The hero's 3D layer and its fallbacks (DESIGN §6, PRD F-03 / F-04, CLAUDE.md rules 3–5).
 * A wrapper over the hero stage, between the HTML marquee and the portrait, that exposes its
 * state as `data-three`: none while server-rendered or hydrating, then `fallback` (static lens),
 * or `loading` → `ready` ⇄ `paused`, and `fallback` for good after any failure.
 *
 * The canvas mounts only when the capability gate allows it, after `load`, after the fonts,
 * after the loader overlay has left, and in an idle callback; the WebGL2 probe and a preflight of
 * the ticker font run inside that callback. A watchdog falls back if the scene is not ready in
 * time, and a lost context falls back unless it comes back within the restore window.
 */
export function HeroGlass({
  ticker,
  hero,
  stage,
  glow,
}: {
  ticker: RefObject<TickerHandle | null>
  hero: RefObject<HTMLElement | null>
  stage: RefObject<HTMLDivElement | null>
  glow: RefObject<HTMLDivElement | null>
}) {
  const { three, eligible } = useCapabilities()
  const hydrated = useHydrated()
  const [targets, setTargets] = useState<Targets | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [live, setLive] = useState<'ready' | 'paused' | 'lost' | null>(null)
  const [generation, setGeneration] = useState(0)
  const [offset, setOffset] = useState<number | null>(null)
  const [unitDelta, setUnitDelta] = useState<number | null>(null)
  const restoreTimer = useRef<number | undefined>(undefined)

  const mounted = hydrated && three && targets !== null && failure === null
  const state: ThreeState | undefined = !hydrated
    ? undefined
    : failure !== null || !eligible
      ? 'fallback'
      : live === 'ready' || live === 'paused'
        ? live
        : 'loading'

  // The mount gate: load → fonts → overlay gone → idle → WebGL2 probe → font preflight.
  useEffect(() => {
    if (!eligible || failure !== null || targets !== null) return
    let cancelled = false
    let stopLoader = () => {}
    let stopIdle = () => {}
    whenLoaded()
      .then(() => document.fonts.ready)
      .then(
        () =>
          new Promise<void>((resolve) => {
            stopLoader = afterLoader(resolve)
          }),
      )
      .then(() => {
        const idle = whenIdle()
        stopIdle = idle.cancel
        return idle.promise
      })
      .then(async () => {
        // A missing WebGL2 flips the gate itself; the state turns `fallback` on its own.
        if (cancelled || !probeWebGL2()) return
        const font = await fetch(TICKER_FONT_URL, { method: 'HEAD' }).catch(() => null)
        if (cancelled) return
        // Without the ticker font troika would reach for a CDN font (CLAUDE.md rule 10).
        if (!font?.ok) {
          setFailure('font')
          return
        }
        const elements = {
          ticker: ticker.current,
          hero: hero.current,
          stage: stage.current,
          glow: glow.current,
        }
        if (Object.values(elements).every(Boolean)) setTargets(elements as Targets)
      })
    return () => {
      cancelled = true
      stopLoader()
      stopIdle()
    }
  }, [eligible, failure, targets, ticker, hero, stage, glow])

  // Watchdog: from the mount to the first frame, counted only while the tab is visible.
  useEffect(() => {
    if (!mounted || live !== null) return
    let timer = 0
    const arm = () => {
      window.clearTimeout(timer)
      if (!document.hidden) timer = window.setTimeout(() => setFailure('watchdog'), MOUNT.watchdog)
    }
    arm()
    document.addEventListener('visibilitychange', arm)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', arm)
    }
  }, [mounted, live, generation])

  useEffect(() => {
    if (state === 'fallback') {
      performance.mark(`three:fallback:${failure ?? blockedBy() ?? 'unknown'}`)
    }
    if (state === 'ready') performance.mark('three:ready')
  }, [state, failure])

  useEffect(() => () => window.clearTimeout(restoreTimer.current), [])

  const onReady = useCallback((at: number) => {
    setOffset(at)
    setLive('ready')
  }, [])
  const onActive = useCallback((active: boolean, at: number) => {
    // `data-phase` keeps the handoff offset while running and records where a pause froze it.
    if (!active) setOffset(at)
    setLive(active ? 'ready' : 'paused')
  }, [])
  const onLost = useCallback(() => {
    setLive('lost')
    window.clearTimeout(restoreTimer.current)
    restoreTimer.current = window.setTimeout(() => setFailure('lost'), MOUNT.restoreWindow)
  }, [])
  const onRestored = useCallback(() => {
    window.clearTimeout(restoreTimer.current)
    // The environment map does not survive a context loss: start a fresh canvas.
    setLive(null)
    setGeneration((value) => value + 1)
  }, [])
  const onFallback = useCallback((reason: string) => setFailure(reason), [])
  const onRelease = useCallback(() => setLive(null), [])
  const onError = useCallback(() => setFailure('error'), [])

  return (
    <div
      aria-hidden="true"
      data-three={state}
      data-phase={offset === null ? undefined : offset.toFixed(2)}
      data-unit-delta={unitDelta === null ? undefined : unitDelta.toFixed(2)}
      className="pointer-events-none absolute inset-0"
    >
      {mounted && targets && (
        <CanvasBoundary key={generation} onError={onError}>
          <HeroCanvas
            {...targets}
            onReady={onReady}
            onActive={onActive}
            onLost={onLost}
            onRestored={onRestored}
            onFallback={onFallback}
            onRelease={onRelease}
            onUnitDelta={setUnitDelta}
          />
        </CanvasBoundary>
      )}
      <GlassFallback />
    </div>
  )
}
