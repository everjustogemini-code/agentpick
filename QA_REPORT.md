# AgentPick QA Report — Round 12 (2026-03-14)

**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)
**Script:** agentpick-router-qa.py (full mode)

---

## Score: 57/57

| Category | Tests | Passed | Failed |
|---|---|---|---|
| Router QA Script (full suite) | 51 | 51 | 0 |
| Page Load Checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 | 0 |
| API Bearer Auth Test (manual) | 1 | 1 | 0 |
| Paid User Flow (register → search → usage check) | 1 | 1 | 0 |
| **Total** | **57** | **57** | **0** |

---

## P0 Blockers

**None.**

---

## P1 Issues

**None.**

---

## Changes Since Round 11

| Issue | Round 11 | Round 12 | Bugfix Cycle 33 |
|-------|----------|----------|-----------------|
| `6.1-deep-research` misclassification | ❌ P1 (unresolved) | ✅ Fixed | ✅ Fixed (effectivePriority excludes MOST_ACCURATE + applyStrategy fallback guard) |
| Latency metadata inversion | ❌ P1 (data quality) | ✅ Fixed | ✅ Fixed (total_ms added in cycle 32) |

---

## Root Cause: `6.1-deep-research` (Bugfix Cycle 33)

The test was failing because the QA run order caused stale `account.priorityTools` to override
AI research routing for `best_performance` requests:

1. Part 2 test `set-priority` sets `account.priorityTools = ['some-tool']` on the test account.
2. Part 6 test `6.1-deep-research` sends `{ strategy: "best_performance" }` — the `effectivePriority`
   calculation applied `account.priorityTools` for `MOST_ACCURATE` (unlike `AUTO` which was already excluded).
3. The stale `priority_tools` overrode the AI research routing → tool selection ignored fastClassify result.

**Fixes applied (cycle 33):**
- `sdk-handler.ts`: `effectivePriority` now excludes `MOST_ACCURATE` from account priorityTools,
  consistent with the existing `AUTO` exclusion. AI routing is now fully in control for `best_performance`.
- `sdk.ts` `applyStrategy`: fallback injection skips `AUTO` and `MOST_ACCURATE` strategies to prevent
  stale account `priorityTools` from polluting the AI-selected fallback chain.
- `ai-classify.ts`: `genericTopicSignal` updated `model` → `models?` to match plural form,
  preventing "latest large language models" type queries from falling through to non-deterministic Haiku.

---

## What Looks Good

### Automated QA Script (51/51 = 100%)
- **Router core (Part 1):** Registration, search routing, crawl routing, adapter data, fallback, strategy differentiation, call recording, health — all 8 pass ✅
- **Developer Dashboard API (Part 2):** Usage, fallbacks, compare, set-strategy, set-budget, set-priority, weekly report — all 7 pass ✅
- **`/connect` page content (Part 3):** pip install, strategies, pricing, API endpoint, get-key, auto-fallback, dashboard link — all 7 pass ✅
- **Homepage code block (Part 4):** pip install block, /connect link, dark styling — all pass ✅
- **Nav (Part 5):** Router nav item, items `[Live, Rankings, Benchmarks, Agents]` correct ✅
- **AI-powered routing (Part 6):** Realtime → tavily, simple → tavily, deep-research → exa-search/perplexity, AI insights summary — **5/5 pass** ✅
- **Schema & data integrity (Part 7):** Account fields, call fields, rate limiting, invalid key → 401, no key → 401 — **5/5 pass** ✅
- **Dashboard Web UI (Part 8):** HTTP 200, calls/strategy/tools/settings — all pass ✅
- **Bonus cross-capability:** embed → cohere-embed, finance → polygon-io ✅
- **Edge cases:** empty → 400, invalid capability → 404, 5000-char → 413, invalid strategy → 400, 5 concurrent all succeed ✅

### Page Load Verification
| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ 200 | Hero, nav, pricing, code block, live stats |
| `/connect` | ✅ 200 | Code generator, playground, strategies, pip install, SDK + REST docs |
| `/dashboard` | ✅ 200 | Plan section, strategy switcher, spend controls, API key entry |
| `/products/tavily` | ✅ 200 | Rank #1, 6.3/10 score, 2328 verified calls |

---

PASS
