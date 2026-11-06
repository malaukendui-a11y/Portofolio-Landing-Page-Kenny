'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Color } from 'three'
import { GlassLens } from '@/components/three/GlassLens'
import { CameraRig, Lighting } from '@/components/three/HeroCanvas'
import { CAMERA, FALLBACK, LENS } from '@/lib/three/glass'

/** Matte colours for the difference matte (not UI colours). */
const MATTE = { black: '#000000', white: '#ffffff' } as const

const noSubscription = () => () => {}

/** Flags the wrapper once a few frames have rendered (the environment and FBOs are filled). */
function ReadyAfterFrames({ onReady }: { onReady: () => void }) {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 4) onReady()
  })
  return null
}

/**
 * The lens alone at the 1440 px size, still (no float, pointer, scroll or noise drift), on a
 * flat matte: `?bg=black` or `?bg=white`. The export script renders both and recovers a
 * transparent lens-only image from the difference.
 */
export function GlassExport() {
  const search = useSyncExternalStore(
    noSubscription,
    () => window.location.search,
    () => '',
  )
  const matte = new URLSearchParams(search).get('bg') === 'white' ? MATTE.white : MATTE.black
  const background = useMemo(() => new Color(matte), [matte])
  const [ready, setReady] = useState(false)
  const timeRef = useRef(0)
  const opacityRef = useRef(1)
  const radius = FALLBACK.size / (2 * LENS.exportExtent)

  return (
    <div
      data-export
      data-export-ready={ready || undefined}
      style={{ width: FALLBACK.size, height: FALLBACK.size, background: matte }}
    >
      <Canvas key={matte} flat dpr={2} camera={{ fov: CAMERA.fov }}>
        <CameraRig />
        <Lighting />
        <GlassLens
          center={{ x: FALLBACK.size / 2, y: FALLBACK.size / 2 }}
          radius={radius}
          background={background}
          timeRef={timeRef}
          opacityRef={opacityRef}
          still
        />
        <ReadyAfterFrames onReady={() => setReady(true)} />
      </Canvas>
    </div>
  )
}
