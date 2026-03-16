# NEXT_VERSION — Bugfix Cycle 129

**Source:** QA Round 15 (2026-03-15)
**Branch:** bugfix/cycle-129
**Rule:** Bug fixes only. Zero new features.

---

## Fix #1 — P1: Calls not persisted to database after routing

**QA Issues:** `1.5-calls-recorded`, `7.2-call-fields`

**Symptom:**
`POST /api/v1/route/search` returns HTTP 200 with a valid `meta.trace_id`, but no `RouterCall` record is ever committed. `GET /api/v1/router/calls` returns `{"calls": []}`. Account `totalCalls` stays at 0.

**Root Cause:**
New developer accounts are created with `strategy: 'AUTO'` (the Prisma schema default in `ensureDeveloperAccount`). When `recordRouterCall` executes:
```ts
db.routerCall.create({ data: { ..., strategyUsed: 'AUTO' } })
```
PostgreSQL rejects the INSERT with an invalid-enum-value error because `'AUTO'` is not yet in the production `RouterStrategy` enum — the migration `20260315_add_router_strategy_manual_auto` that adds it has been created in the repo but **was never deployed to the production database**.

The error is non-retryable (it is not a connection error, so `isRetryable` returns false). `withRetry` clears the singleton and throws immediately. The `catch (insertErr)` block in `recordRouterCall` (`src/lib/router/sdk.ts`) maps AUTO→BALANCED and attempts a fallback INSERT. However, after the enum error the Neon HTTP channel that served the failed INSERT is invalidated; the freshly-created `PrismaNeon` WebSocket adapter fails to open its first connection before the Vercel serverless function's tight I/O timeout fires, and all three INSERT attempts (primary, fallback, minimal) fail. The exception propagates to `handler.ts` where the outer `catch` silently swallows it, logs to Vercel (key: `[RouterCall] write failed`), and returns HTTP 200. The call is lost.

**Note:** The `withRetry` singleton-clear fix (applied in cycle 111 — always clear on any error, not just retryable ones) is already live in `src/lib/prisma.ts`. That fix removed one failure path but the root cause here is the missing DB enum value, not stale singleton.

**Fix — two-part:**

### Part A: Deploy the migration (required, resolves the root cause)

**File:** `prisma/migrations/20260315_add_router_strategy_manual_auto/migration.sql`

This migration already exists in the repo. It must be applied to the production Neon database:
```
npx prisma migrate deploy
```
The SQL is:
```sql
ALTER TYPE "RouterStrategy" ADD VALUE IF NOT EXISTS 'MANUAL';
ALTER TYPE "RouterStrategy" ADD VALUE IF NOT EXISTS 'AUTO';
```
Once deployed, `strategyUsed: 'AUTO'` is a valid enum value and the primary INSERT succeeds. All call records will be committed.

### Part B: Add explicit enum-error detection to the fallback INSERT path (defense-in-depth)

**File:** `src/lib/router/sdk.ts` — `recordRouterCall`, `catch (insertErr)` block (~line 335)

In the `catch (insertErr)` block, before building `safeData`, detect the enum violation explicitly and log it as a distinct actionable alert:
```ts
if (errMsg.includes('invalid input value for enum') || errMsg.includes('invalid enum value')) {
  console.error('[RecordRouterCall] DB ENUM MIGRATION NOT APPLIED — deploy 20260315_add_router_strategy_manual_auto to fix call persistence');
}
```
This makes Vercel logs immediately point to the migration rather than requiring code archaeology.

**File:** `src/lib/router/handler.ts` — `catch (recordErr)` block (~line 321)

Add the same enum-error detection to the outer catch so even if all fallback INSERTs fail the log message names the fix:
```ts
if (errMsg.includes('invalid input value for enum') || errMsg.includes('invalid enum value')) {
  console.error('[RouterCall] ENUM MIGRATION NOT APPLIED — deploy 20260315_add_router_strategy_manual_auto');
}
```

**Files changed:**
- `prisma/migrations/20260315_add_router_strategy_manual_auto/migration.sql` — deploy to prod (file already exists, no code edit needed)
- `src/lib/router/sdk.ts` — add enum-error detection in `recordRouterCall` fallback catch
- `src/lib/router/handler.ts` — add enum-error detection in outer catch

---

## Verification

After deploying the migration, QA should see:
- `GET /api/v1/router/calls?limit=10` → non-empty array after routing calls
- `GET /api/v1/router/account` → `totalCalls > 0` after multiple searches
- Tests `1.5-calls-recorded` and `7.2-call-fields` pass
- Score: 54/54

All other Round 15 checks (routing, auth, pages, edge cases) remain passing and are not touched by this fix.
