# NEXT_VERSION.md — v-next
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **51/52** | P0: none | P1: 1 open
**Live site:** https://agentpick.dev — functional, /router nav fixed in cycle 4, glass CSS tokens partially applied

---

## Must-Have #1 — Fix Remaining P1: POST /api/v1/register Returns 404 Instead of 308

**Bug:** `POST /api/v1/register` returns `404 {"error":{"code":"NOT_FOUND",...}}` instead of a 308 redirect to `/api/v1/router/register`.

**Root cause:** Next.js `redirects` in `next.config.ts` applies only to GET requests during routing. A POST to a non-existent path hits the 404 JSON catch-all handler before redirect middleware fires. Cycle 4 attempted a `next.config.ts` redirect — it was silently ignored for POST.

**Fix:** Create a real route handler at `app/api/v1/register/route.ts` that returns `Response.redirect(new URL('/api/v1/router/register', req.url), 308)` for all HTTP methods. Remove the now-redundant dead entry from `next.config.ts`. Add a regression test that asserts `POST /api/v1/register` → 308 with correct `Location` header.

**Acceptance:**
- `curl -X POST https://agentpick.dev/api/v1/register` → HTTP 308, `Location: /api/v1/router/register`
- QA script reports 52/52 (previously 51/52)

---

## Must-Have #2 — Complete Dark-Glass Design System (Site-Wide Consistency)

Cycle 2 introduced dark-glass CSS tokens and applied them to the homepage hero. Benchmarks, rankings, agents, connect, and dashboard still use a mixed aesthetic. Complete the rollout:

1. **Dark by default** — `body` uses `var(--bg-base)` (#0a0a0f). No white flash on any page. `--bg-card` → `rgba(255,255,255,0.05)`, `--text-primary` → `#E2E8F0`.
2. **Glass cards everywhere** — Apply `glass-card gradient-border-card` (existing tokens) to all feature cards, benchmark domain tiles, rankings rows, agent directory cards, and dashboard stat tiles.
3. **Hero upgrade** — Homepage hero: `backdrop-filter: blur(16px)` frosted panel around headline+CTA. Headline `clamp(2.8rem, 5vw, 4.5rem)` weight-800 with white-to-indigo gradient clip. Primary CTA: gradient fill + glow box-shadow + `scale(1.03)` on hover.
4. **ScrollReveal on all pages** — Wire `.scroll-reveal` → `.visible` transition to stat bars, feature cards, and "How it works" steps on every page (currently homepage-only from cycle 2).
5. **Count-up stats** — Homepage agent count and calls-routed counters animate 0 → final value on `IntersectionObserver` entry, one-shot per session.
6. **Micro-interactions** — Card hover lift (`translateY(-4px)` + box-shadow), CTA shimmer sweep on hover, strategy pill pulse. All gated on `prefers-reduced-motion: no-preference`.
7. **Monospace data** — Latency values, scores, call counts use `font-variant-numeric: tabular-nums` + JetBrains Mono across `/`, `/connect`, `/products/[slug]`, `/dashboard`.

**Acceptance:** Visually consistent dark-glass across all pages. Lighthouse Performance ≥ 90, LCP < 2.5s, CLS < 0.1. All 52 QA checks remain green.

---

## Must-Have #3 — In-Page SDK Playground on /connect (Developer Adoption)

An interactive, zero-account code playground embedded on `/connect` that lets a developer run a real search against the AgentPick router without leaving the page.

**Deliverables:**

1. **Tabbed snippet UI** — Python / Node.js / cURL tabs. Server-side syntax highlighting (Shiki, zero runtime bundle cost). Defaults to cURL.
2. **"Try it" run button** — Makes a real `POST /api/v1/router/search` using a shared public demo key (env: `DEMO_API_KEY`, rate-limited to 3 req/IP/hour via in-memory sliding window). No account required.
3. **Live response panel** — Shows streamed JSON output: `tool_used`, `latency_ms`, `results[0..2]`. Characters revealed at 8ms/char for perceived streaming. Collapses back when a new run starts.
4. **Copy-for-project button** — Replaces demo key with `YOUR_API_KEY` placeholder and copies to clipboard. Tracks copy events in analytics.

**Why this wins:** Reduces time-to-first-result from "sign up → verify email → get key → read docs → write code" to under 60 seconds, no account required. This is the top drop-off point for developer adoption.

**Acceptance:**
- `/connect` page has tabbed playground with Python/Node/cURL snippets.
- "Try it" button fires real search, response panel shows within 2s.
- Copy button replaces demo key and triggers `navigator.clipboard.writeText`.
- Demo key rate-limited; >3 req/IP/hour returns `429` with `Retry-After`.
- All 52 QA checks green post-deploy.

---

## Definition of Done

- [ ] `POST /api/v1/register` → 308 redirect (not 404)
- [ ] QA passes 52/52
- [ ] Dark-glass tokens applied to benchmarks, rankings, agents, connect, dashboard
- [ ] No white flash; all pages use `var(--bg-base)` body background
- [ ] ScrollReveal active on all pages (not homepage-only)
- [ ] Count-up stat animations on homepage
- [ ] Glass cards + hover lift on all card components site-wide
- [ ] CTA shimmer + strategy pulse micro-interactions, off under `prefers-reduced-motion`
- [ ] Lighthouse Performance ≥ 90 on `/` and `/benchmarks`
- [ ] `/connect` playground: tabbed snippets + run button + response panel + copy button
- [ ] Demo key rate-limited to 3 req/IP/hour; `429` on overflow

## Out of Scope (This Cycle)
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — blocked on `BENCHMARK_SECRET` env config
- New routing strategies or tool integrations
- Stripe/billing changes
- Team/org accounts
