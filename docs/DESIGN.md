---
title: "DESIGN — Ananda Kenny Portfolio"
subtitle: "Design Preference, Tokens & Motion Specification · v1.0"
author: "Owner: Ananda Kenny Esqiel Bisaratua · Drafted with Claude"
date: "25 October 2026"
---

# 1. Design intent

**One sentence:** an editorial, monochrome portfolio with one warm accent, a giant typographic hero where the owner's portrait sits *inside* his own name, and a single piece of glass that bends the letters.

**Three words:** confident · precise · warm.

**Who it must impress:** a recruiter scanning for 45 seconds on a laptop, and a freelance client judging whether this person ships polished work. Every visual decision below serves legibility first, then atmosphere.

# 2. Reference and differentiation rules

## 2.1 Reference

*Alexfolio* — Framer template by Volt.Supply, distributed via Craftwork (live preview: `td-alexfolio.framer.website`). Measured from the live site on 25 Oct 2026, desktop 1440:

- Hero: light photographic background, white name ticker (Inter Display 228 px / weight 500 / tracking −4 % / line-height 0.8), the subject cut out and layered *over* the text; roles bottom-right (32 px / 600); socials bottom-left.
- Sections: near-black surface `#121111`, white text, secondary grey `#A7A0A0`, accent `#F05038` used only for `//` labels, highlighted words and counters.
- Type: Inter Display (headings), Inter (body), DM Mono (years, markers). Scale: 18 / 32 / 54 / 228.
- Components: stacked service cards with a huge outlined numeral; project cards = image left, meta panel right (mono year, title, description, tag list); testimonial counter `01/03`; mirrored "Reach Out" hero as footer.
- Motion: infinite marquee, sticky stacked cards (previous dims/scales), scroll reveals, row hover.

## 2.2 What we adopt (structure)

Section order and rhythm; hero concept (ticker + layered portrait); `//` label system; mono year tags; project card anatomy; stacked cards; mirrored footer hero; generous radii and pill buttons.

## 2.3 What we must change (mandatory differentiation)

| Reference | Ours | Why |
|---|---|---|
| Accent orange-red `#F05038` | **Terracotta family** (`accent-400/500/600` below) | Brand continuity with Kenny's existing identity; avoids template recognition |
| White ticker on a photo background | **Near-black ticker on warm paper** (`paper-100`), no photo background | Kenny's portrait is colour on a plain surface; black shirt needs a light ground |
| Flat 2-layer depth (photo / text / cutout) | **Three layers + one 3D glass element** that refracts the ticker | The hybrid-3D signature of this build |
| Testimonials section | **QA Evidence** section | Honest content; QA is the differentiator |
| Services for a designer | **What I Do**: QA & Testing / Web Development / Product & Project Management | Kenny's actual offer |
| Single display face | Inter Display for the ticker, but **DM Mono carries more weight** (section labels, status badges, counters, nav meta) | A recognisably different typographic voice at small sizes |
| Generic "Get in touch" | **Reach Out with two routes**: recruiter (CV + email) and client (WhatsApp) | Dual audience |

Never copy the reference's images, copy, code or exact spacing values. Measurements above are for calibration, not reproduction.

# 3. Design tokens

All tokens live in `app/globals.css` as CSS custom properties and are mirrored in Tailwind v4 `@theme`. Components use tokens only — no raw hex in components.

## 3.1 Colour

