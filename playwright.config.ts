import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://localhost:3000'

const viewport = { width: 1440, height: 900 }
const desktop = { ...devices['Desktop Chrome'], viewport }
const phone = { width: 390, height: 844 }

// Two viewports per CLAUDE.md §7: desktop 1440 and mobile 390. Every spec runs in both.
// The 3D hero (M3) has its own project: `@3d` tests run once `desktop` and `mobile` are done,
// one at a time, so WebGL (SwiftShader in headless Chromium, on the CPU) never competes with
// the timing-sensitive specs. Headless Chromium already provides WebGL2 that way; no flags.
//
// Cross-browser (M5, PRD §3.3): Firefox and WebKit at the same two sizes run every spec except
// `@3d` and `@chromium` (tests that need Chromium internals: Chrome traces, CDP, encoded sizes;
// each tag's reason is in docs/DECISIONS.md). Run them as their own invocation
// (`--project=desktop-firefox --project=desktop-webkit --project=mobile-webkit`), as CI does, so
// the SwiftShader 3D project never shares the machine with them.
export default defineConfig<{ three: boolean; showLoader: boolean }>({
  testDir: './tests/playwright',
  fullyParallel: true,
  // Two workers locally: six parallel browsers starved this machine (timing tests and
  // teardown timeouts, 2026-10-30). CI keeps Playwright's default and is the reference.
  workers: process.env.CI ? undefined : 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      grepInvert: /@3d/,
      use: desktop,
    },
    {
      name: 'mobile',
      grepInvert: /@3d/,
      use: { ...devices['Pixel 7'], viewport: phone },
    },
    {
      name: 'desktop-firefox',
      grepInvert: /@3d|@chromium/,
      retries: process.env.CI ? 1 : 0,
      use: { ...devices['Desktop Firefox'], viewport },
    },
    {
      name: 'desktop-webkit',
      grepInvert: /@3d|@chromium/,
      retries: process.env.CI ? 1 : 0,
      use: { ...devices['Desktop Safari'], viewport },
    },
    {
      name: 'mobile-webkit',
      grepInvert: /@3d|@chromium/,
      retries: process.env.CI ? 1 : 0,
      use: { ...devices['iPhone 13'], viewport: phone },
    },
    {
      name: 'desktop-3d',
      grep: /@3d/,
      dependencies: ['desktop', 'mobile'],
      workers: 1,
      // A retry would hide a flaky 3D test; flaky counts as failed.
      retries: 0,
      use: { ...desktop, three: true },
    },
  ],
  webServer: {
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
