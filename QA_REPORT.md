# AgentPick QA Report — 2026-03-18 (Updated)
**Date:** 2026-03-18
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)

---

## Score: 58/58

---

## P0 Blockers

None.

---

## P1 Issues

**API key field naming inconsistency** — `POST /api/v1/router/register` returns `{"apiKey": "..."}` while some internal tooling may expect `{"key": "..."}`. The automated QA script still passes 51/51, so no functional breakage — but external SDK/docs consumers could be affected if documented as `key`. Worth aligning the field name or documenting clearly.

---

## P2 / Minor Issues

- No dedicated `/api/v1/account` shortcut endpoint; account info lives under `/api/v1/router/usage`. Any external docs referencing a standalone account path will 404.
- `meta.ai_classification` is null for non-AUTO strategies (e.g. `balanced`). Routing is still correct; classification is informational only and only applies to AUTO mode. Acceptable behavior but worth noting in docs.

---

## What Looks Good

| Area | Result |
|------|--------|
| **Automated QA script (51/51)** | 100% pass — all router core, API, pages, AI routing, edge cases, bonus caps |
| **Homepage (`/`)** | Loads cleanly. Hero ("Your agent is picking tools blindly. We fix that."), dark pip-install code block, pricing (3 tiers), 469 agents metric, 26-API carousel, full nav (Live/Rankings/Benchmarks/Agents/Router/Dashboard) |
| **`/connect` page** | All content present: pip install (Python + JS), 5 routing strategies, Free/Pro/Growth pricing, auto-fallback info, dashboard link |
| **`/dashboard` page** | Loads 200 with plan capacity bar, strategy selector, budget controls, API key auth flow |
| **`/products/tavily` page** | Full benchmark data: Agent Score 6.7/10, 74 agents evaluated, 5,020 verified calls, p50 915ms, p99 2,099ms, 100% success rate, advocates/critics, Arena + X-Ray CTAs |
| **Bearer auth enforcement** | Invalid key → 401 `UNAUTHORIZED`, no key → 401 — both `POST /api/v1/router/search` and `POST /api/v1/route/search` enforce auth correctly |
| **Paid user flow** | Register → `apiKey` issued (`plan=FREE`, `monthlyLimit=500`) → search → 9 results with full metadata → calls logged with tool/latency/cost — end-to-end clean |
| **Strategy routing** | `best_performance` → exa-search, `cheapest` → brave-search, `auto`/`balanced` → tavily — all correct |
| **AI classification (AUTO)** | Classifies query type (realtime/research/simple/news), selects tool accordingly. Classification latency ~151ms, total ~1.3–1.6s |
| **Fallback system** | Invalid tool triggers automatic fallback to tavily. `fallback_used=true` correctly surfaced in response meta |
| **Concurrent requests** | 5 parallel calls: 5/5 returned 200 |
| **Edge cases** | Empty query → 400, invalid capability → 404, 5000-char query → 413, invalid strategy → 400 |
| **Embed + Finance routing** | cohere-embed and polygon-io route correctly by capability |
| **Usage tracking** | Calls reflected in real-time: `callsThisMonth`, `daily_used`, `calls_remaining` all accurate after test searches |

---

## Test Coverage Summary

| Suite | Passed | Total |
|-------|--------|-------|
| Automated QA script | 51 | 51 |
| Manual page checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 |
| Manual API: Bearer auth search (valid + invalid key) | 2 | 2 |
| Manual paid user flow (register → search → results → usage) | 1 | 1 |
| **Total** | **58** | **58** |

*No P0 blockers. One P1 (field naming cosmetic inconsistency, no runtime breakage).*

---

PASS
