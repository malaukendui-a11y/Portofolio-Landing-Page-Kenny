// Lighthouse CI, mobile collection (CLAUDE.md rule 3: mobile perf ≥ 80).
// No `preset` = Lighthouse's default mobile emulation (Moto G Power, slow 4G throttling).
// Run after the desktop config: `lhci autorun --config=lighthouserc.mobile.cjs`.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready',
      url: ['http://localhost:3000/'],
      numberOfRuns: 2,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci/mobile',
    },
  },
}
