// Motion tokens (DESIGN §3.4) are declared twice: as CSS custom properties in
// app/globals.css and as GSAP values in lib/motion.ts. This keeps the two in step,
// and checks that the hover duration utility really applies the token.
import { readFileSync } from 'node:fs'
import { expect, test } from './fixtures'
import { DUR, EASE, MARQUEE, STAGGER } from '../../lib/motion'

const css = readFileSync('app/globals.css', 'utf8')

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (!match) throw new Error(`--${name} not found in globals.css`)
  return match[1].trim()
}

const seconds = (value: string) =>
  value.endsWith('ms') ? parseFloat(value) / 1000 : parseFloat(value)

// GSAP ease name → its cubic-bezier twin in CSS.
const BEZIER: Record<string, string> = {
  'power3.out': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  'expo.out': 'cubic-bezier(0.19, 1, 0.22, 1)',
}

test('lib/motion.ts mirrors the CSS motion tokens', () => {
  test.skip(test.info().project.name !== 'desktop', 'no browser involved')
  expect(seconds(token('duration-fast'))).toBe(DUR.fast)
  expect(seconds(token('duration-base'))).toBe(DUR.base)
  expect(seconds(token('duration-slow'))).toBe(DUR.slow)
  expect(seconds(token('duration-stagger'))).toBe(STAGGER)
  expect(seconds(token('duration-marquee'))).toBe(MARQUEE.desktop)
  expect(seconds(token('duration-marquee-sm'))).toBe(MARQUEE.mobile)
  expect(token('ease-out')).toBe(BEZIER[EASE.out])
  expect(token('ease-expo')).toBe(BEZIER[EASE.expo])
})

test('duration-fast applies the 250 ms token to hover transitions', async ({ page }) => {
  await page.goto('/')
  const duration = await page
    .locator('header nav ul a')
    .first()
    .evaluate((link) => getComputedStyle(link).transitionDuration)
  expect(duration).toBe('0.25s')
})
