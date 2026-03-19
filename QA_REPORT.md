# AgentPick QA Report
**Date:** 2026-03-19
**Target:** https://agentpick.dev
**Tester:** QA Agent (claude-sonnet-4-6)

---

## Score: 62/62

---

## Automated Suite (agentpick-router-qa.py)

**Result: 51/51 PASSED**

| Part | Description | Result |
|------|-------------|--------|
| 1 | Router Core (register, search, crawl, fallback, strategies, health) | 11/11 ✅ |
| 2 | Developer Dashboard API (usage, fallbacks, compare, strategy, budget, priority, report) | 7/7 ✅ |
| 3 | /connect Page content | 7/7 ✅ |
| 4 | Homepage Dark Code Block | 3/3 ✅ |
| 5 | Nav Update | 2/2 ✅ |
| 6 | AI-Powered Routing (deep research, realtime, simple, latency, insights) | 5/5 ✅ |
| 7 | Schema & Data Integrity (fields, rate limits, auth) | 5/5 ✅ |
| 8 | Dashboard Web UI | 5/5 ✅ |
| B | Bonus: Cross-Capability (embed, finance) | 2/2 ✅ |
| E | Edge Cases (empty query, invalid cap, long query, invalid strategy, concurrent) | 5/5 ✅ |

---

## Page Load Tests

| Page | Status | Notes |
|------|--------|-------|
| `/` (Homepage) | ✅ 200 | Hero, benchmarks, live feed, pricing all present |
| `/connect` | ✅ 200 | Code examples (Python/JS/curl), strategies, REST API reference |
| `/dashboard` | ✅ 200 | Plan progress, strategy selector, spend cap |
| `/products/tavily` | ✅ 200 | Metrics, benchmarks, agent reviews all present |
| `/rankings` | ✅ 200 | 11 category cards, correct nav items |

---

## Paid User Flow

| Step | Status | Detail |
|------|--------|--------|
| Register → API Key | ✅ | `POST /api/v1/router/register` → `ah_live_sk_...` plan=FREE |
| Search → Results | ✅ | 10 results returned, tool=tavily, latency ~725ms |
| Call History | ✅ | Calls recorded in `/api/v1/router/calls` |

---

## API: POST /api/v1/route/search with Bearer Auth

```
POST https://agentpick.dev/api/v1/route/search
Authorization: Bearer ah_live_sk_...
{"query": "latest AI research 2026", "strategy": "balanced"}
```

**Result:** ✅ 200 OK
**Response structure:** `{ data: { results[] }, meta: { tool_used, latency_ms, fallback_used, ai_classification, ... } }`

Sample meta from live call:
- `tool_used`: tavily
- `latency_ms`: 725ms
- `result_count`: 10
- `fallback_used`: false
- `ai_classification.type`: news/realtime/research (AI-routed correctly)

**Auth rejection:** ✅ Invalid key → 401, No key → 401

---

## P0 Blockers

None.

---

## P1 Issues

1. **Path mismatch: `/api/v1/developer/register` returns 404.** Correct registration endpoint is `POST /api/v1/router/register`. Any docs or client code using the `/developer/` prefix will silently fail.

2. **Product page missing tool pricing:** `/products/tavily` shows AgentPick benchmark data but no pricing info for the Tavily API itself. May confuse users comparing costs. (Possibly intentional for external tools.)

---

## What Looks Good

- **Router core solid:** Fallback, AI classification, strategy differentiation all working
- **AI routing quality:** deep-research → exa-search, realtime → tavily, simple → tavily; classification latency ~150ms
- **Edge cases handled:** Empty → 400, oversized → 413, invalid capability → 404, invalid strategy → 400
- **Concurrent load:** 5/5 concurrent requests succeed
- **Auth correct:** 401 on missing/invalid keys across all protected endpoints
- **Dashboard API complete:** All 7 management endpoints return correct data
- **Connect page:** Full code examples, Python SDK, REST API reference, OpenClaw integration
- **Nav up-to-date:** Router item present; Live/Rankings/Benchmarks/Agents confirmed

---

PASS
