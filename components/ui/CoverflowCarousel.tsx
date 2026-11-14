'use client'

import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'
import { COVERFLOW } from '@/lib/coverflow'
import { useReducedMotion } from '@/lib/useReducedMotion'

/*
 * Coverflow carousel — cards on a ring that fold away from the centre (DESIGN §4.8, v1.1). Drag
 * the ring, click a side card, use the arrows, the dots or ←/→; click the centre card or press
 * Enter on the ring to open it.
 *
 * Ported from the 21st.dev component "Coverflow Carousel" by Ruixen. The maths is unchanged:
 * `paint` (the ring fold, `ramp = distance ** falloff`, the tilt capped at 82°, the recession
 * `depth · width · ramp`, the edge fade at half a turn, z-index by distance), `settle` (exponential
 * ease, 0.16 a frame, stops under 0.0004), the shorter-way `goTo`, `nudge`, the velocity throw
 * clamped to ±2 cards, the ResizeObserver measure of the first card and `--cf-card`. The settings
 * live in lib/coverflow.ts. Removed: `cn`, `lucide-react`, the shadcn colour and ring tokens,
 * `animate-in`, `shadow-xl`, `rounded-2xl`, `text-[15px]`, the `<img>` and the show-props (styles
 * are `.cf-*` in app/globals.css). Changed, see docs/DECISIONS.md: PolaroidLine's pointer rules
 * (only the first pointer drags, a cancelled pointer is never a click, a press that leaves the
 * frame ends, a lost release ends the drag) and a pinch-zoom mid-drag ends it too; the rail lets
 * clicks through to the side cards behind its plane; a press becomes a drag after 4 px across and leaves a
 * settle in flight alone until then; clicks come from the native `click` event; a release held
 * still for 100 ms does not throw; a card faded out is hidden; Enter is cancelled so its keypress
 * cannot click the lightbox's Close button; the frame keeps focus; under reduced motion the ring
 * jumps and never throws.
 * MIT, see THIRD_PARTY_NOTICES.md.
 */

export interface CoverflowRow {
  label: string
  value: string
  /** Renders the value as an external link. */
  href?: string
}

export interface CoverflowSlide {
  id: string
  image: { src: string; width: number; height: number; alt: string }
  caption: { title: string; subtitle: string; rows: readonly CoverflowRow[] }
}

export interface CoverflowLabels {
  region: string
  /** The keyboard frame: how ← → and Enter work. */
  frame: string
  previous: string
  next: string
  /** `{n}` is replaced at render time. */
  goTo: string
  /** `{n}` and `{count}` are replaced at render time. */
  slide: string
  openCurrent: string
}

const { rotate, depth, perspective, falloff, fade, gap, loop } = COVERFLOW

// #region maths (ported as is)
/** Capped short of edge-on, so a far card never turns its back. */
const MAX_TILT = 82
/** Exponential ease-out: the share of the distance covered each frame, and where it stops. */
const SETTLE = 0.16
const SETTLE_EPSILON = 0.0004
/** A flick carries its velocity (cards per second) times this, never more than two cards. */
const THROW = 0.18
const MAX_THROW = 2
// #endregion

/** A press becomes a drag once it has moved this far across, px (the approved demo's value). */
const DRAG_THRESHOLD = 4
/** A release this long after the last move does not throw, ms: a mouse held still sends no moves. */
const THROW_IDLE = 100

/** Nearest whole card, folded back into 0..count-1. */
function indexAt(pos: number, count: number): number {
  return ((Math.round(pos) % count) + count) % count
}

function clampPos(pos: number, count: number): number {
  return loop ? pos : Math.max(0, Math.min(count - 1, pos))
}

/**
 * Paints every card straight to the DOM: sixty state updates a second would re-render every card
 * for numbers React never needs to see. `pos` is the fractional card index at the centre.
 */
