// Shared test fixture. The loader (PRD F-12) shows once per session; every page here
// starts as a returning visit unless a test opts in with `test.use({ showLoader: true })`,
// so the overlay never sits in front of what another test is checking.
import { test as base } from '@playwright/test'
import { LOADER_SESSION_KEY } from '../../lib/loader'

export const test = base.extend<{ showLoader: boolean }>({
  showLoader: [false, { option: true }],
  // The fixture callback is named `run`, not `use`: ESLint reads `use(...)` as a React hook.
  page: async ({ page, showLoader }, run) => {
    if (!showLoader) {
      await page.addInitScript((key) => {
        try {
          sessionStorage.setItem(key, '1')
        } catch {
          // No storage: the pre-paint script cannot read it either, so no loader.
        }
      }, LOADER_SESSION_KEY)
    }
    await run(page)
  },
})

export { expect } from '@playwright/test'
