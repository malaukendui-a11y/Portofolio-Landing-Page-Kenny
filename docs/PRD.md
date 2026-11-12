---
title: "PRD — Ananda Kenny Portfolio (3D Hybrid Landing Page)"
subtitle: "Product Requirements Document · v1.0"
author: "Owner: Ananda Kenny Esqiel Bisaratua · Drafted with Claude"
date: "25 October 2026"
---

# 1. Document control

| Field | Value |
|---|---|
| Product | Ananda Kenny — personal portfolio landing page (rebuild) |
| Version | 1.0 (foundation for build) |
| Status | Approved for M0 — pending content inputs listed in §12 |
| Owner | Ananda Kenny Esqiel Bisaratua (product owner, QA, content) |
| Build agent | Claude Code (reads `CLAUDE.md`, `docs/PRD.md`, `docs/DESIGN.md`) |
| Repository | New repository on `github.com/malaukendui-a11y` (name TBD, e.g. `ananda-kenny-portfolio`) |
| Hosting | Vercel (production + preview deployments) |
| Companion docs | `docs/DESIGN.md` (design preference & tokens), `CLAUDE.md` (agent rules) |

**Why this document exists.** Claude Code works best with explicit, testable requirements. Everything the agent needs to decide *what* to build is here; *how it should look and move* is in `DESIGN.md`; *how to work in the repo* is in `CLAUDE.md`. If the three ever disagree, this PRD wins on scope, `DESIGN.md` wins on visuals, `CLAUDE.md` wins on engineering practice.

# 2. Summary

A single-page, desktop-first, bilingual (EN default / ID) portfolio for Ananda Kenny, positioned as a **Software Engineer with a QA foundation**, aimed at (a) recruiters for QA / IT roles and (b) freelance web-development clients in Indonesia and abroad.

The page adopts the structure and rhythm of the *Alexfolio* reference (hero with a giant name ticker and a layered portrait, dark sections with `//` labels, stacked service and project cards, mirrored "Reach Out" footer) and adds a **lightweight 3D glass element** in the hero. It is a *hybrid* 3D page: one lazy-loaded WebGL element plus GSAP motion design — not a full 3D world.

The rebuild starts from zero in a new repository. Content is largely carried over from the previous portfolio (contact, education, Bank Mandiri QA experience, three certifications) and extended with a project section that honestly shows **status** (Live / In QA / In Development / In Design / Planned), because at the time of writing none of the four showcased projects is live yet.

# 3. Goals, non-goals and success metrics

## 3.1 Goals

1. **Convert a 30–60 second recruiter scan into contact.** A recruiter must be able to reach CV, contact and project proof within two interactions from any point on the page.
2. **Prove engineering quality through the page itself.** Because the showcased projects are not live yet, the portfolio *is* the primary live demo. It must be fast, accessible and polished on real hardware.
3. **Look distinctive, not templated.** Adopt the reference's structure, but differentiate through accent colour, the 3D element, typography decisions and content (see `DESIGN.md` §2).
4. **Serve both audiences without a split page.** Recruiters get proof and contact; freelance clients get services and contact. Same page, different CTAs.

## 3.2 Non-goals (explicitly out of scope for v1)

