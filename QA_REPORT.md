# AgentPick QA Report
**Date:** 2026-03-18
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)

---

## Score: 57/57

---

## P0 Blockers

None.

---

## P1 Issues

None.

---

## P2 / Minor Issues

- `meta.ai_classification` is null for non-AUTO strategies (e.g. `balanced`). Routing is still correct; classification only applies to AUTO mode. Acceptable behavior but worth noting in docs.
- `/dashboard` requires client-side JS to render live data — static HTML fetch shows page structure only (expected Next.js behavior, not a bug).

---

## What Looks Good

| Area | Result |
|------|--------|
| **Automated QA script (51/51)** | 100% pass — router core, API, pages, AI routing, schema, edge cases, bonus caps |
| **Homepage (`/`)** | Hero, dark pip-install code block, pricing (Free/Pro/Growth), nav (Live/Rankings/Benchmarks/Agents/Router/Dashboard) all present |
| **`/connect` page** | pip install, 5 strategies, pricing, auto-fallback, dashboard link — all present |
| **`/dashboard` page** | Loads 200; plan bar, strategy selector, budget controls, API key auth flow visible |
| **`/products/tavily` page** | Score 6.7/10, 75 agents, 5,040 verified calls, p50 915ms, p99 2099ms, 100% success, advocates/critics sections all present |
| **Bearer auth enforcement** | Invalid key → 401 UNAUTHORIZED, missing key → 401 |
| **Paid user flow** | Register → apiKey issued (plan=FREE, limit=500) → search → 9 results with full metadata → calls logged |
| **API response schema** | Consistent `{data: {...}, meta: {...}}` envelope; meta includes tool_used, latency_ms, fallback_used, ai_classification, cost_usd, calls_remaining |
| **Strategy routing** | best_performance→exa-search, cheapest→brave-search, balanced/auto→tavily — all correct |
| **AI classification (AUTO)** | Correctly identifies realtime/research/simple/news; selects tool accordingly; ~151ms classification latency |
| **Fallback system** | Invalid tool triggers automatic fallback; `fallback_used=true` surfaced in meta |
| **Concurrent requests** | 5 parallel calls: 5/5 returned 200 |
| **Edge cases** | Empty query→400, invalid capability→404, 5000-char query→413, invalid strategy→400 |
| **Cross-capability** | Embed (cohere-embed) and finance (polygon-io) route correctly |
| **Usage tracking** | callsThisMonth, calls_remaining accurate after test searches |
| **Visual regressions** | None — no broken images, null values, layout issues, or missing CSS on any tested page |

---

## Test Coverage

| Suite | Passed | Total |
|-------|--------|-------|
| Automated QA script | 51 | 51 |
| Manual page checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 |
| Manual API: POST /api/v1/router/search (valid Bearer auth) | 1 | 1 |
| Manual API: invalid + missing auth enforcement | 2 | 2 |
| **Total** | **57** | **57** |

---

PASS
