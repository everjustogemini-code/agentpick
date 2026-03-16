# NEXT_VERSION — AgentPick v0.98

**Date:** 2026-03-15
**QA Round:** 15 — Score: 51/54 (1 unique P1 bug, 2 test failures sharing same root cause)
**Branch base:** bugfix/cycle-98
**Cycle type:** BUG FIX ONLY — zero new features

---

## Mandate

QA Round 15 has one P1 issue. It is the same call-persistence bug that cycles 91, 96, and 97
each attempted to fix — but it persists. This cycle finds and closes the remaining root cause.

No growth work, no UI changes, no refactors. One bug. Fix it completely.

---

## P1 Issue #1 — QA Round 15: Calls not persisted to database after routing

**QA tests failed:** `1.5-calls-recorded`, `7.2-call-fields`
**Symptom:**
- `POST /api/v1/route/search` → HTTP 200, returns `meta.trace_id` and `meta.cost_usd` ✅
- `GET /api/v1/router/calls?limit=10` → `{"calls": []}` after 5+ searches ❌
- `GET /api/v1/router/account` → `totalCalls: 0`, `callsThisMonth: 0` after 5+ searches ❌

The `meta.trace_id` in each response is a valid CUID (e.g. `cmmsd94hw000w04lav25zr8td`) —
this is the `TelemetryEvent.id` from `recordTrace()` inside `routeRequest()`. So
`recordTrace` writes to `TelemetryEvent` successfully. But `recordRouterCall` (called in
handler.ts immediately after `routeRequest` returns) is failing silently.

---

## Fix History (cycles 91 → 97)

| Cycle | Fix applied | Status |
|-------|-------------|--------|
| 91 | Added `select: { id: true, traceId: true }` to `routerCall.create` — avoids Prisma auto-selecting missing `totalMs`/`responsePreview` columns (P2010) | ✅ Merged |
| 96 | Re-added `totalMs` to INSERT data (migration confirmed applied); isolated `developerAccount.update` concern | ✅ Merged |
| 97 | Wrapped `routerCall.create` in `withRetry()` for P1001/P1002/P2024; added `Math.round` for `latencyMs`/`totalMs`; added structured error logging | ✅ Merged |

All three fixes are present in the current codebase. **QA Round 15 still fails.** The error
is being caught and logged (handler.ts catch block, added in cycle 97), but:
1. Nobody has checked the Vercel production logs for the exact error code since cycle 97 deployed.
2. The `withRetry` in `prisma.ts` only retries `P1001 / P1002 / P2024` — other connection-level
   errors from the Neon HTTP adapter (e.g. `fetch failed`, socket timeouts, P1017) are thrown
   immediately and caught by the silent try-catch in handler.ts.

---

## Root Cause (Confirmed via Code Analysis)

### Primary: `isRetryable` does not cover Neon HTTP-level errors

**File:** `src/lib/prisma.ts` lines 56–65

```ts
// CURRENT — incomplete:
const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P2024']);

function isRetryable(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    return RETRYABLE_CODES.has((err as { code: string }).code);
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('ECONNREFUSED') || msg.includes('connection timeout');
}
```

`PrismaNeon` makes HTTP requests to the Neon serverless proxy. After `routeRequest`
runs (~1.5 seconds including external tool API + `recordTrace` DB write), the HTTP
connection can be invalidated. When `recordRouterCall` attempts `routerCall.create`,
the Neon HTTP fetch fails with one of:

- **P1017** — "Server has closed the connection" — NOT in RETRYABLE_CODES
- **`fetch failed`** — Node.js fetch error on HTTP timeout — does not match `'connection timeout'`
- **`socket hang up`** — TCP-level drop after idle period — does not match either pattern

Because these errors are not retried, `withRetry` throws on the first attempt, which
propagates to the outer `try-catch` in `handler.ts` and is swallowed. No RouterCall is written.

### Secondary: `developerAccount.update` failure inside `recordRouterCall` is not isolated

**File:** `src/lib/router/sdk.ts` — the `currentAccount` findUnique + update block (lines ~304–347)

```ts
const call = await withRetry(() => db.routerCall.create({...}));  // ← covered by withRetry

const currentAccount = await db.developerAccount.findUnique({...}); // ← NOT covered
if (currentAccount) {
  await db.developerAccount.update({...});                           // ← NOT covered
}
```

If `developerAccount.findUnique` or `developerAccount.update` throws after `routerCall.create`
succeeds, the entire `recordRouterCall` throws. Handler.ts catches it and logs
`[RouterCall] write failed` — even though the RouterCall WAS committed. This gives the false
impression that the primary write failed when only the summary stats update failed.

---

## Fix #1 — Expand `isRetryable` to cover Neon HTTP errors

**File:** `src/lib/prisma.ts`
**Lines:** 56–65 (RETRYABLE_CODES constant and isRetryable function)

```ts
// BEFORE:
const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P2024']);

function isRetryable(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    return RETRYABLE_CODES.has((err as { code: string }).code);
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('ECONNREFUSED') || msg.includes('connection timeout');
}

// AFTER:
// NOTE: P1017 = "Server has closed the connection" — common with Neon HTTP after
// ~1.5s external tool API call. 'fetch failed' = Node.js undici error on HTTP timeout.
// 'socket hang up' = TCP drop during idle period. All are transient and safe to retry.
const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P1017', 'P2024']);

function isRetryable(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    return RETRYABLE_CODES.has((err as { code: string }).code);
  }
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('ECONNREFUSED') ||
    msg.includes('connection timeout') ||
    msg.includes('fetch failed') ||       // Neon HTTP adapter — Node.js fetch error
    msg.includes('socket hang up') ||     // TCP drop
    msg.includes('Server has closed')     // P1017 message text fallback
  );
}
```

