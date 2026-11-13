import type { NextConfig } from 'next'
import { securityHeaders } from './lib/security-headers'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // CSP and the other security headers on every path (PRD §8, M5); see lib/security-headers.ts.
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders() }]
  },
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
