// Lighthouse CI against the local production build (CLAUDE.md §3 `pnpm lhci`).
// Budgets are gates (CLAUDE.md rule 3): desktop perf ≥ 90, a11y / best-practices / SEO ≥ 95.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready',
      url: ['http://localhost:3000/'],
      numberOfRuns: 2,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
