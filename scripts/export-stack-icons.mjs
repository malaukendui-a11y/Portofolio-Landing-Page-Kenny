#!/usr/bin/env node
/**
 * Brand logos for the Tools & stack section (v1.1, DESIGN §4.4a), copied out of two pinned devDependencies
 * into one generated module, so no icon package ships to the browser and nothing loads from a CDN
 * (CLAUDE.md rule 10):
 *
 *   pnpm stack:icons        →  content/stack-icons.ts
 *
 * - simple-icons (CC0-1.0 as a package): one 24 × 24 path per icon, read from `icons/<slug>.svg`. Some
 *   icons keep their own licence (`license` in `data/simple-icons.json`: here Git CC-BY-3.0 and
 *   JavaScript MIT); that licence is recorded per icon, not the package's.
 * - The page loads the logos as one static sprite, `/stack-logos.svg` (app/stack-logos.svg/route.ts),
 *   built from this module at build time.
 * - @iconify-json/devicon-plain (MIT, devicon © konpa): Playwright, Codex, VS Code, PowerShell, which
 *   Simple Icons does not carry; read from its `icons.json` by name, never imported whole into the app.
 * - Google Stitch is in no licensed set: a neutral stitched-square symbol drawn here (not Google's logo;
 *   docs/DECISIONS.md 2026-11-27, the owner may swap it).
 *
 * The ids and their order come from content/stack.ts; the script fails if an id has no source here or a
 * source has no id there. Logos are trademarks of their owners, shown only to name the tools used
 * (THIRD_PARTY_NOTICES.md).
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'content', 'stack-icons.ts')

/** id (content/stack.ts) → where its logo comes from. */
const SOURCES = {
  html: { set: 'simple-icons', name: 'html5' },
  css: { set: 'simple-icons', name: 'css' },
  javascript: { set: 'simple-icons', name: 'javascript' },
  typescript: { set: 'simple-icons', name: 'typescript' },
  react: { set: 'simple-icons', name: 'react' },
  nextjs: { set: 'simple-icons', name: 'nextdotjs' },
  tailwind: { set: 'simple-icons', name: 'tailwindcss' },
  vite: { set: 'simple-icons', name: 'vite' },
  nodejs: { set: 'simple-icons', name: 'nodedotjs' },
  supabase: { set: 'simple-icons', name: 'supabase' },
  playwright: { set: 'devicon-plain', name: 'playwright' },
  vitest: { set: 'simple-icons', name: 'vitest' },
  jira: { set: 'simple-icons', name: 'jira' },
  vercel: { set: 'simple-icons', name: 'vercel' },
  'cloudflare-pages': { set: 'simple-icons', name: 'cloudflarepages' },
  figma: { set: 'simple-icons', name: 'figma' },
  'google-stitch': { set: 'own' },
  'claude-code': { set: 'simple-icons', name: 'claude' },
  codex: { set: 'devicon-plain', name: 'codex' },
  git: { set: 'simple-icons', name: 'git' },
  github: { set: 'simple-icons', name: 'github' },
  vscode: { set: 'devicon-plain', name: 'vscode' },
  powershell: { set: 'devicon-plain', name: 'powershell' },
}

/** Rounded square with a dashed "stitched" inner seam: drawn for this site, no brand. */
const STITCH_BODY =
  '<rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.25" fill="none" stroke="currentColor" stroke-width="1.75"/>' +
  '<rect x="7" y="7" width="10" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-dasharray="2.4 2.6"/>'

function fail(message) {
  console.error(`export-stack-icons: ${message}`)
  process.exit(1)
}

function packageDir(name) {
  // Both are direct devDependencies, linked at node_modules/<name> (simple-icons exports no package.json).
  return join(ROOT, 'node_modules', name)
}

async function packageVersion(name) {
  return JSON.parse(await readFile(join(packageDir(name), 'package.json'), 'utf8')).version
}

/** The ids in content/stack.ts, in file order (read as text: this script runs without a TS loader). */
async function stackIds() {
  const source = await readFile(join(ROOT, 'content', 'stack.ts'), 'utf8')
  return [...source.matchAll(/\bid:\s*'([a-z0-9-]+)'/g)].map((match) => match[1])
}

