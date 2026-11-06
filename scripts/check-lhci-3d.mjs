// Proves the desktop Lighthouse runs measured the 3D hero (M3 brief: "Lighthouse desktop ≥ 0.90
// with the 3D mounted"). Run after the desktop `lhci autorun`, before the mobile one:
//   node scripts/check-lhci-3d.mjs [.lighthouseci]
// Every desktop report must contain the `three:ready` user timing that the hero sets on its first
// WebGL frame (components/hero/HeroGlass.tsx), inside the recorded trace. A run where the static
// lens took over names the reason (`three:fallback:<reason>`) and fails the check, so the gate can
// never pass by not measuring the lens. Prints the numbers for the PR.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? '.lighthouseci'
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'))
let failed = false

for (const entry of manifest) {
  const report = JSON.parse(readFileSync(entry.jsonPath, 'utf8'))
  const timings = report.audits['user-timings']?.details?.items ?? []
  const marks = timings.filter((item) => item.timingType === 'Mark').map((item) => item.name)
  const ready = timings.find((item) => item.name === 'three:ready')
  const fallback = marks.filter((name) => name.startsWith('three:fallback'))
  const metric = (id) => report.audits[id]?.numericValue
  const line = [
    `perf ${report.categories.performance.score}`,
    `LCP ${Math.round(metric('largest-contentful-paint'))} ms`,
    `TBT ${Math.round(metric('total-blocking-time'))} ms`,
    `CLS ${metric('cumulative-layout-shift').toFixed(3)}`,
    ready ? `three:ready at ${Math.round(ready.startTime)} ms` : 'three:ready MISSING',
    ...fallback,
  ].join(' · ')
  console.log(`${entry.url} — ${line}`)
  if (!ready || fallback.length) failed = true
}

if (failed) {
  console.error('A desktop Lighthouse run did not measure the mounted 3D lens.')
  process.exit(1)
}
