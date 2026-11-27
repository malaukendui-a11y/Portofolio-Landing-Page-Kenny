// Exports the three boards of the "This portfolio" project card (v1.1 content, PRD §12.1) from this
// site's own production build:
//   pnpm build && pnpm exec next start -p 3100   (in another terminal; never :3000, which
//                                                  Playwright reuses)
//   node scripts/export-portfolio-shots.mjs [http://localhost:3100]
// It writes, at DPR 1, in English, with the loader already seen:
//   public/images/projects/portfolio-01-hero.webp            desktop 1600 × 900 at the top
//   public/images/projects/portfolio-02-certifications.webp  desktop 1600 × 900, the coverflow centred
//   public/images/projects/portfolio-03-phone.webp           two 390 × 844 captures (the hero, the
//                                                            projects) side by side on paper-100
// The hero shows the live 3D lens (`data-three="ready"`) when this machine gives Chromium a hardware
// WebGL2 renderer; otherwise the page gets Save-Data, as the tests do, and shows the static lens.
// The script prints which one it used. Afterwards rebuild from a clean `.next`, so next/image never
// serves a cached copy of an older board.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://localhost:3100'
const OUT = 'public/images/projects'
const BOARD = { width: 1600, height: 900 }
const PHONE = { width: 390, height: 844 }
const QUALITY = 82 // as the certificate conversions (docs/DECISIONS.md, 2026-10-28)

// sharp comes with Next (an optional dependency used by next/image), so no new dependency.
const require = createRequire(import.meta.url)
const sharp = createRequire(require.resolve('next/package.json'))('sharp')

// Same pattern as lib/useCapabilities.ts: these renderers mean WebGL in software (no GPU).
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|basic render driver|software/i

/** A token's value from app/globals.css (as tests/playwright/tokens.spec.ts reads them). */
const css = readFileSync('app/globals.css', 'utf8')
const token = (name) => {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (!match) throw new Error(`token --${name} not found in app/globals.css`)
  return match[1].trim()
}
const paper = token('color-paper-100')
const ink = token('color-text-on-paper')

/** Runs before any page script: the loader was seen this session, the language is English. */
function seed() {
  try {
    sessionStorage.setItem('loader-seen', '1')
    localStorage.setItem('lang', 'en')
  } catch {
    // No storage: no loader either, and English is the default.
  }
}

/** Save-Data on (tests/playwright/fixtures.ts): the 3D layer stays off and the static lens shows. */
function saveData() {
  const Info = window.NetworkInformation
  if (Info)
    Object.defineProperty(Info.prototype, 'saveData', { configurable: true, get: () => true })
}

