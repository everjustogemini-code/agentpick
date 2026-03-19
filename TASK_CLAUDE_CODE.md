# TASK_CLAUDE_CODE.md — cycle 20
**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-19
**QA baseline:** 50/51 — P1 open (embed B.1 failing)
**Target:** 51/51
**Policy:** BUG FIXES ONLY. No new features.
**Source:** NEXT_VERSION.md Fix #2
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Fix #2 — [QA_ISSUE_1-B] Router: explicit `capability` overridden by AI classifier

**QA Reference:** QA_REPORT.md P1 Issue #1 (B.1-embed)

### Problem

When `strategy === 'auto'`, `aiRoute()` returns a ranked tool list. For queries that fast-classify as `type=news`, the AI ranker can return search tools (e.g. `tavily`) even when the caller explicitly passed `capability: "embed"`. The capability constraint is not re-enforced after `aiRoute()` returns.

### File to Modify

- `src/lib/router/index.ts`

### Exact Changes

**Step 1:** Read `src/lib/router/index.ts` and locate the `routeRequest()` function.

**Location 1** — immediately after the assignment:
```typescript
aiRankedTools = aiRoute(classification.context, capability);
```
(~line 457 — confirm by searching for this exact assignment)

Insert:
```typescript
// Enforce capability constraint: AI ranking must never produce tools outside
// the allowed set for the requested capability.
if (aiRankedTools) {
  const allowed = new Set(CAPABILITY_TOOLS[capability] ?? []);
  aiRankedTools = aiRankedTools.filter((t) => allowed.has(t));
  if (aiRankedTools.length === 0) aiRankedTools = undefined;
}
```

**Location 2** — immediately after the assignment inside the `best_performance` branch:
```typescript
aiRankedTools = aiRoute(fastResult, capability);
```
(~line 468 — confirm by searching for this exact assignment)

Insert the same block:
```typescript
if (aiRankedTools) {
  const allowed = new Set(CAPABILITY_TOOLS[capability] ?? []);
  aiRankedTools = aiRankedTools.filter((t) => allowed.has(t));
  if (aiRankedTools.length === 0) aiRankedTools = undefined;
}
```

### Files Owned by CLAUDE CODE This Cycle

| Action | File |
|--------|------|
| Modify | `src/lib/router/index.ts` |

### DO NOT TOUCH (CODEX-owned)

- `/Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py`

---

## Coverage: Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Fix #1 — QA script `voyage-ai` → `voyage-embed` stale allowlist | **TASK_CODEX.md** |
| Fix #2 — Router capability constraint not re-enforced after `aiRoute()` | **This file** |

---

## Acceptance Criteria

- [ ] `POST /api/v1/router/search` with `capability: "embed"` returns `meta.tool_used: "voyage-embed"` for **any** query text, including news-pattern queries
- [ ] `tavily` or other search tools are never returned for an embed capability request
- [ ] All 51 QA tests pass
- [ ] No regression on search / finance / crawl capability routing

---

## Progress Log

After completing this task, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] Fix #2: capability constraint enforced after aiRoute() in routeRequest()
```
