import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://localhost:3000'

// Two viewports per CLAUDE.md §7: desktop 1440 and mobile 390. Every spec runs in both.
export default defineConfig({
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
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
