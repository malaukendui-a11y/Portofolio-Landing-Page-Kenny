# DECISIONS

Append one entry per decision: date · decision · alternative considered · reason.

| Date | Decision | Alternative | Reason |
|---|---|---|---|
| 2026-10-25 | Foundation docs approved (PRD v1.0, DESIGN v1.0) | — | Start of build |
| 2026-10-27 | `save-exact=true` in `.npmrc`; every dependency pinned | caret ranges | CLAUDE.md §2 requires exact versions |
| 2026-10-27 | `pnpm analyze` = native `next analyze` (Turbopack bundle analyzer, Next ≥ 16.1) | `@next/bundle-analyzer` + `cross-env ANALYZE=true` | the plugin is webpack-only; Next 16 builds with Turbopack |
| 2026-10-27 | Fonts: Inter 4.1 static `InterDisplay`/`Inter` woff2 from the rsms release zip, DM Mono woff2 from the `@fontsource/dm-mono` package; all subset to Latin with fonttools (~28 KB each) | Inter variable font; Google Fonts | DESIGN Appendix asks for static subset files; no third-party font requests (CLAUDE.md rule 10) |
| 2026-10-27 | i18n is an external store (`useSyncExternalStore` + `localStorage`, key `lang`) read by client components via `useLang()`; server render is always EN, `<html lang>` synced by `LangHtmlSync` | React context provider; route per language (`/id`) | PRD F-02 forbids a route change; the store needs no provider and avoids setState-in-effect |
| 2026-10-27 | Project copy (title/description/role) lives in `en.ts`/`id.ts` under `projects.items` keyed by `ProjectId`; `projects.ts` holds language-neutral data and the `ctasFor()` rule | nested translations inside `projects.ts` | a missing translation is a type error; CTA rules exist in exactly one place |
| 2026-10-27 | "Download CV" and LinkedIn links render only when `site.cvUrl` / `site.linkedin` are set | placeholder links | no dead links on the preview while PRD §12 inputs are pending |
| 2026-10-27 | Bank Mandiri and Gunadarma periods are empty strings (hidden) until the owner confirms them | "TBD" placeholder text | no placeholder copy on a public preview |
| 2026-10-27 | Thesis year set to 2025 and tagged with topic tags (not tools); PintuKos / Malau / Kos landing stacks left empty until provided | invented values | honesty rule (PRD §11); owner confirms via §12 |
| 2026-10-27 | "Reach Out —" ticker text kept in English in both languages | translate to "Hubungi Saya —" | it mirrors the untranslated name ticker; owner can override in `content/id.ts` |
| 2026-10-27 | CI = GitHub Actions (`lint`, `build`, Playwright, LHCI) in addition to the Vercel preview | Vercel only | PRD §10 "CI green" needs the budget gates to run on every PR |
| 2026-10-27 | Lighthouse CI uploads to `filesystem` (`.lighthouseci/`, git-ignored) | `temporary-public-storage` | no third parties (CLAUDE.md rule 10) |
| 2026-10-27 | Prettier ignores `*.md` so the PRD/DESIGN docs keep their original formatting | format everything | the first `pnpm format` rewrote the docs' emphasis markers |
| 2026-10-27 | Default-language metadata only (EN title/description); per-language metadata deferred | per-language metadata now | PRD F-14 schedules it for M4 |
| 2026-10-27 | Accent pill buttons use `accent-600` as the fill (`text-on-dark` on it = 5.8:1), hover `accent-500` | `accent-500` fill as DESIGN §3.1/§5 suggest | `text-on-dark` on `accent-500` is 4.2:1 — DESIGN rates it "AA large" only; a 16 px button label needs 4.5:1 and axe flags it (TC-002). DESIGN §3.1/§5 should be updated to match |
| 2026-10-27 | Next.js pinned to 16.4.3 (latest stable at scaffold time), React 19.3.0, Tailwind 4.3.3; upgrades are deliberate commits | floating ranges | CLAUDE.md §2 "pin exact versions"; Next 16 differs from earlier majors (Turbopack default, Cache Components), so a silent bump could break the build |
| 2026-10-27 | pnpm 12.15.0 installed per-user with `npm i -g --allow-scripts=pnpm pnpm` (pinned in `packageManager`) | `corepack enable` | corepack needed admin rights to write its shims into `C:\Program Files\nodejs` on the owner's machine |
| 2026-10-27 | `AGENTS.md` is a short pointer to `CLAUDE.md`; `agentRules: false` in `next.config.ts` | keep the Next-generated AGENTS.md block alongside CLAUDE.md | one source of rules; Next 16 rewrites the managed block on every `next dev` unless disabled |
