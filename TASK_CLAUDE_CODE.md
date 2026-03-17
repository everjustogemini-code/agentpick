# TASK_CLAUDE_CODE.md
**Agent:** Claude Code (backend / tests)
**Cycle:** 2
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #1 (P1) + Must-Have #3 (backend audit)

---

## Files to Modify

| File | Action |
|------|--------|
| `src/__tests__/rate-limit-429.test.ts` | Modify — add HTTP route-handler level assertions (file exists, has 2 tests) |
| `src/app/b/[runId]/badge.svg/route.ts` | Modify — add XSS-safe escaping for tool name in SVG template |

**DO NOT touch any files owned by TASK_CODEX.md:**
`src/app/globals.css`, `src/app/page.tsx`, `src/components/HeroCodeBlock.tsx`,
`src/components/AnimatedCounter.tsx`, `src/components/AgentCTA.tsx`,
`src/components/RouterCTA.tsx`, `src/app/connect/page.tsx`,
`src/app/dashboard/page.tsx`, `src/app/rankings/[slug]/page.tsx`,
`src/app/b/[runId]/page.tsx`

---

## Task 1 — Must-Have #1 (P1): Extend Rate Limit 429 Tests to HTTP Layer

**NEXT_VERSION.md ref:** Must-Have #1 — QA suite must reach ≥ 53/53; 429 path must have CI regression coverage, not manual-only.

### Current State
`src/__tests__/rate-limit-429.test.ts` **already exists** with 2 passing tests that call `checkUsageLimit()` directly (function level). These do NOT cover the HTTP response format (status 429, `Retry-After` header, `error.code` body field).

The QA P1 requires asserting the HTTP route handler produces the correct 429 response shape.

### Before Writing

1. Read `src/lib/router/handler.ts` — find the block where `usage.hardCapped === true` triggers a 429 response (around line 240). Confirm the exact `code` string passed to `apiError()` — it may be `'USAGE_LIMIT'` (not `'RATE_LIMITED'` as the spec says). **Use whatever the handler actually passes** — do not change the handler.

2. Read the existing `src/__tests__/rate-limit-429.test.ts` to understand the current mock setup and avoid duplicating tests.

3. Read `src/lib/router/sdk.ts` to find the `checkUsageLimit` function signature and understand what mock values to supply.

### What to Add to `src/__tests__/rate-limit-429.test.ts`

Add a **second `describe` block** (after the existing one) that mocks at a higher level and tests the handler's HTTP output. You will need to import the router handler function from wherever it is exported (likely `src/lib/router/handler.ts` or a route file). Use the `NextRequest` / `Response` pattern already used in other test files (see `src/__tests__/router.test.ts` for the mock pattern).

Add these two new assertions:

**Assertion 1 — 500th call (at 499) → HTTP 200:**
- Mock `prisma.routerCall.count` to return `todayCount=0`, `monthCount=499`
- Invoke the route handler with a valid API key request
- Assert `response.status === 200` (call should be allowed)

**Assertion 2 — 501st call (at 500) → HTTP 429:**
- Mock `prisma.routerCall.count` to return `todayCount=0`, `monthCount=500`
- Invoke the route handler with a valid API key request
- Assert `response.status === 429`
- Assert `(await response.json()).error.code === '<ACTUAL_CODE>'` (use the code from handler.ts)
- Assert `response.headers.get('Retry-After')` is a non-null string

> **Important:** If the handler is difficult to unit-test in isolation (e.g. it requires a live DB for API key lookup), mock the full auth + usage path. Look at how `src/__tests__/router.test.ts` or `src/__tests__/billing.test.ts` handle mocking to use the same approach.

### Acceptance Criteria
- `npx vitest run src/__tests__/rate-limit-429.test.ts` reports 4 passing tests (up from 2)
- No existing tests broken
- The 2 new assertions cover the HTTP 429 path end-to-end (status code + body `error.code` + `Retry-After` header)
- No new npm dependencies

---

## Task 2 — Must-Have #3 (backend): Badge SVG XSS Escaping

**File:** `src/app/b/[runId]/badge.svg/route.ts`

### Problem
Line 43: `const label = \`${winningTool} · ${latencyMs}ms\`` — `winningTool` comes from `run.product?.name` which is a DB value. If a product name contains `<`, `>`, `&`, or `"`, the SVG XML breaks and could render unexpected content.

### Fix
Add an `escSvg` helper before the `GET` function and apply it to `winningTool`:

```typescript
function escSvg(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

Then on line 43, change:
```typescript
const label = `${winningTool} · ${latencyMs}ms`
```
to:
```typescript
const label = `${escSvg(winningTool)} · ${latencyMs}ms`
```

No other changes to this file.

### Acceptance Criteria
- Product names with `<`, `>`, `&`, `"` produce valid SVG XML
- No functional change for normal product names
- No new dependencies

---

## Already Complete — Do Not Redo

- `src/app/api/v1/benchmarks/[runId]/public/route.ts` — multi-tool response is implemented and correct (cycle 1 work). Do not modify.
- `src/app/b/[runId]/opengraph-image.tsx` — implemented and correct. Do not modify.

---

## Final Verification

- [ ] `npx vitest run src/__tests__/rate-limit-429.test.ts` — 4 tests pass
- [ ] `npx vitest run` — all tests pass, no regressions
- [ ] Badge SVG escaping applied
- [ ] No changes to CODEX-owned files
- [ ] Write progress log to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`
