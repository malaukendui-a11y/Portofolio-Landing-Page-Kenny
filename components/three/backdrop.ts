import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'

/** Long side of the backdrop texture, px: it only feeds the lens's 512² refraction buffers. */
const MAX_SIDE = 512

type Radial = { x: number; y: number; radius: number; color: string }

/** `rgba(r, g, b, 0)` for any CSS colour, so a stop fades in alpha only (as CSS does). */
function transparentOf(context: CanvasRenderingContext2D, color: string): string {
  context.fillStyle = '#000'
  context.fillStyle = color
  const parsed = String(context.fillStyle)
  if (parsed.startsWith('#')) {
    const value = parseInt(parsed.slice(1, 7), 16)
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, 0)`
  }
  const [r = '0', g = '0', b = '0'] = parsed.match(/[\d.]+/g) ?? []
  return `rgba(${r}, ${g}, ${b}, 0)`
}

/** Reads a percentage or length custom property as px along `size`. */
function length(style: CSSStyleDeclaration, name: string, size: number): number {
  const value = style.getPropertyValue(name).trim()
  const number = parseFloat(value)
  if (!Number.isFinite(number)) return 0
  return value.endsWith('%') ? (number / 100) * size : number
}

/**
 * The hero surface under the stage as a texture: paper-100 plus the two radial glows of
 * globals.css `hero-glow`, read from the same custom properties. MeshTransmissionMaterial
 * refracts this instead of a flat colour, so the lens shows the terracotta glow it sits in
 * while the canvas itself stays transparent over the real CSS glow.
 */
export function drawBackdrop(
  glow: HTMLElement,
  stage: HTMLElement,
  paper: string,
  texture?: CanvasTexture,
): CanvasTexture {
  const stageRect = stage.getBoundingClientRect()
  const glowRect = glow.getBoundingClientRect()
  const scale = MAX_SIDE / Math.max(stageRect.width, stageRect.height, 1)
  const width = Math.max(1, Math.round(stageRect.width * scale))
  const height = Math.max(1, Math.round(stageRect.height * scale))

  // A texture keeps its GPU storage size: a new size needs a new texture (the caller disposes).
  const previous = texture?.image as HTMLCanvasElement | undefined
  const reuse = previous && previous.width === width && previous.height === height
  if (!reuse) texture = undefined
  const canvas = reuse ? previous : document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const style = getComputedStyle(glow)
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent-glow')

  const offsetX = glowRect.left - stageRect.left
  const offsetY = glowRect.top - stageRect.top
  // CSS paints the first background layer on top: the white glow over the accent glow.
  const layers: Radial[] = [
    {
      x: offsetX + length(style, '--glow-accent-x', glowRect.width),
      y: offsetY + length(style, '--glow-accent-y', glowRect.height),
      radius: length(style, '--glow-accent-r', 0),
      color: accent.trim(),
    },
    {
      x: offsetX + length(style, '--portrait-x', glowRect.width),
      y: offsetY + length(style, '--glow-white-y', glowRect.height),
      radius: length(style, '--glow-white-r', 0),
      color: style.getPropertyValue('--glow-white').trim(),
    },
  ]

  context.setTransform(scale, 0, 0, scale, 0, 0)
  context.fillStyle = paper
  context.fillRect(0, 0, stageRect.width, stageRect.height)
  for (const layer of layers) {
    if (!layer.color || layer.radius <= 0) continue
    const gradient = context.createRadialGradient(
      layer.x,
      layer.y,
      0,
      layer.x,
      layer.y,
      layer.radius,
    )
    gradient.addColorStop(0, layer.color)
    gradient.addColorStop(1, transparentOf(context, layer.color))
    context.fillStyle = gradient
    context.fillRect(0, 0, stageRect.width, stageRect.height)
  }

  if (texture) {
    texture.needsUpdate = true
    return texture
  }
  const created = new CanvasTexture(canvas)
  created.colorSpace = SRGBColorSpace
  created.generateMipmaps = false
  created.minFilter = LinearFilter
  created.magFilter = LinearFilter
  return created
}
