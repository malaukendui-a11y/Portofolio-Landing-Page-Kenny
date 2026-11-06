// Shared test fixture. The loader (PRD F-12) shows once per session; every page here
// starts as a returning visit unless a test opts in with `test.use({ showLoader: true })`,
// so the overlay never sits in front of what another test is checking.
//
// The 3D hero (M3) is off unless a test opts in with `test.use({ three: true })`: the page then
// sees a Save-Data request, one of the capability gate's real conditions, and shows the static
// lens. Specs written before M3 check the HTML marquee and run beside timing-sensitive tests;
// the 3D layer is covered by three.spec.ts and the `@3d` tests in the `desktop-3d` project.
import { test as base } from '@playwright/test'
import { LOADER_SESSION_KEY } from '../../lib/loader'

/** Makes the page report `navigator.connection.saveData === true` (keeps the 3D layer off). */
export function saveDataScript(): void {
  try {
    const Info = (window as unknown as { NetworkInformation?: { prototype: object } })
      .NetworkInformation
    if (Info)
      Object.defineProperty(Info.prototype, 'saveData', { configurable: true, get: () => true })
  } catch {
    // No Network Information API: nothing to fake.
  }
}

export type WebGL2Support = { available: boolean; renderer: string | null }

export const test = base.extend<{ showLoader: boolean; three: boolean }, { webgl2: WebGL2Support }>(
  {
    showLoader: [false, { option: true }],
    three: [false, { option: true }],
    // Probed once per worker on a blank page, and reported, so every run shows whether the 3D
    // tests rendered on SwiftShader or a GPU.
    webgl2: [
      async ({ browser }, run) => {
        const page = await browser.newPage()
        const support = await page.evaluate(() => {
          const gl = document.createElement('canvas').getContext('webgl2')
          const info = gl?.getExtension('WEBGL_debug_renderer_info')
          return {
            available: gl !== null,
            renderer: gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : null,
          }
        })
        await page.close()
        await run(support)
      },
      { scope: 'worker' },
    ],
    // The fixture callback is named `run`, not `use`: ESLint reads `use(...)` as a React hook.
    page: async ({ page, showLoader, three }, run) => {
      if (!showLoader) {
        await page.addInitScript((key) => {
          try {
            sessionStorage.setItem(key, '1')
          } catch {
            // No storage: the pre-paint script cannot read it either, so no loader.
          }
        }, LOADER_SESSION_KEY)
      }
      if (!three) await page.addInitScript(saveDataScript)
      await run(page)
    },
  },
)

export { expect } from '@playwright/test'
