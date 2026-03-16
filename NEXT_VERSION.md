# NEXT_VERSION — Bugfix Cycle 111

**Source:** QA Round 15 (2026-03-15)
**Branch:** bugfix/cycle-111
**Rule:** Bug fixes only. Zero new features.

---

## Fix #1 — P1: Calls not persisted to database after routing

**QA Issues:** `1.5-calls-recorded`, `7.2-call-fields`

**Symptom:**
`POST /api/v1/route/search` returns HTTP 200 with a valid `meta.trace_id`, but no `RouterCall` record is ever committed. `GET /api/v1/router/calls` returns `{"calls": []}`. Account `totalCalls` stays at 0.

**Root Cause:**
`withRetry` in `src/lib/prisma.ts` clears the Prisma singleton (`globalForPrisma.prisma = undefined`) **only on retryable errors**. When any DB operation inside `recordTrace` (`telemetryEvent.create` or `product.update`) fails with a **non-retryable** error (e.g. a schema mismatch, constraint violation, or a connection-drop error message not listed in `isRetryable`), `withRetry` throws immediately **without clearing** the singleton. The Prisma singleton is left holding a stale/broken connection.

The outer `try-catch` in `recordTrace` swallows the error (non-fatal), so `routeRequest` continues and returns 200. Then `recordRouterCall` in `handler.ts` calls `routerCall.create` — still through the same stale singleton. If the stale-connection error is also non-retryable, `withRetry` throws immediately without clearing. The `RouterCall` record is never written. The catch at line 300 of `handler.ts` swallows the recording error. The user sees HTTP 200 but no call is stored.

Cycle 109 added `withRetry` around `product.update` in `recordTrace`, which fixed the case where a *retryable* `product.update` failure left the singleton stale. But **non-retryable** failures from both `telemetryEvent.create` and `product.update` still leave the singleton stale — so the same class of bug persists into Round 15.

**Fix:**
`src/lib/prisma.ts` — in `withRetry`, move `globalForPrisma.prisma = undefined` to execute **before** the `if (!isRetryable(err)) throw err` guard, so the singleton is cleared after **any** error:

```
Before (current):
  if (!isRetryable(err)) throw err;        // throws WITHOUT clearing singleton
  globalForPrisma.prisma = undefined;      // only reached on retryable errors

After (fix):
  globalForPrisma.prisma = undefined;      // always clear on any error
  if (!isRetryable(err)) throw err;        // then rethrow if non-retryable
```

This guarantees that after any failed DB operation, the next `withRetry` call in `recordRouterCall` always starts with a fresh Prisma client — regardless of which error category caused the earlier failure.

**Files changed:**
- `src/lib/prisma.ts` — `withRetry`: move singleton clear before retryability check

---

## Verification

After this fix, QA should see:
- `GET /api/v1/router/calls?limit=10` → non-empty array after routing calls
- `GET /api/v1/router/account` → `totalCalls > 0` after multiple searches
- Tests `1.5-calls-recorded` and `7.2-call-fields` pass
- Score: 54/54
