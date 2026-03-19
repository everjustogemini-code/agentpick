# AgentPick QA Report
**Date:** 2026-03-18 (run: 22:42 UTC)
**Target:** https://agentpick.dev
**QA Agent:** Claude Code (Sonnet 4.6)

---

## Score: 62/63

> Automated suite: 50/51 · All page load checks pass · Manual paid-user flow: 3/3 · API Bearer auth: 5/5
>
> Single failure is a stale slug in the QA script (B.1-embed): actual tool ID is `voyage-embed` but script's valid list contains `voyage-ai`. The embed route itself works correctly.

---

## P0 Blockers

**None.**

---

## P1 Issues

### P1-1: Embed always falls to 3rd provider (`voyage-embed`)
- **Observed:** `POST /api/v1/route/embed` returns `tried_chain: ["openai-embed", "cohere-embed", "voyage-embed"]` with `tool_used: "voyage-embed"` and `fallback_used: true` on every call.
- **Root cause:** openai-embed and cohere-embed are failing silently, forcing every embed request to exhaust two fallbacks before succeeding on voyage-embed.
- **Fix needed:** Configure BYOK keys for openai-embed / cohere-embed, or promote voyage-embed to primary position in the embed tool chain.
- **Product impact:** Embed works (HTTP 200, real vectors returned), but latency overhead from two failed attempts; reliability risk if voyage-embed goes down.

### P1-2: QA script embed valid-list has stale tool slug
- **Observed:** `agentpick-router-qa.py` line B.1 expects `tool in ["cohere-embed", "voyage-ai", "jina-embeddings"]` but actual slug is `"voyage-embed"` — causing a false-negative failure.
- **Fix needed:** Update QA script B.1 valid list to include `"voyage-embed"`.

---

## What Looks Good

### Page Loads — all 200 ✅
| Page | Status | Notes |
|---|---|---|
| `/` | 200 | Hero, dark pip-install block, Router nav item, tool carousel, all nav items present |
| `/connect` | 200 | pip install, strategies, API endpoint docs, auto-fallback section, dashboard link, pricing tiers |
| `/dashboard` | 200 | Plan capacity, strategy selector, budget controls, API key management |
| `/products/tavily` | 200 | Agent score, verified call count, P50 latency, cost/call, benchmark breakdown |

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
- Classification latency: **151ms** (under 200ms target) ✅
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
- Embed route → routes correctly but QA slug mismatch (P1-2 above) ❌
- Empty query → 400 ✅
- Invalid capability → 404 ✅
- 5000-char query → 413 ✅
- Invalid strategy → 400 ✅
- 5 concurrent calls → 5/5 succeeded (no race conditions) ✅

### Paid User Flow (manual): ✅
1. `POST /api/v1/router/register` → `apiKey`, `plan: FREE`, `monthlyLimit: 500` ✅
2. `POST /api/v1/router/search` with Bearer auth → 9 results via tavily (real content, URLs), full `meta` (tool_used, latency_ms, ai_classification, cost_usd, trace_id, calls_remaining) ✅
3. Usage tracking → `callsThisMonth` increments correctly; `calls_remaining` decrements as expected ✅

### API Bearer Auth: 5/5 ✅
| Test | Result |
|------|--------|
| Valid Bearer key → 200 with results | ✅ |
| Missing Authorization header → 401 | ✅ |
| Invalid key (`Bearer invalid_key_xxx`) → 401 | ✅ |
| Strategies endpoint → returns strategy map | ✅ |
| Health endpoint → `status: healthy` | ✅ |

### Visual Regression Check: ✅
- Homepage: dark theme, green accents, pip-install code block — no regressions
- /connect: pricing cards, monospace code blocks — no regressions
- /dashboard: plan capacity progress bar, strategy selector — no regressions
- /products/tavily: color-coded metric cards, scoring breakdown — no regressions

---

PASS
