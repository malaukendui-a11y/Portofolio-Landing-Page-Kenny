'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber'
import { memo, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  BackSide,
  FrontSide,
  MathUtils,
  setConsoleFunction,
  WebGLRenderer,
  WebGLRenderTarget,
  type CanvasTexture,
  type Material,
  type Mesh,
  type PerspectiveCamera,
} from 'three'
import type { TickerHandle } from '@/components/hero/Ticker'
import { DUR, EASE, gsap } from '@/lib/motion'
import { CAMERA, DPR, KEY_LIGHT, LIGHTFORMERS, MOTION_3D } from '@/lib/three/glass'
import { measureHero, type HeroLayout } from '@/lib/three/heroLayout'
import { drawBackdrop } from './backdrop'
import { GlassLens } from './GlassLens'
import { WebGLTicker } from './WebGLTicker'

/**
 * Messages three logs for situations this layer handles itself stay off the console: the
 * deprecation R3F 9.8.2 triggers on every mount (it still builds a THREE.Clock on r187), the
 * context loss / restore notes, and the note that a GPU without parallel shader compilation
 * compiles synchronously instead. Everything else, shader errors included, passes through.
 */
const QUIET = [
  /^THREE\.Clock: This module has been deprecated/,
  /^THREE\.WebGLRenderer: Context (Lost|Restored)\./,
  /^THREE\.WebGLRenderer: KHR_parallel_shader_compile extension not supported/,
]
setConsoleFunction((type, message, ...params) => {
  if (QUIET.some((pattern) => pattern.test(message))) return
  const method = type === 'error' ? console.error : type === 'warn' ? console.warn : console.log
  method(message, ...params)
})

/** Created once: R3F re-applies camera props that change, which would undo CameraRig. */
const CAMERA_PROPS = { fov: CAMERA.fov }

const GL_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
}

export type HeroCanvasProps = {
  ticker: TickerHandle
  hero: HTMLElement
  stage: HTMLElement
  glow: HTMLElement
  /** The WebGL ticker has taken over; `offset` is its x in px (the track's translateX). */
  onReady: (offset: number) => void
  /** The hero went under 10 % visible or the tab was hidden (false), or came back (true). */
  onActive: (active: boolean, offset: number) => void
  onLost: () => void
  onRestored: () => void
  onFallback: (reason: string) => void
  /** The canvas is going away; the name is back with the HTML marquee. */
  onRelease: () => void
  onUnitDelta: (delta: number) => void
}

type Stage = 'boot' | 'warm' | 'live'

/**
 * Lighting with zero downloads (CLAUDE.md rule 10): an Environment built from Lightformers plus
 * one soft key light. Memoised with stable children, so the cube map renders once per mount.
 */
export const Lighting = memo(function Lighting() {
  const [colors] = useState(() => {
    const tokens = getComputedStyle(document.documentElement)
    return LIGHTFORMERS.map(
      (former) =>
        ('token' in former ? tokens.getPropertyValue(former.token).trim() : former.color) ||
        'white',
    )
  })
  return (
    <>
      <Environment resolution={256} frames={1}>
        {LIGHTFORMERS.map((former, index) => (
          <Lightformer
            key={index}
            form="rect"
            color={colors[index]}
            intensity={former.intensity}
            position={[former.position[0], former.position[1], former.position[2]]}
            scale={[former.scale[0], former.scale[1], 1]}
          />
        ))}
      </Environment>
      <directionalLight
        position={[KEY_LIGHT.position[0], KEY_LIGHT.position[1], KEY_LIGHT.position[2]]}
        intensity={KEY_LIGHT.intensity}
      />
    </>
  )
})

/** Perspective camera at z = h / (2·tan(fov / 2)): 1 world unit = 1 CSS px at z = 0. */
export function CameraRig() {
  const get = useThree((state) => state.get)
  const height = useThree((state) => state.size.height)
  useLayoutEffect(() => {
    const camera = get().camera as PerspectiveCamera
    const distance = height / (2 * Math.tan(MathUtils.degToRad(camera.fov / 2)))
    camera.position.set(0, 0, distance)
    camera.near = 1
    camera.far = distance * 2
    camera.updateProjectionMatrix()
  }, [get, height])
  return null
}

/** Lets the main thread breathe between the expensive boot steps. */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/**
 * Compiles every program the first frames need, off the critical path where the browser can
 * (KHR_parallel_shader_compile): the lens front side for the canvas, and the lens back side and
 * the text for the refraction buffers, which render to a target in linear colour space.
 */