function paint(
  cards: readonly (HTMLDivElement | null)[],
  count: number,
  pos: number,
  width: number,
) {
  if (!width) return
  const pitch = width * (1 + gap)
  for (let index = 0; index < count; index++) {
    const card = cards[index]
    if (!card) continue
    // Fold the distance into the shorter way round the ring: the whole looping mechanism, no
    // cloned nodes.
    let offset = index - pos
    if (loop) {
      offset = ((offset % count) + count) % count
      if (offset > count / 2) offset -= count
    }
    const distance = Math.abs(offset)
    // Tilt and recession ease off as cards travel out; a linear ramp folds the second card shut.
    const ramp = Math.pow(distance, falloff)
    const tilt = Math.min(rotate * ramp, MAX_TILT) * Math.sign(offset)
    card.style.transform =
      `translateX(calc(-50% + ${offset * pitch}px)) ` +
      `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`
    // A card crosses the ring at exactly half a turn out, so it has to be gone by then.
    const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1
    const opacity = Math.max(0, 1 - fade * distance) * edge
    card.style.opacity = String(opacity)
    card.style.zIndex = String(100 - Math.round(distance))
    // Added: a card faded out can't be clicked or read. The stylesheet hides every card until here.
    card.style.visibility = opacity > 0 ? 'visible' : 'hidden'
  }
}

