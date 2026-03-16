# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-16
**Cycle:** 129
**Source:** NEXT_VERSION.md — Bugfix Cycle 129, QA Round 15
**Cycle type:** BUG FIX ONLY — zero new features

---

## Overview

This file covers **Fix #1 (P1)** — the only fix in NEXT_VERSION.md this cycle.
All changed files are backend. TASK_CODEX.md has no tasks this cycle.
No file is touched by both agents.

---

## Fix #1 — P1 · Calls not persisted to database after routing

**QA Issues:** `1.5-calls-recorded`, `7.2-call-fields`

**Symptom:** `POST /api/v1/route/search` returns HTTP 200 with valid `meta.trace_id`, but no `RouterCall` record is committed. `GET /api/v1/router/calls` returns `{"calls": []}`. Account `totalCalls` stays at 0.

**Root cause:** `RouterStrategy` enum in the production Neon database is missing `'AUTO'` and `'MANUAL'` values. The migration `20260315_add_router_strategy_manual_auto` exists in the repo but was never deployed. Every `routerCall.create({ strategyUsed: 'AUTO' })` is rejected with an invalid-enum-value error; the outer `catch` in `handler.ts` swallows it silently and returns HTTP 200.

---

### Part A — Deploy the pending migration (resolves root cause)

**File:** `prisma/migrations/20260315_add_router_strategy_manual_auto/migration.sql`

File already exists in the repo. No code edit required. Run:
```
npx prisma migrate deploy
```

The SQL that will be applied:
```sql
ALTER TYPE "RouterStrategy" ADD VALUE IF NOT EXISTS 'MANUAL';
ALTER TYPE "RouterStrategy" ADD VALUE IF NOT EXISTS 'AUTO';
```

Once deployed, `strategyUsed: 'AUTO'` is a valid enum value and the primary INSERT succeeds. All subsequent call records will be committed.

---

### Part B — Add enum-error detection to fallback INSERT path (defense-in-depth)

#### File 1: `src/lib/router/sdk.ts`

**Function:** `recordRouterCall`
**Location:** `catch (insertErr)` block, ~line 335

At the **top** of the `catch (insertErr)` block, before building `safeData`, add:
```ts
if (errMsg.includes('invalid input value for enum') || errMsg.includes('invalid enum value')) {
  console.error('[RecordRouterCall] DB ENUM MIGRATION NOT APPLIED — deploy 20260315_add_router_strategy_manual_auto to fix call persistence');
}
```

#### File 2: `src/lib/router/handler.ts`

**Function:** outer error handler
**Location:** `catch (recordErr)` block, ~line 321

At the **top** of the `catch (recordErr)` block, add:
```ts
if (errMsg.includes('invalid input value for enum') || errMsg.includes('invalid enum value')) {
  console.error('[RouterCall] ENUM MIGRATION NOT APPLIED — deploy 20260315_add_router_strategy_manual_auto');
}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `prisma/migrations/20260315_add_router_strategy_manual_auto/migration.sql` | Deploy via `npx prisma migrate deploy` — no code edit needed |
| `src/lib/router/sdk.ts` | Add enum-error detection in `recordRouterCall` catch (~line 335) |
| `src/lib/router/handler.ts` | Add enum-error detection in outer catch (~line 321) |

**Do NOT touch (no Codex files this cycle):**
- No files are owned by TASK_CODEX.md this cycle.

---

## Acceptance Criteria

- [ ] `GET /api/v1/router/calls?limit=10` → non-empty array after routing calls
- [ ] `GET /api/v1/router/account` → `totalCalls > 0` after multiple searches
- [ ] QA tests `1.5-calls-recorded` and `7.2-call-fields` pass
- [ ] Score: 54/54
- [ ] No other files modified
