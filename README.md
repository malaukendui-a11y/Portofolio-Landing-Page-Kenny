# Portofolio-Landing-Page-Kenny

Portofolio Profesional For Work (Ananda Kenny)

Single-page, bilingual (EN / ID) portfolio built with Next.js 16, TypeScript and Tailwind CSS v4.
Scope lives in `docs/PRD.md`, visuals in `docs/DESIGN.md`, engineering rules in `CLAUDE.md`.

## Development

Requires Node ≥ 22 and pnpm (version pinned in `package.json` → `packageManager`).

```
pnpm install
pnpm dev            # local dev server
pnpm build          # production build — must pass with zero type errors
pnpm lint           # eslint + prettier check
pnpm test           # production build + Playwright smoke & axe tests
pnpm analyze        # Turbopack bundle analyzer
pnpm lhci           # Lighthouse CI against the local production build
```

Copy lives in `content/en.ts` and `content/id.ts`; projects and their status in `content/projects.ts`;
contact details and flags in `content/site.ts`. Components never hard-code text.
