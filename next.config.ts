import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Build time for the sitemap's `lastmod` (app/sitemap.ts), inlined at build.
  env: { BUILD_TIME: new Date().toISOString() },
  // AGENTS.md is a pointer to CLAUDE.md; stop `next dev` from re-adding its managed block.
  agentRules: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