| Token | Hex | Use | Contrast check |
|---|---|---|---|
| `ink-900` | `#121111` | Dark section surface | — |
| `ink-800` | `#1A1918` | Cards on dark | — |
| `ink-700` | `#2A2827` | Dividers on dark, hover rows | — |
| `paper-100` | `#E6E3DE` | Hero & Reach Out surface (warm paper) | — |
| `paper-50` | `#F2F0EC` | Cards on paper, lightbox chrome | — |
| `text-on-dark` | `#F5F3F0` | Primary text on `ink-*` | 17:1 on ink-900 |
| `muted-on-dark` | `#A7A09E` | Secondary text on dark | 7.3:1 on ink-900 |
| `text-on-paper` | `#121111` | Primary text on paper | 15:1 on paper-100 |
| `muted-on-paper` | `#5E5856` | Secondary text on paper | 5.6:1 on paper-100 |
| `accent-400` | `#D9634B` | Accent text/icons **on dark** | 5.2:1 on ink-900 (AA) |
| `accent-500` | `#C2503B` | Buttons, badges, large accent type (≥ 24 px) | 4.0:1 on ink-900 (AA large) |
| `accent-600` | `#A04035` | Accent text **on paper**, pressed states | 5.1:1 on paper-100 (AA) |
| `accent-glow` | `rgba(217, 99, 75, 0.18)` | Soft radial glow behind the glass element | — |
| `success` | `#4F9D69` | "Open to work" dot only | — |

Rule: accent appears on at most **three** elements per viewport. If a screen has more, remove some.

## 3.2 Typography

Fonts (self-hosted, OFL): **Inter Display** (display & headings), **Inter** (body/UI), **DM Mono** (labels, meta, badges, counters).

| Style | Font / weight | Desktop (1440) | Mobile (390) | Tracking / leading |
|---|---|---|---|---|
| `display-ticker` | Inter Display 500 | `clamp(96px, 15.8vw, 228px)` | 96 px | −0.04em / 0.8 |
| `statement` | Inter Display 600 | 54 px | 32 px | −0.03em / 1.05 |
| `h2` | Inter Display 600 | 32 px | 26 px | −0.033em / 1.25 |
| `h3` | Inter Display 600 | 22 px | 20 px | −0.02em / 1.3 |
| `body-lg` | Inter 400 | 18 px | 17 px | 0 / 1.6 |
| `body` | Inter 400 | 16 px | 16 px | 0 / 1.6 |
| `label` | DM Mono 500 | 13 px, uppercase | 12 px | +0.08em / 1.2 |
| `meta` | DM Mono 400 | 14 px | 13 px | 0 / 1.4 |
| `outline-numeral` | Inter Display 600, 1.5 px stroke, no fill | 240 px | hidden | −0.05em |

Section label pattern: `//  LABEL` in `label` style, accent colour. Highlighted words inside a `statement` use `accent-400` (dark) or `accent-600` (paper), never bold.

## 3.3 Spacing, radii, layout

- Base unit 8 px. Section padding: 160 px top/bottom desktop, 96 px tablet, 72 px mobile.
- Page gutter: 40 px desktop, 24 px tablet, 20 px mobile. Max content width: none (full-bleed), inner text measure ≤ 68ch.
- Grid: 12 columns, 24 px gap at 1440.
- Radii: cards 24 px, images inside cards 16 px, badges 999 px (pill), buttons 999 px, lightbox 12 px.
- Borders on dark: 1 px `ink-700`. No drop shadows except the lightbox (0 24px 64px rgba(0,0,0,.5)).

## 3.4 Motion tokens

| Token | Value | Use |
|---|---|---|
| `ease-out` | `power3.out` | Reveals, hovers |
| `ease-expo` | `expo.out` | Hero entrance, card stacking |
| `dur-fast` | 0.25 s | Hover, toggle |
| `dur-base` | 0.6 s | Reveal of a block |
| `dur-slow` | 1.0 s | Hero entrance, loader exit |
| `stagger` | 0.06 s | Lines / list items |
| `marquee-speed` | 1 full loop / 40 s desktop, 28 s mobile | Ticker |

Reduced motion (`prefers-reduced-motion: reduce`): reveals become instant (opacity only, 0.2 s), marquee is static (name shown once), stacked cards become a plain list, glass element becomes a static image, Lenis disabled.

# 4. Section specifications (desktop 1440 → notes for mobile)

## 4.1 Navigation

