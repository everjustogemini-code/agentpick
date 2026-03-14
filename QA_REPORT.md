# AgentPick QA Report — Round 11 (2026-03-14)

**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)
**Script:** agentpick-router-qa.py (full mode)

---

## Score: 56/57

| Category | Tests | Passed | Failed |
|---|---|---|---|
| Router QA Script (full suite) | 51 | 50 | 1 |
| Page Load Checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 | 0 |
| API Bearer Auth Test (manual) | 1 | 1 | 0 |
| Paid User Flow (register → search → usage check) | 1 | 1 | 0 |
| **Total** | **57** | **56** | **1** |

---

## P0 Blockers

**None.**

---

## P1 Issues

### P1-1: Deep-research routing misclassification (`6.1-deep-research`) *(carries over from Round 10)*
- **Symptom:** Query `"state of large language models 2025 comprehensive analysis"` with `best_performance` strategy classified as `type=news, depth=shallow`, routed to `tavily` instead of `exa-search` or `perplexity`.
- **Expected:** Analytical/academic queries should classify as `type=research, depth=deep` → exa-search or perplexity.
- **Impact:** Users relying on `best_performance` for comprehensive research get shallower results. Realtime and simple queries route correctly.
- **File:** `src/lib/router/ai-classify.ts`

### P1-2: Latency metadata inversion in `/router/search` response (`6.4-latency`) *(new)*
- **Symptom:** `classification_ms=500` > `total_ms=65` — classification latency exceeds total request latency, which is logically impossible.
- **Impact:** Observability data is misleading. Any dashboard or alerting based on these fields will produce incorrect measurements.
- **Note:** The test passes (marked ✅) because the QA script only checks that the field exists, not that the values are sane. This is a data correctness bug.

---

## Changes Since Round 10

| Issue | Round 10 | Round 11 |
|-------|----------|----------|
| `6.1-deep-research` misclassification | ❌ P1 | ❌ P1 (unresolved) |
| `7.5-auth-missing` test isolation bug | ❌ P1 (QA script) | ✅ Fixed (script fixed + confirmed HTTP 401) |
| `6.2-realtime` inconsistency | ✅ Resolved | ✅ Stays resolved |
| Latency metadata inversion | Not tested | ❌ P1 (new) |

---

## What Looks Good

### Automated QA Script (50/51 = 98%)
- **Router core (Part 1):** Registration, search routing, crawl routing, adapter data, fallback, strategy differentiation, call recording, health — all 8 pass ✅
- **Developer Dashboard API (Part 2):** Usage, fallbacks, compare, set-strategy, set-budget, set-priority, weekly report — all 7 pass ✅
- **`/connect` page content (Part 3):** pip install, strategies, pricing, API endpoint, get-key, auto-fallback, dashboard link — all 7 pass ✅
- **Homepage code block (Part 4):** pip install block, /connect link, dark styling — all pass ✅
- **Nav (Part 5):** Router nav item, items `[Live, Rankings, Benchmarks, Agents]` correct ✅
- **AI-powered routing (Part 6):** Realtime → tavily, simple → tavily, AI insights summary — 4/5 pass ✅
- **Schema & data integrity (Part 7):** Account fields, call fields, rate limiting, invalid key → 401, no key → 401 — **5/5 pass** (7.5 now fixed) ✅
- **Dashboard Web UI (Part 8):** HTTP 200, calls/strategy/tools/settings — all pass ✅
- **Bonus cross-capability:** embed → cohere-embed, finance → polygon-io ✅
- **Edge cases:** empty → 400, invalid capability → 404, 5000-char → 413, invalid strategy → 400, 5 concurrent all succeed ✅

### Page Load Verification
| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ 200 | Hero ("Your agent is picking tools blindly. We fix that"), nav, pricing (Free/$29/$99), code block, live stats (309 agents, 794 calls today) |
| `/connect` | ✅ 200 | Code generator, playground, strategies, pip install, SDK + REST docs, pricing tiers |
| `/dashboard` | ✅ 200 | Plan section, strategy switcher, spend controls, API key entry — no broken redirects |
| `/products/tavily` | ✅ 200 | Rank #1, 6.3/10 score, 2328 verified calls, p50=814ms, $0.001/call |

### API: `POST /api/v1/router/search` with Bearer Auth (Manual)
- Valid key → HTTP 200, real results ✅
- Invalid key → HTTP 401 ✅
- No Authorization header → HTTP 401 ✅
- Both `/api/v1/router/search` and `/api/v1/route/search` work ✅

### Paid User Flow (End-to-End)
1. `POST /api/v1/router/register` → `{ apiKey: "ah_live_sk_...", plan: "FREE", monthlyLimit: 500 }` ✅
2. `POST /api/v1/router/search` (Bearer) → real results, `tool_used: tavily`, `latency_ms: ~1300`, `fallback_used: false` ✅
3. `GET /api/v1/router/calls` → call recorded immediately ✅
4. `GET /api/v1/router/usage` → `callsThisMonth: 2, daily_remaining: 198` — correctly incremented ✅

---

## Manual API Sample

```
POST /api/v1/router/register
→ 200: { apiKey: "ah_live_sk_431b9c...", plan: "FREE", monthlyLimit: 500 }

POST /api/v1/router/search (Authorization: Bearer ah_live_sk_431b9c...)
Body: { query: "latest AI news today", capability: "search" }
→ 200: {
    data: { results: [5 items], answer: "Meta plans big layoffs as AI costs mount..." },
    (tool: tavily, latency ~1300ms, no fallback)
  }
```

---

FAIL
