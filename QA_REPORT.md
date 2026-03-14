# AgentPick QA Report — Round 10 (2026-03-14)

**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)
**Script:** agentpick-router-qa.py (full mode)

---

## Score: 55/57

| Category | Tests | Passed | Failed |
|---|---|---|---|
| Router QA Script (full suite) | 51 | 49 | 2 |
| Page Load Checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 | 0 |
| API Bearer Auth Test (manual) | 1 | 1 | 0 |
| Paid User Flow (register → search → usage check) | 1 | 1 | 0 |
| **Total** | **57** | **55** | **2** |

---

## P0 Blockers

**None.**

---

## P1 Issues

### P1-1: Deep-research routing misclassification (`6.1-deep-research`)
- **Symptom:** Query `"comprehensive analysis of global chip shortage causes and solutions with supply chain implications"` with `strategy: best_performance` was classified `type=news, depth=shallow`, routing to `tavily` instead of `exa-search` or `perplexity`.
- **Expected:** Analytical multi-factor queries should classify as `type=research, depth=deep` → exa-search or perplexity when using `best_performance`.
- **Impact:** Users relying on `best_performance` for comprehensive research queries may receive shallower results. Routing is only affected for queries with news-adjacent framing despite analytical intent.
- **Note:** Clearly technical queries (e.g. quantum computing algorithms) correctly route to `exa-search`. The classifier struggles with socioeconomic/policy analysis framing.
- **File:** `src/lib/router/ai-classify.ts`

### P1-2: Auth-missing QA script regression (`7.5-auth-missing`) — likely test isolation bug
- **Symptom:** Automated QA script reported HTTP 200 for request with no Authorization header.
- **Manual re-test result:** HTTP 401 with `{"error":{"code":"UNAUTHORIZED","message":"Invalid or missing API key."}}` ✅
- **Assessment:** The QA script's `http()` helper auto-injects `_dev_key` if set (`if _dev_key and "Authorization" not in h`). The 7.5 test likely ran while `_dev_key` was populated from earlier tests — making it an authenticated request, not an unauthenticated one. Auth enforcement is correct in production.
- **Recommendation:** Fix QA script test 7.5 to explicitly clear the `_dev_key` global before testing the no-auth case.

---

## P2 / Minor

- Previous round's P1-1 (`6.2-realtime` inconsistency) is **resolved** — realtime queries now consistently route to `tavily` with `type=realtime, freshness=realtime` classification. ✅

---

## What Looks Good

### Automated QA Script (49/51 = 96%)
- **Router core (Part 1):** Registration, search routing, crawl routing, adapter data, fallback, strategy differentiation (4 strategies → 4 distinct tools), call recording, health — all 8 pass ✅
- **Developer Dashboard API (Part 2):** Usage, fallbacks, compare, set-strategy, set-budget, set-priority, weekly report — all 7 pass ✅
- **`/connect` page content (Part 3):** pip install, strategies, pricing, API endpoint, get-key, auto-fallback, dashboard link — all 7 pass ✅
- **Homepage code block (Part 4):** pip install block, /connect link, dark styling — all pass ✅
- **Nav (Part 5):** Router nav item present, items `[Live, Rankings, Benchmarks, Agents]` correct — pass ✅
- **AI-powered routing (Part 6):** Realtime → tavily, simple → tavily, classification latency ~500ms, AI insights summary — 4/5 pass ✅
- **Schema & data integrity (Part 7):** Account fields, call fields, rate limiting, invalid key → 401 — 4/5 pass ✅
- **Dashboard Web UI (Part 8):** HTTP 200, calls/strategy/tools/settings — all pass ✅
- **Bonus cross-capability:** embed → cohere-embed, finance → polygon-io ✅
- **Edge cases:** empty → 400, invalid capability → 404, 5000-char → 413, invalid strategy → 400, 5 concurrent all succeed ✅

### Page Load Verification (Manual)
| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ 200 | Hero ("Your agent is picking tools blindly. We fix that"), nav (Live/Rankings/Benchmarks/Agents/Router/Dashboard), Free/Pro($29)/Growth($99) pricing, code block |
| `/connect` | ✅ 200 | Code generator, playground, 5 strategies, pricing, pip install, SDK + REST docs |
| `/dashboard` | ✅ 200 | Plan section, strategy switcher, spend/budget controls, API key entry — no broken redirects |
| `/products/tavily` | ✅ 200 | Rank #1 Search & Research, 6.3/10 score, 2301 verified calls, p50=814ms latency, agent feedback |

### API: `POST /api/v1/router/search` with Bearer Auth (Manual)
- Valid key → HTTP 200, real results, full `meta` object ✅
- Invalid key → HTTP 401 ✅
- No Authorization header → HTTP 401 ✅
- Response schema: `{ data: { results[], answer, ... }, meta: { tool_used, latency_ms, fallback_used, trace_id, cost_usd, result_count, byok_used, strategy, plan, calls_remaining } }`

### Paid User Flow (End-to-End)
1. `POST /api/v1/router/register` → `{ apiKey: "ah_live_sk_74974...", plan: "FREE", monthlyLimit: 500 }` ✅
2. `POST /api/v1/router/search` (Bearer) → 10 real results, `tool_used: exa-search`, `latency_ms: 600`, `fallback_used: false` ✅
3. `GET /api/v1/router/usage` → `callsThisMonth: 1, plan: FREE` — correctly incremented ✅

### Infrastructure Health
- `GET /api/v1/health` → `{ status: "ok", db: { status: "ok", latency_ms: 6 }, uptime_s: 112, commit: "9fb2a0f" }` ✅

---

## Manual API Sample

```
POST /api/v1/router/register
→ 200: { apiKey: "ah_live_sk_74974274...", plan: "FREE", monthlyLimit: 500 }

POST /api/v1/router/search (Authorization: Bearer ah_live_sk_74974274...)
Body: { query: "best AI coding assistants 2026", strategy: "balanced" }
→ 200: {
    data: { results: [10 items], answer: "GitHub Copilot, PlayCode AI, Replit Agent 3..." },
    meta: { tool_used: "tavily", latency_ms: 600, fallback_used: false,
            cost_usd: 0.002, result_count: 10, strategy: "MOST_ACCURATE",
            plan: "FREE", calls_remaining: 195 }
  }
```

---

PASS