const browser = await chromium.launch({
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'],
})
const errors = []
try {
  // Does Chromium get a hardware WebGL2 renderer here?
  const probe = await browser.newPage()
  const renderer = await probe.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return null
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    return String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
  })
  await probe.close()
  const live3d = renderer !== null && !SOFTWARE_RENDERER.test(renderer)
  console.log(
    `WebGL2 renderer: ${renderer ?? 'none'} → ${live3d ? 'live 3D lens' : 'static lens (Save-Data)'}`,
  )

  const open = async (viewport) => {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
    await context.addInitScript(seed)
    if (!live3d) await context.addInitScript(saveData)
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    const response = await page.goto(BASE, { waitUntil: 'load' })
    if (!response?.ok()) throw new Error(`${BASE} answered ${response?.status()}`)
    await page.evaluate(() => document.fonts.ready)
    return { context, page }
  }

  /** Every image inside `selector` (or the page) that is laid out has loaded. */
  const imagesLoaded = (page, selector = 'body') =>
    page.waitForFunction(
      (root) => {
        const images = [...document.querySelector(root).querySelectorAll('img')].filter(
          (img) => img.offsetParent !== null,
        )
        for (const img of images) img.loading = 'eager'
        return images.every((img) => img.complete && img.naturalWidth > 0)
      },
      selector,
      { timeout: 30_000 },
    )

  /** Scrolls `selector` into view and waits for its reveals and images. */
  const showSection = async (page, selector, block) => {
    await page.evaluate(
      ([target, where]) => document.querySelector(target).scrollIntoView({ block: where }),
      [selector, block],
    )
    await page.waitForFunction(
      (target) =>
        [...document.querySelector(target).querySelectorAll('[data-reveal]')].every(
          (element) => getComputedStyle(element).opacity === '1',
        ),
      selector,
      { timeout: 15_000 },
    )
    await imagesLoaded(page, selector)
    await page.waitForTimeout(800) // smooth scroll, header backdrop and card transitions settle
  }

  // 1. Desktop hero, at the top, after the entrance (and the lens, when it mounts).
  {
    const { context, page } = await open(BOARD)
    const state = live3d ? 'ready' : 'fallback'
    await page.waitForSelector(`[data-three="${state}"]`, { timeout: 30_000 })
    if (live3d)
      // The WebGL ticker has taken the name over: the HTML marquee is suspended (and hidden).
      await page.waitForSelector('#top [data-marquee][data-suspended]', {
        state: 'attached',
        timeout: 10_000,
      })
    await imagesLoaded(page, '#top')
    await page.waitForTimeout(1_500) // the lens fades in; the hero stagger finishes
    const shot = await page.screenshot({ type: 'png' })
    await write('portfolio-01-hero.webp', sharp(shot))
    await context.close()
  }

  // 2. Desktop certifications: the coverflow in the middle of the window, the newest centred.
  {
    const { context, page } = await open(BOARD)
    await showSection(page, '#certifications .cf-frame', 'center')
    await page.waitForSelector('#certifications .cf-card[aria-current="true"]')
    const shot = await page.screenshot({ type: 'png' })
    await write('portfolio-02-certifications.webp', sharp(shot))
    await context.close()
  }

  // 3. Phone: the hero and the projects section, framed side by side on paper-100. Captured
  // without mobile emulation flags, as screenshots.spec.ts does (with them the portrait dropped
  // out of the bitmap); the layout is the same 390 px one.
  {
    const { context, page } = await open(PHONE)
    await imagesLoaded(page, '#top')
    await page.waitForTimeout(1_500)
    const hero = await page.screenshot({ type: 'png' })
    await showSection(page, '#work', 'start')
    const work = await page.screenshot({ type: 'png' })
    await context.close()

    const radius = 28
    const frame = async (png) => {
      const mask = Buffer.from(
        `<svg width="${PHONE.width}" height="${PHONE.height}"><rect width="100%" height="100%" rx="${radius}" ry="${radius}"/></svg>`,
      )
      const rounded = await sharp(png)
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toBuffer()
      const border = Buffer.from(
        `<svg width="${PHONE.width}" height="${PHONE.height}"><rect x="0.5" y="0.5" width="${PHONE.width - 1}" height="${PHONE.height - 1}" rx="${radius}" ry="${radius}" fill="none" stroke="${ink}" stroke-opacity="0.15"/></svg>`,
      )
      return sharp(rounded)
        .composite([{ input: border }])
        .png()
        .toBuffer()
    }
    const gap = 96
    const left = Math.round((BOARD.width - 2 * PHONE.width - gap) / 2)
    const top = Math.round((BOARD.height - PHONE.height) / 2)
    const board = sharp({
      create: { width: BOARD.width, height: BOARD.height, channels: 3, background: paper },
    }).composite([
      { input: await frame(hero), left, top },
      { input: await frame(work), left: left + PHONE.width + gap, top },
    ])
    await write('portfolio-03-phone.webp', sharp(await board.png().toBuffer()))
  }

  if (errors.length) throw new Error(`page errors: ${errors.join('; ')}`)
} finally {
  await browser.close()
}

/** Encodes `image` as WebP and checks it is a 1600 × 900 board. */
async function write(name, image) {
  const bytes = await image.webp({ quality: QUALITY }).toBuffer()
  const { width, height } = await sharp(bytes).metadata()
  if (width !== BOARD.width || height !== BOARD.height) {
    throw new Error(`${name} is ${width}×${height}, expected ${BOARD.width}×${BOARD.height}`)
  }
  writeFileSync(`${OUT}/${name}`, bytes)
  console.log(`${OUT}/${name}: ${width}×${height}, ${(bytes.length / 1024).toFixed(1)} KB`)
}
