/**
 * Layout of the Tools & stack contribution graph (components/sections/Stack.tsx, DESIGN §4.4a): week
 * columns that start on a Sunday, as on GitHub, and the columns that carry a month label. Pure, so
 * tests/playwright/stack.spec.ts (TC-135) can check it with dates the snapshot does not have.
 */
export function graphLayout(days: readonly { date: string }[]): {
  /** Empty squares before the first day, so each column starts on a Sunday. */
  lead: number
  weeks: number
  /** Week column (0-based) and month (0–11) of each month label. */
  months: { week: number; month: number }[]
} {
  const lead = new Date(`${days[0].date}T00:00:00Z`).getUTCDay()
  const weeks = Math.ceil((lead + days.length) / 7)
  const months: { week: number; month: number }[] = []
  let last = ''
  for (let week = 0; week < weeks; week++) {
    const first = days[Math.max(0, week * 7 - lead)].date
    // A label needs two columns of room: none in the last two weeks, and when a month starts one
    // column after the previous label (a snapshot beginning in a month's last week), the newer
    // month keeps the place, as on GitHub.
    if (first.slice(0, 7) !== last && week < weeks - 2) {
      if (months.length && week - months[months.length - 1].week < 2) months.pop()
      months.push({ week, month: Number(first.slice(5, 7)) - 1 })
      last = first.slice(0, 7)
    }
  }
  return { lead, weeks, months }
}
