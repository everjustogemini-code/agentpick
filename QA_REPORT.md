# AgentPick QA Report
**Date:** 2026-03-18
**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)

---

## Score: 50/51 (98%)

---

## P0 Blockers

None. All critical paths are operational.

---

## P1 Issues

### 1. Embed QA test failure — tool name mismatch (non-functional)
- **Test:** `B.1-embed`
- **Expected tools:** `["cohere-embed", "voyage-ai", "jina-embeddings"]`
- **Actual tool returned:** `voyage-embed`
- **Root cause:** The QA script uses `"voyage-ai"` as the valid tool name, but the router returns `"voyage-embed"`. The embed endpoint is fully functional — it correctly falls back from `cohere-embed` → `voyage-embed` and returns valid embedding data (`dimensions: 1024, tokens: 3`).
- **Fix needed:** Update QA script valid list: add `"voyage-embed"` to `["cohere-embed", "voyage-ai", "jina-embeddings"]`.

### 2. `/api/v1/register` endpoint is 404
- The public-facing registration endpoint is `/api/v1/router/register`, not `/api/v1/register`. Any documentation or external tools pointing to `/api/v1/register` will fail with `NOT_FOUND`. Low severity if not publicly documented, but worth aligning.

---

## What Looks Good

### Router Core (8/8 pass)
- Search routing correctly selects `tavily` for general queries
- Crawl routing correctly selects `jina-ai`
- Real adapter data returns (full Tavily search results with answer synthesis)
- Fallback works: `nonexistent-tool-xxx` → `tavily`
- Strategy differentiation works (`best_performance=exa-search`, `cheapest=brave-search`, `balanced=tavily`, `most_stable` distinct)
- Call recording: 8 calls logged as expected
- Health endpoint returns `healthy` with DB latency 5ms, uptime tracked

### AI-Powered Routing (5/5 pass)
- Deep research → `exa-search` (correct)
- Realtime query → `tavily` with `freshness=realtime` (correct)
- Simple query → shallow depth routing (correct)
- Classification latency: 151ms, total round-trip: 1162ms (acceptable)
- AI insights endpoint returns proper aggregated stats

### Developer Dashboard API (7/7 pass)
- Usage stats, fallback reports, strategy comparison all return 200
- Strategy/budget/priority settings all persist correctly
- Weekly report generation works

### Pages (all load correctly)
| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ 200 | Hero, pricing, live feed (475 agents, 23 calls), code examples all render |
| `/connect` | ✅ 200 | Interactive code generator, playground, strategies, pricing all present |
| `/dashboard` | ✅ 200 | API-key-gated UI renders correctly (no broken auth wall) |
| `/products/tavily` | ✅ 200 | Rankings, metrics (915ms P50, 100% success), agent reviews all visible |

### API Auth & Security (4/4 pass)
- No auth → HTTP 401 (correct)
- Invalid key → HTTP 401 (correct)
- `POST /api/v1/router/search` with valid Bearer key → HTTP 200, returns full results
- `POST /api/v1/route/search` with valid Bearer key → HTTP 200, returns full results (both endpoints active)

### Schema & Data Integrity (5/5 pass)
- Account fields present: `plan`, `monthlyLimit`, `callsThisMonth`, `strategy`
- Call fields present: `id`, `capability`, `query`, `toolRequested`, `toolUsed`, `strategyUsed`, `latencyMs`, `costUsd`, `resultCount`
- Auth on invalid/missing keys returns correct 401

### Edge Cases (5/5 pass)
- Empty query → 400 (correct rejection)
- Invalid capability → 404
- 5000-char query → 413
- Invalid strategy → 400
- 5 concurrent calls → all 200 (no race conditions)

### Cross-Capability (1/2 pass)
- Embed: working (voyage-embed with cohere fallback, 89ms latency) — test failure is QA script naming issue only
- Finance (`polygon-io`) → correct routing

### /connect Page Content (7/7 pass)
- `pip install`, strategies, pricing, API endpoint, API key CTA, auto-fallback, dashboard link all present

### Navigation (2/2 pass)
- Router nav item present
- Nav items match expected: `['Live', 'Rankings', 'Benchmarks', 'Agents']`

---

## Summary

AgentPick is in excellent shape. 50 of 51 automated checks pass. The single failure (`B.1-embed`) is a QA script naming bug — the embed capability itself works correctly with proper fallback chain (`cohere-embed` → `voyage-embed`). No P0 blockers. The product is live, routing correctly, and all pages render cleanly.

---

PASS
