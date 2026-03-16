# NEXT_VERSION.md
**Date:** 2026-03-16
**Prepared by:** AgentPick PM
**QA Source:** QA_REPORT.md (55/56 — 1 P1 remaining)

---

## Must-Have #1 — Fix P1: `/api/v1/keys/register` Returns 404 + `apiKey` Inconsistency

**Source:** QA_REPORT.md P1 Issue #1

**Problem:** `POST /api/v1/keys/register` returns `404 NOT_FOUND`. The canonical registration endpoint is `POST /api/v1/agents/register`. Any external docs, SDK examples, or third-party integrations referencing `/keys/register` silently fail — broken onboarding, lost developer signups.

Secondary issue: registration response returns `api_key` (snake_case) while JS/TS convention expects `apiKey` (camelCase). Breaks destructuring in JS SDK consumers.

**Required fixes:**
1. Add a route handler at `src/app/api/v1/keys/register/route.ts` that 308-redirects (or proxies) to `/api/v1/agents/register`, preserving the full POST body.
2. Extend `/api/v1/agents/register` response to include **both** `api_key` (existing) and `apiKey` (camelCase alias) — backwards-compatible, no breaking change.
3. Add `Deprecation: true` response header on the `/keys/register` alias path.

**Acceptance criteria:**
- `POST /api/v1/keys/register` with valid payload returns the same response as `/api/v1/agents/register`
- Both `api_key` and `apiKey` present in the response body
- QA score: 55/56 → 56/56
- Zero regression on existing `/api/v1/agents/register` behavior

---

## Must-Have #2 — Major UI Upgrade: Glassmorphism + Micro-animations + Typography Overhaul

**Context:** The current design is clean but flat — no depth, no motion. Competing developer tools (Vercel, Linear, Resend) ship immersive animated pages. This upgrade converts first-time visitors into signups.

**Required changes:**

1. **Glassmorphism cards** — Replace solid `bg-card` on stat cards, feature cards, pricing tiers, and the agent-counter widget with `backdrop-filter: blur(12px)` + `bg-white/5` + `border border-white/10`. Apply to homepage, `/connect`, and `/dashboard`.

2. **Hero stat counter animation** — CSS keyframe count-up on live network stats ("413 agents / 125 calls routed today"): animate 0 → final value on `IntersectionObserver` trigger, 800ms ease-out. No animation library dependency.

3. **Typography overhaul** — Upgrade hero `h1` to `clamp(2.5rem, 6vw, 4.5rem)` with `background-clip: text` gradient (accent-blue → accent-purple). Enforce JetBrains Mono across all code snippets. Add `font-mono tracking-widest text-xs uppercase` category labels for section headers.

4. **Animated gradient mesh background** — Replace flat dark background with a slow-drifting radial gradient mesh (blue/purple/indigo nodes) using `@keyframes` CSS only — no canvas/WebGL. Adds depth at zero JS weight.

5. **CTA glow effect** — Primary "Get API Key" button: `box-shadow: 0 0 32px rgba(99,102,241,0.6)` pulse on hover. Replace current shimmer-only effect.

**Acceptance criteria:**
- Lighthouse Performance ≥ 90 on mobile (no regression)
- All 4 QA page load checks return 200 OK
- No CLS on 375px viewport
- All animations respect `prefers-reduced-motion: reduce`

---

## Must-Have #3 — New Feature: Shareable Benchmark Permalinks

**Goal:** Increase developer adoption via viral sharing. Every benchmark run becomes a permanent, embeddable artifact developers can link in PRs, blog posts, and GitHub READMEs.

**Feature:** Each benchmark run generates a public URL `agentpick.dev/b/{runId}` showing:
- Query used, tools compared, latency/cost/relevance scores in a side-by-side table
- "Run this benchmark" CTA with pre-filled Python/JS/curl snippet
- Auto-generated `og:image` social card via `@vercel/og` for Twitter/LinkedIn previews
- SVG badge: `agentpick.dev/b/{runId}/badge.svg` — shows winning tool + latency, embeddable in GitHub READMEs with one Markdown line

**Why this drives adoption:**
- Developers sharing results in Discord/Twitter/PRs brings referral traffic with immediate technical context
- README badges create persistent brand exposure at zero marginal cost
- Reuses existing `benchmarkRun` DB records — minimal new backend surface

**Implementation:**
- `GET /api/v1/benchmarks/{runId}/public` — unauthenticated endpoint returning sanitized run data
- `/b/[runId]` — Next.js ISR page (`revalidate: 3600`)
- `/b/[runId]/opengraph-image` — `@vercel/og` dynamic OG card
- `/b/[runId]/badge.svg` — SVG response, target < 200ms

**Acceptance criteria:**
- A Playground benchmark run produces a working `agentpick.dev/b/{runId}` URL accessible without auth
- OG card renders correctly in Twitter card validator
- Badge SVG loads in < 200ms
- QA page load check for `/b/{runId}` returns 200 OK

---

## Ship Order

```
1. #1 — /keys/register alias + apiKey fix   → < 1 hour, zero risk → QA scores 56/56
2. #2 — UI upgrade                          → parallel track, no API surface changes
3. #3 — Shareable permalinks               → ships after #1 confirmed 56/56 by QA
```

**Rule:** No new features merge to main until #1 is confirmed green in prod by QA.
