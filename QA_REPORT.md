# AgentPick QA Report — Round 15 (2026-03-15)

**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)
**Script:** agentpick-router-qa.py (full mode)

---

## Score: 51/54

| Category | Tests | Passed | Failed |
|---|---|---|---|
| Router QA Script (full suite) | 51 | 49 | 2 |
| Page Load Checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 | 0 |
| **Total** | **54** | **51** | **3** |

*(Note: the 2 script failures share the same root cause — counted as 1 unique bug)*

---

## P0 Blockers

None.

---

## P1 Issues

### 1. Calls not persisted to database after routing (`1.5-calls-recorded`, `7.2-call-fields`)
- **Symptom:** `POST /api/v1/route/search` executes successfully and returns a `meta.trace_id` + `meta.cost_usd`, but the call is never written to the database.
- **Evidence:**
  - Performed 5+ searches with fresh API key
  - `GET /api/v1/router/calls?limit=10` → `{"calls": []}` consistently
  - `GET /api/v1/router/account` → `totalCalls: 0`, `callsThisMonth: 0` after multiple searches
  - `meta.trace_id` is populated in each response (e.g. `cmmsd94hw000w04lav25zr8td`), but the record is never committed
- **Impact:** Usage dashboard shows zero activity for all users. Billing/metering cannot function. Rate-limit and budget cap enforcement are broken. **Regressed from Round 14** (was HTTP 500, now 200 with empty result — partial fix but call persistence still broken).

---

## Regressions Fixed Since Round 14

| Check | Round 14 | Round 15 |
|-------|----------|----------|
| `GET /api/v1/router/calls` | ❌ HTTP 500 | ⚠️ HTTP 200, empty (partially fixed) |
| `POST /api/v1/router/priority` | ❌ HTTP 400 | ✅ HTTP 200 |
| Account defaults for new users | ❌ nulls | ✅ plan=FREE, monthlyLimit=500, strategy=AUTO |
| `/api/v1/router/health` auth | ❌ 401 | ✅ 200 |

---

## What Looks Good

### Core Routing Engine (✅ Fully functional)
- Search routing: AI classification working, routes correctly by query type
- Strategy differentiation: `best_performance→exa-search`, `cheapest→brave-search`, `balanced→tavily`, `most_stable` ✅
- Fallback: unknown tool gracefully falls back with `fallback_used=true` ✅
- AI classification latency: ~500ms classify, ~1551ms end-to-end ✅
- Crawl routing → firecrawl ✅
- Embed routing → cohere-embed ✅
- Finance routing → polygon-io ✅

### Paid User Flow (✅ Core working)
- `POST /api/v1/router/register` → 200, returns `ah_live_sk_...` key with `plan=FREE` ✅
- `POST /api/v1/route/search` with Bearer auth → 200, real results returned ✅
- Results contain `meta.tool_used`, `meta.latency_ms`, `meta.cost_usd`, `meta.ai_classification` ✅
- `GET /api/v1/router/account` → correct defaults populated ✅

### Authentication (✅ All correct)
- Invalid key → 401 ✅
- Missing key → 401 ✅
- Valid key → 200 ✅

### Pages (✅ All loading cleanly)
| Page | Status | Title |
|------|--------|-------|
| `/` | ✅ 200 | AgentPick — The runtime layer for agent tools |
| `/connect` | ✅ 200 | Route your API calls through AgentPick |
| `/dashboard` | ✅ 200 | Account, usage, and routing on one screen |
| `/products/tavily` | ✅ 200 | Tavily — AgentPick |

### Developer Dashboard API (✅ All passing)
- Usage: 200 ✅ | Fallbacks: 200 ✅ | Compare: 200 ✅
- Set strategy (AUTO): 200 ✅ | Set budget ($50): 200 ✅ | Set priority: 200 ✅ | Weekly report: 200 ✅

### Edge Cases (✅ All handled)
- Empty query → 400 ✅
- Invalid capability → 404 ✅
- 5000-char query → 413 ✅
- Invalid strategy → 400 ✅
- 5 concurrent requests → 5/5 succeed ✅

### /connect Page Content (✅ Complete)
- pip install, strategies, pricing, API endpoint, API key CTA, fallback info, dashboard link — all present ✅

### Homepage (✅ Clean)
- Dark code block with pip install ✅
- /connect link ✅
- Nav items: Live, Rankings, Benchmarks, Agents, Router ✅

---

## Summary

The core routing engine is healthy and 3 of 4 Round 14 regressions are now fixed. One P1 remains: **call records are not being persisted** — trace IDs are generated and returned in search responses, but the write to the database never completes. Usage dashboards show zero activity for all users and billing/metering cannot function.

---

FAIL
