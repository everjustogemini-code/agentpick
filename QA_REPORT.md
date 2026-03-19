# AgentPick QA Report
**Date:** 2026-03-18
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Code)

---

## Score: 50/51 (automated) — manual findings below

---

## P0 Blockers

### P0-1: Embed endpoint returns no embedding vector
- **Endpoint:** `POST /api/v1/route/embed`
- **Issue:** Response `data` contains only `{dimensions, tokens, count}` — the actual embedding vector is absent. Clients cannot use this for semantic search or downstream ML tasks.
- **Evidence:**
  ```json
  { "data": { "dimensions": 1024, "tokens": 1, "count": 1 } }
  ```
  No `embedding`, `embeddings`, or `vector` key present.
- **Impact:** The entire embed capability is non-functional for real use cases.

---

## P1 Issues

### P1-1: Two of three embed providers are down (forced double-fallback)
- **Issue:** Every embed call falls through `openai-embed → cohere-embed → voyage-embed` (3rd fallback). Both `openai-embed` and `cohere-embed` are unavailable.
- **Evidence from meta:**
  ```json
  "tried_chain": ["openai-embed", "cohere-embed", "voyage-embed"],
  "fallback_used": true,
  "fallback_from": "openai-embed"
  ```
- **Impact:** Higher latency on every embed call. If `voyage-embed` also goes down, the embed capability is fully offline.

### P1-2: QA script valid-tool list has wrong tool name for voyage
- **Issue:** QA test `B.1-embed` checks `tool in ["cohere-embed", "voyage-ai", "jina-embeddings"]` but the actual tool name is `voyage-embed` (not `voyage-ai`). Causes a false failure in the test suite.
- **Fix:** Update QA script valid list to include `"voyage-embed"`.

### P1-3: AI classifier returns wrong type for embed queries
- **Issue:** Embedding `"machine learning fundamentals"` returns AI classification `type: "news"` with reasoning `"News query + → voyage-embed"`. Classifier context is wrong for embed capability.
- **Impact:** Routing logic may make incorrect decisions if AI classification influences embed tool selection.

---

## What Looks Good

### Automated Suite: 50/51 (98%)
All major router functionality passes:
- ✅ **Registration** — `POST /api/v1/router/register` returns API key + plan correctly
- ✅ **Search routing** — Correct tool selection (tavily, exa-search, brave-search) by strategy
- ✅ **Crawl routing** — Routes to jina-ai correctly
- ✅ **Adapter data** — Real results returned with answer, sources, relevance scores
- ✅ **Fallback system** — Falls back gracefully when unknown tool requested
- ✅ **Strategy differentiation** — `best_performance → exa-search`, `cheapest → brave-search`, `balanced → tavily`
- ✅ **Call recording** — Usage tracking works; calls appear in history
- ✅ **Health endpoint** — Reports healthy with success rate and latency metrics
- ✅ **Developer Dashboard API** — Usage, fallbacks, compare, set-strategy, set-budget, set-priority, weekly-report all return HTTP 200
- ✅ **AI-powered routing** — Deep research → exa-search, realtime → tavily, simple → tavily; classification latency 151ms
- ✅ **Auth enforcement** — Invalid key and missing key both return HTTP 401
- ✅ **Edge cases** — Empty query → 400, invalid capability → 404, 5000-char query → 413, invalid strategy → 400, 5 concurrent calls → all 200
- ✅ **Finance capability** — Routes to polygon-io correctly

### Page Load Tests (all pass)
| Page | Status |
|------|--------|
| `/` (Homepage) | ✅ Loads — hero, dark code block, nav (Live/Rankings/Benchmarks/Agents/Router/Dashboard), pricing all present |
| `/connect` | ✅ Loads — pip install visible, API key section, strategies documented |
| `/dashboard` | ✅ Loads — API key input gate works, no hard login wall |
| `/products/tavily` | ✅ Loads — score 6.2/10, latency metrics, 75 agent reviews, domain breakdown all present |

### API: POST /api/v1/router/search with Bearer Auth
- ✅ Returns HTTP 200 with 10 real, ranked search results
- ✅ Response structure: `data` (results, answer, URLs) + `meta` (tool_used, latency_ms, ai_classification, cost_usd)
- ✅ Results are fresh and relevant (live AI news from 2026)
- ✅ AI classification correctly identifies query type and routes appropriately

### Visual / UX
- ✅ Dark theme consistent across all pages
- ✅ No broken images or layout issues
- ✅ Nav items present: Live, Rankings, Benchmarks, Agents, Router, Dashboard
- ✅ Code blocks have correct dark styling
- ✅ `/products/tavily` renders score breakdown, agent reviews, and performance data

---

## Summary

The router core is solid — search, crawl, finance, fallback, strategy selection, and auth all work correctly. The one functional gap is the embed capability: actual embedding vectors are missing from the response (P0), two of three embed providers are unavailable (P1), and the AI classifier is misidentifying embed queries (P1). Everything else is production-ready.

---

FAIL
