'use client'

import Image from 'next/image'
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/ui/icons'
import { useReducedMotion } from '@/lib/useReducedMotion'

/*
 * Polaroid line — square prints pegged to a sagging string (DESIGN §4.9). Drag the line, click
 * a print, use the arrows or ←/→: the prints slide along the string, swing with the speed you
 * give them and settle with a little overshoot.
 *
 * Ported from the 21st.dev component "Polaroid Line Carousel": the physics constants
 * (`stringY`, `springStep`, `swingStep`, `nearestAt`) are unchanged. Removed: titles, captions,
 * the painted-landscape fallback and the inline stylesheet (styles are `.pl-*` in
 * app/globals.css). Changed, see docs/DECISIONS.md: size lives in a ref and the loop places the
 * prints once off-screen; autoplay runs only on screen, waits for hover or keyboard focus and
 * stops at the pause button; only the first finger drags; a cancelled pointer is never a click;
 * a press that leaves the root ends; under reduced motion the line jumps instead of springing.
 */

export interface PolaroidSlide {
  id: string
  src: string
  width: number
  height: number
  alt: string
}

export interface PolaroidLineLabels {
  region: string
  previous: string
  next: string
  pause: string
  play: string
  /** `{current}` and `{total}` are replaced at render time. */
  status: string
}

// #region physics (ported as is)
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

/** Height of a string sagging by `sag` between (0, y0) and (w, y0), at x. */
function stringY(x: number, w: number, y0: number, sag: number): number {
  const t = clamp(x / w, 0, 1)
  return y0 + 4 * sag * t * (1 - t)
}

/** One step of a critically damped spring toward target. */
function springStep(x: number, v: number, target: number, dt: number, k = 70): [number, number] {
  const c = 2 * Math.sqrt(k)
  const nv = v + (k * (target - x) - c * v) * dt
  return [x + nv * dt, nv]
}

/** One step of a print's swing: it lags the line's speed (px/s), gravity pulls it back, damped. */
function swingStep(
  a: number,
  w: number,
  lineVel: number,
  dt: number,
  gain: number,
): [number, number] {
  const nw = w + (-38 * a - 4.2 * w + lineVel * 0.0034 * gain) * dt
  return [clamp(a + nw * dt, -0.6, 0.6), nw]
}

/** Index of the print nearest the centre for a line offset. */
function nearestAt(off: number, spacing: number, n: number): number {
  return clamp(Math.round(off / spacing), 0, Math.max(0, n - 1))
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n)
}
// #endregion

const spacingFor = (cw: number) => cw * 1.08

/** A busy main thread delivers several changes in one callback, oldest first: read the newest. */
const isOnScreen = (entries: IntersectionObserverEntry[]) =>
  entries[entries.length - 1].isIntersecting

