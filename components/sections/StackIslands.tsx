'use client'

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useLang } from '@/lib/i18n'
import { PauseIcon, PlayIcon } from '@/components/ui/icons'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { Copy, Lang } from '@/content/types'

/**
 * The client side of the Tools & stack section (components/sections/Stack.tsx, DESIGN §4.4a): the
 * strings of the current language, the hover caption, the graph's scroll position and Pause / Play.
 * The cells and tiles are still server-rendered HTML (these components render on the server too); they
 * are built here from compact props (a level string, a count list, tool ids) so the page's RSC payload
 * carries those few kilobytes instead of a tree of 370 cells and 158 tiles. The logo paths live in one
 * static sprite, `/stack-logos.svg` (app/stack-logos.svg/route.ts), never in the HTML or the bundle.
 */

const DAY_MS = 86_400_000
const SPRITE_URL = '/stack-logos.svg'

/** "7 May 2026" / "7 Mei 2026" from YYYY-MM-DD, with the copy's fixed month names (not Intl: en-GB writes "Sept"). */
export function formatDay(iso: string, months: Copy['stack']['months']): string {
  const [year, month, day] = iso.split('-').map(Number)
  return `${day} ${months[month - 1]} ${year}`
}

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

function formatCount(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US').format(value)
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}

/** One day's caption: "3 contributions on 7 May 2026", "1 contribution on …", "No contributions on …". */
export function dayCaption(count: number, iso: string, t: Copy['stack'], lang: Lang): string {
  const date = formatDay(iso, t.months)
  if (count === 0) return fill(t.dayNone, { date })
  return fill(count === 1 ? t.dayOne : t.dayMany, { n: formatCount(count, lang), date })
}

export function StackHeading() {
  const { t } = useLang()
  return (
    <>
      <SectionLabel className="mb-8">{t.stack.label}</SectionLabel>
      <h2
        id="stack-heading"
        data-reveal
        className="mb-8 max-w-measure font-display text-h2-sm text-balance md:mb-10 md:text-h2"
      >
        {t.stack.heading}
      </h2>
    </>
  )
}

/**
 * Card head (profile link and summary), the contribution graph and its caption line. One delegated
 * pointer listener turns the caption from the hint into the hovered (or tapped) day and back.
 */
export function StackGraph({
  handle,
  profileUrl,
  total,
  asOf,
  start,
  levels,
  counts,
  lead,
  weeks,
  months,
}: {
  handle: string
  profileUrl: string
  total: number
  asOf: string
  /** Date of the first day, YYYY-MM-DD; day i is `start` + i days. */
  start: string
  /** One digit 0–4 per day. */
  levels: string
  /** Contributions per day. */
  counts: readonly number[]
  /** Empty squares before the first day, so each column starts on a Sunday. */
  lead: number
  weeks: number
  /** Week column (0-based) and month (0–11) of each month label. */
  months: readonly { week: number; month: number }[]
}) {
  const { lang, t } = useLang()
  const copy = t.stack
  const [day, setDay] = useState<{ date: string; count: number } | null>(null)
  const [scrollable, setScrollable] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  // Narrow cards scroll the graph inside the card; it starts on the latest week (the right end).
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    let wasScrollable = false
    const measure = () => {
      const canScroll = scroller.scrollWidth > scroller.clientWidth + 1
      if (canScroll && !wasScrollable) scroller.scrollLeft = scroller.scrollWidth
      wasScrollable = canScroll
      setScrollable(canScroll)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [])

  const asOfText = formatDay(asOf, copy.months)
  const totalText = formatCount(total, lang)
  const summary = `${fill(copy.summary, { total: totalText })} · ${fill(copy.asOf, { date: asOfText })}`

  const show = (event: PointerEvent<HTMLDivElement>) => {
    const cell = (event.target as Element).closest<HTMLElement>('[data-date]')
    const index = Number(cell?.dataset.index)
    if (cell?.dataset.date && Number.isInteger(index))
      setDay({ date: cell.dataset.date, count: counts[index] ?? 0 })
  }
  // A finger "leaves" as soon as it lifts: keep a tapped day until the next tap; a mouse or pen
  // hovering out of the graph brings the hint back.
  const hide = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') setDay(null)
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body font-semibold text-fg underline-offset-4 hover:underline"
        >
          @{handle}
        </a>
        <p className="font-mono text-meta-sm text-fg-muted">{summary}</p>
      </div>
      <div>
        <div
          ref={scrollerRef}
          className="stack-scroller"
          tabIndex={scrollable ? 0 : undefined}
          role={scrollable ? 'region' : undefined}
          aria-label={scrollable ? copy.scrollRegion : undefined}
        >
          <div
            role="img"
            aria-label={fill(copy.graphLabel, { handle, total: totalText, date: asOfText })}
            className="stack-graph"
            style={{ '--weeks': weeks } as CSSProperties}
          >
            <div className="stack-months font-mono" aria-hidden="true">
              {months.map(({ week, month }) => (
                <span key={week} style={{ gridColumnStart: week + 1 }}>
                  {copy.months[month]}
                </span>
              ))}
            </div>
            <div className="stack-cells" onPointerOver={show} onPointerLeave={hide}>
              {Array.from({ length: lead }, (_, index) => (
                <span key={`pad-${index}`} className="stack-cell-pad" />
              ))}
              {counts.map((_, index) => (
                <span
                  key={index}
                  className="stack-cell"
                  data-index={index}
                  data-date={addDays(start, index)}
                  data-level={levels[index]}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-meta-sm text-fg-muted">
          <p aria-hidden="true" data-stack-caption className="min-h-[1lh]">
            {day ? dayCaption(day.count, day.date, copy, lang) : copy.hint}
          </p>
          <p aria-hidden="true" className="stack-legend">
            <span>{copy.less}</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span key={level} className="stack-cell" data-level={level} />
            ))}
            <span>{copy.more}</span>
          </p>
        </div>
      </div>
    </>
  )
}

