'use client'

import { MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import {
  MathUtils,
  type Color,
  type Group,
  type Material,
  type Mesh,
  type PerspectiveCamera,
  type Texture,
} from 'three'
import { floatPose, GLASS, LENS, MOTION_3D } from '@/lib/three/glass'

type TransmissionMaterial = Material & { uniforms: { time: { value: number } } }

/**
 * The glass lens (DESIGN §6): a sphere flattened 1 : 1 : 0.45 with MeshTransmissionMaterial,
 * floating over the ticker's left third. The scene uses 1 world unit = 1 CSS px at z = 0;
 * the lens sits in front of that plane at z = r, so its position and scale are pulled in by
 * k = (zCam − r) / zCam to land exactly where the static fallback image sits.
 *
 * Motion runs on the scene's own clock (`time`), not R3F's: R3F resets its clock whenever the
 * frame loop pauses, which would snap the lens to a new pose. `opacity` fades the lens in after
 * the ticker handoff. `still` (export route) drops the pointer and scroll motion.
 */
export function GlassLens({
  center,
  radius,
  background,
  hero,
  timeRef,
  opacityRef,
  still = false,
}: {
  /** Lens centre in stage px, origin top-left. */
  center: { x: number; y: number }
  radius: number
  /** What the refraction sees behind the lens (the hero surface, or a flat colour). */
  background: Texture | Color
  hero?: HTMLElement | null
  timeRef: RefObject<number>
  opacityRef: RefObject<number>
  still?: boolean
}) {
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const mesh = useRef<Mesh>(null)
  const material = useRef<TransmissionMaterial>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const tilt = useRef({ x: 0, y: 0 })
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const size = useThree((state) => state.size)

  useEffect(() => {
    if (still || !hero) return
    const onMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    const onLeave = () => {
      pointer.current = null
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [hero, still])

  // MeshTransmissionMaterial sets its noise time from R3F's clock; every pass that draws the
  // lens takes the scene clock instead, so pausing never jumps the distortion.
  useEffect(() => {
    const object = mesh.current
    if (!object) return
    object.onBeforeRender = () => {
      if (material.current) material.current.uniforms.time.value = timeRef.current
    }
  }, [timeRef])

  useFrame((_, delta) => {
    if (!outer.current || !inner.current) return
    const step = Math.min(delta, MOTION_3D.maxStep)
    let scroll = 0
    let target = { x: 0, y: 0 }
    if (!still && hero) {
      scroll = MathUtils.clamp(window.scrollY / Math.max(hero.offsetHeight, 1), 0, 1)
      const rect = hero.getBoundingClientRect()
      const at = pointer.current
      if (
        at &&
        at.x >= rect.left &&
        at.x <= rect.right &&
        at.y >= rect.top &&
        at.y <= rect.bottom
      ) {
        target = {
          x: (((at.y - rect.top) / rect.height) * 2 - 1) * MOTION_3D.parallax,
          y: (((at.x - rect.left) / rect.width) * 2 - 1) * MOTION_3D.parallax,
        }
      }
    }
    tilt.current.x = MathUtils.damp(tilt.current.x, target.x, MOTION_3D.parallaxLambda, step)
    tilt.current.y = MathUtils.damp(tilt.current.y, target.y, MOTION_3D.parallaxLambda, step)

    const zCamera = camera.position.z
    const k = (zCamera - radius) / zCamera
    const x = center.x - size.width / 2
    const y = size.height / 2 - center.y - scroll * MOTION_3D.scrollDrift
    outer.current.position.set(x * k, y * k, radius)
    outer.current.scale.setScalar(radius * k)

    const pose = floatPose(still ? 0 : timeRef.current)
    inner.current.position.y = pose.lift
    inner.current.rotation.set(
      pose.x + tilt.current.x,
      pose.y + tilt.current.y + MathUtils.degToRad(MOTION_3D.scrollYaw) * scroll,
      pose.z,
    )
    if (material.current) material.current.opacity = opacityRef.current
  })

  return (
    <group ref={outer}>
      <group ref={inner}>
        <mesh ref={mesh} name="glass-lens" scale={[1, 1, LENS.depth]}>
          <sphereGeometry args={[1, LENS.widthSegments, LENS.heightSegments]} />
          <MeshTransmissionMaterial
            ref={material as RefObject<never>}
            transmission={GLASS.transmission}
            thickness={GLASS.thickness}
            roughness={GLASS.roughness}
            ior={GLASS.ior}
            chromaticAberration={GLASS.chromaticAberration}
            anisotropicBlur={GLASS.anisotropicBlur}
            distortion={GLASS.distortion}
            // The noise is sampled in world units (px here): per lens radius, as in a unit scene.
            distortionScale={GLASS.distortionScale / radius}
            temporalDistortion={still ? 0 : GLASS.temporalDistortion}
            backside={GLASS.backside}
            samples={GLASS.samples}
            resolution={GLASS.resolution}
            backsideResolution={GLASS.backsideResolution}
            color={GLASS.color}
            background={background}
            transparent
            opacity={0}
          />
        </mesh>
      </group>
    </group>
  )
}
