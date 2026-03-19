# AgentPick QA Report
**Date:** 2026-03-18 (run: 21:53 UTC)
**Target:** https://agentpick.dev
**QA Agent:** Claude Code (Sonnet 4.6)

---

## Score: 50/51 (98%)

> Automated suite: 50/51 · All page load checks pass · All manual flow checks pass

---

## P0 Blockers

**None.**

---

## P1 Issues

### B.1-embed: Tool ID mismatch (`voyage-embed` vs `voyage-ai`)
- **Observed:** `POST /api/v1/route/embed` returns `tool_used: "voyage-embed"`, HTTP 200, data returned correctly.
- **Root cause:** QA validator expects `"voyage-ai"` but the backend emits `"voyage-embed"`. The embed capability works — this is a slug naming inconsistency between the router's tool registry and the QA expected list.
- **Fix needed:** Align the tool identifier — update the adapter to emit `"voyage-ai"` or update all canonical references (docs, QA, dashboard) to `"voyage-embed"`.
- **Product impact:** Minimal — embed routing and results are correct. Any client code that pattern-matches on `"voyage-ai"` will silently miss.

---

## What Looks Good

### Page Loads — all 200 ✅
| Page | Status | Notes |
|---|---|---|
| `/` | 200 | Hero, dark pip-install block, Router nav item, 26-tool carousel, all nav items present |
| `/connect` | 200 | pip install, 5 strategies, API endpoint docs, auto-fallback section, dashboard link, pricing tiers |
| `/dashboard` | 200 | Plan capacity, strategy selector, budget controls, API key management |
| `/products/tavily` | 200 | Agent score 6.2/10, 5,184 verified calls, P50:915ms, $0.001/call, benchmark breakdown |

### Router Core (Parts 1–2): 16/16 ✅
- Registration → `ah_live_sk_...` key, plan=FREE, monthlyLimit=500
- Search routing: `balanced` → tavily, `best_performance` → exa-search, `cheapest` → brave-search, `most_stable` → distinct tool
- Crawl routing: jina-ai (no Phidata — correct)
- Fallback: unknown tool `nonexistent-tool-xxx` gracefully falls back to tavily (`fallback_used=true`, `fallback_from` set)
- All 4 strategies return ≥2 unique tools (diversity verified)
- 8 calls recorded in DB after test run; health endpoint reports `status: healthy`
- Dashboard API: usage, fallbacks, compare-strategies, set-strategy, set-budget, set-priority, weekly-report — all 200

### /connect Page (Part 3): 7/7 ✅
- pip install snippet, strategy docs, 3-tier pricing (Free/Pro/Growth), API endpoint `/api/v1/route/search`, "Get API key" CTA, auto-fallback documentation, `/dashboard` link

### Homepage Visual (Parts 4–5): 5/5 ✅
- Dark terminal code block with `pip install agentpick` present
- `/connect` link in hero
- "Router" nav item linking to `/connect`
- All expected nav items present: Live, Rankings, Benchmarks, Agents (+ Playground, Router, Dashboard)

### AI-Powered Routing (Part 6): 6/6 ✅
- Deep research query → `exa-search` (`type=research`, `depth=deep`) ✅
- Realtime query ("AAPL stock price right now") → `tavily` (`type=realtime`, `freshness=realtime`) ✅
- Simple query ("what is Python") → `tavily` (`type=simple`, `depth=shallow`) ✅
- Classification latency: **150ms** (under 200ms target) ✅
- Full `ai_classification` object returned in `meta` (type, domain, depth, freshness, reasoning) ✅
- AI routing summary aggregated in `/usage` (`total_ai_routed_calls`, `by_type` breakdown) ✅

### Schema & Security (Part 7): 5/5 ✅
- All account fields present: `plan`, `monthlyLimit`, `callsThisMonth`, `strategy`
- All RouterCall fields present: `capability`, `toolUsed`, `strategy`, `success`, `traceId`, `latencyMs`, `costUsd`
- Invalid API key → 401 ✅
- Missing API key → 401 ✅

### Dashboard UI (Part 8): 5/5 ✅
- Page loads (HTTP 200), shows call usage, strategy controls, tool references, budget/settings

### Bonus / Edge Cases: 6/7
- Finance route → `polygon-io` ✅
- Embed route → routes correctly but tool ID mismatch (P1 above) ❌
- Empty query → 400 ✅
- Invalid capability → 404 ✅
- 5000-char query → 413 ✅
- Invalid strategy → 400 ✅
- 5 concurrent calls → 5/5 succeeded (no race conditions) ✅

### Paid User Flow (manual): ✅
1. `POST /api/v1/router/register` → `apiKey`, `plan: FREE`, `monthlyLimit: 500` ✅
2. `POST /api/v1/route/search` with Bearer auth → results returned, full `meta` (tool_used, latency_ms, ai_classification, cost_usd, trace_id) ✅
3. Usage tracking → calls visible in `/api/v1/router/usage`, breakdown by capability/tool/strategy ✅

### Visual Regression Check: ✅
- Homepage: dark theme, green accents, pip-install code block — no regressions
- /connect: pricing cards, monospace code blocks — no regressions
- /dashboard: plan capacity progress bar, strategy selector — no regressions
- /products/tavily: color-coded metric cards, scoring breakdown — no regressions

---

PASS