- Blog, CMS, admin panel, authentication.
- Analytics or tracking of any kind (owner's decision). No cookies beyond the language preference in `localStorage`.
- Contact form (contact is via email and WhatsApp links only).
- Pricing for freelance services.
- Per-project case-study pages. Projects are shown as cards with screenshots and outbound links.
- Full 3D scenes, 3D navigation, or 3D on mobile.

## 3.3 Success metrics (acceptance for launch)

| Metric | Target | How verified |
|---|---|---|
| Lighthouse Performance (desktop, production URL) | ≥ 90 | Lighthouse CI on Vercel preview, throttled |
| Lighthouse Performance (mobile) | ≥ 80 with 3D disabled by the mobile fallback | Same |
| Lighthouse Accessibility / Best Practices / SEO | ≥ 95 each | Same |
| Largest Contentful Paint (desktop) | < 2.5 s | Lighthouse + WebPageTest |
| Cumulative Layout Shift | < 0.1 (loader and 3D canvas must reserve space) | Lighthouse |
| Initial JS (excluding the lazy 3D chunk) | ≤ 250 KB gzipped | `next build` output / bundle analyzer |
| Lazy 3D chunk + its assets (three, R3F, drei, env map, font) | ≤ 1.2 MB over the wire, loaded only on desktop after first paint | Network panel |
| Time to interactive contact CTA | Visible without scrolling on desktop and mobile | Manual |
| Cross-browser | Last 2 versions of Chrome, Edge, Firefox, Safari (macOS + iOS); Samsung Internet | Manual + Playwright |
| Reduced motion | `prefers-reduced-motion: reduce` disables marquee auto-scroll, parallax, 3D animation | Manual |

# 4. Audience and jobs-to-be-done

| Persona | Context | What they need in the first minute | Primary CTA |
|---|---|---|---|
| **Recruiter / HR (QA, IT support, trainee)** | Opens the link from a CV or LinkedIn, usually on a laptop, sometimes inside the LinkedIn/WhatsApp in-app browser on a phone | Who is this, what role, proof of QA skill, a CV, a way to contact | Download CV · Email · WhatsApp |
| **Freelance client (ID / overseas)** | Found via referral or search; cares about reliability and communication | What services, evidence of shipped web work, how to reach | WhatsApp · Email |
| **Engineer / hiring manager** | Will click through to GitHub | Clean repos with real READMEs, sensible stack | GitHub links |

# 5. Information architecture

Single route `/` with anchored sections. Language toggle switches all copy in place (no route change). Order and purpose:

| # | Section (anchor) | Purpose | Key content |
|---|---|---|---|
| 0 | Loader | Brand moment, hides font/3D loading; max 1.5 s, skippable, never shown twice per session | Percentage counter, brand mark |
| 1 | Navigation (sticky) | Orientation + two persistent CTAs | Brand "© Ananda Kenny", links (Work, About, Contact), EN/ID toggle, "Download CV" |
| 2 | Hero (`#top`) | Identity in one screen | Giant name ticker, portrait cutout (photo 1, original colour), roles ("Software Engineer", "QA & Web Developer"), social links, 3D glass element, availability badge |
| 3 | Intro (`#about`) | One-paragraph positioning + proof pointers | Big statement with accented keywords, short bio, CTAs "See my work", "Download CV" |
| 4 | What I Do (`#services`) | Services for clients, competencies for recruiters | 3 stacked cards: 01 Quality Assurance & Testing, 02 Web Development, 03 Product & Project Management — each with 4–6 numbered items |
| 5 | Projects (`#work`) | Proof of work with honest status | 4 project cards + 1 research card (see §6) |
| 6 | QA Evidence (`#qa`) | Differentiator for QA roles | Bank Mandiri experience summary + evidence from Kenny's own product PintuKos (a CI run, an E2E report and a UAT sheet; M4b batch 2), shown as images in a lightbox |
| 7 | Experience & Education (`#experience`) | Timeline | Bank Mandiri (Project Kopra), Universitas Gunadarma |
| 8 | Certifications (`#certifications`) | Credentials | 3 Gunadarma certificates with lightbox |
| 9 | Reach Out (`#contact`) | Mirror of hero; conversion | Giant "Reach Out" ticker, polaroid line (DECISIONS 2026-11-02), email, WhatsApp, Download CV (M4b batch 2), location, availability, social links, back-to-top |
| 10 | Footer | Legal / meta | © year, "Built with Next.js, GSAP & React Three Fiber", language note |

# 6. Project showcase model

## 6.1 Status taxonomy and CTA rules

Every project card carries exactly one status. CTAs are derived from status, link availability and access — never hard-coded:

| Status | Meaning | Primary CTA | Secondary CTA |
|---|---|---|---|
| **Live** | Deployed and public (`liveUrl` set, no `access`) | "Live demo" (external) | "GitHub" if the repo is public |
| **Live** (invite only) | Deployed behind a login for invited users; `liveUrl` set and `access: 'private'` (M4b batch 2: PintuKos) | "Open app · invite only" (external, new tab) | "Preview" (opens screenshot lightbox) if it has images; "GitHub" if the repo is public |
| **Live** (no public URL) | Deployed for a private audience behind a login; `liveUrl` is null (PintuKos until M4b batch 2; no project uses it now) | "Preview" (opens screenshot lightbox) if it has images, otherwise none | "GitHub" if the repo is public |
| **In QA** | Feature-complete, being tested | "Preview" (opens screenshot lightbox) | "GitHub" if public |
| **In Development** | Being built | "Preview" | "GitHub" if public |
| **In Design** | UI/UX stage, no code yet | "Preview designs" | — |
| **Planned** | PRD / design docs only | "Read the plan" (optional PDF) or no CTA | — |

A card without a public repo **must not** show a GitHub button. A card without a live URL **must not** show a "Live demo" button, and an invite-only app is never labelled "Live demo": its link says it needs an invite. Status is data (`content/projects.ts`), so a status flip or a new link is a one-line change and a redeploy.

## 6.2 Project inventory (as of 25 Oct 2026; rows 1, 2 and 4 updated for M4b, rows 1, 2, 3 and 5 for M4b batch 2, 13 Nov 2026 — `content/projects.ts` holds the live data)

| # | Product name | Role | Status | Live URL | GitHub | Notes |
|---|---|---|---|---|---|---|
| 1 | **PintuKos** — finance app for the family's boarding houses & rentals | Product owner, QA & developer (AI-assisted) | **Live** as a private family deployment behind a login (M4b) | `https://app.pintukos.my.id/` — invite only (`access: 'private'`, M4b batch 2) | `malaukendui-a11y/Pengelola-Keuangan-Kos-Kontrakan-Kenny` — **private while in beta** | "Open app · invite only" links the app (§6.1 "Live (invite only)", M4b batch 2); "Preview" opens four design renders with sample data; no GitHub button |
| 2 | **Trading Compass** (formerly Trading Journal X1) — trading discipline journal | Full-stack developer, QA | **In QA** (paused) | TBD | `malaukendui-a11y/Trading-Journal-X1` — public, but not linked | README is still the Vite template boilerplate and the repo has no description: no GitHub button until it is real (M4b); stack React · Vite · Supabase confirmed and no images, both by owner decision (M4b batch 2) |
| 3 | **Malau Pase community & genealogy website** (Tarombo) | Project Manager | **In Design** (UI/UX stage) | — | `malaukendui-a11y/malau-website` — **currently private (404)** | No images by owner decision (M4b batch 2), so no CTA; no GitHub button until public |
| 4 | **Kos & Kontrakan Kenny — landing page** | Product & business strategy | **In Development** (PRD and design done; Vite, React, TypeScript, Tailwind CSS) (M4b) | — | — | No CTA until it has images or a URL |
| 5 | **Research:** Big Data Analysis to Detect Cryptocurrency Price Movement Patterns and Trends (Altcoin market) | Author (bachelor thesis) | **Completed** | PDF (1.76 MB) | — | The only finished artifact; keep as a fifth card labelled *Research*; card year 2026 (completed January 2026, M4b batch 2; the PDF keeps its `-2025` file name) |

Each card shows: status badge, year, title, a short description (one or two sentences; the card must fit below its sticky top, DESIGN §4.5), role, 3–6 stack tags, 2–4 screenshots (WebP, lazy, lightbox), CTAs per §6.1.

# 7. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| F-01 | Single page, anchored sections, smooth scrolling (Lenis) with native fallback when reduced motion is on | Must |
| F-02 | Bilingual copy: English default, Indonesian via toggle; choice persisted in `localStorage`; `<html lang>` updated; all copy lives in `content/en.ts` and `content/id.ts` — no hard-coded strings in components | Must |
| F-03 | Hero name ticker (infinite marquee) rendered in WebGL (drei `Text`) when the 3D element is active, with an HTML ticker fallback otherwise; a visually-hidden `<h1>` always exists for SEO/a11y | Must |
| F-04 | 3D glass element (see `DESIGN.md` §6): lazy-loaded after first paint, desktop only (≥ 1024 px and pointer: fine), paused when off-screen, replaced by a static pre-rendered PNG/WebP on mobile, on `prefers-reduced-motion`, and when WebGL is unavailable | Must |
| F-05 | Portrait cutout: the hero uses `kenny-hero-formal@2x.webp` (1070 × 1600, WebP with alpha; M4b); Reach Out shows the polaroid line instead of a portrait (DECISIONS 2026-11-02); delivered via `next/image` with explicit dimensions | Must |
| F-06 | Stacked / sticky card scrolling for Services and Projects (GSAP ScrollTrigger); previous card dims and scales as the next arrives; degrades to a plain vertical list under reduced motion | Must |
| F-07 | Project cards built from `content/projects.ts` with the status/CTA rules of §6.1 | Must |
| F-08 | Screenshot and certificate lightbox (keyboard: Esc closes, arrows navigate; focus trapped; scroll locked) | Must |
| F-09 | "Download CV" (PDF in `/public`, versioned filename) in nav, Intro and Reach Out | Must |
| F-10 | Contact actions: `mailto:`, `https://wa.me/6287720052003` with a pre-filled message, copy-to-clipboard with toast | Must |
| F-11 | Availability badge ("Open to work", with the current month) driven by a single config flag | Should |
| F-12 | Loader: ≤ 1.5 s, progress tied to font + hero image load, shown once per session, skippable by click/keypress | Should |
| F-13 | Back-to-top control in Reach Out | Should |
| F-14 | OpenGraph image (1200×630) generated from the hero design; `metadata` per language | Should |
| F-15 | 404 page in the same visual language | Could |

# 8. Non-functional requirements

- **Performance:** budgets in §3.3 are build-time gates (bundle size) and CI gates (Lighthouse CI on every preview). Images: WebP with PNG/JPEG fallback, explicit `width/height`, `priority` only for the hero portrait. Fonts self-hosted via `next/font` (Inter Display, Inter, DM Mono — all OFL).
- **Accessibility:** WCAG 2.2 AA colour contrast (tokens in `DESIGN.md` are pre-checked), full keyboard navigation with visible focus rings, `aria-label`s on icon-only controls, all images with meaningful `alt`, marquee and 3D are decorative (`aria-hidden`), no content conveyed by colour alone.
- **Responsiveness:** designed at 1440, verified at 1920, 1280, 1024, 768 and 390. Desktop-first in design priority; mobile must be complete, not a cut-down afterthought.
- **SEO:** semantic landmarks, one `<h1>`, descriptive `<title>` and meta description per language, canonical URL, sitemap, `robots.txt`, JSON-LD `Person`.
- **Privacy:** no third-party scripts, no analytics, no embedded fonts from Google servers, no cookies.
- **Security:** no secrets in the repo; CSP headers via `next.config`; external links use `rel="noopener noreferrer"`.
- **Maintainability:** content changes (new project, status flip, copy fix) must not require touching components.

# 9. Technical approach

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js (latest stable, App Router) + TypeScript | Image/font optimisation, metadata API, first-class Vercel deploys |
| Styling | Tailwind CSS v4 with design tokens from `DESIGN.md` as CSS variables | Fast iteration for an agent; tokens stay in one place |
| Motion | GSAP 3 (ScrollTrigger, SplitText — all free since 2025) + Lenis | Industry standard for this genre; matches the reference's feel |
| 3D | three.js + React Three Fiber + drei (`MeshTransmissionMaterial`, `Text`, `Float`, `Environment`) | Minimal code for the glass effect; well-documented |
| Content | Typed TS objects (`content/*.ts`), i18n by key | No CMS; agent-friendly; type errors catch missing translations |
| Testing | Playwright (smoke + a11y via axe), Lighthouse CI, manual device QA by the owner | Owner is a QA engineer — the test plan is part of the deliverable |
| Hosting | Vercel, preview per branch, production on `main` | Owner already uses Vercel |

Repository layout (target):

```
/CLAUDE.md
/docs/PRD.md  /docs/DESIGN.md  /docs/QA-PLAN.md  /docs/DECISIONS.md
/app        (layout, page, not-found, opengraph-image)
/components (hero/, sections/, ui/, three/)
/content    (en.ts, id.ts, projects.ts, site.ts)
/public     (cv/, images/projects/, images/qa/, images/portrait/, images/certs/, 3d/)
/tests      (playwright/)
```

# 10. Milestones and acceptance criteria

| Milestone | Scope | Done when |
|---|---|---|
| **M0 — Foundation** | Repo, Next.js + TS + Tailwind, tokens, fonts, content files, Vercel preview, Lighthouse CI, Playwright smoke test | Preview URL renders a static page with real copy in EN and ID; CI green |
| **M1 — Static layout** | All sections laid out per `DESIGN.md` with real content and images, no animation, light hero / dark sections, lightbox, CV download | Owner signs off layout at 1440 and 390; a11y audit passes; Lighthouse ≥ 90 desktop |
| **M2 — Motion** | Lenis, reveals, marquee (HTML), stacked cards, hover states, loader, reduced-motion paths | 60 fps on a mid-range laptop; reduced-motion verified; CLS < 0.1 |
| **M3 — 3D hero** | R3F canvas, glass element, WebGL ticker, fallbacks, lazy loading, DPR clamp | Desktop budget met; mobile gets static fallback; no regression in M1/M2 metrics |
| **M4 — Content & polish** | Final copy in EN/ID, project screenshots, QA artifacts, OG image, 404, SEO | Owner approves copy; links verified; status model works |
| **M5 — QA & launch** | Cross-browser, real devices, regression per `docs/QA-PLAN.md`, performance sign-off, domain | All launch metrics in §3.3 met; production deploy; old portfolio archived with a redirect notice |

Build order is strict: **M1 before M2 before M3**. The 3D element is the last thing added, so a schedule slip never ships an unfinished page.

# 11. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No project is live at launch | Weaker proof for clients | Status model (§6.1); the portfolio itself is the live demo; flip statuses as projects ship; thesis PDF as a finished artifact |
| Two of three repos are private; public repo README is boilerplate | A recruiter who clicks GitHub sees nothing or a template README — worse than no link | Before M4: either make repos public after a secret scan (Supabase keys, `.env`) and write real READMEs, or omit the GitHub button via the status rules |
| QA evidence from Bank Mandiri is confidential | Legal/professional risk | Never publish Kopra artifacts. The evidence comes from Kenny's own product PintuKos: screenshots of a green CI run, a Playwright E2E report (45 passed) and an 85-step UAT sheet, sample data only (M4b batch 2; the source moved from Trading Compass in M4b) |
| 3D element hurts performance on low-end laptops | Metric failure, bad first impression | Lazy load, DPR clamp, `samples` ≤ 6, pause off-screen, static fallback; budgets enforced in CI; M3 is last and can be cut without touching the rest |
| Source photos are AI-processed 900×1600 exports; upscaled ×4 | Slight "painted" texture at Retina 100%; sunlight flecks in hair | Acceptable at display size; re-run the pipeline if a better photo is taken later |
| English copy quality | Overseas clients judge language | Draft in EN first, owner reviews; keep sentences short; ID is a translation of final EN |
| Scope creep (case-study pages, blog) | Delays launch | Non-goals in §3.2; log ideas in `docs/DECISIONS.md` for v2 |
| Template look-alike | Reads as "used a template" | Differentiation rules in `DESIGN.md` §2 are mandatory, not optional |

# 12. Content inputs still needed from the owner

1. **Screenshots**: 2–4 per project (PintuKos, Trading Compass from local/staging; Malau design screens; Kos & Kontrakan concept if any). 1600 px wide minimum, PNG; the build pipeline converts to WebP. — **Partial (M4b, 2026-11-13):** PintuKos has four 1600 × 900 design boards (WebP, design renders with sample data); Trading Compass and Malau stay without images by owner decision (M4b batch 2); Kos & Kontrakan has none yet.
2. **Stack and one-line description** for PintuKos and the Malau website (Trading Compass: React + Vite + Supabase from the repo). — **Partial (M4b):** PintuKos stack and description done, Kos & Kontrakan stack and description too, Trading Compass's React · Vite · Supabase confirmed by the owner (M4b batch 2); the Malau stack is still pending.
3. **Repository decision** for the two private repos (make public + README, or no GitHub button). — **Done (M4b):** no repo is linked. PintuKos stays private while in beta, Malau stays private, and Trading Compass's public repo shows no GitHub button until its README is real.
4. **CV PDF** (English, ATS version) for the "Download CV" button. — **Done (M4b):** `public/cv/kenny-cv-2026-11-en.pdf`.
5. **LinkedIn URL** and preferred display name on LinkedIn. — **Pending** (still open after M4b batch 2; the LinkedIn links stay hidden while `site.linkedin` is null).
6. **Bank Mandiri dates** (month/year start–end) and the exact programme/internship title for the timeline. — **Done (M4b):** work `Aug 2026` / `Agu 2026`, title `QA Tester (Manual Testing) — Project Kopra by Mandiri` / `QA Tester (Pengujian Manual) — Project Kopra by Mandiri` (M4b batch 2, from the owner's CV; was `Quality Assurance — …`, DECISIONS 2026-11-12); education `2021 — Jan 2026`.
7. **QA artifacts** from PintuKos (Trading Compass until M4b): test plan, 5–10 test cases, 2–3 bug reports (sanitised screenshots or PDF). — **Done (M4b batch 2, 2026-11-13), with different evidence:** asked were a test plan, 5–10 test cases and 2–3 bug reports; delivered were three screenshots from the PintuKos repository, sample data only — the green GitHub Actions run, the Playwright report (45 passed) and the 85-step UAT sheet — shown as `ci-run`, `e2e-report` and `uat-sheet` (DESIGN §4.6; owner decision).
8. **Domain**: confirm `anandakenny.com` (or similar) purchase, or launch on `*.vercel.app` first. — **Pending.**

# 13. Decisions log (summary)

| Date | Decision |
|---|---|
| Oct 2026 | Rebuild from zero in a new repo; Claude Code as build agent; PRD + DESIGN first |
| Oct 2026 | Hybrid 3D: one lightweight glass element in the hero + GSAP motion elsewhere |
| Oct 2026 | Desktop-first design priority, fully responsive |
| Oct 2026 | Projects shown as screenshots + outbound links, with an explicit status model |
| Oct 2026 | Reference: Alexfolio (Volt.Supply / Craftwork) — structure adopted, visuals differentiated |
| Oct 2026 | Hero on light surface, dark sections after; accent = terracotta family (brand continuity) |
| Oct 2026 | Photo 1 = hero (original colour, soft-saturation variant available), photo 2 = Reach Out |
| Oct 2026 | 3D direction: glass lens refracting the name ticker (pmndrs lens-refraction / Olivier Larose glass effect as technical references) |
| Oct 2026 | Trading Journal X1 renamed Trading Compass (same product) |

# Appendix A — Content inventory carried over from the previous site

- **Name:** Ananda Kenny Esqiel Bisaratua · brand: *Ananda Kenny*
- **Positioning:** Software Engineer · QA & Web Developer · Bachelor of Information Systems
- **Location:** East Jakarta, Indonesia · open to on-site, hybrid or remote
- **Contact:** malaukendui@gmail.com · WhatsApp +62 877-2005-2003 (`wa.me/6287720052003`) · GitHub `malaukendui-a11y` · LinkedIn (TBD)
- **Education:** Universitas Gunadarma, Faculty of Computer Science & Information Technology — Bachelor of Information Systems (S.Kom), Depok. Highlights: software QA & testing standards; big-data mining, machine learning & systems analysis; full-stack web development & database architecture.
- **Experience:** PT Bank Mandiri (Persero) Tbk — Quality Assurance, Project Kopra by Mandiri (wholesale digital super-platform): manual and UAT testing with regression cycles; test scenario/test case design and execution reporting in Atlassian Jira; defect lifecycle tracking (severity, re-test, sign-off) in Jira. Dates: TBD.
- **Certifications (Universitas Gunadarma):** Designing Software (May–Jun 2025); JavaScript Programming Language Fundamentals (Nov 2023); Fundamental Desktop Programming — Java & Oracle PL/SQL (Feb 2024).
- **Research:** *Big Data Analysis to Detect Cryptocurrency Price Movement Patterns and Trends (A Case Study of the Altcoin Market)* — bachelor thesis, PDF.
- **Assets available:** portrait cutouts (hero crop + footer, colour / colour-soft / grayscale, @2x WebP + PNG masters), certificate photos ×3, campus photos ×3, work photos ×4, K monogram SVG.
