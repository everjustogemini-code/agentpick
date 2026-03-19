# AgentPick QA Report
**Date:** 2026-03-19
**Target:** https://agentpick.dev
**Tester:** QA Agent (claude-sonnet-4-6)
**Run:** Cycle 23 post-deploy

---

## Score: 57/58

---

## Automated Suite (agentpick-router-qa.py)

**Result: 51/51 PASSED (100%)**

| Part | Description | Result |
|------|-------------|--------|
| 1 | Router Core (register, search, crawl, fallback, strategies, health) | 11/11 ✅ |
| 2 | Developer Dashboard API (usage, fallbacks, compare, strategy, budget, priority, report) | 7/7 ✅ |
| 3 | /connect Page content | 7/7 ✅ |
| 4 | Homepage Dark Code Block | 3/3 ✅ |
| 5 | Nav Update | 2/2 ✅ |
| 6 | AI-Powered Routing (deep research, realtime, simple, latency, insights) | 6/6 ✅ |
| 7 | Schema & Data Integrity (fields, rate limits, auth) | 5/5 ✅ |
| 8 | Dashboard Web UI | 5/5 ✅ |
| B | Bonus: Cross-Capability (embed, finance) | 2/2 ✅ |
| E | Edge Cases (empty query, invalid cap, long query, invalid strategy, concurrent) | 5/5 ✅ |

---

## Page Load Tests

| Page | Status | Keywords Found |
|------|--------|----------------|
| `/` (Homepage) | ✅ 200 | AgentPick, pip install, Router, Benchmark |
| `/connect` | ✅ 200 | pip install, strategy, API, dashboard |
| `/dashboard` | ✅ 200 | strategy, tools, call, usage |
| `/products/tavily` | ✅ 200 | Tavily, search, API |

---

## Paid User Flow

| Step | Status | Detail |
|------|--------|--------|
| Register → API Key | ✅ | `POST /api/v1/router/register` → `ah_live_sk_...` plan=FREE |
| Search (python ML) | ✅ | 10 results returned |
| Search (coffee SF) | ✅ | 10 results returned |
| Search (AWS vs GCP) | ✅ | 10 results returned |
| Usage counter | ✅ | Incremented correctly: 0 → 3 after 3 searches |

---

## API: POST /api/v1/router/search with Bearer Auth

```
POST https://agentpick.dev/api/v1/router/search
Authorization: Bearer ah_live_sk_...
{"query": "latest AI news 2026", "strategy": "balanced"}
```

**Result:** ✅ 200 OK
**Response structure:** `{ data: { query, answer, results[], follow_up_questions, images[] } }`

Sample live response:
- `data.answer`: summarized AI answer
- `data.results[0].score`: 0.9999 (highly relevant)
- `data.results.length`: 10 results
- AI classification: realtime → tavily routing correct

**Auth rejection:** ✅ Invalid key → 401, No key → 401

---

## P0 Blockers

None.

---

## P1 Issues

1. **API response envelope:** `POST /api/v1/router/search` wraps all data under a `data` key. Fields like `tool`, `resultCount`, `latencyMs` are not at the top level of the response — they appear nested inside `data`. The automated QA suite accounts for this, but it should be explicitly documented for SDK consumers to avoid integration confusion.

---

## What Looks Good

- **Router core solid:** Fallback, AI classification, and strategy differentiation all working perfectly
- **AI routing quality:** deep-research → exa-search, realtime → tavily, simple → tavily; classification latency ~151ms
- **Real results:** Tavily adapter returning high-quality, relevant search results with scores >0.99
- **Edge cases handled:** Empty → 400, oversized (5000 chars) → 413, invalid capability → 404, invalid strategy → 400
- **Concurrent load:** 5/5 concurrent requests all succeed with HTTP 200
- **Auth correct:** 401 on missing/invalid keys across all protected endpoints
- **Dashboard API complete:** All 7 management endpoints (usage, fallbacks, compare, strategy, budget, priority, weekly report) return correct data
- **All 4 main pages load:** /, /connect, /dashboard, /products/tavily all HTTP 200
- **Content integrity:** Homepage has dark code block with pip install; /connect has strategy/API docs; /products/tavily has Tavily info
- **Nav up-to-date:** Router item present; Live/Rankings/Benchmarks/Agents confirmed
- **Cross-capability routing:** embed → voyage-embed, finance → polygon-io working
- **Usage tracking:** Call counts increment correctly per user

---

PASS
