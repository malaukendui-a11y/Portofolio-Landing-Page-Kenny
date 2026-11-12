// Exports the OpenGraph image (PRD F-14) from the dev-only card route:
//   pnpm exec next dev -p 3100        (in another terminal; never :3000, which Playwright reuses)
//   node scripts/export-og.mjs [http://localhost:3100]
// It captures /dev/og-export at 1200 × 630, DPR 1, and writes app/opengraph-image.png (≤ 300 KB)
// plus app/opengraph-image.alt.txt (the card's `data-alt`, i.e. `en.meta.og.alt`). Next serves the
// PNG as the og:image and, through openGraph, as the Twitter image. Re-run it whenever the name,
// the roles or the card's design change, then rebuild.
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://localhost:3100'
const WIDTH = 1200
const HEIGHT = 630
const MAX_BYTES = 300 * 1024
const OUTPUT = 'app/opengraph-image.png'
const ALT_OUTPUT = 'app/opengraph-image.alt.txt'

// sharp comes with Next (an optional dependency used by next/image), so no new dependency.
const require = createRequire(import.meta.url)
const sharp = createRequire(require.resolve('next/package.json'))('sharp')

/** Width and height from a PNG's IHDR chunk (bytes 16–24). */
const pngSize = (bytes) => ({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) })

const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))

  const response = await page.goto(`${BASE}/dev/og-export`, { waitUntil: 'networkidle' })
  if (!response?.ok()) throw new Error(`/dev/og-export answered ${response?.status()}`)
  // Next's development indicator would otherwise be captured in the corner.
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
  // DM Mono is not preloaded (app/fonts.ts): wait until every font in use has arrived.
  await page.evaluate(() => document.fonts.ready)
  const alt = await page.locator('[data-og]').getAttribute('data-alt')
  if (!alt) throw new Error('the card has no data-alt')
  const capture = await page.screenshot({ type: 'png' })
  if (errors.length) throw new Error(`page errors: ${errors.join('; ')}`)

  const captured = pngSize(capture)
  if (captured.width !== WIDTH || captured.height !== HEIGHT) {
    throw new Error(`captured ${captured.width}×${captured.height}, expected ${WIDTH}×${HEIGHT}`)
  }

  // Lossless first; a 256-colour palette (libimagequant, pngquant's library) only if it is too big.
  let bytes = await sharp(capture).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
  let mode = 'lossless'
  if (bytes.length > MAX_BYTES) {
    bytes = await sharp(capture)
      .png({ palette: true, quality: 100, effort: 10, dither: 1, compressionLevel: 9 })
      .toBuffer()
    mode = 'palette'
  }
  if (bytes.length > MAX_BYTES) throw new Error(`${bytes.length} bytes exceeds ${MAX_BYTES}`)

  writeFileSync(OUTPUT, bytes)
  // No trailing newline: Next copies the file into og:image:alt as it is.
  writeFileSync(ALT_OUTPUT, alt)
  console.log(
    `${OUTPUT}: ${WIDTH}×${HEIGHT}, ${(bytes.length / 1024).toFixed(1)} KB (${mode}); ` +
      `${ALT_OUTPUT}: "${alt}"`,
  )
} finally {
  await browser.close()
}