Sticky, transparent over the hero, gains `ink-900/80` backdrop blur after 80 px of scroll. Left: `© Ananda Kenny` (body, 18 px). Centre: Work · About · Contact. Right: `EN / ID` toggle (mono) and a pill button **Download CV** (`accent-500` on dark, `ink-900` on paper). Mobile: brand + hamburger; the menu is a full-screen `ink-900` overlay with the same links and the CV button.

## 4.2 Hero (paper surface)

Layer order, back to front:

1. `paper-100` surface with a soft radial white glow centred behind the portrait (≈ 60 % opacity at centre, 0 at 520 px) and a faint `accent-glow` behind the glass element.
2. **WebGL canvas** (desktop only): name ticker as drei `Text` in Inter Display, colour `ink-900`, size matching `display-ticker`, scrolling right-to-left; the **glass element** floating over the left third, refracting the letters as they pass. (HTML ticker fallback when the canvas is not active.)
3. **Portrait cutout** `kenny-hero-crop-color@2x.webp`, height ≈ 86 % of viewport, horizontally centred at 56 % of the width, anchored to the bottom edge; the soft alpha fade at its bottom edge is part of the asset.
4. UI: bottom-left social list (LinkedIn, GitHub, WhatsApp — `body`, with an `—` dash prefix); bottom-right two roles (`h2` size 32 px / 600, right-aligned: *Software Engineer* / *QA & Web Developer*); top-right under nav: availability pill `● Open to work · Oct 2026` (mono, success dot).
5. Bottom-left corner: `//  INTRO` label as the scroll cue, matching the reference's transition into the next section.

Mobile: ticker at 96 px as HTML marquee, portrait height ≈ 55 % of viewport, roles stacked under the portrait, social list collapses into icons. No WebGL.

## 4.3 Intro (dark)

Label `//  INTRO`. Statement (54 px) with 2–3 accented phrases, e.g. *"I'm a software engineer with a **QA mindset** — I build web products and **test them like a user would**."* Followed by a 2-line paragraph (`body-lg`, `muted-on-dark`, max 60ch) and two pill buttons: **See my work** (filled accent) and **Download CV** (outlined). Statement reveals line-by-line (SplitText, `stagger`).

## 4.4 What I Do (dark, stacked cards)

Three cards, each `100vh` tall, sticky at `top: 0`, stacking: as card *n+1* scrolls up, card *n* scales to 0.96 and fades to 55 %. Card anatomy: huge outlined numeral `01` left (240 px, stroke only), title `h2` 54 px, description `body-lg muted`, then a numbered list of 4–6 items with hairline dividers and right-aligned mono indices `01…06`. Row hover: text shifts 8 px right, index turns accent.

Content: **01 Quality Assurance & Testing** (manual & UAT, test case design, regression, bug reporting in Jira, exploratory, API testing basics) · **02 Web Development** (landing pages, company profiles, dashboards, Next.js/React, Supabase, deployment on Vercel) · **03 Product & Project Management** (PRD & design docs, backlog & milestones, stakeholder coordination, QA planning).

Mobile: cards stack normally (no sticky), numeral hidden, list unchanged.

## 4.5 Projects (dark, stacked cards)

Label `//  SELECTED WORK`. One card per project (§6 of the PRD), sticky-stacked like Services with a 24 px offset per card. Card anatomy (grid 7/5): left — screenshot carousel (2–4 images, 16 px radius, click opens lightbox); right — `(2026)` mono year, **status badge** (mono pill: `LIVE` accent, `IN QA` paper outline, `IN DEVELOPMENT` / `IN DESIGN` / `PLANNED` muted), title `h2` 32 px, one-sentence description, role line (mono), tag list with hairline dividers, CTA row per the PRD rules.

Research card uses the same anatomy with a PDF icon and "Read the paper (PDF)".

## 4.6 QA Evidence (paper)

