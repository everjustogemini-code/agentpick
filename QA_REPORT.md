# AgentPick QA Report
**Date:** 2026-03-17
**Target:** https://agentpick.dev
**Tester:** Claude Code QA Agent

---

## Score: 57/58

---

## P0 Blockers

### ❌ `POST /v1/chat/completions` — 404 Not Found
The new OpenAI-compatible endpoint returns a 404 HTML page (Next.js "Page not found").
Neither `/v1/chat/completions` nor `/api/v1/chat/completions` exist.
This endpoint was listed as a required test item and is not yet deployed.

---

## P1 Issues

None.

---

## What Looks Good

### Automated QA Suite — 51/51 PASS (100%)
All checks in `agentpick-router-qa.py` passed:
- **Part 1 – Router Core:** Registration, search routing, crawl routing, adapter data, fallback, strategy differences, call recording, health endpoint ✅
- **Part 2 – Developer Dashboard API:** Usage, fallbacks, compare, strategy/budget/priority settings, weekly report ✅
- **Part 3 – /connect Page:** pip install block, strategies, pricing, API endpoint, key CTA, auto-fallback text, dashboard link ✅
- **Part 4 – Homepage Dark Code Block:** pip install, connect link, dark styling ✅
- **Part 5 – Nav:** Router nav item, all nav items present ✅
- **Part 6 – AI Routing:** Deep research → exa-search, realtime → tavily, simple → tavily, classification latency (151ms), AI insights in usage ✅
- **Part 7 – Schema & Data Integrity:** Account fields, call fields, rate limit rejection (429), invalid key → 401, missing key → 401 ✅
- **Part 8 – Dashboard Web UI:** Loads, shows calls/strategy/tools/settings ✅
- **Bonus – Cross-Capability:** embed → cohere-embed, finance → polygon-io ✅
- **Bonus – Edge Cases:** empty query → 400, invalid capability → 404, 5000-char query → 413, invalid strategy → 400, 5 concurrent → 5/5 success ✅

### Paid User Flow — PASS
- `POST /api/v1/router/register` → returns `apiKey`, `plan=FREE`, `monthlyLimit=500` ✅
- `POST /api/v1/router/search` with Bearer auth → returns real results via tavily, with proper `meta` block (`tool_used`, `latency_ms`, `fallback_used`, `cost_usd`, `calls_remaining`) ✅
- Dashboard usage API reflects calls accurately ✅

### Page Load Checks — All 200 OK
| Page | Status |
|------|--------|
| `/` | 200 ✅ |
| `/connect` | 200 ✅ |
| `/dashboard` | 200 ✅ |
| `/products/tavily` | 200 ✅ |

### Visual Regression — No Regressions
- Hero headline present ✅
- Dark code block with pip install ✅
- Nav items: Live, Rankings, Benchmarks, Agents ✅
- Products/Tavily section visible ✅
- CTA button present ✅
- `/products/tavily` has Tavily content + pricing info ✅

### `POST /api/v1/router/search` with Bearer Auth — PASS
Returns structured response with:
- `data` key with tool-specific results
- `meta` key: `tool_used`, `latency_ms`, `fallback_used`, `cost_usd`, `calls_remaining`, `strategy`

---

FAIL
