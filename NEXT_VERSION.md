# NEXT_VERSION.md
**Date:** 2026-03-19
**PM:** AgentPick PM (Claude Code)
**QA baseline:** QA_REPORT.md (2026-03-19) — score **50/51** | P0: none | P1: 1 open
**Policy:** BUG FIXES ONLY. No new features.

---

## Fix #1 — [QA_ISSUE_1-A] QA script stale embed tool name

**QA reference:** QA_REPORT.md P1 Issue #1 (B.1-embed) — "QA script valid-tools list is stale (`voyage-ai` → now `voyage-embed`)"

**File:** `/Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py`

**Root cause:** The B.1 embed assertion checks for `voyage-ai` or `cohere-embed`. The router now uses `voyage-embed` as the canonical tool ID. The test fails because `voyage-embed` is not in the allowlist.

**Change:**
```python
# BEFORE (stale):
valid_embed_tools = ["cohere-embed", "voyage-ai", "jina-embeddings"]

# AFTER:
valid_embed_tools = ["voyage-embed"]
```

**Acceptance:** `grep "voyage-ai" agentpick-router-qa.py` → zero hits. QA suite B.1-embed passes.

---

## Fix #2 — [QA_ISSUE_1-B] Router: explicit `capability` can be overridden by AI classifier

**QA reference:** QA_REPORT.md P1 Issue #1 (B.1-embed) — "Direct POST with `capability: "embed"` routed to `tavily`. The AI classifier tagged it as `type=news` and skipped embed routing."

**File:** `src/lib/router/index.ts` — `routeRequest()` function

**Root cause:** When `strategy === 'auto'`, `aiRoute()` returns a ranked tool list. Under certain query-text patterns (e.g. queries that fast-classify as `type=news`), there is a code path where `aiRankedTools` can contain search tools that are not valid for the requested `capability`. The explicit `capability` constraint is not re-enforced after `aiRoute()` returns.

**Change — two locations in `routeRequest()`:**

Location 1: after `aiRankedTools = aiRoute(classification.context, capability);` (~line 457)
```typescript
// Enforce capability constraint: AI ranking must never produce tools outside
// the allowed set for the requested capability.
if (aiRankedTools) {
  const allowed = new Set(CAPABILITY_TOOLS[capability] ?? []);
  aiRankedTools = aiRankedTools.filter((t) => allowed.has(t));
  if (aiRankedTools.length === 0) aiRankedTools = undefined;
}
```

Location 2: after `aiRankedTools = aiRoute(fastResult, capability);` (~line 468, inside `best_performance` branch)
```typescript
if (aiRankedTools) {
  const allowed = new Set(CAPABILITY_TOOLS[capability] ?? []);
  aiRankedTools = aiRankedTools.filter((t) => allowed.has(t));
  if (aiRankedTools.length === 0) aiRankedTools = undefined;
}
```

**Effect:** `capability: "embed"` always routes to `voyage-embed`. No search tool can be returned for an embed request regardless of query text or AI classification output.

**Acceptance:**
- `POST /api/v1/router/search` with `capability: "embed"` and any query text returns `meta.tool_used: "voyage-embed"`, never `tavily` or any other search tool
- All 51 QA tests pass
- No regression on search/finance/crawl capability routing

---

## Out of Scope This Cycle
Everything else. Zero feature work until QA score is 51/51.
