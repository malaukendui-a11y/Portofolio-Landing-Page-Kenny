/**
 * Security headers (PRD §8 Security, M5). One plain module, no React: next.config.ts sends these
 * headers on every path, and tests/playwright/security.spec.ts asserts the same literal.
 *
 * Content-Security-Policy, one policy for every environment (previews get production's):
 * - script-src 'unsafe-inline': the App Router streams its RSC payload in inline <script>s that
 *   change with every build, so they cannot be hashed ahead of time; nonces need dynamic rendering,
 *   which the prerendered, CDN-cached page rules out. Never add a hash or a nonce: CSP3 browsers then
 *   ignore 'unsafe-inline' and block Next's own scripts. The loader's pre-paint script runs under
 *   'unsafe-inline' too; the JSON-LD block is data, which script-src does not gate.
 * - script-src blob: troika (the 3D ticker's text layout) boots a blob: worker that loads each of its
 *   modules with importScripts(blob:…); a blob worker inherits this policy, so without blob: the text
 *   never lays out and the 3D falls back (owner decision, docs/DECISIONS.md 2026-11-13).
 * - worker-src blob: that worker itself. connect-src 'self': the ticker-font fetch and Next's
 *   prefetches (troika's CDN fallback-font lookup stays blocked, as it should).
 * - 'unsafe-eval' only under `next dev` (React's dev tooling), never in a build.
 * - No upgrade-insecure-requests: WebKit applies it to http://localhost too, so on `next start` every
 *   script, stylesheet and font went to https://localhost and failed (measured with Playwright's
 *   WebKit, M5). The site is HTTPS-only on Vercel (HSTS) and has no http:// subresources, so the
 *   directive would add nothing there.
 * No report-to / report-uri: that would send data to an endpoint (CLAUDE.md rule 10).
 */

type Header = { key: string; value: string }

/** The policy's directives, joined with "; ". `development` adds 'unsafe-eval' for React dev builds. */
export function contentSecurityPolicy(development: boolean): string {
  return [
    "default-src 'self'",
    [
      'script-src',
      "'self'",
      "'unsafe-inline'",
      ...(development ? ["'unsafe-eval'"] : []),
      'blob:',
    ].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ')
}

/** The production policy: what every build serves, previews included. */
export const CSP_PRODUCTION = contentSecurityPolicy(false)

/** Browser features the site never uses, switched off for this page and any frame. */
export const PERMISSIONS_POLICY =
  'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'

/**
 * Every security header, in the shape next.config.ts `headers()` takes. No HSTS (Vercel sends it)
 * and no COOP/COEP (nothing needs cross-origin isolation).
 */
export function securityHeaders(development = process.env.NODE_ENV === 'development'): Header[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(development) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    { key: 'X-Frame-Options', value: 'DENY' },
  ]
}
