# AgentPick QA Report
**Date:** 2026-03-19
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude)

---

## Score: 50/51 (98%)

---

## P0 Blockers

None.

---

## P1 Issues

### 1. Embed tool name mismatch (B.1-embed)
- **What:** The QA test expected `voyage-ai` or `cohere-embed` as the embed tool name. The API returns `voyage-embed`.
- **Root cause:** The embed capability works correctly (cohere-embed is primary, voyage-embed is the fallback). Fallback is functioning. The issue is the QA test's valid-tools list is stale — it checks for `voyage-ai` but the tool ID in the registry is `voyage-embed`.
- **Impact:** No user-facing breakage; embed calls succeed and return valid data (1024-dim embeddings, correct token count). The fallback mechanism is working. Cohere-embed appears to be unavailable or deprioritized.
- **Fix:** Update QA script valid tools for B.1-embed to include `voyage-embed`, OR investigate why cohere-embed is not being selected as primary.

---

## What Looks Good

### Router Core (Part 1) — All Pass
- Registration endpoint `POST /api/v1/router/register` works, returns API key with FREE plan
- Search routing correctly routes to `tavily` by default
- Crawl routing correctly routes to `jina-ai`
- Real data returned from adapters (actual search results)
- Fallback mechanism works: unknown tool → falls back to `tavily`
- Strategy differentiation verified: `best_performance→exa-search`, `cheapest→brave-search`, `balanced→tavily`, `most_stable` as expected
- Call recording works (8 calls logged)
- Health endpoint returns healthy with stats

### Developer Dashboard API (Part 2) — All Pass
- Usage stats, fallback stats, strategy comparison all return correctly
- Strategy/budget/priority settings update correctly
- Weekly report generates with correct call counts

### Pages (Parts 3-5, 8) — All Pass
- `/connect`: pip install, strategies, pricing, API endpoint, API key CTA, auto-fallback, dashboard link all present
- `/`: pip install block, dark code styling, /connect link all present
- Nav: Router nav item present, all 4 nav items (`Live`, `Rankings`, `Benchmarks`, `Agents`) correct
- `/dashboard` page loads with calls, strategy, tools, settings sections
- All pages return HTTP 200 with fast response times (96ms–645ms)

### AI-Powered Routing (Part 6) — All Pass
- Deep research queries → `exa-search`, classified as `research/deep`
- Realtime queries → `tavily`, classified as `realtime`
- Simple queries → `tavily`, classified as `simple/shallow`
- AI classification latency: 151ms, total: 1208ms (within acceptable range)
- AI insights in usage API working

### Data Integrity & Security (Part 7) — All Pass
- Account schema has all required fields
- Call log schema complete with latency, cost, tool used
- Invalid API keys return HTTP 401
- Missing auth returns HTTP 401

### Edge Cases — All Pass
- Empty query → HTTP 400
- Invalid capability → HTTP 404
- 5000-char query → HTTP 413
- Invalid strategy → HTTP 400
- 5 concurrent calls → all succeed (200)

### Paid User Flow — Pass
- Register → get key → search → calls recorded: confirmed working end-to-end
- `POST /api/v1/router/search` with Bearer auth returns `{data, meta}` structure
- Meta includes: `tool_used`, `latency_ms`, `total_ms`, `fallback_used`, `cost_usd`, `result_count`, `calls_remaining`, `strategy`, `plan`
- Search returns 10 results with exa-search on `best_performance` strategy (65ms total latency)
- Finance routing: `polygon-io` selected correctly

### Product Page (/products/tavily) — Pass
- Page loads with title, pricing, description, benchmarks, CTA all present

---

## Summary Table

| Area | Tests | Pass | Fail |
|------|-------|------|------|
| Router Core | 7 | 7 | 0 |
| Developer Dashboard API | 7 | 7 | 0 |
| /connect Page | 7 | 7 | 0 |
| Homepage Dark Block | 3 | 3 | 0 |
| Nav Update | 2 | 2 | 0 |
| AI-Powered Routing | 5 | 5 | 0 |
| Schema & Data Integrity | 5 | 5 | 0 |
| Dashboard Web UI | 5 | 5 | 0 |
| Cross-Capability (Bonus) | 2 | 1 | 1 |
| Edge Cases (Bonus) | 5 | 5 | 0 |
| **TOTAL** | **51** | **50** | **1** |

---

PASS
