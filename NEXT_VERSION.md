# NEXT_VERSION.md — AgentPick Next Release Plan
**Date:** 2026-03-16
**QA Source:** QA_REPORT.md Round 16 (56/57 — 1 P1 remaining)

---

## Must-Have #1 — Fix P1: `/api/v1/account/register` Returns 404

**Source:** QA_REPORT.md Round 16, P1 Issue #1

**Problem:** `POST /api/v1/account/register` returns `404 NOT_FOUND`. The canonical registration path is `POST /api/v1/router/register`. Any integration docs, third-party clients, or agent tooling referencing the `/account/register` path silently fails — lost signups, broken onboarding.

**Fix:** Add a Next.js route handler at `src/app/api/v1/account/register/route.ts` that proxies or 308-redirects to `/api/v1/router/register`. Must preserve request body, return identical `{ apiKey, plan, monthlyLimit }` JSON response, and emit a `Deprecation: true` response header so callers can detect the alias.

**Acceptance:**
- `POST /api/v1/account/register` with valid payload → same response shape as `/api/v1/router/register`
- QA Round 17 test for `/api/v1/account/register` passes → score 57/57
- Zero regression on existing `/api/v1/router/register` behavior

---

## Must-Have #2 — Major UI Upgrade: Glassmorphism + Micro-animations + Typography Overhaul

**Context:** Current design is clean and functional but flat — no depth, no motion, no visual hierarchy guiding visitors to the CTA. Competitors (Tavily, Exa, Jina) ship immersive animated developer-first pages. This upgrade converts first-time visitors into signups.

**Scope:**

1. **Glassmorphism cards** — apply `backdrop-filter: blur(12px)` + `bg-white/5` + `border border-white/10` to all stat cards, feature cards, and the agent-counter widget on homepage and `/connect`. Drop the current flat card backgrounds.

2. **Hero stat counter animation** — CSS keyframe counter on the live network stats ("402 active agents / 880+ benchmark runs / 11,500+ calls"): count up 0 → final value on page load, 800ms ease-out, triggered by `IntersectionObserver`.

3. **Typography overhaul** — upgrade homepage `h1` to `clamp(2.5rem, 6vw, 4.5rem)` with a `background-clip: text` gradient (accent blue → accent-purple). Increase code block background contrast to `#0d1117`. All code uses JetBrains Mono consistently.

4. **Animated routing diagram on `/connect`** — a simple CSS/SVG flow animation (agent icon → AgentPick logo → tool icons with a traveling pulse dot) above the code example. Must convey the routing concept in under 2 seconds, no external animation library.

5. **CTA button shimmer** — primary "Get API Key" and "Install AgentPick" buttons get a `@keyframes shimmer` sweep on hover (white highlight travels left → right).

**Acceptance:**
- Lighthouse Performance score ≥ 90 on mobile (no regression from animation weight)
- All 4 QA page load checks still pass 200 OK
- No CLS on 375px viewport
- Animations respect `prefers-reduced-motion: reduce`

---

## Must-Have #3 — New Feature: Shareable Benchmark Permalinks

**Goal:** Increase developer adoption via viral sharing and organic discovery. Every benchmark run becomes a shareable artifact.

**Feature:** Each benchmark run (from Playground, `/connect` code generator, or direct API) generates a permanent public URL: `agentpick.dev/b/{runId}` showing:
- Query used, tools compared, latency/cost/relevance scores side-by-side table
- "Run this benchmark" CTA with pre-filled Python/JS/curl code snippet
- Auto-generated `og:image` social card (via `@vercel/og`) for Twitter/LinkedIn previews
- "Embed" button producing an `<iframe>` snippet for README files or blog posts
- SVG badge: `agentpick.dev/b/{runId}/badge.svg` showing winning tool + latency — embeddable in GitHub READMEs

**Why this drives adoption:**
- Developers sharing results in PRs, blog posts, and Discord threads brings referral traffic with immediate technical context
- README badges create persistent backlinks and brand exposure at zero marginal cost
- Reuses existing `benchmarkRun` DB records — minimal new backend work

**Implementation:**
- `GET /api/v1/benchmarks/{runId}/public` — unauthenticated endpoint returning sanitized run data
- `/b/[runId]` — Next.js page with `revalidate: 3600`
- `/b/[runId]/opengraph-image` — `@vercel/og` dynamic OG card
- `/b/[runId]/badge.svg` — lightweight SVG, < 200ms response

**Acceptance:**
- A Playground benchmark run produces a working shareable URL
- OG card renders correctly in Twitter card validator
- Badge SVG loads in under 200ms
- QA page load check for `/b/{runId}` returns 200 OK

---

## Ship Order

```
1. #1 — /account/register alias   → < 1 hour, zero risk → QA scores 57/57
2. #2 — UI upgrade                → parallel track, no API changes
3. #3 — Shareable permalinks      → ships after #1 confirmed 57/57 by QA
```

**Rule:** No new features deploy until #1 is confirmed 57/57 by QA.
