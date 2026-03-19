# NEXT_VERSION.md — v-next (cycle 8)
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code, Sonnet 4.6)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **50/51** | P0: none | P1: 1 open
**Recently shipped (cycle 7):** hero depth upgrade, SDK snippets endpoint (`GET /api/v1/sdk/snippets`)

---

## Must-Have #1 — Fix P1: Align `voyage-embed` Tool Slug Everywhere

**Type:** Bug fix
**QA ref:** B.1-embed — the only failing check; closes the gap to 51/51

**What:** `POST /api/v1/route/embed` returns `tool_used: "voyage-embed"`. Canonical references in docs, the `/connect` code snippets, and the QA validator all still say `"voyage-ai"`. Any agent code pattern-matching on `"voyage-ai"` silently misfires.

**Exact changes required — pick one canonical slug and apply everywhere:**

Option A — make backend match docs (recommended): update the embed adapter to emit `"voyage-ai"` instead of `"voyage-embed"`. No frontend changes.

Option B — make docs match backend: update `/connect` copy, dashboard tool labels, `GET /api/v1/sdk/snippets` examples, and the QA validator's `valid` list from `"voyage-ai"` → `"voyage-embed"`.

Whichever is chosen, add a regression assertion:
```
POST /api/v1/route/embed  →  tool_used === "voyage-ai"  (or "voyage-embed", whichever is canonical)
```

**Acceptance:** QA suite reports **51/51**. Zero references to the old slug remain.

---

## Must-Have #2 — Site-Wide Dark-Glass Design System

**Type:** UI upgrade
**Why now:** Core routing is 98% stable. Homepage hero already has dark-glass tokens; every other page (benchmarks, rankings, agents, `/connect`, `/dashboard`) is visually inconsistent. Developer-tool buyers (Vercel, Linear, Resend tier) expect polish throughout.

**Deliverables:**

1. **Glass cards everywhere** — `backdrop-filter: blur(16px)` + `rgba(255,255,255,0.04)` background + 1px `rgba(255,255,255,0.12)` border on: benchmark domain tiles, rankings rows, agent directory cards, dashboard stat tiles, `/connect` strategy blocks. Reuse `--glass-bg` / `--glass-border` CSS tokens already defined.

2. **ScrollReveal on all pages** — The existing `.scroll-reveal → .visible` IntersectionObserver is homepage-only. Wire it to stat bars, feature cards, and "How it works" steps on `/connect`, `/benchmarks`, `/rankings`, and `/dashboard`. Stagger siblings 60ms.

3. **Count-up hero stats** — "X agents ranked" and "Y calls routed" on the homepage animate 0 → final value on first viewport entry (one-shot per session via `sessionStorage`).

4. **Micro-interactions** — Card hover: `translateY(-4px)` + elevated shadow. Primary CTA: CSS shimmer sweep (600ms). All gated on `prefers-reduced-motion: no-preference`.

5. **Monospace data** — Latency values, scores, and call counts use `font-variant-numeric: tabular-nums` + JetBrains Mono across all pages.

**Acceptance:** Visually consistent dark-glass across all routes. No white flash on any page. Lighthouse Performance ≥ 90, LCP < 2.5s, CLS < 0.1. QA 51/51 stays green.

---

## Must-Have #3 — OpenAI-Compatible Proxy Endpoint

**Type:** New feature (developer adoption)
**Why:** The MCP tool (cycle 6) and SDK snippets (cycle 7) cover existing AgentPick users. The next growth lever is zero-migration adoption: developers already using an OpenAI-compatible search or responses API can drop AgentPick in with a single `base_url` change — no SDK migration, no new auth pattern.

**Spec:**

**New endpoint: `POST /v1/responses`** (mirrors OpenAI Responses API shape)
- Input: standard OpenAI `{ model, input, tools[] }` payload; AgentPick classifies intent and routes to the optimal search/embed/crawl tool automatically.
- Output: OpenAI-compatible response envelope wrapping AgentPick routing result. Include response headers:
  - `x-agentpick-tool-used`
  - `x-agentpick-latency-ms`
  - `x-agentpick-trace-id`
- Auth: existing `Bearer ah_live_sk_...` key — no new credentials.
- Rate limits: same plan limits as `/api/v1/route/*`.
- Usage: calls appear in `/dashboard` and `/api/v1/router/usage` with `source: "openai-compat"`.

**Documentation on `/connect`:**
- Add a "Migration" section with a before/after snippet showing one-line change from OpenAI → AgentPick.
- Add "OpenAI-compatible" to the homepage feature list.

**Acceptance:**
- `POST /v1/responses` with a valid Bearer key returns a valid OpenAI-format response routed through AgentPick.
- Usage appears in `/dashboard` tagged as `openai-compat`.
- Migration snippet live on `/connect`.
- QA 51/51 stays green.

---

## Definition of Done

- [ ] `voyage-embed` / `voyage-ai` slug consistent in adapter, docs, QA, and SDK snippets; suite reports **51/51**
- [ ] Glass cards on benchmarks, rankings, agents, connect, dashboard
- [ ] No white flash; all pages use `var(--bg-base)` body background
- [ ] ScrollReveal active on all pages (not homepage-only); 60ms stagger
- [ ] Count-up stat animations on homepage hero (sessionStorage one-shot)
- [ ] Card hover lift + CTA shimmer (respects `prefers-reduced-motion`)
- [ ] Lighthouse Performance ≥ 90 on `/` and `/benchmarks`; LCP < 2.5s; CLS < 0.1
- [ ] `POST /v1/responses` returns OpenAI-format response with correct routing headers
- [ ] Usage appears in dashboard with `source: "openai-compat"`
- [ ] Migration snippet live on `/connect`

## Out of Scope (This Cycle)
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — tracked by Pclaw in `/workspace/agentpick-benchmark/`
- New routing strategies or tool integrations
- Stripe/billing changes
- Team/org accounts