async function compileScene(state: RootState): Promise<void> {
  const { gl, scene, camera } = state
  const lens = scene.getObjectByName('glass-lens') as Mesh | undefined
  const material = lens?.material as Material | undefined
  await gl.compileAsync(scene, camera)
  await yieldToMain()
  if (!material) return
  const target = new WebGLRenderTarget(1, 1)
  const previous = gl.getRenderTarget()
  gl.setRenderTarget(target)
  material.side = BackSide
  material.needsUpdate = true
  try {
    await gl.compileAsync(scene, camera)
  } finally {
    material.side = FrontSide
    material.needsUpdate = true
    gl.setRenderTarget(previous)
    target.dispose()
  }
}

/**
 * Runs first in every frame (it mounts before the scene, so its frame callback is registered
 * first): compiles once the text has laid out, renders two hidden frames, then hands the name
 * over from the HTML marquee in a single frame and fades the lens in (DECISIONS: M3 handoff).
 */
function Boot({
  synced,
  setStage,
  ticker,
  layout,
  phaseRef,
  runningRef,
  timeRef,
  fadeRef,
  boxRef,
  handedOffRef,
  unmountingRef,
  onReady,
  onLost,
  onRestored,
}: {
  synced: boolean
  setStage: (stage: Stage) => void
  ticker: TickerHandle
  layout: HeroLayout
  phaseRef: React.RefObject<number>
  runningRef: React.RefObject<boolean>
  timeRef: React.RefObject<number>
  fadeRef: React.RefObject<number>
  boxRef: React.RefObject<HTMLDivElement | null>
  handedOffRef: React.RefObject<boolean>
  unmountingRef: React.RefObject<boolean>
  onReady: (offset: number) => void
  onLost: () => void
  onRestored: () => void
}) {
  const get = useThree((state) => state.get)
  const gl = useThree((state) => state.gl)
  // The frame state lives in a ref: a React prop would reach this root a frame or more late.
  const mode = useRef<Stage>('boot')
  const warmFrames = useRef(0)
  const fadeStart = useRef<number | null>(null)
  const [ease] = useState(() => gsap.parseEase(EASE.out))

  useEffect(() => {
    if (!synced || mode.current !== 'boot') return
    let cancelled = false
    const warm = () => {
      if (cancelled || mode.current !== 'boot') return
      mode.current = 'warm'
      setStage('warm')
    }
    // A failed parallel compile only means the first frame compiles synchronously instead.
    compileScene(get()).then(warm, warm)
    return () => {
      cancelled = true
    }
  }, [synced, get, setStage])

  // Context loss: give the name back to the HTML marquee at once; the hero decides whether to
  // wait for a restore or fall back. Losses caused by our own unmount are ignored.
  useEffect(() => {
    const canvas = gl.domElement
    const lost = () => {
      if (unmountingRef.current) return
      if (handedOffRef.current) {
        ticker.resume(phaseRef.current)
        handedOffRef.current = false
      }
      runningRef.current = false
      if (boxRef.current) boxRef.current.style.opacity = '0'
      onLost()
    }
    const restored = () => {
      if (!unmountingRef.current) onRestored()
    }
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    return () => {
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl, ticker, phaseRef, runningRef, boxRef, handedOffRef, unmountingRef, onLost, onRestored])

  useFrame((_, delta) => {
    const step = Math.min(delta, MOTION_3D.maxStep)
    if (mode.current === 'warm') {
      warmFrames.current += 1
      // Frame 1 renders anything compileAsync could not reach; frame 2 is a clean one.
      if (warmFrames.current <= 2) return
      // Handoff: freeze the HTML marquee, start the WebGL copy at the same phase, show the canvas
      // in this same frame. The WebGL copy starts moving from the next frame.
      phaseRef.current = ticker.suspend()
      handedOffRef.current = true
      if (boxRef.current) boxRef.current.style.opacity = '1'
      fadeStart.current = timeRef.current
      mode.current = 'live'
      setStage('live')
      onReady(-phaseRef.current * layout.groupWidth)
      return
    }
    if (mode.current !== 'live') return
    runningRef.current = handedOffRef.current
    timeRef.current += step
    if (fadeStart.current !== null) {
      const progress = Math.min(1, (timeRef.current - fadeStart.current) / DUR.base)
      fadeRef.current = ease(progress)
      if (progress >= 1) fadeStart.current = null
    }
  })

  return null
}

/**
 * The hero's 3D layer (DESIGN §6, PRD F-03 / F-04): the WebGL name marquee and the glass lens in
 * one transparent canvas covering the hero stage. Loaded only through `next/dynamic` with
 * `ssr: false` from components/hero/HeroGlass, which owns the mount gate and the fallbacks.
 */
export default function HeroCanvas(props: HeroCanvasProps) {
  const {
    ticker,
    hero,
    stage: stageElement,
    glow,
    onActive,
    onFallback,
    onRelease,
    onUnitDelta,
  } = props
  const boxRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<HeroLayout>(() => measureHero(ticker.root!, stageElement))
  const [backdrop, setBackdrop] = useState<CanvasTexture>(() =>
    drawBackdrop(glow, stageElement, layout.paper),
  )
  const [stage, setStage] = useState<Stage>('boot')
  const [synced, setSynced] = useState(false)
  const [visible, setVisible] = useState(true)
  const phaseRef = useRef(0)
  const runningRef = useRef(false)
  const timeRef = useRef(0)
  const fadeRef = useRef(0)
  const handedOffRef = useRef(false)
  const unmountingRef = useRef(false)

  // Pause below 10 % visibility (DESIGN §6) or in a hidden tab. Reads the newest entry: a busy
  // main thread delivers several in one callback, oldest first.
  useEffect(() => {
    let ratio = 1
    const update = () => setVisible(ratio >= 0.1 && !document.hidden)
    const observer = new IntersectionObserver(
      (entries) => {
        ratio = entries[entries.length - 1].intersectionRatio
        update()
      },
      { threshold: [0, 0.1] },
    )
    observer.observe(hero)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [hero])

  useEffect(() => {
    if (stage === 'live') onActive(visible, -phaseRef.current * layout.groupWidth)
  }, [stage, visible, onActive, layout.groupWidth])

  // Re-measure when the stage or the ticker changes size; redraw the backdrop for the new shape.
  useEffect(() => {
    const root = ticker.root
    if (!root) return
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = measureHero(root, stageElement)
        setLayout(next)
        // Redrawn in place at the same size; a new size returns a new texture (the old one is
        // disposed by the effect below).
        setBackdrop((current) => drawBackdrop(glow, stageElement, next.paper, current))
      })
    })
    observer.observe(stageElement)
    observer.observe(root)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [ticker, stageElement, glow])

  // Unmounting (a live gate change, a fallback or a remount): hand the name back to the HTML
  // marquee before the canvas disappears, in the same commit, so no frame shows neither.
  useLayoutEffect(
    () => () => {
      unmountingRef.current = true
      if (handedOffRef.current) ticker.resume(phaseRef.current)
      handedOffRef.current = false
      onRelease()
    },
    [ticker, onRelease],
  )
  useEffect(() => () => backdrop.dispose(), [backdrop])

  // R3F's defaults are these same three attributes; the context is created here so that a
  // refusal can fall back quietly.
  const createRenderer = async (defaults: { canvas?: unknown }) => {
    const canvas = defaults.canvas as HTMLCanvasElement
    const context = canvas.getContext('webgl2', GL_ATTRIBUTES)
    if (!context) {
      // No throw: R3F would rethrow into the page. The hero swaps in the static lens, and this
      // pending root is dropped with the unmount.
      onFallback('context')
      return new Promise<never>(() => {})
    }
    return new WebGLRenderer({ ...GL_ATTRIBUTES, canvas, context })
  }

  return (
    <div ref={boxRef} className="absolute inset-0 opacity-0">
      <Canvas
        flat
        dpr={DPR}
        gl={createRenderer}
        camera={CAMERA_PROPS}
        frameloop={stage === 'boot' || (stage === 'live' && !visible) ? 'never' : 'always'}
        resize={{ scroll: false }}
        // R3F's own div defaults to pointer-events: auto; none keeps every pointer event (and
        // so R3F's raycasting) away from the canvas. The lens reads the pointer from window.
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl }) => {
          gl.domElement.setAttribute('aria-hidden', 'true')
          gl.domElement.tabIndex = -1
        }}
      >
        <Boot
          synced={synced}
          setStage={setStage}
          ticker={ticker}
          layout={layout}
          phaseRef={phaseRef}
          runningRef={runningRef}
          timeRef={timeRef}
          fadeRef={fadeRef}
          boxRef={boxRef}
          handedOffRef={handedOffRef}
          unmountingRef={unmountingRef}
          onReady={props.onReady}
          onLost={props.onLost}
          onRestored={props.onRestored}
        />
        <CameraRig />
        <Lighting />
        <Suspense fallback={null}>
          <WebGLTicker
            layout={layout}
            phaseRef={phaseRef}
            runningRef={runningRef}
            onSynced={() => setSynced(true)}
            onUnitDelta={onUnitDelta}
          />
          <GlassLens
            center={layout.lens}
            radius={layout.lens.radius}
            background={backdrop}
            hero={hero}
            timeRef={timeRef}
            opacityRef={fadeRef}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