/** Title, `issuer · period`-style subtitle and label/value rows. Sizer copies render no links. */
function CaptionBody({ caption, live }: { caption: CoverflowSlide['caption']; live: boolean }) {
  return (
    <>
      <h3 className="cf-title font-display text-h3-sm md:text-h3">{caption.title}</h3>
      <p className="font-mono text-meta-sm text-fg-muted md:text-meta">{caption.subtitle}</p>
      {caption.rows.length > 0 && (
        <dl className="cf-rows text-meta-sm">
          {caption.rows.map((row) => (
            <div key={row.label}>
              <dt className="font-mono text-fg-muted">{row.label}</dt>
              <dd>
                {row.href && live ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-fg hover:text-accent-fg"
                  >
                    {row.value}
                    <ArrowUpRightIcon size={16} />
                  </a>
                ) : row.href ? (
                  <span className="inline-flex items-center gap-1">
                    {row.value}
                    <ArrowUpRightIcon size={16} />
                  </span>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </>
  )
}

export function CoverflowCarousel({
  slides,
  labels,
  onOpen,
  className = '',
}: {
  slides: readonly CoverflowSlide[]
  labels: CoverflowLabels
  /** Opens slide `index`; `trigger` (the frame) gets focus back when the overlay closes. */
  onOpen: (index: number, trigger: HTMLElement) => void
  className?: string
}) {
  const count = slides.length
  const reduced = useReducedMotion()
  const [selected, setSelected] = useState(0)
  const [dragging, setDragging] = useState(false)

  const frameRef = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])
  /** Fractional card index at the centre: the single source of truth. */
  const pos = useRef(0)
  /** Where the current settle is headed. Stepping off `pos` instead would swallow a key press
      that lands mid-flight, before the round-off moves. */
  const target = useRef(0)
  /** The first card's width, px; pitch, depth and perspective derive from it. */
  const width = useRef(0)
  const raf = useRef(0)
  const drag = useRef<null | {
    id: number
    x0: number
    pos: number
    /** `timeStamp` of the last move, ms. */
    t: number
    /** Cards per second, for the throw. */
    v: number
    moved: boolean
    /** The pinch-zoom scale at the press. */
    scale: number
  }>(null)
  /** Set when a press became a drag: the click it ends with is not a click. */
  const suppressClick = useRef(false)

  const draw = () => paint(cards.current, count, pos.current, width.current)

  const settle = (to: number) => {
    cancelAnimationFrame(raf.current)
    raf.current = 0
    target.current = to
    setSelected(indexAt(to, count))
    // Reduced motion (CLAUDE.md rule 5): the ring jumps to its target.
    if (reduced) {
      pos.current = to
      draw()
      return
    }
    const step = () => {
      const remaining = to - pos.current
      if (Math.abs(remaining) < SETTLE_EPSILON) {
        pos.current = to
        draw()
        raf.current = 0
        return
      }
      pos.current += remaining * SETTLE
      draw()
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  const goTo = (index: number) => {
    // The shorter way round, rather than unwinding the whole ring.
    const to = loop ? index + Math.round((target.current - index) / count) * count : index
    settle(clampPos(to, count))
  }

  const nudge = (by: number) => settle(clampPos(Math.round(target.current) + by, count))

  // The card width drives pitch, depth and perspective, so it is the only thing worth measuring,
  // and only when the box changes. Layout effect: placed before the first paint after hydration.
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const measure = () => {
      const card = cards.current[0]
      if (!card) return
      width.current = card.offsetWidth
      paint(cards.current, count, pos.current, width.current)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [count])

  useEffect(() => {
    const frames = raf
    return () => cancelAnimationFrame(frames.current)
  }, [])

  /** The open button leaves with the centre card: hand its focus to the frame first. */
  const keepFocusOnFrame = useCallback(
    (button: HTMLButtonElement | null) => () => {
      if (button && document.activeElement === button) {
        frameRef.current?.focus({ preventScroll: true })
      }
    },
    [],
  )

  /**
   * Ends a drag; `thrown` lets a flick carry. `released`: the pointer is up, so the click it ends
   * with, if any, comes in this same task; a later click is not this drag's. A lost release keeps
   * the flag for the click its real release will still bring.
   */
  const endDrag = (event: ReactPointerEvent | null, thrown: boolean, released = true) => {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    setDragging(false)
    const idle = event ? event.timeStamp - d.t : Number.POSITIVE_INFINITY
    const carried =
      thrown && !reduced && idle <= THROW_IDLE
        ? Math.max(-MAX_THROW, Math.min(MAX_THROW, d.v * THROW))
        : 0
    settle(clampPos(Math.round(pos.current + carried), count))
    if (released) {
      window.setTimeout(() => {
        suppressClick.current = false
      }, 0)
    }
  }

  // A press anywhere in the frame focuses the frame, so ←/→ work after a click (the open button,
  // tabIndex -1, would take focus and then leave with the centre card); no text selection starts.
  const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // A second finger makes it a pinch, the browser's (`touch-action: pan-y pinch-zoom`).
    if (!event.isPrimary) {
      endDrag(null, false)
      return
    }
    if (event.button !== 0) return
    suppressClick.current = false
    // A settle in flight carries on: a click must not strand the ring between two cards.
    drag.current = {
      id: event.pointerId,
      x0: event.clientX,
      pos: pos.current,
      t: event.timeStamp,
      v: 0,
      moved: false,
      scale: window.visualViewport?.scale ?? 1,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    // A second finger that landed outside the frame (on an arrow, say) sends us no pointerdown, but
    // the page zooms and this finger's coordinates with it: end the drag, no throw.
    if ((window.visualViewport?.scale ?? 1) !== d.scale) {
      endDrag(null, false)
      return
    }
    // The release never reached us, so the button is up already.
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      endDrag(event, false, false)
      return
    }
    const pitch = width.current * (1 + gap)
    if (!pitch) return
    const dx = event.clientX - d.x0
    if (!d.moved) {
      if (Math.abs(dx) <= DRAG_THRESHOLD) return
      d.moved = true
      cancelAnimationFrame(raf.current)
      raf.current = 0
      d.pos = pos.current
      target.current = pos.current
      suppressClick.current = true
      setDragging(true)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // The pointer is no longer active; the drag still follows its events.
      }
    }
    const previous = pos.current
    pos.current = clampPos(d.pos - dx / pitch, count)
    d.v = ((pos.current - previous) / Math.max(event.timeStamp - d.t, 1)) * 1000
    d.t = event.timeStamp
    const index = indexAt(pos.current, count)
    if (index !== selected) setSelected(index)
    draw()
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return
    endDrag(event, true)
  }

  // A vertical swipe hands the pointer to the browser: settle where it is, never a click (the
  // browser sends no click after a cancel).
  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === event.pointerId) endDrag(event, false)
  }

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    // Left before it became a drag (no capture yet): its release will not reach us.
    if (drag.current && !drag.current.moved) drag.current = null
  }

  // Mouse, touch, pen and assistive technology all end in a click. A keyboard or AT activation
  // (detail 0) is never one a drag ended with.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false
      if (event.detail !== 0) return
    }
    const card = (event.target as Element).closest<HTMLElement>('[data-cf-index]')
    if (!card || !event.currentTarget.contains(card)) return
    const index = Number(card.dataset.cfIndex)
    if (index === indexAt(target.current, count)) onOpen(index, event.currentTarget)
    else goTo(index)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      nudge(event.key === 'ArrowRight' ? 1 : -1)
      return
    }
    if (event.key !== 'Enter' || event.target !== event.currentTarget) return
    // Cancelled: by the keypress, React has already moved focus to the lightbox's Close button,
    // and the keypress would click it.
    event.preventDefault()
    if (event.repeat) return
    onOpen(indexAt(target.current, count), event.currentTarget)
  }

  if (count === 0) return null

  const rootStyle = {
    '--cf-card': COVERFLOW.cardWidth,
    '--cf-aspect': COVERFLOW.aspect,
  } as CSSProperties

  return (
    <div
      className={`cf-root ${className}`}
      style={rootStyle}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
    >
      <div className="cf-stage">
        <div
          ref={frameRef}
          className="cf-frame"
          role="group"
          aria-label={labels.frame}
          tabIndex={0}
          data-drag={dragging ? '1' : '0'}
          style={{ perspective: `calc(var(--cf-card) * ${perspective})` }}
          onMouseDown={onMouseDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
          onClick={onClick}
          onKeyDown={onKeyDown}
        >
          <div className="cf-rail">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                ref={(node) => {
                  cards.current[index] = node
                }}
                className="cf-card"
                data-cf-index={index}
                role="group"
                aria-roledescription="slide"
                aria-label={labels.slide
                  .replace('{n}', String(index + 1))
                  .replace('{count}', String(count))}
                aria-current={index === selected ? 'true' : undefined}
              >
                <Image
                  className="cf-backdrop"
                  src={slide.image.src}
                  width={slide.image.width}
                  height={slide.image.height}
                  alt=""
                  aria-hidden="true"
                  sizes="32px"
                  draggable={false}
                />
                <Image
                  className="cf-shot"
                  src={slide.image.src}
                  width={slide.image.width}
                  height={slide.image.height}
                  alt={slide.image.alt}
                  sizes="(min-width: 1024px) 22vw, 40vw"
                  draggable={false}
                />
                {index === selected && (
                  // No handler: its click bubbles to the frame, which opens the centre card.
                  <button
                    ref={keepFocusOnFrame}
                    type="button"
                    tabIndex={-1}
                    className="cf-open"
                    aria-label={labels.openCurrent}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="cf-ctl cf-prev"
          aria-label={labels.previous}
          onClick={() => nudge(-1)}
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          className="cf-ctl cf-next"
          aria-label={labels.next}
          onClick={() => nudge(1)}
        >
          <ChevronRightIcon />
        </button>
      </div>

      {/* Every caption sits in one grid cell: the invisible copies keep the tallest one's
          height, so changing the slide or the language never moves the dots. */}
      <div className="cf-caption">
        <div className="cf-caption-live" aria-live="polite">
          <div key={selected} className="cf-caption-body">
            <CaptionBody caption={slides[selected].caption} live />
          </div>
        </div>
        {slides.map((slide) => (
          <div key={slide.id} className="cf-caption-body cf-caption-sizer" aria-hidden="true">
            <CaptionBody caption={slide.caption} live={false} />
          </div>
        ))}
      </div>

      <div className="cf-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className="cf-dot"
            aria-label={labels.goTo.replace('{n}', String(index + 1))}
            aria-current={index === selected ? 'true' : undefined}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  )
}
