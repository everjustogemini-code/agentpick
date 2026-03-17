# NEXT_VERSION.md
**Date:** 2026-03-17 (refreshed)
**Prepared by:** AgentPick PM
**QA Source:** QA_REPORT.md (51/51 — 100% pass, 0 P0/P2 blockers)
**Live site:** https://agentpick.dev — dark theme, Inter/JetBrains Mono, marquee, gradient hero, partial glassmorphism

---

## P1 Status from QA

Two P1 notes remain — neither is a user-facing failure but both are must-fix before the next growth push:

| # | Issue | Severity |
|---|-------|----------|
| 1 | AI classification latency ~500ms (~1283ms total), above 200ms routing target | P1 — degrades at scale |
| 2 | Rate limit 429 path (test 7.3) has no automated regression coverage | P1 — coverage gap |

---

## Must-Have #1 — Close Both P1s: Latency + Rate Limit Test Coverage

**Rule:** P1s from QA are must-have #1, no exceptions.

### 1a — AI Classification Latency

**Problem:** `POST /api/v1/route/search` AI classification step clocks ~500ms, pushing total end-to-end to ~1283ms. The routing spec targets ≤200ms for the classification sub-step. Under concurrent agent load this compounds — 10 agents = 5s+ queue.

**Required fix:**
- Profile `src/lib/ai-classifier.ts` (or equivalent) — identify whether latency is cold-start (LLM init), repeated prompt tokenization, or missing response cache.
- Add an in-process LRU cache keyed on normalized query intent: identical or near-identical queries skip the LLM call entirely.
- If the LLM call itself is the bottleneck, switch to a smaller/faster model (e.g., `claude-haiku-4-5`) for the classification step only — accuracy is secondary to routing speed here.
- Target: classification sub-step ≤ 200ms at p95 under 10 concurrent requests.

**Acceptance criteria:**
- `meta.latency_ms` for a realtime search query ≤ 1000ms end-to-end (currently ~1283ms)
- Classification step ≤ 200ms in isolation (loggable via `X-Classification-Ms` response header)
- All 51 existing QA tests still pass

### 1b — Automated Rate Limit Coverage

**Problem:** The 429 path (501st call in a month) has no automated regression test. If rate limit logic is accidentally broken by a future DB schema change, no CI signal catches it.

**Required fix:**
- Add one test to `agentpick-router-qa.py` (or equivalent vitest/integration suite):
  - Mock or seed usage to `monthlyLimit - 1` calls
  - Fire one more call → assert HTTP 429 + `RATE_LIMITED` error code + `Retry-After` header present
- This test must run in CI on every PR to `main`.

**Acceptance criteria:**
- `pytest agentpick-router-qa.py` includes a `test_rate_limit_429` case that passes
- No manual-only check for this path going forward

---

## Must-Have #2 — Major UI Upgrade: Glassmorphism + Motion + Typography

**Context:** QA confirms all 4 pages load at HTTP 200 and the product works end-to-end. The visual layer is the weakest signal for developer trust. Competing tools (Vercel, Resend, Linear) ship immersive animated pages. This upgrade converts first-time visitors into API key signups.

**Required changes:**

### Glassmorphism Cards
Replace solid `bg-card` on stat cards, feature cards, pricing tiers, and the agent-counter widget with:
```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
```
Apply across: homepage hero, `/connect` feature grid, `/dashboard` stat panels.

### Hero Stat Counter Animation
Animate live network stats (agent count, calls routed) from 0 → final value on `IntersectionObserver` trigger. CSS keyframe count-up, 800ms ease-out. No animation library. Respects `prefers-reduced-motion`.

### Typography Overhaul
- Hero `h1`: `font-size: clamp(2.5rem, 6vw, 4.5rem)` with `background-clip: text` gradient (accent-blue → accent-purple)
- All code snippets: enforce JetBrains Mono (already likely loaded — verify it's applied consistently)
- Section category labels: `font-mono tracking-widest text-xs uppercase opacity-60`

### Animated Gradient Mesh Background
Replace flat dark `#0a0a0a` with a slow-drifting radial gradient mesh using `@keyframes` CSS only — no canvas, no WebGL, no JS dependency. Blue/purple/indigo nodes drifting at 20s cycle.

### CTA Glow Pulse
Primary "Get API Key" button on hover:
```css
box-shadow: 0 0 32px rgba(99, 102, 241, 0.6), 0 0 64px rgba(99, 102, 241, 0.2);
transition: box-shadow 0.3s ease;
```

**Acceptance criteria:**
- Lighthouse Performance ≥ 90 mobile (no regression from current baseline)
- All 51 QA tests still pass (no HTTP regressions)
- No CLS on 375px viewport
- All motion effects gated behind `@media (prefers-reduced-motion: no-preference)`

---

## Must-Have #3 — New Feature: Shareable Benchmark Permalinks

**Goal:** Every benchmark run becomes a permanent, embeddable artifact. Developers share results in PRs, Discord, and GitHub READMEs — each link drives referral traffic with built-in technical context. Zero-cost distribution.

**Feature spec:**

Each benchmark run generates a public URL `agentpick.dev/b/{runId}` showing:
- Query used, tools compared, latency / cost / relevance scores in a side-by-side table
- "Run this benchmark" CTA with pre-filled Python / JS / curl snippet for instant reproduction
- Auto-generated `og:image` social card via `@vercel/og` for Twitter/LinkedIn previews
- Embeddable SVG badge: `agentpick.dev/b/{runId}/badge.svg` — shows winning tool + latency in one line

```markdown
![AgentPick Benchmark](https://agentpick.dev/b/abc123/badge.svg)
```

**Implementation surface:**
- `GET /api/v1/benchmarks/{runId}/public` — unauthenticated, returns sanitized run data (no internal cost fields), reads from existing `benchmarkRun` DB records
- `/b/[runId]` — Next.js ISR page (`revalidate: 3600`)
- `/b/[runId]/opengraph-image` — `@vercel/og` dynamic OG card (tool name, query snippet, winner callout)
- `/b/[runId]/badge.svg` — SVG response, target < 200ms, no auth

**Why this drives adoption over alternatives (SDK, GitHub Action, OpenAPI docs):**
- Passive virality: README badges create persistent brand exposure at zero ongoing cost
- Immediate trust signal: real latency/cost data beats marketing copy
- Reuses existing DB records — minimal new backend surface, fast to ship

**Acceptance criteria:**
- A Playground benchmark run produces a working `agentpick.dev/b/{runId}` URL without auth
- OG card renders correctly in Twitter card validator (`https://cards-dev.twitter.com/validator`)
- Badge SVG loads in < 200ms (verify via `X-Response-Time` header)
- `/b/{runId}` returns HTTP 200 in QA page load check (add to QA suite)

---

## Ship Order

```
1. #1a — Classification latency cache/model optimization   → profile first, fix second
1b. #1b — Rate limit 429 automated test                   → < 2 hours, pure test work
                                                           ↓ both must pass before #2/#3 land on main
2. #2  — UI upgrade                                        → parallel track, no API surface changes
3. #3  — Shareable benchmark permalinks                   → ships after #1 confirmed in prod by QA
```

**Rule:** Must-Have #1 confirmed green by QA agent before #2 or #3 merge to main.
