# QA PLAN

Test cases are added per feature. Format: ID · Milestone · Title · Preconditions · Steps · Expected · Device/Browser · Status.

| ID | M | Title | Steps | Expected | Device | Status |
|---|---|---|---|---|---|---|
| TC-001 | M0 | Preview renders EN and ID | Open preview; toggle EN/ID | All copy switches; <html lang> updates; choice persists after reload | Chrome 1440 (automated in `tests/playwright/smoke.spec.ts`; owner re-runs on the Vercel preview) | Pass locally (2026-10-27); preview pending |
| TC-002 | M0 | No serious/critical axe violations | Run `pnpm test`; `tests/playwright/a11y.spec.ts` scans `/` in EN, toggles to ID and scans again (WCAG 2.x A/AA + best-practice tags) | Zero violations with impact serious or critical in both languages | Chromium 1280 (Playwright) | Pass (2026-10-27) |
| TC-003 | M0 | Lighthouse CI budgets on the local production build | `pnpm lhci` (desktop preset, 2 runs) | Performance ≥ 0.90, Accessibility / Best Practices / SEO ≥ 0.95, CLS < 0.1; assertions pass | Headless Chrome desktop | Pass (2026-10-27) |
| TC-004 | M0 | No third-party requests | `pnpm test`; smoke test records every request while loading and toggling | No request leaves `localhost`; fonts served from `/fonts/` | Chromium (Playwright) | Pass (2026-10-27) |
| TC-005 | M0 | Status → CTA rules | `pnpm test`; smoke test checks `#work` | No "Live demo" link while no project has `liveUrl`; exactly one "GitHub" link (Trading Compass, the only public repo) | Chromium (Playwright) | Pass (2026-10-27) |
| TC-006 | M0 | Language toggle persists | Open `/`, click `ID`, reload | `<html lang="id">` after reload; Indonesian copy visible; `localStorage.lang === "id"` | Chromium (Playwright, in TC-001 flow) | Pass (2026-10-27) |