A deliberate surface switch to paper to signal "documents". Label `//  QA EVIDENCE`. Left column: a short statement about the Bank Mandiri experience (no confidential detail). Right column: a 3-up grid of document previews — Test Plan, Test Cases, Bug Report — from Trading Compass, each opening the lightbox. Captions in mono.

## 4.7 Experience & Education (dark)

Two-column timeline with a hairline spine; each entry: mono date range, `h3` title, body description. Entries: Bank Mandiri (QA — Project Kopra), Universitas Gunadarma (B.IS). Campus photos optional as a small 3-up strip under Education.

## 4.8 Certifications (dark)

Three cards in a row (stack on mobile): certificate image (lightbox), issuer badge, period (mono), title, 1-line scope.

## 4.9 Reach Out (paper — mirror of the hero)

Giant ticker **"Reach Out —"** in `ink-900`, portrait cutout `kenny-footer-color@2x.webp` (looking down and away, which reads as "waiting for your message"), left block: **Email** `malaukendui@gmail.com` (copy button), **WhatsApp** `+62 877-2005-2003` (opens `wa.me` with a prefilled line), **Location** East Jakarta · on-site / hybrid / remote. Right block: social links and a circular back-to-top button. Two CTA pills: **Email me** (recruiters) and **Chat on WhatsApp** (clients).

## 4.10 Footer (dark, compact)

`© 2026 Ananda Kenny` · *Built with Next.js, GSAP & React Three Fiber* · language note · nav links repeated in mono.

# 5. Components

- **Pill button**: 48 px height, 24 px horizontal padding, `body` 16 px/500; filled (accent-500 on dark / ink-900 on paper) and outlined (1 px current colour). Hover: background inverts over `dur-fast`; arrow icon slides 4 px.
- **Status badge**: DM Mono 12 px uppercase, 1 px border, 999 px radius, 6×12 px padding.
- **Tag**: mono 13 px, hairline divider rows (not chips) to match the reference's list rhythm.
- **Lightbox**: full-screen `ink-900/95`, image max 90vw × 85vh, caption bottom-left in mono, close top-right, arrows on sides; focus trapped; Esc closes.
- **Toast**: bottom-centre, `paper-50` on dark, 2.5 s.
- **Language toggle**: `EN / ID` in mono; active language `text`, inactive `muted`; animates underline.

# 6. 3D glass element — specification

**Concept:** a single glass form floating in the hero's left third, in front of the WebGL name ticker and behind the portrait cutout. As the letters scroll beneath it they bend and smear with slight chromatic fringing. It drifts slowly, tilts toward the cursor, and rotates a few degrees with scroll. It is calm, not showy.

