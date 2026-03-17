# NEXT_VERSION.md
**Date:** 2026-03-17
**Prepared by:** AgentPick PM (reviewed & confirmed)
**QA Source:** QA_REPORT.md (51/51 — 100% pass, 0 P0/P2 blockers)
**Live site:** https://agentpick.dev — 448 agents, 103 calls routed today; dark theme functional, low-contrast text noted (white/40% opacity in places)

---

## P1 Status from QA

One P1 remains — not user-facing but a coverage gap that must close before next growth push:

| # | Issue | Severity |
|---|-------|----------|
| 1 | Rate limit 429 path (test 7.3) has no automated regression coverage — manual check only | P1 |

No P2s.

---

## Must-Have #1 — Fix P1: Automate Rate Limit 429 Regression Test

**Rule:** All QA P1s are must-have #1. No new features ship while P1s are open.

**Problem:** The 501st-call threshold (FREE plan: 500 calls/month) returns HTTP 429 with `RATE_LIMITED` — but this path is verified manually only. Any future DB schema change or middleware refactor could silently break billing enforcement with zero CI signal.

**Required fix:**
- Add `test_rate_limit_429` to `agentpick-router-qa.py`:
  - Seed or mock a test user at `callsThisMonth = monthlyLimit - 1` (499)
  - Assert the 500th call returns HTTP 200 with normal response
  - Assert the 501st call returns HTTP 429 + `{"error": {"code": "RATE_LIMITED"}}` + `Retry-After` header
- Test must run in CI on every push to `main`

**Acceptance criteria:**
- QA suite reports ≥ 53/53 (adds at least 2 new assertions)
- No manual-only check for the 429 path going forward
- All existing 51 tests still pass

---

## Must-Have #2 — Major UI Upgrade: Glassmorphism, Motion, Typography

**Context:** Product works end-to-end (51/51 QA). The conversion bottleneck is now visual trust. Competing dev tools (Vercel, Resend, Upstash) ship immersive animated pages — AgentPick looks functional but not yet *shareable*. The `UI_POLISH_V1.md` spec is written; this is the execution.

**Required changes (zero new npm packages — pure CSS/Tailwind):**

### Navigation
- `backdrop-filter: blur(12px)` glass nav bar on scroll
- Live green pulse dot next to logo (pulsing CSS `@keyframes` — signals system is alive)
- Active page underline (2px accent line, not just color change)

### Cards & Panels
- All feature cards, stat panels, pricing tiers: `backdrop-filter: blur(12px)` + `background: rgba(255,255,255,0.05)` + `border: 1px solid rgba(255,255,255,0.10)`
- Hover: `transform: translateY(-2px)` + elevated box-shadow

### Typography
- Hero `h1`: `clamp(2.5rem, 6vw, 4.5rem)` + `background-clip: text` gradient (blue → purple)
- All `font-mono` code: enforce JetBrains Mono via `next/font/google` consistently across all pages
- Section labels: `font-mono tracking-widest text-xs uppercase opacity-60`

### Animations
- Animated slow-drift radial gradient mesh background (`@keyframes`, 20s cycle, no JS/canvas)
- Hero stat counters (agent count, calls routed): count-up from 0 on `IntersectionObserver`, 800ms ease-out
- CTA "Get API Key" button: glow pulse on hover (`box-shadow: 0 0 32px rgba(99,102,241,0.6)`)
- Leaderboard score bars: red→yellow→green gradient (not single color)
- `pip install` snippet: one-click copy with "Copied! ✓" fade tooltip

**Acceptance criteria:**
- Lighthouse Performance ≥ 90 mobile (no regression)
- All 51+ QA tests still pass
- No CLS on 375px viewport
- All motion gated behind `@media (prefers-reduced-motion: no-preference)`

---

## Must-Have #3 — New Feature: Shareable Benchmark Permalinks + Embeddable Badges

**Why this drives developer adoption:** Passive virality via README badges. Every developer who runs a benchmark gets a shareable URL and a one-line badge they paste into their GitHub repo — each badge is a permanent inbound link with real performance data, not marketing copy. Zero ongoing cost to distribute.

**Feature spec:**

```
GET  /b/[runId]                  → public permalink page (no auth)
GET  /b/[runId]/badge.svg        → embeddable SVG badge, < 200ms, no auth
GET  /api/v1/benchmarks/[runId]/public  → sanitized JSON (no cost fields), no auth
/b/[runId]/opengraph-image       → @vercel/og dynamic OG card for social previews
```

Each permalink page shows:
- Query used, tools compared, latency / relevance / cost scores side-by-side
- "Reproduce this benchmark" CTA with pre-filled Python + curl snippets
- Auto-generated OG card for Twitter/LinkedIn unfurls

Badge example for README:
```markdown
![AgentPick Benchmark](https://agentpick.dev/b/abc123/badge.svg)
```

**Implementation surface:**
- Reuses existing `benchmarkRun` DB records — minimal new backend
- `/b/[runId]` as Next.js ISR page (`revalidate: 3600`)
- Badge SVG is a pure HTTP response, no DB write on read

**Acceptance criteria:**
- A completed Playground run produces a working `/b/{runId}` URL without auth
- OG card renders correctly in Twitter card validator
- Badge SVG loads in < 200ms
- `/b/{runId}` added to QA page-load check (suite grows to ≥ 54 tests)

---

## Ship Order

```
1. Must-Have #1 — Rate limit 429 test (< 2h)     → merge alone, confirm QA green
                                                    ↓
2. Must-Have #2 — UI upgrade                      → no API surface, safe parallel dev
                                                    ↓
3. Must-Have #3 — Benchmark permalinks            → ships after #1 confirmed in prod
```

**Rule:** Must-Have #1 confirmed green by QA before #3 merges to main.