const simpleIconsVersion = await packageVersion('simple-icons')
const simpleIconsJson = JSON.parse(
  await readFile(join(packageDir('simple-icons'), 'data', 'simple-icons.json'), 'utf8'),
)
const simpleIconsData = Array.isArray(simpleIconsJson) ? simpleIconsJson : simpleIconsJson.icons
const deviconVersion = await packageVersion('@iconify-json/devicon-plain')
const devicon = JSON.parse(
  await readFile(join(packageDir('@iconify-json/devicon-plain'), 'icons.json'), 'utf8'),
)
const deviconInfo = JSON.parse(
  await readFile(join(packageDir('@iconify-json/devicon-plain'), 'info.json'), 'utf8'),
)
if (deviconInfo.license?.spdx !== 'MIT') fail('devicon-plain is no longer MIT-licensed')

const ids = await stackIds()
const missing = ids.filter((id) => !SOURCES[id])
const extra = Object.keys(SOURCES).filter((id) => !ids.includes(id))
if (missing.length) fail(`no logo source for ${missing.join(', ')}`)
if (extra.length) fail(`sources for ids not in content/stack.ts: ${extra.join(', ')}`)

const icons = {}
for (const id of ids) {
  const source = SOURCES[id]
  if (source.set === 'simple-icons') {
    const svg = await readFile(
      join(packageDir('simple-icons'), 'icons', `${source.name}.svg`),
      'utf8',
    )
    const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]
    const paths = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map((match) => match[1])
    if (viewBox !== '0 0 24 24' || paths.length !== 1)
      fail(`simple-icons/${source.name}: unexpected SVG`)
    const data = simpleIconsData.find((entry) => entry.slug === source.name)
    if (!data) fail(`simple-icons/${source.name}: not in data/simple-icons.json`)
    icons[id] = {
      viewBox,
      body: `<path d="${paths[0]}"/>`,
      source: `simple-icons@${simpleIconsVersion} · ${source.name} (from ${data.source})`,
      // The package is CC0, but some icons keep their own licence (Simple Icons DISCLAIMER.md).
      license: data.license?.type ?? 'CC0-1.0',
    }
  } else if (source.set === 'devicon-plain') {
    const icon = devicon.icons[source.name]
    if (!icon) fail(`devicon-plain has no "${source.name}"`)
    const width = icon.width ?? devicon.width ?? 16
    const height = icon.height ?? devicon.height ?? 16
    if (/<(script|foreignObject|image|use)\b|\bon\w+=|href=/i.test(icon.body))
      fail(`devicon-plain/${source.name}: unexpected markup`)
    icons[id] = {
      viewBox: `${icon.left ?? 0} ${icon.top ?? 0} ${width} ${height}`,
      body: icon.body,
      source: `@iconify-json/devicon-plain@${deviconVersion} · ${source.name}`,
      license: 'MIT',
    }
  } else {
    icons[id] = {
      viewBox: '0 0 24 24',
      body: STITCH_BODY,
      source: 'own neutral symbol (not a brand logo)',
      license: 'own work',
    }
  }
}

const header = `// generated by scripts/export-stack-icons.mjs — jangan diedit manual (do not edit by hand).
// Run \`pnpm stack:icons\` after changing content/stack.ts or the pinned icon packages.
// Logos are trademarks of their owners, shown only to name the tools used (THIRD_PARTY_NOTICES.md).
import type { StackToolId } from './stack'

export interface StackIcon {
  /** SVG viewBox of \`body\`. */
  readonly viewBox: string
  /** Inner SVG markup, monochrome: paths fill with currentColor. */
  readonly body: string
  /** Package, version and icon name it was copied from. */
  readonly source: string
  /** SPDX id of the source's licence, or "own work". */
  readonly license: string
}

export const stackIcons: Record<StackToolId, StackIcon> = `
const prettier = await import('prettier')
const formatted = await prettier.format(`${header}${JSON.stringify(icons, null, 2)}\n`, {
  ...(await prettier.resolveConfig(OUT)),
  filepath: OUT,
})
await writeFile(OUT, formatted)
const bytes = Object.values(icons).reduce((sum, icon) => sum + icon.body.length, 0)
console.log(
  `wrote ${ids.length} icons (${(bytes / 1024).toFixed(1)} KB of SVG markup) to content/stack-icons.ts`,
)
