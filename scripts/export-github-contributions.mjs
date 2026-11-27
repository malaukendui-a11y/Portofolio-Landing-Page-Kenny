#!/usr/bin/env node
/**
 * Snapshot of the public GitHub contribution graph for the Tools & stack section (v1.1, DESIGN §4.4a).
 *
 *   pnpm stack:contributions
 *
 * Reads https://github.com/users/<handle>/contributions (the fragment the public profile loads; no token,
 * no API) and writes content/github-contributions.json:
 *
 *   { handle, asOf: "YYYY-MM-DD" (Asia/Jakarta), total, days: [{ date, level, count }] }
 *
 * The data changes only when the owner runs this script: nothing fetches it at build time or at runtime
 * (CLAUDE.md rule 10). It fails loudly, writing nothing, unless the snapshot is consistent: 365–371 days
 * in an unbroken run of dates, every level 0–4, a count of 0 exactly when the level is 0, and the day
 * counts adding up to the "N contributions in the last year" total in the same page.
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const HANDLE = 'malaukendui-a11y' // content/site.ts `site.github.handle`
const OUT = fileURLToPath(new URL('../content/github-contributions.json', import.meta.url))
const DAY_MS = 86_400_000

function fail(message) {
  console.error(`export-github-contributions: ${message}`)
  process.exit(1)
}

/** Every `name="value"` pair of one opening tag. */
function attributes(tag) {
  const result = {}
  for (const match of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) result[match[1]] = match[2]
  return result
}

/** "No contributions on May 6th." → 0, "1 contribution on May 7th." → 1, "1,024 contributions …" → 1024. */
function countFromLabel(label) {
  const text = label.trim()
  if (/^No contributions\b/.test(text)) return 0
  const match = /^([\d,]+) contributions?\b/.exec(text)
  return match ? Number(match[1].replaceAll(',', '')) : null
}

const response = await fetch(`https://github.com/users/${HANDLE}/contributions`, {
  headers: { 'user-agent': 'portfolio-contributions-export', accept: 'text/html' },
})
if (!response.ok) fail(`GitHub answered ${response.status} ${response.statusText}`)
const html = await response.text()

const totalMatch = /([\d,]+)\s+contributions?\s+in the last year/.exec(html)
if (!totalMatch) fail('no "N contributions in the last year" heading in the page')
const total = Number(totalMatch[1].replaceAll(',', ''))

const labels = new Map()
for (const match of html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g)) {
  const { for: target } = attributes(match[1])
  if (target) labels.set(target, match[2])
}

const days = []
for (const match of html.matchAll(/<td\b([^>]*)>/g)) {
  const attrs = attributes(match[1])
  if (!attrs['data-date']) continue // legend cells carry a level but no date
  const date = attrs['data-date']
  const level = Number(attrs['data-level'])
  const label = labels.get(attrs.id)
  if (label === undefined) fail(`${date}: no tooltip for cell ${attrs.id}`)
  const count = countFromLabel(label)
  if (count === null) fail(`${date}: cannot read a count from "${label.trim()}"`)
  days.push({ date, level, count })
}

// The page lists the cells row by row (all Sundays, then all Mondays, …): sort into calendar order.
days.sort((a, b) => a.date.localeCompare(b.date))

if (days.length < 365 || days.length > 371) fail(`${days.length} days; expected 365–371`)
for (const [index, day] of days.entries()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) fail(`bad date "${day.date}"`)
  if (!Number.isInteger(day.level) || day.level < 0 || day.level > 4)
    fail(`${day.date}: level ${day.level} outside 0–4`)
  if (!Number.isInteger(day.count) || day.count < 0) fail(`${day.date}: bad count ${day.count}`)
  if ((day.count === 0) !== (day.level === 0))
    fail(`${day.date}: count ${day.count} does not match level ${day.level}`)
  if (index > 0) {
    const gap =
      Date.parse(`${day.date}T00:00:00Z`) - Date.parse(`${days[index - 1].date}T00:00:00Z`)
    if (gap !== DAY_MS) fail(`dates jump from ${days[index - 1].date} to ${day.date}`)
  }
}
const sum = days.reduce((acc, day) => acc + day.count, 0)
if (sum !== total) fail(`day counts add up to ${sum}, the page says ${total}`)

// en-CA formats as YYYY-MM-DD.
const asOf = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
// One day per line keeps the file (and its diffs) readable; Prettier keeps an object on one line when
// its first key starts on the brace's line.
const head = JSON.stringify({ handle: HANDLE, asOf, total }, null, 2).slice(0, -2)
const lines = days.map(
  (day) => `    ${JSON.stringify(day).replace(/^\{/, '{ ').replace(/\}$/, ' }')}`,
)
const prettier = await import('prettier')
const json = await prettier.format(`${head},\n  "days": [\n${lines.join(',\n')}\n  ]\n}\n`, {
  ...(await prettier.resolveConfig(OUT)),
  filepath: OUT,
})
await writeFile(OUT, json)

const active = days.filter((day) => day.count > 0)
const busiest = active.reduce((best, day) => (day.count > best.count ? day : best), active[0])
console.log(
  `@${HANDLE}: ${total} contributions in the last year, as of ${asOf} (Asia/Jakarta); ` +
    `${days.length} days ${days[0].date} … ${days.at(-1).date}, ${active.length} active, ` +
    `first ${active[0]?.date ?? '—'}, busiest ${busiest?.date ?? '—'} (${busiest?.count ?? 0})`,
)
