# CLAUDE.md — Ananda Kenny Portfolio

This file is read by Claude Code at the start of every session. It defines how to work in this repository. Product scope lives in `docs/PRD.md`; visual and motion rules live in `docs/DESIGN.md`. Read both before writing code. If they conflict: PRD wins on scope, DESIGN wins on visuals, this file wins on engineering practice.

## 1. What this project is

A single-page, desktop-first, bilingual (EN default / ID) portfolio for Ananda Kenny — Software Engineer with a QA foundation. Hybrid 3D: one lazy-loaded glass element in the hero (React Three Fiber) plus GSAP motion design. Deployed on Vercel. No CMS, no analytics, no contact form.

## 2. Stack (pin exact versions in `package.json`; do not add libraries without a note in `docs/DECISIONS.md`)

- Next.js (latest stable, App Router) · TypeScript strict · Tailwind CSS v4 (tokens as CSS variables, see DESIGN §3)
- GSAP 3 with ScrollTrigger + SplitText (free licence) · Lenis for smooth scroll
- three + @react-three/fiber + @react-three/drei (MeshTransmissionMaterial, Text, Float, Environment)
- Playwright (+ axe) for tests · Lighthouse CI · pnpm

## 3. Commands

```
pnpm dev            # local dev
pnpm build          # production build — must pass with zero type errors
pnpm lint           # eslint + prettier check
pnpm test           # playwright smoke + a11y
pnpm analyze        # bundle analyzer (ANALYZE=true next build)
pnpm lhci           # lighthouse ci against the local production build
```

## 4. Repository layout

```
app/                layout.tsx, page.tsx, not-found.tsx, opengraph-image.tsx, globals.css
components/hero/    Hero, Ticker (HTML), Portrait, AvailabilityBadge
components/three/   HeroCanvas (dynamic, ssr:false), GlassLens, WebGLTicker
components/sections/ Intro, Services, Projects, QAEvidence, Experience, Certifications, ReachOut, Footer
components/ui/      Button, Badge, Lightbox, Toast, LangToggle, Nav, SectionLabel
content/            site.ts (contacts, flags), en.ts, id.ts, projects.ts
lib/                i18n.ts, motion.ts (gsap helpers), useReducedMotion.ts, useCapabilities.ts
public/             images/, fonts/, cv/, 3d/
docs/               PRD.md, DESIGN.md, QA-PLAN.md, DECISIONS.md
tests/              playwright/
```

## 5. Non-negotiable rules

1. **Content is data.** Every visible string comes from `content/en.ts` / `content/id.ts` (same TypeScript shape, so a missing key is a type error). Projects come from `content/projects.ts`. Never hard-code copy in components.
2. **Status drives CTAs.** A project card shows "Live demo" only if `liveUrl` is set, and "GitHub" only if `repoUrl` is set *and* `repoPublic === true`. See PRD §6.1.
3. **Performance budgets are gates, not goals.** Initial JS ≤ 250 KB gz (3D chunk excluded); 3D chunk + assets ≤ 1.2 MB; Lighthouse desktop ≥ 90, mobile ≥ 80, A11y/BP/SEO ≥ 95. If a change breaks a budget, fix it before moving on; do not raise the budget.
4. **3D is last and optional.** Build order M0 → M1 (static) → M2 (motion) → M3 (3D) → M4 (content) → M5 (QA). Never start M3 before M1 and M2 are signed off. The site must be complete without the 3D element.
5. **Reduced motion is a first-class path.** Every animation has a reduced-motion branch (instant reveal, static ticker, plain lists, static glass image). Test it.
6. **Tokens only.** No raw hex, px font sizes or ad-hoc easings in components; use the tokens defined in `globals.css` from DESIGN §3.
7. **Do not clone the reference.** The Alexfolio template is a structural reference only. The differentiation table in DESIGN §2.3 is mandatory. Never use its images, copy, orange accent, photo-background hero or torus shape.
8. **Accessibility is part of done.** Keyboard navigation, focus rings, `aria-hidden` on decorative layers, alt text on every image, axe test green.
9. **Images through `next/image`** with explicit dimensions; WebP first; `priority` only on the hero portrait. Reserve space for the loader and the 3D canvas (CLS < 0.1).
10. **No secrets, no third parties.** No analytics, no external fonts, no tracking. External links use `rel="noopener noreferrer"`.

## 6. How to work

- Start every task by restating which milestone and which PRD/DESIGN sections it touches.
- Make small, reviewable commits (`feat(hero): …`, `fix(a11y): …`). Each commit must build and pass `pnpm lint && pnpm test`.
- When a requirement is ambiguous, choose the option that is simpler and faster to load, implement it, and record the choice in `docs/DECISIONS.md` (date, decision, alternative, reason). Do not stop to ask unless the choice is irreversible.
- Before claiming a milestone is done: run `pnpm build`, `pnpm test`, `pnpm lhci`; paste the numbers in the PR/summary; list what was *not* verified.
- Keep `docs/QA-PLAN.md` current: every feature adds a test case (ID, steps, expected, device/browser). The owner executes manual/UAT passes from it.
- Prefer a Vercel preview URL for every milestone so the owner can review on real devices.

## 7. Definition of done (per milestone)

- Builds with zero type and lint errors; tests green; budgets met and reported.
- EN and ID both complete for everything shipped in the milestone.
- Verified at 1440 and 390 at minimum; reduced-motion verified.
- Owner review on the preview URL; feedback addressed or logged in `docs/DECISIONS.md`.
