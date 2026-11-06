// Lighthouse CI against the local production build (CLAUDE.md §3 `pnpm lhci`).
// Budgets are gates (CLAUDE.md rule 3): desktop perf ≥ 90, a11y / best-practices / SEO ≥ 95.
// Measured WITH the 3D hero mounted (M3): scripts/check-lhci-3d.mjs, run right after this
// config, fails unless every run recorded the hero's `three:ready` mark inside its trace.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready',
      url: ['http://localhost:3000/'],
      numberOfRuns: 2,
      settings: {
        preset: 'desktop',
        // The lens mounts after load, the loader and an idle callback (about 2–4 s on a fresh
        // session): keep observing long enough that every run includes it.
        pauseAfterLoadMs: 6000,
        // A desktop mouse's pointer and hover (the values Playwright passes): on a runner with no
        // mouse (CI), headless Chrome reports no fine pointer and the capability gate keeps the 3D
        // off (seen as `three:fallback:pointer`). SwiftShader lets a GPU-less runner render WebGL
        // in software; with a GPU it changes nothing.
        chromeFlags:
          '--enable-unsafe-swiftshader --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4',
      },
    },
    assert: {
      assertions: {
        // Pessimistic: both runs must pass, not just the better one.
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'pessimistic' }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.1, aggregationMethod: 'pessimistic' },
        ],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
