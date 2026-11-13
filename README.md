# Portofolio-Landing-Page-Kenny

Single-page, bilingual (EN / ID) portfolio of Ananda Kenny, Software Engineer with a QA foundation,
built with Next.js 16, TypeScript, Tailwind CSS v4, GSAP and one lazy-loaded React Three Fiber glass
lens in the hero. Live at https://portofolio-landing-page-kenny.vercel.app. Scope lives in
`docs/PRD.md`, visuals in `docs/DESIGN.md`, engineering rules in `CLAUDE.md`, decisions in
`docs/DECISIONS.md` and the test plan in `docs/QA-PLAN.md`.

## Quality gates

- Lighthouse: desktop performance ≥ 90 measured with the 3D lens mounted (`pnpm lhci` on a machine
  with a GPU), mobile ≥ 80, accessibility / best practices / SEO ≥ 95, CLS < 0.1.
- Accessibility: axe (WCAG 2.x A/AA) on the page, the 404 and an open lightbox, in EN and ID.
- Playwright on Chromium, Firefox and WebKit at 1440 × 900 and 390 × 844, plus the 3D hero on
  Chromium.
- Bundle budgets: initial JS ≤ 250 KB gzipped; the lazy 3D chunk and its assets ≤ 1.2 MB.
- Security headers on every response: Content-Security-Policy, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy, X-Frame-Options (`lib/security-headers.ts`). No analytics,
  no third-party requests.

## Development

Requires Node 24 (`engines.node` `24.x`, enforced by `engine-strict` in `.npmrc`; CI and Vercel use
the same major) and pnpm (version pinned in `package.json` → `packageManager`).

```
pnpm install
pnpm dev            # local dev server
pnpm build          # production build — must pass with zero type errors
pnpm lint           # eslint + prettier check
pnpm test           # production build + every Playwright project
pnpm analyze        # Turbopack bundle analyzer
pnpm lhci           # Lighthouse CI against the local production build
```

Playwright runs as two invocations, as CI does, so the SwiftShader 3D project never shares the
machine with Firefox and WebKit (`pnpm exec playwright install firefox webkit` once):

```
pnpm exec playwright test --project=desktop --project=mobile --project=desktop-3d
pnpm exec playwright test --project=desktop-firefox --project=desktop-webkit --project=mobile-webkit
```

Copy lives in `content/en.ts` and `content/id.ts`; projects and their status in `content/projects.ts`;
contact details and flags in `content/site.ts`. Components never hard-code text.

## Credits

Third-party code, fonts and icons, with their licences: `THIRD_PARTY_NOTICES.md`.