type LogoTool = { readonly id: string; readonly name: string }

function Tile({ tool, named }: { tool: LogoTool; named: boolean }) {
  return (
    <span className="stack-tile" title={tool.name}>
      <svg
        focusable="false"
        {...(named ? { role: 'img', 'aria-label': tool.name } : { 'aria-hidden': true as const })}
      >
        <use href={`${SPRITE_URL}#${tool.id}`} width="100%" height="100%" />
      </svg>
    </span>
  )
}

/**
 * One marquee track: two identical groups (the -50 % loop of `marquee-track`), each the row's logos
 * `repeats` times. The first run of the first group is the one screen readers get; the repeats and the
 * whole second group are aria-hidden, and reduced motion hides them from sight too (one tile per tool).
 */
function Track({ tools, repeats }: { tools: readonly LogoTool[]; repeats: number }) {
  const run = (named: boolean, key: string) =>
    tools.map((tool) => <Tile key={`${key}-${tool.id}`} tool={tool} named={named} />)
  const extra = (copy: string) =>
    Array.from({ length: repeats - 1 }, (_, index) => (
      <span key={`${copy}-${index}`} className="contents" data-repeat aria-hidden="true">
        {run(false, `${copy}-${index}`)}
      </span>
    ))
  return (
    <div
      className="marquee-track"
      style={{ '--logo-tiles': tools.length * repeats } as CSSProperties}
    >
      <div className="stack-group">
        {run(true, 'a')}
        {extra('a')}
      </div>
      <div className="stack-group" data-marquee-copy aria-hidden="true">
        {run(false, 'b')}
        {extra('b')}
      </div>
    </div>
  )
}

/**
 * The two logo rows and the Pause / Play control (WCAG 2.2.2). The rows run while on screen and the tab
 * is visible; the button, hovering a row and focus inside a row pause them. Under reduced motion the
 * rows are a static wrapped grid (CSS) and the button is not shown.
 */
export function StackLogos({
  rows,
}: {
  rows: readonly {
    direction: 'normal' | 'reverse'
    tools: readonly LogoTool[]
    /** How many times one copy repeats the row's logos (wide enough for a 2560 px window). */
    repeats: number
  }[]
}) {
  const { t } = useLang()
  const copy = t.stack
  const [paused, setPaused] = useState(false)
  const [idle, setIdle] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let offscreen = false
    const sync = () => setIdle(offscreen || document.hidden)
    const observer = new IntersectionObserver((entries) => {
      // A busy main thread delivers several changes in one callback, oldest first: read the newest.
      offscreen = !entries[entries.length - 1].isIntersecting
      sync()
    })
    observer.observe(root)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return (
    <>
      <div ref={rootRef} className="grid gap-3">
        {rows.map((row, index) => (
          <div
            key={row.direction}
            role="group"
            aria-label={copy.rows[index]}
            className="stack-row"
            data-marquee={row.direction}
            data-paused={paused || idle || undefined}
          >
            <Track tools={row.tools} repeats={row.repeats} />
          </div>
        ))}
      </div>
      <div className="flex justify-end motion-reduce:hidden">
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
          className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-hairline px-4 font-mono text-label-sm text-fg uppercase transition-colors duration-fast ease-out hover:border-fg-muted"
        >
          {paused ? <PlayIcon size={12} /> : <PauseIcon size={12} />}
          {paused ? copy.play : copy.pause}
        </button>
      </div>
    </>
  )
}