export function PolaroidLine({
  slides,
  initial = 2,
  autoplay = 4500,
  cardWidth = 260,
  sag = 46,
  swing = 1,
  labels,
  className = '',
}: {
  slides: PolaroidSlide[]
  initial?: number
  /** ms per print; 0 turns autoplay off. */
  autoplay?: number
  /** Width of a print in px; it shrinks on narrow screens. */
  cardWidth?: number
  /** How far the string sags in the middle, px. */
  sag?: number
  /** How much the prints swing; 0 holds them still. */
  swing?: number
  labels: PolaroidLineLabels
  className?: string
}) {
  const n = slides.length
  const first = clamp(initial, 0, Math.max(0, n - 1))
  const reduced = useReducedMotion()
  const [active, setActive] = useState(first)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [paused, setPaused] = useState(false)
  // A button or key moved the line: announce it, whatever focus did (a touch screen reader may
  // not focus the button at all). Autoplay's next step hands the region back.
  const [stepped, setStepped] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const sim = useRef({ off: 0, vel: 0, target: 0, a: [] as number[], w: [] as number[] })
  const size = useRef({ w: 0, h: 0, cw: cardWidth })
  const drag = useRef<null | {
    id: number
    x: number
    off: number
    lx: number
    lt: number
    v: number
    moved: boolean
  }>(null)
  const lastTouch = useRef(Number.NEGATIVE_INFINITY)
  const activeRef = useRef(first)
  const gainInputs = useRef({ sag, swing, reduced })

  useEffect(() => {
    gainInputs.current = { sag, swing, reduced }
  }, [sag, swing, reduced])

  const goTo = (i: number) => {
    sim.current.target = clamp(i, 0, n - 1) * spacingFor(size.current.cw)
  }

  // Size, then the simulation, written straight to the DOM each frame.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let visible = true
    let raf = 0
    let prev = performance.now()
    const S = sim.current

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.033, (now - prev) / 1000)
      prev = now
      const { w, h, cw } = size.current
      const spacing = spacingFor(cw)
      const y0 = Math.max(40, h * 0.2)
      const d = drag.current
      const o = gainInputs.current
      let lineVel: number
      if (d && d.moved) {
        lineVel = d.v * 1000
      } else if (o.reduced) {
        // Reduced motion (CLAUDE.md rule 5): the line goes straight to its target.
        S.off = S.target
        S.vel = 0
        lineVel = 0
      } else {
        const before = S.off
        ;[S.off, S.vel] = springStep(S.off, S.vel, S.target, dt)
        lineVel = -(S.off - before) / Math.max(dt, 1e-3)
      }
      const g = o.reduced ? 0 : o.swing
      const near = nearestAt(S.off, spacing, n)
      for (let i = 0; i < n; i++) {
        const el = cards.current[i]
        if (!el) continue
        const x = w / 2 + i * spacing - S.off
        if (x < -cw * 1.5 || x > w + cw * 1.5) {
          el.style.visibility = 'hidden'
          continue
        }
        el.style.visibility = 'visible'
        let a = S.a[i] || 0
        let av = S.w[i] || 0
        ;[a, av] = swingStep(a, av, lineVel, dt, g)
        if (g) a += Math.sin(now / 1300 + i * 1.7) * 0.0009 * g
        S.a[i] = a
        S.w[i] = av
        const y = stringY(x, w, y0, o.sag) - 6
        el.style.transform = `translate(${(x - cw / 2).toFixed(1)}px,${y.toFixed(1)}px) rotate(${a.toFixed(4)}rad)`
        el.style.zIndex = String(i === near ? n + 1 : n - Math.abs(i - near))
      }
      pathRef.current?.setAttribute('d', `M0 ${y0} Q${w / 2} ${y0 + 2 * o.sag} ${w} ${y0}`)
      if (near !== activeRef.current) {
        activeRef.current = near
        setActive(near)
      }
      // Always one frame, even off-screen, so the prints are placed before they scroll in.
      if (visible) raf = requestAnimationFrame(frame)
    }

    const schedule = () => {
      if (raf) return
      prev = performance.now()
      raf = requestAnimationFrame(frame)
    }

    let measured = false
    const resize = new ResizeObserver(() => {
      const r = root.getBoundingClientRect()
      if (!r.width) return
      const cw = Math.round(Math.max(150, Math.min(cardWidth, r.width * 0.42, r.height * 0.42)))
      const changed = !measured || cw !== size.current.cw
      size.current = { w: r.width, h: r.height, cw }
      measured = true
      root.style.setProperty('--pl-cw', `${cw}px`)
      if (changed) {
        // Keep the active print centred when the spacing changes.
        const off = activeRef.current * spacingFor(cw)
        S.off = off
        S.target = off
        S.vel = 0
      }
      schedule()
    })
    resize.observe(root)

    const intersection = new IntersectionObserver((entries) => {
      visible = isOnScreen(entries)
      if (visible && measured) schedule()
    })
    intersection.observe(root)

    return () => {
      cancelAnimationFrame(raf)
      resize.disconnect()
      intersection.disconnect()
    }
  }, [cardWidth, n])

  // Autoplay: wraps from the last print to the first; only on screen; waits for the user; the
  // pause button stops it until pressed again (WCAG 2.2.2: hover and focus do not reach a phone).
  const canRotate = autoplay > 0 && n > 1 && !reduced
  const rotating = canRotate && !paused && !hovered && !focused
  useEffect(() => {
    const root = rootRef.current
    if (!root || !rotating) return
    let timer = 0
    const stop = () => {
      window.clearInterval(timer)
      timer = 0
    }
    const observer = new IntersectionObserver((entries) => {
      stop()
      if (!isOnScreen(entries)) return
      timer = window.setInterval(() => {
        if (document.hidden || drag.current) return
        if (performance.now() - lastTouch.current < autoplay) return
        setStepped(false)
        sim.current.target =
          (activeRef.current >= n - 1 ? 0 : activeRef.current + 1) * spacingFor(size.current.cw)
      }, autoplay)
    })
    observer.observe(root)
    return () => {
      observer.disconnect()
      stop()
    }
  }, [rotating, autoplay, n])

  /** Ends a drag. Returns false when the pointer never moved far enough to be one. */
  const endDrag = (thrown = true): boolean => {
    const d = drag.current
    drag.current = null
    lastTouch.current = performance.now()
    if (!d?.moved) return false
    setDragging(false)
    const v = thrown ? d.v : 0
    sim.current.vel = -v * 1000
    goTo(nearestAt(sim.current.off - v * 180, spacingFor(size.current.cw), n))
    return true
  }

  const onDown = (e: ReactPointerEvent) => {
    // A second finger makes it a pinch, the browser's (`touch-action: pan-y pinch-zoom`). It may
    // not cancel the first finger, which would then keep driving the line, so drop the drag here.
    if (!e.isPrimary) {
      endDrag(false)
      return
    }
    if ((e.target as HTMLElement).closest('.pl-bar')) return
    if (e.button !== 0) return
    lastTouch.current = performance.now()
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      off: sim.current.off,
      lx: e.clientX,
      lt: e.timeStamp,
      v: 0,
      moved: false,
    }
  }

  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    // The release never reached us, so the button is up already.
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      endDrag()
      return
    }
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true
      setDragging(true)
      rootRef.current?.setPointerCapture(e.pointerId)
    }
    if (!d.moved) return
    const dt = Math.max(1, e.timeStamp - d.lt)
    d.v = 0.7 * ((e.clientX - d.lx) / dt) + 0.3 * d.v
    d.lx = e.clientX
    d.lt = e.timeStamp
    const spacing = spacingFor(size.current.cw)
    const max = (n - 1) * spacing
    let off = d.off - dx
    if (off < 0) off *= 0.35
    if (off > max) off = max + (off - max) * 0.35
    sim.current.off = off
  }

  const onUp = (e: ReactPointerEvent) => {
    if (drag.current?.id !== e.pointerId) return
    if (endDrag()) return
    const card = (e.target as HTMLElement).closest('[data-i]')
    if (card) goTo(Number(card.getAttribute('data-i')))
  }

  // A vertical swipe cancels the pointer: never a click.
  const onCancel = (e: ReactPointerEvent) => {
    if (drag.current?.id === e.pointerId) endDrag()
  }

  const onLeave = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') return
    setHovered(false)
    // Left without capturing the pointer: its release will not reach us.
    if (drag.current && !drag.current.moved) drag.current = null
  }

  const step = (dir: number) => {
    lastTouch.current = performance.now()
    setStepped(true)
    goTo(clamp(activeRef.current + dir, 0, n - 1))
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') step(1)
    else if (e.key === 'ArrowLeft') step(-1)
    else return
    e.preventDefault()
  }

  const onFocus = (e: FocusEvent) => {
    if ((e.target as HTMLElement).matches(':focus-visible')) setFocused(true)
  }

  const onBlur = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
  }

  return (
    <div
      ref={rootRef}
      className={`pl-root ${className}`}
      data-drag={dragging ? '1' : '0'}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      tabIndex={0}
      onKeyDown={onKey}
      onFocus={onFocus}
      onBlur={onBlur}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onCancel}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHovered(true)
      }}
      onPointerLeave={onLeave}
    >
      <svg className="pl-string" aria-hidden="true">
        <path ref={pathRef} />
      </svg>
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          ref={(el) => {
            cards.current[i] = el
          }}
          className="pl-card"
          data-i={i}
          data-on={i === active ? '1' : '0'}
          aria-hidden={i === active ? undefined : true}
        >
          <div className="pl-print">
            <div className="pl-shot">
              <Image
                src={slide.src}
                width={slide.width}
                height={slide.height}
                alt={slide.alt}
                sizes="(min-width: 768px) 300px, 160px"
                draggable={false}
              />
            </div>
            <div className="pl-note" />
          </div>
          <div className="pl-peg" />
        </div>
      ))}
      <div className="pl-bar">
        <span className="pl-count" aria-hidden="true">
          <b>{pad2(active + 1)}</b> / {pad2(n)}
        </span>
        {canRotate && (
          <button
            type="button"
            className="pl-btn"
            aria-label={paused ? labels.play : labels.pause}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
          </button>
        )}
        <button
          type="button"
          className="pl-btn"
          aria-label={labels.previous}
          onClick={() => step(-1)}
        >
          <ChevronLeftIcon size={16} />
        </button>
        <button type="button" className="pl-btn" aria-label={labels.next} onClick={() => step(1)}>
          <ChevronRightIcon size={16} />
        </button>
      </div>
      <div className="sr-only" aria-live={rotating && !stepped ? 'off' : 'polite'}>
        {labels.status.replace('{current}', String(active + 1)).replace('{total}', String(n))}
      </div>
    </div>
  )
}
