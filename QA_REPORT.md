# AgentPick QA Report — 2026-03-18
**Date:** 2026-03-18
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)

---

## Score: 56/57

---

## P0 Blockers

None.

---

## P1 Issues

### 1. `POST /api/v1/router/search` response — nested `meta` structure (documentation risk)
- **Issue:** Tool routing metadata (`tool_used`, `latency_ms`, `cost_usd`, `ai_classification`, `calls_remaining`) is under `meta`; results are under `data`. Top-level has no flat `tool`, `results` keys.
- **Impact:** Clients/docs relying on a flat schema will silently get null/empty. Not a runtime breakage for current SDK, but a potential integration confusion for new users.
- **Recommend:** Ensure docs and SDK wrappers accurately reflect `response.meta.tool_used` and `response.data.results` paths.

### 2. `ai_classification` absent for non-AUTO strategies
- **Issue:** With `strategy=balanced`, `meta.ai_classification` is null. AI routing reasoning is only populated for `strategy=auto`.
- **Impact:** Clients on non-auto strategies cannot inspect classification rationale.
- **Severity:** Low — routing still works correctly; classification is informational.

---

## P2 / Minor Issues

- `/api/v1/account/usage` and `/api/v1/developer/usage` return 404. Correct endpoint is `/api/v1/router/usage`. Any docs/examples referencing old paths should be updated.

---

## What Looks Good

| Area | Result |
|------|--------|
| **Automated QA script (51/51)** | 100% pass — all router core, API, pages, edge cases |
| **Homepage** | Loads cleanly. Hero, pricing, code examples, API carousel all present. |
| **`/connect` page** | Full content: code generator, strategies, SDK docs, pricing. |
| **`/dashboard` page** | Loads with plan status, strategy selector, budget controls. |
| **`/products/tavily` page** | Full benchmark data, latency stats, agent reviews, voting. |
| **Bearer auth enforcement** | Invalid key → 401, no key → 401. |
| **Paid user flow** | Register → search → usage recorded → call logged — end-to-end clean. |
| **Strategy routing** | `best_performance` → exa-search, `cheapest` → brave-search, `auto`/`balanced` → tavily. |
| **AI classification (AUTO)** | Classifies query type correctly (realtime/research/simple), selects tool accordingly. |
| **Fallback system** | Invalid tool triggers fallback to tavily. |
| **Concurrent requests** | 5 parallel calls all return 200. |
| **Edge cases** | Empty query → 400, invalid capability → 404, 5000-char query → 413, invalid strategy → 400. |
| **Health endpoint** | `status: ok`, DB latency 6ms. |
| **Embed + Finance routing** | cohere-embed and polygon-io route correctly by capability. |

---

## Test Coverage Summary

| Suite | Passed | Total |
|-------|--------|-------|
| Automated QA script | 51 | 51 |
| Manual page checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 |
| Manual API: Bearer auth search | 1 | 1 |
| Manual paid user flow (register→search→usage→calls) | 1 | 1 |
| **Total** | **57** | **57** |

*Score 56/57: deducting 1 for the P1 meta structure documentation risk.*

---

PASS
