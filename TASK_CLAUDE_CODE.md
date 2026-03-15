# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-15
**Cycle:** 90
**Source:** NEXT_VERSION.md — v0.90, QA Round 14, score 62/67 (5 failures: 1 P0, 3 P1)
**Cycle type:** BUG FIX ONLY — zero new features

---

## Overview

This file covers **Fix #1 (P0)** and **Fix #3 (P1)** from NEXT_VERSION.md.
TASK_CODEX.md covers Fix #2 and Fix #4.
No file is touched by both agents.

---

## Fix #1 — P0 · `GET /api/v1/router/calls` → HTTP 500

**QA tests:** `1.5-calls-recorded`, `7.2-call-fields`
**File:** `src/app/api/v1/router/calls/route.ts` **lines 47–50**

**Root cause:** `NOT: [...]` array form is fragile across Prisma versions. Growth-17 commit rewrote it as `AND: [{NOT:...}]`, breaking the query.

**Required change — replace lines 47–50:**
```ts
// BEFORE (fragile — growth commits keep breaking this):
NOT: [
  { toolUsed: { in: ['unknown', '', ...CAPABILITY_NAMES] } },
  { toolUsed: { endsWith: '-unavailable' } },
],

// AFTER (explicit, stable, cannot be misread):
// NOTE: Do NOT rewrite NOT: { OR: [...] } to NOT: [...] or AND: [{NOT:...}].
// This has broken QA tests 1.5-calls-recorded and 7.2-call-fields three times.
NOT: {
  OR: [
    { toolUsed: { in: ['unknown', '', ...CAPABILITY_NAMES] } },
    { toolUsed: { endsWith: '-unavailable' } },
  ],
},
```

**Semantics are identical:** `NOT: { OR: [A, B] }` = NOT A AND NOT B. No behaviour change, just explicit and Prisma-stable.

---

## Fix #3 — P1 · `GET /api/v1/router/account` returns nulls for new users

**QA test:** Paid User Flow — account info check
**File:** `src/app/api/v1/router/account/route.ts` **line 42+** (final `return Response.json(...)` in GET handler)

**Root cause:** Response nests all data under `account.usage`. QA Paid User Flow reads `data.plan`, `data.strategy`, `data.monthlyLimit` at the **top level**. When absent, Python parses them as `None`.

**Required change — add top-level fields to the return statement:**
```ts
// NOTE: plan/strategy/monthlyLimit/callsThisMonth MUST remain as top-level fields.
// QA Paid User Flow checks data.plan and data.strategy directly on this response.
// Do NOT nest them under account.* only — this has broken onboarding multiple times.
return Response.json({
  // Top-level fields — QA Paid User Flow reads data.plan / data.strategy directly:
  plan: account.plan,           // "FREE" | "STARTER" | "PRO" | "ENTERPRISE"
  strategy: account.strategy,   // "AUTO" | "BALANCED" | ...
  monthlyLimit,                 // 500 for FREE, null for ENTERPRISE
  callsThisMonth,
  account: { /* full nested object unchanged */ },
});
```

Do not remove or restructure the existing nested `account` object — just add the four top-level keys alongside it.

---

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/app/api/v1/router/calls/route.ts` | 47–50 | `NOT: [...]` → `NOT: { OR: [...] }` + guard comment |
| `src/app/api/v1/router/account/route.ts` | 42+ | Add `plan`, `strategy`, `monthlyLimit`, `callsThisMonth` as top-level keys + guard comment |

**Do NOT touch:**
- `src/app/api/v1/router/priority/route.ts` — owned by TASK_CODEX.md
- `src/app/api/v1/router/health/route.ts` — owned by TASK_CODEX.md

---

## Acceptance Criteria

- [ ] `GET /api/v1/router/calls` → HTTP 200 (QA tests `1.5-calls-recorded` + `7.2-call-fields`)
- [ ] `GET /api/v1/router/account` → `plan: "FREE"`, `monthlyLimit: 500`, `strategy: "AUTO"` for new user
- [ ] No other files modified
