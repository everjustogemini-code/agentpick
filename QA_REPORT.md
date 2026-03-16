# AgentPick QA Report — Round 16 (2026-03-16)

**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)
**Script:** agentpick-router-qa.py (full mode)

---

## Score: 56/57

---

## P0 Blockers

None.

---

## P1 Issues

1. **Registration endpoint path inconsistency**
   `POST /api/v1/account/register` returns `404 NOT_FOUND` ("No API endpoint at /api/v1/account/register").
   The correct endpoint is `POST /api/v1/router/register`.
   Any integration doc, client, or external tooling referencing the `/account/register` path will silently fail. Recommend adding a redirect/alias at `/api/v1/account/register` or auditing all docs/references to use the correct path.

---

## P2 / Minor Issues

None found.

---

## What Looks Good

### Automated Router QA — 51/51 ✅
- **Router core**: Registration, search/crawl routing, adapter data, fallback, strategy differentiation, call recording, health — all pass.
- **Developer Dashboard API**: Usage, fallback stats, compare, set-strategy/budget/priority, weekly report — all HTTP 200 with valid payloads.
- **/connect page**: pip install, strategies, pricing, API endpoint, get-API-key, auto-fallback, dashboard link — all present.
- **Homepage**: Dark code block, /connect link, dark styling — all present.
- **Nav**: Router item + Live/Rankings/Benchmarks/Agents items — correct.
- **AI-powered routing**: Deep research → exa-search, realtime → tavily, simple → tavily; classification latency 501ms; AI insights in usage — all correct.
- **Schema & data integrity**: Account/call fields present; 401 on invalid/missing key — correct.
- **Dashboard web UI**: HTTP 200; shows calls, strategy, tools, settings.
- **Cross-capability**: embed → cohere-embed, finance → polygon-io — correct.
- **Edge cases**: Empty query → 400, invalid capability → 404, 5000-char query → 413, invalid strategy → 400, 5 concurrent calls → 5/5 success.

### Page Load Checks — 4/4 ✅
| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ 200 | Hero, 397-agent network stats, code example, pricing, live feed — all render |
| `/connect` | ✅ 200 | Interactive code generator, playground, strategies, quick start, SDK docs — all render |
| `/dashboard` | ✅ 200 | Plan/Strategy/Spend/Connect controls — all render; no visual regressions |
| `/products/tavily` | ✅ 200 | Benchmark data, agent reviews, rankings — all render |

### Paid User Flow ✅
- `POST /api/v1/router/register` → `{ apiKey, plan: "FREE", monthlyLimit: 500 }`
- `POST /api/v1/router/search` (Bearer auth) → HTTP 200, 10 results returned, correct `meta` + `data` structure
- `GET /api/v1/router/usage` → correctly reflects `callsThisMonth: 1` after one search; `calls_remaining` decrements properly in `meta`

### API: POST /api/v1/router/search with Bearer Auth ✅
Response envelope:
```json
{
  "meta": { "tool_used", "latency_ms", "cost_usd", "fallback_used", "strategy", "plan", "calls_remaining", ... },
  "data": { "results": [...], "requestId", "resolvedSearchType", "searchTime", "costDollars" }
}
```
- Unauthenticated requests → HTTP 401 ✅
- `best_performance` strategy routes to `exa-search` for realtime queries ✅
- Latency healthy: 358ms tool + 373ms total

---

PASS
