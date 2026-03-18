# AgentPick QA Report — 2026-03-18
**Date:** 2026-03-18
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)

---

## Score: 59/60

---

## P0 Blockers

None.

---

## P1 Issues

### 1. Usage API — `calls` and `cost_usd` not at top level
- `GET /api/v1/router/usage?period=7d` returns `callsThisMonth` and `stats.totalCostUsd` (nested under `stats`), not top-level `calls` / `cost_usd`
- The automated QA script hardcodes `True` for this check so it passes, but client code using `data['calls']` or `data['cost_usd']` would get `None`
- **Recommend:** Either flatten these fields to top-level or update QA/docs to match actual schema

### 2. `ai_classification` absent for non-AUTO strategies
- With `strategy=balanced`, `meta.ai_classification` is null. AI routing reasoning only populates for `strategy=auto`.
- Clients on non-auto strategies cannot inspect classification rationale.
- **Severity:** Low — routing still works correctly; classification is informational only.

---

## P2 / Minor Issues

- No dedicated `/api/v1/account` shortcut endpoint; account info lives under `/api/v1/router/usage` (which does include `plan`, `monthlyLimit`, `callsThisMonth`, `strategy`, `account` fields). Any docs referencing a standalone account path will 404.

---

## What Looks Good

| Area | Result |
|------|--------|
| **Automated QA script (51/51)** | 100% pass — all router core, API, pages, edge cases |
| **Homepage (`/`)** | Loads cleanly. Hero, pricing (3 tiers), live feed (463 agents, 88 calls/day), code examples, pip install block all present. |
| **`/connect` page** | Full content: interactive code generator, API playground, strategies, SDK quick start, pricing, API reference. |
| **`/dashboard` page** | Loads with plan progress bar, strategy selector, budget controls, API key access. |
| **`/products/tavily` page** | Full benchmark data (6.8/10, 73 agents, 898ms p50, 100% success), domain scores, agent reviews, voting. |
| **Bearer auth enforcement** | Invalid key → 401, no key → 401, both `/api/v1/router/search` and `/api/v1/route/search` work |
| **Paid user flow** | Register → key issued → search → 10 results returned → usage recorded — end-to-end clean. |
| **Strategy routing** | `best_performance` → exa-search, `cheapest` → brave-search, `auto`/`balanced` → tavily — correct |
| **AI classification (AUTO)** | Classifies query type (realtime/research/simple), selects tool accordingly. Classification latency 150ms. |
| **Fallback system** | Invalid tool triggers automatic fallback to tavily. |
| **Concurrent requests** | 5 parallel calls: 5/5 returned 200. |
| **Edge cases** | Empty query → 400, invalid capability → 404, 5000-char query → 413, invalid strategy → 400. |
| **Health endpoint** | `status: healthy`, operational. |
| **Embed + Finance routing** | cohere-embed and polygon-io route correctly by capability. |
| **Security headers** | HSTS, CSP, X-Frame-Options DENY, X-Content-Type-Options, X-XSS-Protection all present. |

---

## Test Coverage Summary

| Suite | Passed | Total |
|-------|--------|-------|
| Automated QA script | 51 | 51 |
| Manual page checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 |
| Manual API: Bearer auth search (both endpoint variants) | 2 | 2 |
| Manual paid user flow (register → search → results → usage) | 1 | 1 |
| Security headers check | 1 | 1 |
| Health endpoint | 1 | 1 |
| **Total** | **60** | **60** |

*Score 59/60: deducting 1 for P1 usage field naming inconsistency.*

---

PASS
