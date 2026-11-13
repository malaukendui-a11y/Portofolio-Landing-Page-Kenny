// Shared test fixture. The loader (PRD F-12) shows once per session; every page here
// starts as a returning visit unless a test opts in with `test.use({ showLoader: true })`,
// so the overlay never sits in front of what another test is checking.
//
// The 3D hero (M3) is off unless a test opts in with `test.use({ three: true })`: the page then
// sees a Save-Data request, one of the capability gate's real conditions, and shows the static
// lens. Specs written before M3 check the HTML marquee and run beside timing-sensitive tests;
// the 3D layer is covered by three.spec.ts and the `@3d` tests in the `desktop-3d` project.
//
// With the 3D on, the page names its WebGL renderer as `webglRenderer` (a GPU by default):
// headless Chromium renders WebGL on SwiftShader, which the capability gate treats as a
// machine without a GPU, so the 3D tests would otherwise only ever see the static lens.
import { test as base, expect } from '@playwright/test'
import { LOADER_SESSION_KEY } from '../../lib/loader'

/**
 * Makes the page report `navigator.connection.saveData === true` (keeps the 3D layer off). Firefox
 * and Safari have no Network Information API, so there the page gets a `connection` that asks for
 * Save-Data: the same gate condition Chromium sees, in every engine (M5).
 */
export function saveDataScript(): void {
  try {
    const Info = (window as unknown as { NetworkInformation?: { prototype: object } })
      .NetworkInformation
    if (Info)
      Object.defineProperty(Info.prototype, 'saveData', { configurable: true, get: () => true })
    else if (!('connection' in navigator))
      Object.defineProperty(Navigator.prototype, 'connection', {
        configurable: true,
        get: () => ({ saveData: true, addEventListener() {}, removeEventListener() {} }),
      })
  } catch {
    // Nothing to fake.
  }
}

/**
 * Answers `name` for the WebGL renderer: the unmasked one (`UNMASKED_RENDERER_WEBGL`, 0x9246) and,
 * where the browser does not mask it as Chromium does ('WebKit WebGL'), `RENDERER` (0x1F01), which
 * Firefox answers directly. WebKit joins every init script into one script, so a missing context
 * class must not throw here.
 */
function rendererScript(name: string): void {
  try {
    const scope = window as unknown as Record<string, typeof WebGLRenderingContext | undefined>
    for (const Context of [scope.WebGLRenderingContext, scope.WebGL2RenderingContext]) {
      if (!Context) continue
      const getParameter = Context.prototype.getParameter
      Context.prototype.getParameter = function (this: WebGLRenderingContext, parameter: number) {
        if (parameter === 0x9246) return name
        const value = getParameter.call(this, parameter)
        return parameter === 0x1f01 && value !== 'WebKit WebGL' ? name : value
      } as typeof getParameter
    }
  } catch {
    // No WebGL in this browser: nothing to fake.
  }
}

/** A hardware renderer name, for tests that need the 3D layer to mount. */
export const GPU_RENDERER = 'ANGLE (Test GPU, Direct3D11 vs_5_0 ps_5_0, D3D11)'

export type WebGL2Support = { available: boolean; renderer: string | null }

/**
 * Records every Content-Security-Policy violation in the page (lib/security-headers.ts) and hands it
 * to the test runner. A request the CSP blocks is never sent, so a test that watches requests for
 * third parties would not see it; with this guard every test fails on a violation instead (M5).
 */
function cspViolationScript(): void {
  document.addEventListener(
    'securitypolicyviolation',
    (event) => {
      const report = (window as unknown as { __reportCspViolation?: (text: string) => void })
        .__reportCspViolation
      report?.(
        `${event.effectiveDirective} blocked ${event.blockedURI || '(inline)'} at ${event.sourceFile}:${event.lineNumber}`,
      )
    },
    true,
  )
}

export const test = base.extend<
  { showLoader: boolean; three: boolean; webglRenderer: string; cspGuard: boolean },
  { webgl2: WebGL2Support }
>({
  showLoader: [false, { option: true }],
  three: [false, { option: true }],
  webglRenderer: [GPU_RENDERER, { option: true }],
  cspGuard: [true, { option: true }],
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
  page: async ({ page, showLoader, three, webglRenderer, cspGuard }, run) => {
    const violations: string[] = []
    if (cspGuard) {
      await page.exposeBinding('__reportCspViolation', (_source, text: string) => {
        violations.push(text)
      })
      await page.addInitScript(cspViolationScript)
    }
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
    else await page.addInitScript(rendererScript, webglRenderer)
    await run(page)
    expect(violations, 'Content-Security-Policy violations').toEqual([])
  },
})

export { expect } from '@playwright/test'
