# AgentPick QA Report
**Date:** 2026-03-18
**Target:** https://agentpick.dev
**Tester:** AgentPick QA Agent (Claude Code)
**Run time:** 2026-03-18T23:53Z (fresh run)

---

## Score: 50/51 (98%)

---

## P0 Blockers

None.

---

## P1 Issues

### P1-1: Embed tool name mismatch — `voyage-embed` vs expected allowlist
- **Test:** B.1-embed (cross-capability embed routing)
- **Got:** router selected `voyage-embed`
- **QA suite expected:** one of `["cohere-embed", "voyage-ai", "jina-embeddings"]`
- The call returned HTTP 200 and succeeded, so this may be a QA script allowlist being outdated rather than a production regression. However, if `voyage-embed` is a renamed adapter, downstream users referencing the old ID could break.
- **Action:** Verify the correct registered tool ID in the router registry; update QA allowlist to match production.

---

## What Looks Good

### Automated QA Suite: 50/51 (98%)

**Router Core**
- Registration → free API key issued correctly (`plan=FREE`)
- Search routing → `tavily` (balanced), `exa-search` (best_performance), `brave-search` (cheapest)
- Crawl routing → `jina-ai`
- Adapter returns real data with answer, sources, response time
- Fallback works: unknown tool falls back gracefully (`fallback_used=True, fallback_from=nonexistent-tool-xxx`)
- All 4 strategies produce different tool selections
- 8 calls recorded in history after test run
- Health endpoint: `healthy`, correct metrics shape

**Developer Dashboard API (7/7)**
- Usage stats, fallback analytics, strategy comparison: all HTTP 200
- Set strategy, set budget, set priority tools: all update correctly
- Weekly report generates with accurate call summary

**AI-Powered Routing (5/5)**
- Deep research query → `exa-search` (`type=research, depth=deep`)
- Realtime query → `tavily` (`type=realtime, freshness=realtime`)
- Simple query → `tavily` (`type=simple, depth=shallow`)
- Classification latency: 150ms
- AI insights endpoint returns correct breakdown by query type

**Auth & Schema (5/5)**
- Invalid API key → 401
- Missing API key → 401
- Account fields: `plan, monthlyLimit, callsThisMonth, strategy`
- Call record fields: `id, capability, query, toolRequested, toolUsed, strategyUsed, latencyMs, costUsd, resultCount, ...`

**Edge Cases (5/5)**
- Empty query → 400
- Invalid capability → 404
- 5000-char query → 413
- Invalid strategy → 400
- 5 concurrent calls → all HTTP 200

**Finance capability (bonus):** `polygon-io` correctly selected

---

### Page Load Tests

| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ | Title: "AgentPick — The runtime layer for agent tools"; nav: Live, Rankings, Benchmarks, Agents, Router, Dashboard; hero, pricing tiers, live stats (493 agents, 36 calls routed today) all present |
| `/connect` | ✅ | pip install visible; REST API examples; strategy docs; pricing; MCP config snippet; no broken elements |
| `/dashboard` | ✅ | Loads; displays plan/strategy/spend UI; API key input gate; no hard login wall |
| `/products/tavily` | ✅ | Rank #10, score 6.2/10, 5,330 verified calls, 75 active agents, latency metrics, agent reviews — all rendered |

---

### API: POST /api/v1/router/search with Bearer Auth
- Authenticated requests with valid Bearer token: HTTP 200, real results returned
- Invalid/missing key: HTTP 401 (correct enforcement)
- Response shape verified: `data` (results, answer) + `meta` (tool_used, latency_ms, ai_classification, cost_usd)

---

### Visual / UX
- Dark theme consistent across all pages
- Dark code block on homepage with `pip install agentpick` present
- `/connect` link on homepage present
- No broken images or layout issues detected
- All nav items present on homepage

---

## Summary

Router core, fallback system, AI-powered routing, auth enforcement, and all main pages are working correctly. The only failure is a tool ID naming mismatch on the embed capability (`voyage-embed` returned vs `voyage-ai` expected by QA allowlist) — likely a QA script maintenance issue rather than a production regression. No P0 blockers found.

---

PASS
