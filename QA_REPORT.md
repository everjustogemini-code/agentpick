# AgentPick QA Report
**Date:** 2026-03-16
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Code)

---

## Score: 55/56

---

## P0 Blockers

None.

---

## P1 Issues

### 1. Registration endpoint inconsistency
- **`/api/v1/keys/register`** returns 404 (NOT_FOUND)
- Correct endpoint is **`/api/v1/agents/register`**
- The `/connect` page shows the correct endpoint, but any external docs using `keys/register` will break
- Response key is `api_key` (snake_case), not `apiKey` (camelCase) — minor inconsistency with JS conventions

---

## Test Results

### Automated QA Suite (`agentpick-router-qa.py`)
**51/51 passed (100%)**

| Part | Tests | Result |
|------|-------|--------|
| Part 1: Router Core | 9 | ✅ All pass |
| Part 2: Developer Dashboard API | 7 | ✅ All pass |
| Part 3: /connect Page | 7 | ✅ All pass |
| Part 4: Homepage Dark Code Block | 3 | ✅ All pass |
| Part 5: Nav Update | 2 | ✅ All pass |
| Part 6: AI-Powered Routing | 5 | ✅ All pass |
| Part 7: Schema & Data Integrity | 5 | ✅ All pass |
| Part 8: Dashboard Web UI | 5 | ✅ All pass |
| Bonus: Cross-Capability | 2 | ✅ All pass |
| Bonus: Edge Cases | 5 | ✅ All pass |

### Main Pages (HTTP Status)
| Page | Status |
|------|--------|
| `/` (homepage) | ✅ 200 |
| `/connect` | ✅ 200 |
| `/dashboard` | ✅ 200 |
| `/products/tavily` | ✅ 200 |

### Paid User Flow (manual end-to-end)
- **Register** → `POST /api/v1/agents/register` → ✅ Returns `api_key`, `agent_id`, `status: active`
- **Search** → `POST /api/v1/router/search` with Bearer auth → ✅ HTTP 200, real results via tavily (1768ms), 10 results
- **Usage check** → `GET /api/v1/router/usage` → ✅ HTTP 200, shows `callsThisMonth: 1`, `daily_used: 1`, full stats object

### API: POST /api/v1/router/search (Bearer auth)
- ✅ Returns valid JSON with `data` and `meta` fields
- ✅ `meta.tool_used: "tavily"`, `meta.latency_ms: 1768`, `meta.cost_usd: 0.001`
- ✅ `meta.plan: "FREE"`, `meta.calls_remaining: 199`
- ✅ Fallback info present (`fallback_used: false`, `tried_chain`)
- ✅ Auth enforced: missing/invalid key → HTTP 401

### Visual Regression Check
- ✅ Brand name present on homepage
- ✅ Nav present with correct items: [Live, Rankings, Benchmarks, Agents]
- ✅ CSS/stylesheet loaded
- ✅ No error pages or 500s on any page
- ✅ Dark code block on homepage with pip install snippet
- ✅ /connect page: pip install, strategies, pricing, API endpoint, get-API-key CTA, auto-fallback info, dashboard link — all present

### AI Routing
- ✅ Deep research queries → exa-search
- ✅ Realtime queries → tavily
- ✅ Simple queries → tavily
- ✅ AI classification latency ~500ms, total ~1400ms
- ✅ AI insights available in usage endpoint

### Edge Cases
- ✅ Empty query → HTTP 400
- ✅ Invalid capability → HTTP 404
- ✅ 5000-char query → HTTP 413
- ✅ Invalid strategy → HTTP 400
- ✅ 5 concurrent calls → 5/5 success

---

## What Looks Good

- **Router core solid**: all 4 strategies routing correctly, fallback working, calls recorded
- **AI routing live**: query classification working with correct tool selection per type
- **Developer dashboard API**: all 7 endpoints healthy (usage, fallbacks, compare, strategy, budget, priority, weekly report)
- **Auth enforcement**: 401 on missing/invalid keys, proper error codes on bad inputs
- **Cross-capability routing**: embed (cohere-embed) and finance (polygon-io) both working
- **Paid user flow end-to-end**: register → search → usage tracking all functional
- **All 4 main pages load** cleanly at HTTP 200
- **Performance**: search ~1.8s end-to-end, AI classification ~500ms

---

PASS
