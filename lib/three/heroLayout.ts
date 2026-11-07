/**
 * Measures the HTML name marquee so the WebGL copy can sit exactly on top of it (DESIGN §6
 * "Ticker in WebGL"): same font size, letter spacing, baseline and unit positions. Everything is
 * read from the DOM and CSS, so the marquee stays the single source (CLAUDE.md rules 1 and 6).
 * No `three` import: the hero may call this before the 3D chunk exists.
 */
import { marqueeAnimation } from '@/lib/marquee'
import { LENS } from './glass'

export type TickerUnit = {
  /** Left edge relative to the track, CSS px. */
  x: number
  /** The unit text exactly as the HTML marquee renders it ("Ananda Kenny —"). */
  text: string
  /** Pen position of the unit's last character relative to the unit's left edge, CSS px. */
  lastCharX: number
}

export type HeroLayout = {
  /** Stage (canvas) size, CSS px. */
  width: number
  height: number
  /** Ticker font size, px (`--text-ticker` as computed). */
  fontSize: number
  /** Letter spacing in em (`--text-ticker--letter-spacing` as computed). */
  letterSpacing: number
  /** Line box of the ticker relative to the stage top, px. */
  lineTop: number
  lineHeight: number
  /** Distance from the line box top to the text baseline, px. */
  baseline: number
  units: TickerUnit[]
  /** Distance the track travels per loop (one copy group), px. */
  groupWidth: number
  /** One loop, seconds. */
  duration: number
  /** Lens centre relative to the stage top-left, and radius, CSS px. */
  lens: { x: number; y: number; radius: number }
  /** Token colours. */
  ink: string
  paper: string
}

/** Resolves a CSS duration token ("40s", "40000ms") to seconds. */
function seconds(value: string): number {
  const number = parseFloat(value)
  if (!Number.isFinite(number)) return 40
  return value.trim().endsWith('ms') ? number / 1000 : number
}

/** Baseline position inside a line box with the ticker's font and leading. */
function measureBaseline(root: HTMLElement): number {
  const probe = document.createElement('div')
  const marker = document.createElement('span')
  probe.className = root.className
  probe.style.cssText =
    'position:absolute;inset:auto;left:0;top:0;visibility:hidden;pointer-events:none;translate:none'
  marker.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
  probe.append('A', marker)
  root.parentElement?.append(probe)
  const baseline = marker.offsetTop
  probe.remove()
  return baseline
}

/** Pen position of the last character of `element`'s text, relative to its left edge. */
function lastCharOffset(element: HTMLElement): number {
  const node = element.firstChild
  if (!node || node.nodeType !== Node.TEXT_NODE) return 0
  const length = node.textContent?.length ?? 0
  if (length < 1) return 0
  const range = document.createRange()
  range.setStart(node, length - 1)
  range.setEnd(node, length)
  return range.getBoundingClientRect().left - element.getBoundingClientRect().left
}

export function measureHero(root: HTMLElement, stage: HTMLElement): HeroLayout {
  const track = root.firstElementChild as HTMLElement
  const groups = Array.from(track.children) as HTMLElement[]
  const stageRect = stage.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  const trackLeft = track.getBoundingClientRect().left
  const style = getComputedStyle(root)
  const fontSize = parseFloat(style.fontSize)
  const tokens = getComputedStyle(document.documentElement)

  const units = groups.flatMap((group) =>
    (Array.from(group.children) as HTMLElement[]).map((unit) => ({
      x: unit.getBoundingClientRect().left - trackLeft,
      text: unit.textContent ?? '',
      lastCharX: lastCharOffset(unit),
    })),
  )
  const groupWidth =
    groups.length > 1
      ? groups[1].getBoundingClientRect().left - groups[0].getBoundingClientRect().left
      : track.scrollWidth

  const lineTop = rootRect.top - stageRect.top
  const lineHeight = rootRect.height
  const scale = window.innerWidth < 1440 ? LENS.scaleBelow1440 : 1
  const running = Number(marqueeAnimation(track)?.effect?.getTiming().duration)

  return {
    width: stageRect.width,
    height: stageRect.height,
    fontSize,
    letterSpacing: (parseFloat(style.letterSpacing) || 0) / fontSize,
    lineTop,
    lineHeight,
    baseline: measureBaseline(root),
    units,
    groupWidth,
    duration: running > 0 ? running / 1000 : seconds(tokens.getPropertyValue('--duration-marquee')),
    lens: {
      x: LENS.x * stageRect.width,
      y: lineTop + lineHeight / 2,
      radius: LENS.radiusEm * fontSize * scale,
    },
    ink: tokens.getPropertyValue('--color-ink-900').trim(),
    paper: tokens.getPropertyValue('--color-paper-100').trim(),
  }
}
