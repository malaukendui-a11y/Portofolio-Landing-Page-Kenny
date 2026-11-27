import contributions from '@/content/github-contributions.json'
import { site } from '@/content/site'
import { stackRows, toolsInRow } from '@/content/stack'
import { graphLayout } from '@/lib/stackGraph'
import { Section } from '@/components/ui/Section'
import { StackGraph, StackHeading, StackLogos } from './StackIslands'

/**
 * Tools & stack (DESIGN §4.4a, v1.1): one ink-800 card with the real GitHub contribution graph
 * (content/github-contributions.json, a snapshot the owner refreshes with `pnpm stack:contributions`),
 * a hairline, and two logo rows running in opposite directions. This Server Component reads the data
 * and hands the islands in StackIslands.tsx compact props; neither the snapshot nor the logo paths
 * (served as `/stack-logos.svg`) are part of the client bundle.
 */

/** Logo tile pitch: a 64 px tile plus the 12 px gap (`stack-tile`, `stack-group` in globals.css). */
const TILE_PITCH_PX = 76
/**
 * Each copy of a row must be at least as wide as the row, or the loop shows a gap. The card is
 * full-bleed (DESIGN §3.3), so size for a 2560 px window: 2560 − 2 × 40 px gutters.
 */
const WIDEST_ROW_PX = 2480

export function Stack() {
  const { days } = contributions
  const { lead, weeks, months } = graphLayout(days)
  return (
    <Section id="stack" surface="dark" labelledBy="stack-heading">
      <StackHeading />
      <div className="grid gap-5 rounded-card border border-hairline bg-ink-800 p-5 md:gap-6 md:p-8 [&>*]:min-w-0">
        <StackGraph
          handle={contributions.handle}
          profileUrl={site.github.url}
          total={contributions.total}
          asOf={contributions.asOf}
          start={days[0].date}
          levels={days.map((day) => day.level).join('')}
          counts={days.map((day) => day.count)}
          lead={lead}
          weeks={weeks}
          months={months}
        />
        <div aria-hidden="true" className="-mx-5 h-px bg-hairline md:-mx-8" />
        <StackLogos
          rows={stackRows.map((row) => {
            const tools = toolsInRow(row).map(({ id, name }) => ({ id, name }))
            return {
              direction: row.direction,
              tools,
              repeats: Math.max(1, Math.ceil(WIDEST_ROW_PX / (tools.length * TILE_PITCH_PX))),
            }
          })}
        />
      </div>
    </Section>
  )
}
