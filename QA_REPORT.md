# AgentPick QA Report — Round 14 (2026-03-15)

**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)
**Script:** agentpick-router-qa.py (full mode)

---

## Score: 62/67

| Category | Tests | Passed | Failed |
|---|---|---|---|
| Router QA Script (full suite) | 51 | 48 | 3 |
| Page Load Checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 | 0 |
| API Bearer Auth Test | 8 | 7 | 1 |
| Paid User Flow (register → search → usage → account) | 4 | 3 | 1 |
| **Total** | **67** | **62** | **5** |

---

## P0 Blockers

### 1. `GET /api/v1/router/calls` → HTTP 500 (tests `1.5-calls-recorded` + `7.2-call-fields`)
- **Error:** `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}`
- **Impact:** Call history endpoint is completely broken. Developers cannot view their call logs. Dashboard call history will display nothing or error. **Reproduced twice independently** (automated script and manual verification).

---

## P1 Issues

### 2. `POST /api/v1/router/priority` → HTTP 400 Validation Error (test `2.6-set-priority`)
- **Error:** `{"error": {"code": "VALIDATION_ERROR", "message": "Provide tools/priority_tools ..."}}`
- **Impact:** Priority tool configuration is broken. Developers cannot set custom tool priority ordering via API.

### 3. Account info returns `null` for new users
- **Endpoint:** `GET /api/v1/router/account`
- **Observed:** `plan: None, monthlyLimit: None, strategy: None` on a freshly-registered account
- **Expected:** `plan: "FREE"`, `monthlyLimit: 500`, `strategy: "auto"` (defaults should be populated)
- **Impact:** New user dashboard shows blank values on first login. Onboarding experience is broken.

### 4. `GET /api/v1/router/health` returns 401 without auth
- **Expected:** Public health/status endpoint (no auth required)
- **Actual:** Returns 401 — `{"error": {"code": "UNAUTHORIZED", "message": "Invalid or missing API key."}}`
- **Impact:** External uptime monitors, status pages, and health check pings cannot reach this endpoint without embedding an API key.

---

## Regressions vs Round 13

| Check | Round 13 | Round 14 |
|-------|----------|----------|
| `1.5-calls-recorded` | ✅ PASS | ❌ HTTP 500 |
| `2.6-set-priority` | ✅ PASS | ❌ HTTP 400 |
| `7.2-call-fields` | ✅ PASS | ❌ HTTP 500 |
| `/api/v1/router/health` (no auth) | ✅ PASS | ❌ HTTP 401 |
| Account defaults for new user | ✅ PASS | ❌ nulls returned |

All 5 failures are **regressions** from Round 13 (which was 58/58).

---

## What Looks Good

### Core Routing Engine (✅ Fully functional)
- Search routing: AI classification working, routes correctly by query type
- Strategy differentiation: `best_performance → exa-search`, `cheapest → brave-search`, `balanced → tavily`, `most_stable` ✅
- Fallback: unknown tool gracefully falls back with `fallback_used=true` ✅
- AI classification latency: ~501ms classify, ~1236ms end-to-end ✅
- Crawl routing → firecrawl ✅
- Embed routing → cohere-embed ✅
- Finance routing → polygon-io ✅

### Authentication (✅ All correct)
- Invalid key → 401 ✅
- Missing key → 401 ✅
- Valid key → 200 ✅

### Pages (✅ All loading cleanly)
| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ 200 | Hero, nav, pricing, dark code block, live stats, 26 APIs listed |
| `/connect` | ✅ 200 | pip install, code generator, SDK + REST docs, strategy selector |
| `/dashboard` | ✅ 200 | Plan section, strategy switcher, spend controls |
| `/products/tavily` | ✅ 200 | Rank #1, 6.3/10 score, p50 834ms, 100% success rate, reviews |

### Developer Dashboard API (✅ Mostly passing)
- Usage: 200 ✅ | Fallbacks: 200 ✅ | Compare: 200 ✅
- Set strategy (AUTO): 200 ✅ | Set budget ($50): 200 ✅ | Weekly report: 200 ✅

### Edge Cases (✅ All handled)
- Empty query → 400 ✅
- Invalid capability → 404 ✅
- 5000-char query → 413 ✅
- Invalid strategy → 400 ✅
- 5 concurrent requests → 5/5 succeed ✅

### Registration + Search Flow (✅ Core working)
- `POST /api/v1/router/register` → 201, returns `ah_live_sk_...` key ✅
- `POST /api/v1/route/search` with fresh key → 200, real results returned ✅
- `GET /api/v1/router/usage` → 200 ✅
- `GET /api/v1/router/fallbacks` → 200 ✅

---

## Summary

The **core routing engine remains healthy** — search, fallback, strategy selection, AI classification, and auth all pass. However, this round introduced **3 new regressions** that were passing in Round 13: the call history endpoint now returns HTTP 500 consistently (P0), and priority configuration + health endpoint auth have regressed. New user account defaults returning null values is also a new issue affecting onboarding.

---

FAIL
