# NEXT_VERSION — AgentPick v0.80

**Date:** 2026-03-15
**QA Round:** 14 — Score: 62/67 (5 failures: 1 P0, 3 P1)
**Branch base:** bugfix/cycle-80
**Cycle type:** BUG FIX ONLY — zero new features

---

## Mandate

QA Round 14 found 5 regressions vs Round 13 (which was 58/58 clean).
Every issue below MUST be fixed before any growth work resumes.
Fixes must not be reverted by subsequent growth commits.

---

## Fix #1 — P0 · QA Issue #1: `GET /api/v1/router/calls` → HTTP 500

**QA tests failed:** `1.5-calls-recorded`, `7.2-call-fields`
**Error:** `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}`

**Root cause:**
`src/app/api/v1/router/calls/route.ts` lines 47–50 use Prisma `NOT` with an array:
```ts
NOT: [
  { toolUsed: { in: ['unknown', '', ...CAPABILITY_NAMES] } },
  { toolUsed: { endsWith: '-unavailable' } },
],
```
This syntax is fragile across Prisma versions and was broken by the growth-17 commit
which rewrote it as `AND: [{ NOT: {cond1} }, { NOT: {cond2} }]`. The array form
of `NOT` must not be touched by growth commits. The fix is to use the explicit
`NOT: { OR: [...] }` form which is unambiguous and stable:

**Fix — `src/app/api/v1/router/calls/route.ts` lines 47–50:**
```ts
// BEFORE (fragile — growth commits keep breaking this):
NOT: [
  { toolUsed: { in: ['unknown', '', ...CAPABILITY_NAMES] } },
  { toolUsed: { endsWith: '-unavailable' } },
],

// AFTER (explicit, stable, cannot be misread):
NOT: {
  OR: [
    { toolUsed: { in: ['unknown', '', ...CAPABILITY_NAMES] } },
    { toolUsed: { endsWith: '-unavailable' } },
  ],
},
```

**Why this is stable:** `NOT: { OR: [A, B] }` = NOT (A OR B) = NOT A AND NOT B.
Same semantics as the array form, but explicit. No Prisma version ambiguity.
Growth commits must not rewrite this pattern.

---

## Fix #2 — P1 · QA Issue #2: `POST /api/v1/router/priority` → HTTP 400

**QA test failed:** `2.6-set-priority`
**Error:** `{"error": {"code": "VALIDATION_ERROR", "message": "Provide tools/priority_tools ..."}}`

**Root cause:**
`src/app/api/v1/router/priority/route.ts` line 43 matches the request body against
a fixed list of field aliases. QA test `2.6-set-priority` sends a capability-keyed
payload (e.g. `{"search": ["tavily", "exa-search"]}`). Growth commits have repeatedly
removed the capability-name aliases (`body.search`, `body.crawl`, etc.) while
"cleaning up" the handler, causing `Object.keys(update).length === 0` → 400.

**Fix — `src/app/api/v1/router/priority/route.ts` line 43:**
```ts
// MUST accept ALL of these aliases — QA test 2.6 sends capability-keyed payload:
const toolsValue =
  body.tools ??
  body.priority_tools ??
  body.search ??      // QA test 2.6-set-priority sends {"search": [...]}
  body.crawl ??
  body.embed ??
  body.finance;
```

**Guard comment to prevent future regression (add above line 43):**
```ts
// NOTE: Do NOT remove body.search / body.crawl / body.embed / body.finance.
// QA test 2.6-set-priority sends capability-keyed payloads (e.g. {"search": [...]}).
// Removing these aliases causes HTTP 400 — this has regressed 3 times already.
```

---

## Fix #3 — P1 · QA Issue #3: `GET /api/v1/router/account` returns nulls for new users

**QA test failed:** Paid User Flow — account info check
**Observed:** `plan: None, monthlyLimit: None, strategy: None` on fresh account

**Root cause:**
`src/app/api/v1/router/account/route.ts` GET handler returns the account data nested
under `account.usage`. The QA Paid User Flow checks `data.plan`, `data.strategy`,
`data.monthlyLimit` at the TOP LEVEL of the JSON response. When these top-level
fields are absent, Python parses them as `None`.

