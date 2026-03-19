# AgentPick QA Report
**Date:** 2026-03-18
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Code)

---

## Score: 51/52

> Automated suite: 50/51 · Manual checks: 1/1 additional

---

## P0 Blockers

None.

---

## P1 Issues

### `/api/v1/register` redirect returns 404 (not 308)

- **Config:** `next.config.ts` has `permanent: true` redirect from `/api/v1/register` → `/api/v1/router/register`
- **Observed:** `POST /api/v1/register` returns HTTP 404 with `{"error":{"code":"NOT_FOUND","message":"No API endpoint at /api/v1/register"}}`
- **Expected:** HTTP 308 with `Location: /api/v1/router/register`
- **Impact:** Any SDK/client that calls the short path `/api/v1/register` gets a 404. Redirect config exists but is not applied in production (Next.js redirects may not intercept POST to non-existent routes handled by 404 JSON handler before redirect middleware runs).
- **Workaround:** Call `/api/v1/router/register` directly (QA script and production SDK do this).

---

## What Looks Good

### Page Loads (all 200)
| Page | Status | Latency |
|---|---|---|
| `/` | 200 | 303ms |
| `/connect` | 200 | 218ms |
| `/dashboard` | 200 | 87ms |
| `/products/tavily` | 200 | 703ms |

### Router Core (Parts 1–2): All 14 tests pass
- Registration → `ah_live_sk_...` key + plan=FREE, limit=500
- Search routing correct: tavily (balanced), exa-search (best_performance), brave-search (cheapest)
- Fallback works: invalid tool falls back with `fallback_used=true`
- All 4 strategies return different tools
- Calls recorded in DB (8 calls post-run)
- Health: `healthy`, lastHour stats present
- Dashboard API: usage, fallbacks, compare, set-strategy, set-budget, set-priority, weekly-report all 200

### /connect Page (Part 3): All 7 tests pass
- pip install snippet, strategy docs, pricing, API endpoint, "Get API key" CTA, auto-fallback docs, dashboard link

### Homepage Visual (Parts 4–5): All 5 tests pass
- Dark code block with pip install, /connect link in hero, Router in nav
- Nav: Live, Rankings, Benchmarks, Agents

### AI-Powered Routing (Part 6): All 6 tests pass
- Deep research → `exa-search` (type=research, depth=deep)
- Realtime → `tavily` (type=realtime, freshness=realtime)
- Simple → `tavily` (type=simple, depth=shallow)
- Classification latency: 150ms
- AI insights aggregation works

### Schema & Auth (Part 7): All 5 tests pass
- Account + call fields complete; invalid/missing key → 401

### Dashboard UI (Part 8): All 5 tests pass
- Loads, shows calls/strategy/tools/settings

### Bonus: Finance + Edge Cases: All 6 pass
- Finance → polygon-io; empty/invalid/long/bad-strategy/concurrent all handled correctly

### API: POST /api/v1/router/search with Bearer auth
- Returns `data` (query, results, answer, images) + `meta` (tool_used, latency_ms, ai_classification, strategy, calls_remaining, trace_id, cost_usd)
- 8 results for "latest AI news 2026" ✅

### Embed Capability — B.1 "failure" is a QA script bug, not a product bug
- `/api/v1/route/embed` returns real embeddings via `voyage-embed` (91ms, 1024 dimensions, fallback chain: openai-embed → cohere-embed → voyage-embed)
- QA script checks for `["cohere-embed", "voyage-ai", "jina-embeddings"]` but tool ID is `voyage-embed` (not `voyage-ai`) — validation list is stale
- Product behavior is correct

### Security Headers
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Content-Security-Policy` — all present on all pages

### Paid User Flow (manual)
1. `POST /api/v1/router/register` → apiKey + plan=FREE ✅
2. `POST /api/v1/router/search` with Bearer → 8 results, correct meta ✅
3. Calls appear in usage stats ✅

---

PASS
