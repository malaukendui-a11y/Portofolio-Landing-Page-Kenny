// Exports the static glass lens (DESIGN §6 "Static fallback") from the dev scene:
//   pnpm exec next dev -p 3100        (in another terminal; never :3000, which Playwright reuses)
//   node scripts/export-glass-fallback.mjs [http://localhost:3100]
// It renders /dev/glass-export over black and over white at 2×, recovers a lens-only RGBA image
// by difference matting (alpha = 1 − (white − black), colour = black / alpha), and writes
// public/3d/hero-glass-fallback@2x.webp. Over a uniform background the refraction itself cancels
// out; what remains is what the lens adds: reflections, rim highlights and its tint.
// Afterwards delete .next/cache/images so next/image serves the new file.
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://localhost:3100'
const OUTPUT = 'public/3d/hero-glass-fallback@2x.webp'
const MAX_BYTES = 120 * 1024
const QUALITY = 0.9

const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 640, height: 480 },
    deviceScaleFactor: 2,
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))

  const capture = async (bg) => {
    await page.goto(`${BASE}/dev/glass-export?bg=${bg}`)
    await page.waitForSelector('[data-export-ready]', { timeout: 60_000 })
    return (await page.locator('[data-export]').screenshot()).toString('base64')
  }
  const black = await capture('black')
  const white = await capture('white')
  if (errors.length) throw new Error(`page errors: ${errors.join('; ')}`)

  const { dataUrl, width, height, coverage } = await page.evaluate(
    async ({ black, white, quality }) => {
      const load = async (base64) => {
        const image = new Image()
        image.src = `data:image/png;base64,${base64}`
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0)
        return context.getImageData(0, 0, canvas.width, canvas.height)
      }
      const onBlack = await load(black)
      const onWhite = await load(white)
      const out = new ImageData(onBlack.width, onBlack.height)
      let visible = 0
      for (let i = 0; i < out.data.length; i += 4) {
        let difference = 0
        for (let c = 0; c < 3; c++) difference += (onWhite.data[i + c] - onBlack.data[i + c]) / 255
        const alpha = Math.min(1, Math.max(0, 1 - difference / 3))
        if (alpha < 1 / 255) continue
        visible += 1
        for (let c = 0; c < 3; c++) {
          out.data[i + c] = Math.min(255, Math.round(onBlack.data[i + c] / alpha))
        }
        out.data[i + 3] = Math.round(alpha * 255)
      }
      const canvas = document.createElement('canvas')
      canvas.width = out.width
      canvas.height = out.height
      canvas.getContext('2d').putImageData(out, 0, 0)
      return {
        dataUrl: canvas.toDataURL('image/webp', quality),
        width: out.width,
        height: out.height,
        coverage: visible / (out.width * out.height),
      }
    },
    { black, white, quality: QUALITY },
  )

  const bytes = Buffer.from(dataUrl.split(',')[1], 'base64')
  if (!dataUrl.startsWith('data:image/webp')) throw new Error('the browser did not encode WebP')
  if (bytes.length > MAX_BYTES) throw new Error(`${bytes.length} bytes exceeds ${MAX_BYTES}`)
  writeFileSync(OUTPUT, bytes)
  console.log(
    `${OUTPUT}: ${width}×${height}, ${(bytes.length / 1024).toFixed(1)} KB, ` +
      `${(coverage * 100).toFixed(1)} % of pixels visible`,
  )
} finally {
  await browser.close()
}
