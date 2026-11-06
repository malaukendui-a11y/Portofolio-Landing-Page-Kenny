'use client'

import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type { Group, Mesh } from 'three'
import type { HeroLayout } from '@/lib/three/heroLayout'
import { MOTION_3D, TICKER_FONT_URL, TICKER_GLYPHS, TICKER_SDF_SIZE } from '@/lib/three/glass'

type TroikaText = Mesh & {
  textRenderInfo?: { caretPositions?: Float32Array }
}

/**
 * The name marquee in WebGL (DESIGN §6 "Ticker in WebGL", PRD F-03): drei `Text` with the
 * subset Inter Display face, one mesh per HTML unit at the unit's measured position, so the
 * pitch, baseline and size match `.text-ticker` exactly. Each mesh is clipped to the HTML line
 * box, which crops the "y" descender the way the marquee's `overflow: hidden` does.
 *
 * `phase` is the fraction of one copy group travelled, shared with the hero: the group sits at
 * x = −phase · groupWidth, exactly where the CSS keyframe puts the track. `running` decides
 * whether this component advances it (after the handoff) or leaves it to the handoff code.
 * `onSynced` fires once every mesh has laid out its glyphs; `onUnitDelta` reports how far the
 * last glyph of a unit lands from the HTML one (px), for the alignment test.
 */
export function WebGLTicker({
  layout,
  phaseRef,
  runningRef,
  onSynced,
  onUnitDelta,
}: {
  layout: HeroLayout
  phaseRef: RefObject<number>
  runningRef: RefObject<boolean>
  onSynced: () => void
  onUnitDelta: (delta: number) => void
}) {
  const group = useRef<Group>(null)
  const synced = useRef(new Set<number>())
  const reported = useRef(false)
  const { width, height, fontSize, lineTop, lineHeight, baseline, units, groupWidth, duration } =
    layout

  useFrame((_, delta) => {
    if (runningRef.current) {
      phaseRef.current = (phaseRef.current + Math.min(delta, MOTION_3D.maxStep) / duration) % 1
    }
    if (group.current) group.current.position.x = -width / 2 - phaseRef.current * groupWidth
  })

  // Text local space: anchor at the baseline, y up. The HTML line box spans from `baseline`
  // above it to `lineHeight − baseline` below it.
  const clipRect: [number, number, number, number] = [
    -Infinity,
    baseline - lineHeight,
    Infinity,
    baseline,
  ]
  const y = height / 2 - (lineTop + baseline)

  const handleSync = (index: number, mesh: TroikaText) => {
    synced.current.add(index)
    if (index === 0 && !reported.current) {
      const carets = mesh.textRenderInfo?.caretPositions
      const unit = units[0]
      if (carets && unit && unit.text.length > 0) {
        reported.current = true
        onUnitDelta(carets[(unit.text.length - 1) * 4] - unit.lastCharX)
      }
    }
    if (synced.current.size === units.length) onSynced()
  }

  return (
    <group ref={group}>
      {units.map((unit, index) => (
        <Text
          key={index}
          font={TICKER_FONT_URL}
          characters={TICKER_GLYPHS}
          sdfGlyphSize={TICKER_SDF_SIZE}
          fontSize={fontSize}
          letterSpacing={layout.letterSpacing}
          anchorX="left"
          anchorY="top-baseline"
          position={[unit.x, y, 0]}
          clipRect={clipRect}
          color={layout.ink}
          onSync={(mesh: TroikaText) => handleSync(index, mesh)}
        >
          {unit.text}
        </Text>
      ))}
    </group>
  )
}
