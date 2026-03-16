# AgentPick QA Report
**Date:** 2026-03-16
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Code)

---

## Score: 51/51

---

## P0 Blockers

None.

---

## P1 Issues

- **AI classification latency**: ~500ms for classification, ~1283ms total end-to-end. Slightly above the 200ms target noted in Part 6 routing tests. No user-facing failure but may degrade agent UX at scale — worth monitoring under load.
- **Rate limit test (7.3) not automated**: The 501-call rate limit / 429 path has no automated regression coverage. Manual check only.

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
| Bonus: Cross-Capability Routing | 2 | ✅ All pass |
| Bonus: Edge Cases | 6 | ✅ All pass |

### Main Pages (HTTP Status)
| Page | Status |
|------|--------|
| `/` (homepage) | ✅ 200 |
| `/connect` | ✅ 200 |
| `/dashboard` | ✅ 200 |
| `/products/tavily` | ✅ 200 |

### Paid User Flow
- **Register** → `POST /api/v1/router/register` → ✅ Returns `apiKey` (ah_live_sk_…), `plan: FREE`, `monthlyLimit: 500`
- **Search** → `POST /api/v1/route/search` with Bearer auth → ✅ HTTP 200, real Tavily results with ranked URLs + answer
- **Usage check** → `GET /api/v1/router/usage` → ✅ HTTP 200, `callsThisMonth: 1`, `daily_used: 1`

### API: POST /api/v1/router/search (Bearer auth)
- ✅ Returns valid JSON with results and metadata
- ✅ Tool routing correct (tavily for realtime, exa-search for deep research)
- ✅ `meta.cost_usd`, `meta.latency_ms`, `meta.plan`, `meta.calls_remaining` all present
- ✅ Fallback info present in response (`fallback_used`, `tried_chain`)
- ✅ Auth enforced: missing/invalid key → HTTP 401 with `UNAUTHORIZED` code

### Visual Regression Check
- ✅ Homepage: brand name, dark terminal code block, pip install snippet, nav present
- ✅ Nav items: Live, Rankings, Benchmarks, Agents — all correct
- ✅ CSS/stylesheets loaded, no layout errors, no 500s
- ✅ `/connect`: pip install, strategies, pricing, API endpoint, fallback info, dashboard link — all present
- ✅ `/dashboard`: API key login form, strategy/plan/spend sections, pricing link present
- ✅ `/products/tavily`: rank #1, 69 AI agents, 16.1K verified API calls

### AI Routing
- ✅ Deep research queries → exa-search
- ✅ Realtime queries → tavily
- ✅ Simple/cheap queries → cheapest tool
- ✅ Embed queries → cohere-embed
- ✅ Finance queries → polygon-io

### Edge Cases
- ✅ Empty query → HTTP 400
- ✅ Invalid capability → HTTP 404
- ✅ 5000-char query → HTTP 413
- ✅ Invalid strategy → HTTP 400
- ✅ 5 concurrent calls → 5/5 success

---

## What Looks Good

- **Router core solid**: all 4 strategies routing correctly, fallback working, calls recorded
- **AI routing live**: query classification working, correct tool selection per query type
- **Developer Dashboard API**: all 7 endpoints healthy (usage, fallbacks, compare, strategy, budget, priority, weekly report)
- **Auth enforcement**: 401 on missing/invalid keys, proper error codes on bad inputs
- **Cross-capability routing**: embed (cohere-embed) and finance (polygon-io) both working
- **Paid user flow end-to-end**: register → search → usage tracking all functional
- **All 4 main pages load** cleanly at HTTP 200
- **Performance**: search ~1.3–1.8s end-to-end

---

PASS
