import { stackTools } from '@/content/stack'
import { stackIcons } from '@/content/stack-icons'

/**
 * The Tools & stack logos as one SVG sprite (DESIGN §4.4a): a `<symbol id="<tool id>">` per tool, which
 * the tiles draw with `<use href="/stack-logos.svg#<id>">`. Prerendered at build time from the generated
 * content/stack-icons.ts, served from this origin: the 18 KB of paths stay out of the page's HTML and its
 * RSC payload, and out of the JS bundle (docs/DECISIONS.md 2026-11-27).
 */
export function GET(): Response {
  const symbols = stackTools
    .map(
      ({ id }) =>
        `<symbol id="${id}" viewBox="${stackIcons[id].viewBox}">${stackIcons[id].body}</symbol>`,
    )
    .join('')
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`, {
    headers: { 'content-type': 'image/svg+xml; charset=utf-8' },
  })
}
