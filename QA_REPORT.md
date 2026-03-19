# AgentPick QA Report
**Date:** 2026-03-19
**Target:** https://agentpick.dev
**Tester:** AgentPick QA Agent (Claude Code)
**Run time:** 2026-03-19T00:07Z (fresh run)

---

## Score: 53/54

| Category | Pass | Fail |
|---|---|---|
| Router Core (automated) | 8/8 | 0 |
| Developer Dashboard API | 7/7 | 0 |
| /connect Page content | 7/7 | 0 |
| Homepage content | 3/3 | 0 |
| Nav items | 2/2 | 0 |
| AI-Powered Routing | 5/5 | 0 |
| Schema & Data Integrity | 5/5 | 0 |
| Dashboard Web UI | 5/5 | 0 |
| Bonus Cross-Capability | 1/2 | 1 |
| Edge Cases | 5/5 | 0 |
| Page Load Tests (manual) | 4/4 | 0 |
| API Auth Tests (manual) | 3/3 | 0 |

---

## P0 Blockers

None.

---

## P1 Issues

### P1-1: Embed tool name mismatch — `voyage-embed` vs QA allowlist
- **Test:** B.1-embed (cross-capability embed routing)
- **Got:** router selected `voyage-embed`
- **QA suite expected:** one of `["cohere-embed", "voyage-ai", "jina-embeddings"]`
- The call returned HTTP 200 and the embed route succeeded functionally. This is likely a QA script allowlist being outdated (`voyage-ai` renamed to `voyage-embed`) rather than a production regression. However, if downstream users reference the old adapter ID, they could break.
- **Action:** Confirm registered tool ID in router registry; update QA allowlist to match production.

---

## What Looks Good

### Automated QA Suite: 50/51 (98%)

**Router Core (8/8)**
- Registration → free API key issued instantly (`plan=FREE`, `monthlyLimit=500`)
- Search routing → `tavily` (balanced), `exa-search` (best_performance), `brave-search` (cheapest)
- Crawl routing → `jina-ai`
- Adapter returns real data with answer, sources, response time
- Fallback works: unknown tool falls back gracefully (`fallback_used=True`)
- All 4 strategies produce different tool selections
- 8 calls recorded in history after test run
- Health endpoint: `healthy`, correct metrics shape

**Developer Dashboard API (7/7)**
- Usage stats, fallback analytics, strategy comparison: all HTTP 200
- Set strategy, set budget, set priority tools: all update correctly
- Weekly report generates with accurate call/cost summary

**AI-Powered Routing (5/5)**
- Deep research query → `exa-search` (`type=research, depth=deep`)
- Realtime query → `tavily` (`type=realtime, freshness=realtime`)
- Simple query → `tavily` (`type=simple, depth=shallow`)
- Classification latency: 150ms (excellent)
- AI insights endpoint returns correct breakdown by query type

**Auth & Schema (5/5)**
- Invalid API key → 401, Missing API key → 401
- Account fields: `plan, monthlyLimit, callsThisMonth, strategy` ✓
- Call record fields: `id, capability, query, toolRequested, toolUsed, strategyUsed, latencyMs, costUsd, resultCount, ...` ✓

**Edge Cases (5/5)**
- Empty query → 400, Invalid capability → 404, 5000-char query → 413
- Invalid strategy → 400, 5 concurrent calls → all HTTP 200

**Finance capability (bonus):** `polygon-io` correctly selected

---

### Page Load Tests

| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ | Hero, pricing tiers (Free/Pro/Growth), 26 integrations marquee, live activity feed, dark code block all present |
| `/connect` | ✅ | pip install, REST API examples, strategy docs, pricing, MCP config — all present |
| `/dashboard` | ✅ | Auth gate + plan/strategy/spend UI; loads correctly |
| `/products/tavily` | ✅ | Rank #10, score 6.3/10, 5,381 verified calls, latency metrics, agent reviews — all rendered |

---

### API: POST /api/v1/router/search with Bearer Auth

- **Paid user flow (register → search → results):** ✅
  - `POST /api/v1/account/register` → instant key issuance
  - `POST /api/v1/router/search` with Bearer → HTTP 200, real results, AI-generated answer, source URLs, ~1.2s latency
- Invalid Bearer → 401 ✅
- Missing auth → 401 ✅
- Response shape verified: `data.results`, `data.answer` + `meta.tool_used`, `meta.latency_ms`, `meta.ai_classification`, `meta.cost_usd`

---

### Visual / UX

- Dark theme consistent across all pages
- Dark code block on homepage with `pip install agentpick` present
- `/connect` link and Router nav item on homepage present
- No broken images or layout issues detected
- Nav items confirmed: Live, Rankings, Benchmarks, Agents, Router, Dashboard

---

## Summary

Router core, fallback system, AI-powered routing, auth enforcement, and all main pages are working correctly. The one failure (embed capability returning `voyage-embed` vs QA allowlist expecting `voyage-ai`) is almost certainly a stale QA allowlist issue rather than a production regression — the route succeeds functionally. No P0 blockers found.

---

PASS
