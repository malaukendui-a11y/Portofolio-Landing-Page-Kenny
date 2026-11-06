/**
 * Capability gate for the 3D hero (DESIGN §6 "Performance rules", PRD F-04, CLAUDE.md rule 4).
 * `three` is true only when every condition holds: a viewport of at least 1024 px, a fine
 * pointer, no reduced-motion preference, no Save-Data request, and a WebGL2 context that can
 * be created on a real GPU. A software renderer (SwiftShader, llvmpipe, Microsoft Basic Render)
 * draws the glass scene on the CPU, each frame blocking the page for 150–200 ms (measured on the
 * CI runner), so those visitors get the static lens. Same external-store pattern as `useReducedMotion`; the server snapshot is
 * `{ three: false }`, so the server render and hydration never take the 3D path.
 *
 * The WebGL2 probe creates (and then loses) a real context, which blocks the main thread for a
 * moment. It runs only on demand (`probeWebGL2()`, called by the hero once the page has loaded
 * and gone idle) and only after the cheap conditions pass, so phones, Save-Data visitors and the
 * hydration task never pay for it. Until it has run, `eligible` is true and `three` is false.
 */
import { useSyncExternalStore } from 'react'

const QUERIES = [
  '(min-width: 1024px)',
  '(pointer: fine)',
  '(prefers-reduced-motion: no-preference)',
] as const

type Connection = EventTarget & { saveData?: boolean }

export type Capabilities = {
  /** Every condition holds, WebGL2 included: the canvas may mount. */
  readonly three: boolean
  /** The cheap conditions hold and WebGL2 is not known to be missing (it may be unprobed). */
  readonly eligible: boolean
}

const OFF: Capabilities = Object.freeze({ three: false, eligible: false })
const PENDING: Capabilities = Object.freeze({ three: false, eligible: true })
const ON: Capabilities = Object.freeze({ three: true, eligible: true })

/** Renderer names that mean WebGL runs on the CPU. */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|basic render driver|software/i

type Probe = 'unknown' | 'gpu' | 'missing' | 'software'

let webgl2: Probe = 'unknown'
const probeListeners = new Set<() => void>()

function connection(): Connection | undefined {
  return (navigator as Navigator & { connection?: Connection }).connection
}

/** Viewport, pointer, motion preference and Save-Data, without touching WebGL. */
function cheapConditions(): boolean {
  return (
    QUERIES.every((query) => window.matchMedia(query).matches) && connection()?.saveData !== true
  )
}

/**
 * The renderer behind a context. Chrome masks `RENDERER` ("WebKit WebGL") and names it through
 * `WEBGL_debug_renderer_info`; Firefox and Safari answer `RENDERER` directly (Firefox warns when
 * the extension is requested), so the extension is asked only when the plain answer is masked.
 */
function rendererName(context: WebGL2RenderingContext): string {
  const plain = String(context.getParameter(context.RENDERER) ?? '')
  if (plain && plain !== 'WebKit WebGL') return plain
  const info = context.getExtension('WEBGL_debug_renderer_info')
  return info ? String(context.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '') : plain
}

/**
 * Creates a WebGL2 context once per page, reads which renderer backs it, then releases it with
 * `WEBGL_lose_context`. True only for a real GPU. The result is cached and every
 * `useCapabilities()` reader is told.
 */
export function probeWebGL2(): boolean {
  if (webgl2 !== 'unknown') return webgl2 === 'gpu'
  let result: Probe = 'missing'
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    if (context) {
      result = SOFTWARE_RENDERER.test(rendererName(context)) ? 'software' : 'gpu'
      context.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    result = 'missing'
  }
  webgl2 = result
  probeListeners.forEach((listener) => listener())
  return result === 'gpu'
}

function snapshot(): Capabilities {
  if (!cheapConditions() || webgl2 === 'missing' || webgl2 === 'software') return OFF
  return webgl2 === 'gpu' ? ON : PENDING
}

function subscribe(onChange: () => void): () => void {
  const media = QUERIES.map((query) => window.matchMedia(query))
  media.forEach((list) => list.addEventListener('change', onChange))
  const network = connection()
  network?.addEventListener?.('change', onChange)
  probeListeners.add(onChange)
  return () => {
    media.forEach((list) => list.removeEventListener('change', onChange))
    network?.removeEventListener?.('change', onChange)
    probeListeners.delete(onChange)
  }
}

/** The first condition that keeps the 3D off, for diagnostics (`performance.mark`). */
export function blockedBy(): string | null {
  if (typeof window === 'undefined') return 'server'
  const names = ['viewport', 'pointer', 'motion'] as const
  const index = QUERIES.findIndex((query) => !window.matchMedia(query).matches)
  if (index >= 0) return names[index]
  if (connection()?.saveData === true) return 'save-data'
  if (webgl2 === 'missing') return 'webgl2'
  if (webgl2 === 'software') return 'software'
  return null
}

/** Live answer for code outside React; runs the WebGL2 probe if it has not run yet. */
export function canUseThree(): boolean {
  return typeof window !== 'undefined' && cheapConditions() && probeWebGL2()
}

export function useCapabilities(): Capabilities {
  return useSyncExternalStore(subscribe, snapshot, () => OFF)
}

const noSubscription = () => () => {}

/** False on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  )
}
