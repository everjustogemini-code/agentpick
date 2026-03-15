# NEXT_VERSION.md — AgentPick Bugfix Cycle 33

**Date:** 2026-03-14
**QA Round:** 12
**QA Score entering cycle:** 56/57 (Round 11)
**P0 blockers:** None
**Scope:** Bug fixes only. Zero new features.

---

## Fix #1 — `effectivePriority` applies stale account `priorityTools` for `MOST_ACCURATE` strategy

**Symptom:** `best_performance` requests route to account's stale `priorityTools` tool (e.g. `tavily`)
instead of the AI-classified research-quality tool (`exa-search` or `perplexity-search`). The QA test
`6.1-deep-research` fails because the `set-priority` test (Part 2) sets `account.priorityTools` on
the test account, which is then applied by `effectivePriority` for the subsequent `best_performance`
request in Part 6.

**Root cause:** `effectivePriority` in `sdk-handler.ts` excluded `AUTO` from applying account
`priorityTools` but NOT `MOST_ACCURATE`. Since `MOST_ACCURATE` uses `fastClassify` for AI-based
deep-research routing (same as `AUTO`), stale account `priorityTools` override the AI tool selection,
routing to the stale tool rather than the AI-selected research tool.

**File:** `src/lib/router/sdk-handler.ts`

**Fix:** Added `strategyUsed !== 'MOST_ACCURATE'` to the `effectivePriority` condition, consistent
with the existing `AUTO` exclusion. The comment was also updated to document both excluded strategies.

**Acceptance criteria:**
- `best_performance` request with stale `account.priorityTools = ['tavily']` routes to research-quality
  tool (exa-search or perplexity), not to tavily.
- `MANUAL` and `BALANCED` strategies continue to apply account `priorityTools` correctly.
- QA test `6.1-deep-research` passes 5/5 consecutive runs.

---

## Fix #2 — `applyStrategy` injects stale `priorityTools` as fallbacks for AUTO/MOST_ACCURATE

**Symptom:** Even after fixing `effectivePriority`, `applyStrategy` could still pollute the fallback
chain with stale `account.priorityTools` for `AUTO` and `MOST_ACCURATE` strategies when
`account.fallbackEnabled = true`. This adds tools to `request.fallback` that bypass the AI-ranked
fallback order.

**Root cause:** The fallback injection block in `applyStrategy` (sdk.ts) lacked the strategy guard
that the pre-selection block has. Pre-selection correctly skips AUTO/MOST_ACCURATE/CHEAPEST, but
the fallback block always ran for all strategies when `fallbackEnabled = true`.

**File:** `src/lib/router/sdk.ts`

**Fix:** Added `account.strategy !== 'AUTO' && account.strategy !== 'MOST_ACCURATE'` guard to the
fallback injection block in `applyStrategy`, preventing stale `priorityTools` from polluting the
AI-ranked fallback chain.

**Acceptance criteria:**
- `AUTO` and `MOST_ACCURATE` requests with `account.fallbackEnabled = true` and stale `priorityTools`
  do NOT have those tools injected into `request.fallback`.
- `MANUAL` and `BALANCED` strategies with `fallbackEnabled` continue to use account `priorityTools`
  as fallbacks correctly.

---

## Fix #3 — `genericTopicSignal` missing plural `models` form

**Symptom:** Queries like `"latest large language models 2025"` fall through `fastClassify` to Haiku
because `genericTopicSignal` uses `\bmodel\b` (singular only) and `"models"` (plural) does not match.
Without a `genericTopicSignal` match, `hasNewsWithDomain` is FALSE, so the query is not auto-classified
as `news`. Haiku then handles it non-deterministically.

**Root cause:** `genericTopicSignal` regex had `model` (singular) but not `models?` (matching both
singular and plural). The `stateOfPattern` domain detection at line 95 already had `models?`, but
this different regex (`genericTopicSignal`) used in `hasNewsWithDomain` was left with singular-only.

**File:** `src/lib/router/ai-classify.ts`

**Fix:** Changed `model` to `models?` in `genericTopicSignal` so both singular and plural forms match.
Queries like `"latest large language models 2025"` now correctly classify as `news` via `hasNewsWithDomain`
without falling through to Haiku.

**Acceptance criteria:**
- `"latest large language models 2025"` → `fastClassify` returns `type=news` (via `hasNewsWithDomain`).
- `"latest model release 2025"` → still routes as news (singular form still matches).
- Existing passing QA tests remain green.
