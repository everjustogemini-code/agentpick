# AgentPick QA Report
**Date:** 2026-03-19 (run: 01:06 UTC)
**Target:** https://agentpick.dev
**Tester:** QA Agent (claude-sonnet-4-6)
**Script:** `/Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py`

---

## Score: 50/51 (98%)

---

## P0 Blockers

None.

---

## P1 Issues

### 1. Embed capability routing — tool name mismatch (B.1-embed)
- **What:** QA script expects `voyage-ai` or `cohere-embed`. API returns `voyage-embed`.
- **Additional finding:** Direct `POST /api/v1/router/search` with `capability: "embed"` and query `"embed this text"` routed to `tavily` (a search tool), returning web search results rather than vector embeddings. The AI classifier tagged it as `type=news` and skipped embed routing.
- **Root cause (likely):** AI query classifier is over-riding capability hint when query text pattern doesn't match. The embed capability should be respected regardless of AI classification. Also, QA script valid-tools list is stale (`voyage-ai` → now `voyage-embed`).
- **Impact:** Developers who request `capability: "embed"` with natural-language queries may receive search results instead of embeddings. Direct embed-style queries (e.g. from the script) work. P1 — could affect embed users in production.
- **Fix:** Router should respect explicit `capability` parameter and bypass AI type-classification for capability routing decisions. Also update QA script to accept `voyage-embed`.

---

## What Looks Good

### Pages — All Pass
| Page | Status | Latency |
|------|--------|---------|
| `/` | 200 OK | 388ms |
| `/connect` | 200 OK | 160ms |
| `/dashboard` | 200 OK | 65ms |
| `/products/tavily` | 200 OK | 595ms |

### Paid User Flow — Pass
- `POST /api/v1/router/register` → returns `apiKey` + `plan: FREE` + `monthlyLimit: 500`
- `POST /api/v1/router/search` with Bearer auth → returns `{data, meta}` structure
- `data.results`: 10 items, each with `id, title, url, publishedDate, author, score, text, image, favicon`
- `meta`: `tool_used: exa-search`, `result_count: 10`, `total_ms: ~363ms`, `plan: FREE`, `cost_usd: 0.002`
- Calls recorded to account history

### API — Pass
- `GET /api/v1/router/health` → `{"status":"healthy","message":"AgentPick router is operational."}`
- `POST /api/v1/router/search` with valid Bearer → 200, correct `{data, meta}` response
- Invalid key → 401; Missing auth → 401

### Router Core (Part 1) — 7/7 Pass
- Registration returns API key with FREE plan
- Default routing → `tavily`; Crawl routing → `jina-ai`
- Real results returned from adapters
- Unknown tool → fallback to `tavily` works
- Strategy differentiation: `best_performance→exa-search`, `cheapest→brave-search`, `balanced→tavily`
- Calls recorded (8 calls logged in health lastHour)
- Health endpoint returns healthy

### Developer Dashboard API (Part 2) — 7/7 Pass
- Usage stats, fallback stats, strategy comparison all correct
- Strategy/budget/priority updates work
- Weekly report generates with call counts

### /connect Page (Part 3) — 7/7 Pass
- pip install, strategies, pricing, API endpoint, get-API-key CTA, auto-fallback, dashboard link all present

### Homepage (Part 4) — 3/3 Pass
- pip install block, dark code styling, /connect link all present

### Nav (Part 5) — 2/2 Pass
- Router nav item present; Nav items: `Live`, `Rankings`, `Benchmarks`, `Agents`

### AI-Powered Routing (Part 6) — 5/5 Pass
- Deep research → `exa-search` (classified `research/deep`)
- Realtime queries → `tavily` (classified `realtime`)
- Simple queries → `tavily` (classified `simple/shallow`)
- AI classification latency: ~149ms; total: ~1242ms
- AI insights in usage API working

### Schema & Data Integrity (Part 7) — 5/5 Pass
- Account fields: `plan`, `monthlyLimit`, `callsThisMonth`, `strategy`
- Call log fields: `id`, `capability`, `query`, `toolRequested`, `toolUsed`, `strategyUsed`, `latencyMs`, `costUsd`, `resultCount`, etc.
- Invalid/missing API key → 401

### Dashboard Web UI (Part 8) — 5/5 Pass
- Loads 200, shows calls/strategy/tools/settings

### Edge Cases (Bonus) — 5/5 Pass
- Empty query → 400; Invalid capability → 404; 5000-char query → 413
- Invalid strategy → 400; 5 concurrent calls → all 200

### Cross-Capability (Bonus) — 1/2 Pass
- Finance routing → `polygon-io` ✅
- Embed routing → `voyage-embed` (test expects `cohere-embed` or `voyage-ai`) ❌ (P1, not P0)

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

FAIL