**Form:** a *lens* — a flattened sphere (`sphereGeometry` scaled 1 : 1 : 0.45) or a rounded superellipsoid. **Not a torus** (that is the reference demo's exact shape).

**Material:** drei `MeshTransmissionMaterial` with starting values: `transmission 1`, `thickness 0.45`, `roughness 0.08`, `ior 1.32`, `chromaticAberration 0.035`, `anisotropy 0.1`, `distortion 0.12`, `distortionScale 0.3`, `temporalDistortion 0.1`, `backside true`, `samples 6`, `resolution 512`, `color #ffffff` with a 2 % terracotta tint (`#fff3ef`). Tune with Leva in development only; remove Leva from production.

**Lighting:** drei `Environment` with a small custom HDR (≤ 300 KB, warm studio) or preset `city` as a fallback during development; one soft `directionalLight` from top-left for a highlight on the rim.

**Animation:** drei `Float` (`speed 1.2`, `rotationIntensity 0.4`, `floatIntensity 0.6`); pointer parallax ±0.18 rad eased with `damp`; scroll adds up to +12° rotation on Y and a 40 px drift down over the hero's height.

**Ticker in WebGL:** drei `Text` with the Inter Display woff, same tracking as the HTML version, duplicated for a seamless loop, moved on `useFrame`. A visually-hidden `<h1>` carries the name in the DOM.

**Performance rules:** mount only on desktop (≥ 1024 px, `pointer: fine`, WebGL2 available, no reduced-motion); lazy chunk loaded after first paint via `next/dynamic` with `ssr: false`; `dpr` clamped to `[1, 1.5]`; `frameloop` paused when the hero is < 10 % visible; `powerPreference: "high-performance"`; total 3D chunk + assets ≤ 1.2 MB over the wire. If any of these fail, render the static fallback.

**Static fallback:** a pre-rendered WebP of the glass element over the ticker, exported from the dev scene at 2× (`/public/3d/hero-glass-fallback@2x.webp`), used on mobile, reduced-motion and no-WebGL.

# 7. Imagery rules

- Portraits: colour originals, `color-soft` variant (−30 % saturation) is the approved alternative if the full-colour version clashes with the paper surface in M1 review. Never mix treatments between hero and Reach Out.
- Project screenshots: real UI only, 16:10 crops, no device mockups, no fake data that looks like real users; light drop of 1 px `ink-700` border on dark.
- Certificates: photographed originals, straightened, no filters.
- No stock photos, no illustrations, no icons other than a minimal line set (Lucide) at 1.5 px stroke.

# 8. Responsive behaviour

| Breakpoint | Hero | Cards | Type |
|---|---|---|---|
| ≥ 1440 | WebGL ticker + glass, portrait 86 vh | Sticky stacked | Full scale |
| 1024–1439 | Same, glass slightly smaller | Sticky stacked | `statement` 44 px |
| 768–1023 | HTML ticker, static glass image, portrait 70 vh | Static list, numeral hidden | `statement` 36 px, `h2` 28 px |
| ≤ 767 | HTML ticker 96 px, portrait 55 vh, roles below | Static list | Mobile column |

Touch targets ≥ 44 px. No horizontal scroll at any width (marquee is `overflow: hidden`).

# 9. Accessibility checklist (design-level)

- Contrast per §3.1 tokens; accent never used for body text.
- Focus ring: 2 px `accent-400` outline with 2 px offset on dark, `accent-600` on paper.
- Marquee, glass canvas and decorative numerals are `aria-hidden`.
- Status badges carry text, not only colour.
- Lightbox and mobile menu trap focus and restore it on close.
- All motion respects reduced-motion; no autoplaying video.

# 10. Do / Don't

**Do** keep one accent per viewport region · use mono for anything that is metadata · let whitespace do the work · anchor the portrait to the bottom edge · show status honestly.

**Don't** add gradients to text · use drop shadows on cards · put the accent on body copy · add a second display typeface · ship the Leva panel · show a GitHub button for a private repo · use the reference's torus, orange or photo-background hero.

# Appendix — Asset list

| Asset | File | Notes |
|---|---|---|
| Hero portrait | `public/images/portrait/kenny-hero-crop-color@2x.webp` (+ `.png`) | 1600 px tall; soft fade at bottom |
| Reach Out portrait | `public/images/portrait/kenny-footer-color@2x.webp` (+ `.png`) | 1800 px tall |
| Alternates | `*-color-soft@2x.*`, `*-bw@2x.*` | Keep in repo for quick swaps |
| Fonts | `public/fonts/InterDisplay-{Medium,SemiBold}.woff2`, `Inter-{Regular,Medium}.woff2`, `DMMono-{Regular,Medium}.woff2` | OFL; subset Latin |
| Glass fallback | `public/3d/hero-glass-fallback@2x.webp` | Exported from the dev scene |
| OG image | generated at `app/opengraph-image.tsx` | 1200×630 from hero composition |
| Certificates | `public/images/certs/cert-{1,2,3}.webp` | from `cert-photo-*.jpg` |
| Monogram | `public/brand/k-monogram.svg` | from `kenny-k-logo.svg`, recoloured to tokens |