**Why this is correct:** All new patterns are transient network failures that resolve on
retry. They are NOT data errors (P2002 unique, P2003 FK, P2009 enum). Adding them to the
retry set is safe — a retry either succeeds or throws a different non-retryable error that
is handled by the handler.ts catch block.

---

## Fix #2 — Isolate `developerAccount.update` in `recordRouterCall`

**File:** `src/lib/router/sdk.ts`
**Function:** `recordRouterCall` — the `currentAccount` block after `routerCall.create`

```ts
// BEFORE — findUnique + update can throw and mask whether routerCall.create succeeded:
const currentAccount = await db.developerAccount.findUnique({ where: { id: developerId }, select: { ... } });
if (currentAccount) {
  ...
  await db.developerAccount.update({ where: { id: developerId }, data: { ... } });
}
return call;

// AFTER — isolate account update so RouterCall commit is never hidden by a stats failure:
// NOTE: routerCall.create is already committed at this point (awaited above via withRetry).
// developerAccount.update is a denormalized stats cache — stale counts are acceptable.
// Do NOT remove this try-catch: losing it causes a misleading "[RouterCall] write failed"
// log in handler.ts even when the RouterCall record was successfully committed.
try {
  const currentAccount = await db.developerAccount.findUnique({ where: { id: developerId }, select: { ... } });
  if (currentAccount) {
    ...
    await db.developerAccount.update({ where: { id: developerId }, data: { ... } });
  }
} catch (updateErr) {
  const code = (updateErr as Record<string, unknown>)?.code;
  console.error('[RouterCall] account stats update failed (RouterCall committed OK):', code ?? '', updateErr instanceof Error ? updateErr.message : updateErr);
}
return call;
```

**Why this is correct:** `callsThisMonth` in the account endpoint is computed via
`db.routerCall.count()`, not from `DeveloperAccount.totalCalls`. If the account update
fails but RouterCall is committed, `callsThisMonth` will be accurate. `totalCalls` is a
cache that will self-correct on the next successful update.

---

## Fix #3 — Improve error logging in handler.ts recording catch block

**File:** `src/lib/router/handler.ts`
**Lines:** 298–302 (catch block of the `recordRouterCall` try-catch)

```ts
// BEFORE — loses stack trace, hard to diagnose in Vercel logs:
console.error('[RouterCall] write failed:', errCode ?? 'no-code', errMeta ?? '', recordErr instanceof Error ? recordErr.message : recordErr);

// AFTER — structured object with full error for Vercel Function Logs inspection:
// NOTE: The structured object form allows Vercel to render the full stack trace.
// Keep errCode/errMeta at the top level for quick grep in Vercel log search.
console.error('[RouterCall] write failed', {
  code: errCode ?? 'no-code',
  meta: errMeta ?? null,
  message: recordErr instanceof Error ? recordErr.message : String(recordErr),
  error: recordErr,
});
```

---

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/lib/prisma.ts` | 56–65 | Add `P1017` to `RETRYABLE_CODES`; expand message patterns with `fetch failed`, `socket hang up`, `Server has closed` |
| `src/lib/router/sdk.ts` | ~304–347 | Wrap `developerAccount.findUnique` + `developerAccount.update` in separate try-catch; log but do not propagate |
| `src/lib/router/handler.ts` | 298–302 | Improve catch block to log full error object (structured form) |

**Do NOT touch:**
- `src/app/api/v1/router/calls/route.ts` — `NOT: { OR: [...] }` must not be changed
- `src/app/api/v1/router/priority/route.ts` — all capability-key aliases must stay
- `src/app/api/v1/router/health/route.ts` — public endpoint, no mandatory auth
- `src/app/api/v1/router/account/route.ts` — top-level `plan`/`strategy`/`monthlyLimit`/`callsThisMonth` must stay

---

## Regression Prevention

| Rule | File |
|------|------|
| `RETRYABLE_CODES` must include P1001, P1002, **P1017**, P2024 | `src/lib/prisma.ts` |
| `isRetryable` must match `fetch failed`, `socket hang up`, `Server has closed` | `src/lib/prisma.ts` |
| `developerAccount.update` block inside `recordRouterCall` must be in its own try-catch | `src/lib/router/sdk.ts` |
| `NOT: { OR: [...] }` in calls/route.ts must never be rewritten to array or AND form | `src/app/api/v1/router/calls/route.ts` |

---

## Acceptance Criteria

- [ ] `POST /api/v1/route/search` × 5, then `GET /api/v1/router/calls?limit=10` → non-empty `calls` array (QA `1.5-calls-recorded`)
- [ ] Each call in the array has `tool_used`, `latency_ms`, `cost_usd`, `trace_id` fields (QA `7.2-call-fields`)
- [ ] `GET /api/v1/router/account` → `callsThisMonth > 0` after 5+ searches
- [ ] All Round 14 regressions remain fixed (calls HTTP 200, priority HTTP 200, account defaults, health HTTP 200)
- [ ] Full QA suite: 54/54 — no P0 or P1 failures

---

## Out of Scope

All deferred features from previous cycles (Glassmorphism UI, Node.js SDK, Request Inspector)
remain deferred. Zero new features until QA is 54/54 clean.
