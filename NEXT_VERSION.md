# NEXT_VERSION.md — v-next (cycle 10)
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code, Sonnet 4.6)
**QA baseline:** QA_REPORT.md (2026-03-18, re-verified 22:27 UTC) — score **62/63** | P0: none | P1: **2 open**
**Recently shipped (cycle 9):** Promoted voyage-embed to primary (partial — chain still exhausts openai-embed + cohere-embed first per re-verification)

---

## Must-Have #1 — Fix both P1 embed bugs (bugs before features — no exceptions)

### P1-1: Remove dead providers from the embed chain — cycle 9 fix is incomplete

**QA evidence (re-verified 22:27 UTC, post cycle-9 deploy):** Every `POST /api/v1/route/embed` *still* returns `tried_chain: ["openai-embed", "cohere-embed", "voyage-embed"]` with `fallback_used: true`. Cycle 9 committed "promote voyage-embed to primary" but did not eliminate the dead providers from the front of the chain.

**Root cause:** The cycle-9 change likely updated a default/fallback config pointer but left `openai-embed` and `cohere-embed` as active entries in the embed capability's provider list. They still get attempted (and fail) before reaching voyage-embed.

**Required fix:** Delete (or disable) `openai-embed` and `cohere-embed` from the embed tool chain config entirely. `voyage-embed` must be the sole entry — not just "primary." No BYOK keys are configured for the other two; they serve no purpose in the chain.

**Acceptance:** `POST /api/v1/route/embed` returns `fallback_used: false` and `tried_chain: ["voyage-embed"]` (length 1) on every normal call.

---

### P1-2: Fix stale slug in QA validation list

**QA evidence:** `agentpick-router-qa.py` line B.1 checks `tool in ["cohere-embed", "voyage-ai", "jina-embeddings"]` but the live slug is `"voyage-embed"` — causing a false-negative on every QA run.

**Required fix:** Update line B.1 valid-list to `["cohere-embed", "voyage-embed", "jina-embeddings"]`.

**Acceptance:** QA suite reports **63/63**. No references to the old `"voyage-ai"` slug remain in the QA script.

---

## Must-Have #2 — Site-Wide Dark-Glass Design System

**Type:** UI upgrade
**Why now:** Core routing is stable. Homepage hero already has dark-glass tokens; every other page (benchmarks, rankings, agents, `/connect`, `/dashboard`) is visually inconsistent. Developer-tool buyers (Vercel, Linear, Resend tier) expect polish throughout.

**Deliverables:**

1. **Glass cards everywhere** — `backdrop-filter: blur(16px)` + `rgba(255,255,255,0.04)` background + 1px `rgba(255,255,255,0.12)` border on: benchmark domain tiles, rankings rows, agent directory cards, dashboard stat tiles, `/connect` strategy blocks. Reuse `--glass-bg` / `--glass-border` CSS tokens already defined on the homepage.

2. **ScrollReveal on all pages** — The existing `.scroll-reveal → .visible` IntersectionObserver is homepage-only. Wire it to stat bars, feature cards, and "How it works" steps on `/connect`, `/benchmarks`, `/rankings`, and `/dashboard`. Stagger siblings 60 ms.

3. **Count-up hero stats** — "X agents ranked" and "Y calls routed" animate 0 → final value on first viewport entry (one-shot per session via `sessionStorage`).

4. **Micro-interactions** — Card hover: `translateY(-4px)` + elevated shadow. Primary CTA: CSS shimmer sweep (600 ms). All gated on `prefers-reduced-motion: no-preference`.

5. **Monospace data** — Latency values, scores, and call counts use `font-variant-numeric: tabular-nums` + JetBrains Mono across all pages.

**Acceptance:** Visually consistent dark-glass across all routes. No white flash on any page. Lighthouse Performance ≥ 90, LCP < 2.5 s, CLS < 0.1. QA stays 63/63.

---

## Must-Have #3 — Live API Playground page (`/playground`)

**Type:** New feature (developer adoption)
**Why:** Cycle 6 added the MCP tool, cycle 7 added SDK snippets, cycle 8 added OpenAI-compat. The missing piece: developers can't *try* the router without writing code or using curl. A browser-based playground eliminates the zero-to-first-call friction and is the fastest path to "aha moment."

**Spec:**

`GET /playground` — new page with:
- **Query input** — text field + capability selector (search / embed / crawl) + strategy dropdown (balanced / best_performance / cheapest / most_stable).
- **Run button** — fires `POST /api/v1/route/{capability}` using the visitor's own API key (entered in the page) or the public demo key. Shows a spinner during the call.
- **Result pane** — renders `tool_used`, `latency_ms`, `cost_usd`, `fallback_used`, `ai_classification`, and the first 3 results (title + URL + snippet) in a formatted dark card. Includes a raw JSON toggle.
- **Copy-as-curl** button — generates the equivalent `curl` command pre-filled with the query and key.
- Auth: no new backend endpoints needed — uses existing `/api/v1/route/*` with Bearer auth. The demo key is hard-coded client-side (same as `/connect` page).
- No account required to try the demo key (rate-limited to 10 calls/day, same as existing demo key logic).

**Homepage + `/connect` hook:** Add "Try it live →" CTA linking to `/playground`.

**Acceptance:**
- `/playground` loads at HTTP 200; demo key works without login; full routing result renders in < 2 s on a simple query.
- Copy-as-curl produces a valid curl command.
- QA 63/63 stays green.

---

## Definition of Done

- [ ] `POST /api/v1/route/embed` returns `fallback_used: false`, `tried_chain` length 1 on happy path
- [ ] QA script line B.1 slug updated; suite reports **63/63**
- [ ] Glass cards on benchmarks, rankings, agents, connect, dashboard
- [ ] No white flash; all pages use `var(--bg-base)` body background
- [ ] ScrollReveal active on all pages (not homepage-only); 60 ms stagger
- [ ] Count-up stat animations on homepage hero (sessionStorage one-shot)
- [ ] Card hover lift + CTA shimmer (respects `prefers-reduced-motion`)
- [ ] Lighthouse Performance ≥ 90 on `/` and `/benchmarks`; LCP < 2.5 s; CLS < 0.1
- [ ] `/playground` loads 200; demo key returns results; copy-as-curl works
- [ ] "Try it live →" CTA on homepage and `/connect`

## Out of Scope (This Cycle)
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — tracked by Pclaw in `/workspace/agentpick-benchmark/`; needs `BENCHMARK_SECRET` env var coordination first
- New routing strategies or tool integrations
- Stripe/billing changes
- Team/org accounts
