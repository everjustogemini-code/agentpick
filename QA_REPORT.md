# AgentPick QA Report — Round 13 (2026-03-14)

**Target:** https://agentpick.dev
**Tester:** QA Agent (Claude Sonnet 4.6)
**Script:** agentpick-router-qa.py (full mode)

---

## Score: 58/58

| Category | Tests | Passed | Failed |
|---|---|---|---|
| Router QA Script (full suite) | 51 | 51 | 0 |
| Page Load Checks (/, /connect, /dashboard, /products/tavily) | 4 | 4 | 0 |
| API Bearer Auth Test (valid key + missing + invalid) | 2 | 2 | 0 |
| Paid User Flow (register → search → verify results) | 1 | 1 | 0 |
| **Total** | **58** | **58** | **0** |

---

## P0 Blockers

**None.**

---

## P1 Issues

**None.**

---

## Changes Since Round 12

No regressions detected. All 51 automated checks continue to pass. Additional manual verification added this round:
- API Bearer auth tested with valid key (10 results, has_answer=True), missing key (401), invalid key (401) — all correct.
- Paid user flow confirmed: registration returns `ah_live_sk_...` with `plan: FREE, monthlyLimit: 500`; search returns real results.
- Visual regression scan of homepage confirms "500" occurrences are only CSS classes and pricing copy, not errors.

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