**Fix — `src/app/api/v1/router/account/route.ts` line 42+:**
The response must expose `plan`, `strategy`, `monthlyLimit`, and `callsThisMonth`
as top-level keys alongside the nested `account` object:
```ts
return Response.json({
  // Top-level fields — QA Paid User Flow reads data.plan / data.strategy directly:
  plan: account.plan,           // "FREE" | "STARTER" | "PRO" | "ENTERPRISE"
  strategy: account.strategy,   // "AUTO" | "BALANCED" | ...
  monthlyLimit,                 // 500 for FREE, null for ENTERPRISE
  callsThisMonth,
  account: { ... },             // full nested object unchanged
});
```

**Guard comment (add before the return statement):**
```ts
// NOTE: plan/strategy/monthlyLimit/callsThisMonth MUST remain as top-level fields.
// QA Paid User Flow checks data.plan and data.strategy directly on this response.
// Do NOT nest them under account.* only — this has broken onboarding multiple times.
```

---

## Fix #4 — P1 · QA Issue #4: `GET /api/v1/router/health` → 401 without auth

**QA test failed:** `1.4-health-no-auth` (Bearer Auth Test suite)
**Observed:** `{"error": {"code": "UNAUTHORIZED", ...}}` instead of `{"status": "healthy"}`

**Root cause:**
`src/app/api/v1/router/health/route.ts` is a public endpoint — no auth required.
Growth commits that add auth guards to `/api/v1/router/*` handlers (to fix security
issues on other endpoints) have inadvertently added auth checks to this handler as well.

**Fix — `src/app/api/v1/router/health/route.ts`:**
The handler must NOT have any early-return 401 block. The correct pattern is:
1. Parse auth header but do NOT return 401 if missing
2. If auth header present and valid → return personalized health data
3. If no auth or invalid auth → return public health response (HTTP 200)

```ts
// CORRECT — unauthenticated callers get public response, NOT 401:
if (!agent) {
  return Response.json({ status: 'healthy', message: 'AgentPick router is operational.' });
}
```

The `hasAuth` guard (lines 16–17) must never be replaced with a mandatory auth check.
External uptime monitors and status pages hit this endpoint without keys.

**Guard comment (add at top of GET handler):**
```ts
// PUBLIC ENDPOINT — no auth required. Do NOT add mandatory auth checks here.
// Unauthenticated requests receive basic status; authenticated requests get per-account stats.
// This endpoint must return 200 for requests with no Authorization header.
```

---

## Regression Prevention Rules

These 5 failures are all regressions from Round 13. To prevent recurrence:

| Rule | Applies to |
|------|------------|
| `NOT: { OR: [...] }` form is canonical — do NOT rewrite to `NOT: [{...}]` or `AND: [{NOT:...}]` | `calls/route.ts` |
| All 6 body aliases in priority handler are required — do NOT remove `body.search/crawl/embed/finance` | `priority/route.ts` |
| `plan`/`strategy`/`monthlyLimit`/`callsThisMonth` must remain top-level in account response | `account/route.ts` |
| Health endpoint must return 200 with no auth — never add mandatory auth guards here | `health/route.ts` |

---

## Acceptance Criteria

- [ ] `GET /api/v1/router/calls` → HTTP 200 (tests `1.5-calls-recorded` + `7.2-call-fields`)
- [ ] `POST /api/v1/router/priority` → HTTP 200 (test `2.6-set-priority`)
- [ ] `GET /api/v1/router/account` → `plan: "FREE"`, `monthlyLimit: 500`, `strategy: "AUTO"` for new user
- [ ] `GET /api/v1/router/health` with no auth → HTTP 200 `{"status": "healthy"}`
- [ ] Full QA suite: 67/67 (or ≥ 63/67 with no P0/P1 failures)
- [ ] No growth features merged until QA passes

---

## Out of Scope This Cycle

Everything from previous NEXT_VERSION.md (Glassmorphism UI, Node.js SDK, Request Inspector)
is deferred. Zero new features until QA is clean.
