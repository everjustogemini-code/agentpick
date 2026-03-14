# AgentPick QA Report — Round 9 (2026-03-14)

**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)
**Script:** agentpick-router-qa.py (full mode)

---

## Score: 49/51

---

## P0 Blockers

None.

---

## P1 Issues

### P1-1: Realtime routing inconsistency (`6.2-realtime`)
- **Symptom:** Automated QA observed `serpapi-google` selected for a realtime query. Direct manual retest with an equivalent "breaking news" query routed to `tavily` instead.
- **Expected:** A consistent realtime-optimized tool for queries classified `type=realtime, freshness=realtime`.
- **Impact:** AI routing for realtime queries is non-deterministic — callers relying on freshness guarantees may get inconsistent tool selection run-to-run.
- **File:** `src/lib/router/ai-classify.ts`, `src/lib/router/index.ts`

### P1-2: Auth-missing edge case (`7.5-auth-missing`)
- **Symptom:** Automated QA observed HTTP 200 for a request with no Authorization header. Manual retests (no header, empty header) both correctly returned HTTP 401.
- **Expected:** All requests without a valid `Authorization: Bearer <key>` should return HTTP 401.
- **Impact:** Possible intermittent auth bypass for a specific missing-auth request format (race condition or middleware ordering issue).
- **File:** `src/lib/router/index.ts` — auth middleware

---

## P2 / Minor

None significant.

---

## What Looks Good

### Automated QA (49/51 = 96%)
- **Router core (Part 1):** Registration, search routing, crawl routing, adapter data, fallback, strategy differentiation, call recording, health endpoint — all 8 pass
- **Developer Dashboard API (Part 2):** Usage, fallbacks, compare, set-strategy, set-budget, set-priority, weekly report — all 7 pass
- **`/connect` page content (Part 3):** pip install, strategies, pricing, API endpoint, get-key, auto-fallback, dashboard link — all 7 pass
- **Homepage code block (Part 4):** pip install block, /connect link, dark styling — all pass
- **Nav (Part 5):** Router nav item present, correct items `[Live, Rankings, Benchmarks, Agents]` — pass
- **AI-powered routing (Part 6):** Deep research → exa-search, simple → tavily, classification latency ~500ms, AI insights — 4/5 pass (6.2 realtime inconsistency)
- **Schema & data integrity (Part 7):** Account fields, call fields, rate limiting, invalid key → 401 — 4/5 pass (7.5 edge case)
- **Dashboard Web UI (Part 8):** HTTP 200, calls/strategy/tools/settings — all pass
- **Bonus cross-capability:** embed → cohere-embed, finance → polygon-io — pass
- **Edge cases:** empty query → 400, invalid capability → 404, 5000-char → 413, invalid strategy → 400, 5 concurrent all succeed — all 5 pass

### Page Load Verification (Manual)
| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ 200 | Hero, nav, pricing, 26-tool carousel, dark code block all present |
| `/connect` | ✅ 200 | pip install, 5 strategies, pricing tiers, code generator present |
| `/dashboard` | ✅ 200 | Plan/strategy/spend/connect sections, no redirect on load |
| `/products/tavily` | ✅ 200 | Score (6.1/10), latency metrics, agent reviews, scoring breakdown |

### API: `POST /api/v1/router/search` with Bearer Auth (Manual)
- Valid key → HTTP 200, real search results, `meta` object includes `tool_used`, `latency_ms`, `fallback_used`, `cost_usd`, `calls_remaining` ✅
- Invalid key → HTTP 401 ✅
- No Authorization header → HTTP 401 ✅
- Response structure: `{ data: { results, answer, ... }, meta: { tool_used, latency_ms, fallback_used, trace_id, cost_usd, result_count, byok_used, strategy, plan, calls_remaining } }`

### User Flow (Register → Search → Verify)
1. `POST /api/v1/router/register` → API key issued, plan=FREE, monthlyLimit=500 ✅
2. `POST /api/v1/router/search` (Bearer) → real results returned with AI routing ✅
3. `GET /api/v1/router/usage` → callsThisMonth incremented correctly ✅

### Recently Shipped (verified working)
- BYOK support (`src/lib/router/sdk.ts`, `env-lock.ts`) — functional
- Blog page updated, llms.txt route updated
- Weekly report page for 2026-03-28 added

---

## Manual API Sample

```
POST /api/v1/router/register
→ 200: { apiKey: "ah_live_sk_b96be0...", plan: "free", monthlyLimit: 500 }

POST /api/v1/router/search (Authorization: Bearer ah_live_sk_b96be0...)
Body: { query: "latest AI news 2026", strategy: "balanced" }
→ 200: {
    data: { results: [5 items], answer: "AI is transitioning from hype to practical..." },
    meta: { tool_used: "exa-search", latency_ms: 399, fallback_used: false,
            cost_usd: 0.002, result_count: 10, strategy: "MOST_ACCURATE",
            plan: "FREE", calls_remaining: 197 }
  }
```

---

FAIL
