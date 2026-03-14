# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md — Bugfix Cycle 4 (QA Round 8, score 30/37)

---

## Files to Modify / Create

| Action | File |
|--------|------|
| MODIFY | `src/app/api/v1/health/route.ts` |
| MODIFY (if needed) | `next.config.ts` |
| MODIFY | `src/lib/router/handler.ts` |
| MODIFY | `src/lib/router/index.ts` |
| MODIFY | `src/lib/router/plans.ts` |
| MODIFY | `src/app/api/v1/router/register/route.ts` |

**DO NOT TOUCH:** `src/app/products/[slug]/page.tsx`, `src/app/connect/page.tsx`, or any other frontend file.

---

## Bug P1-1 — `/api/v1/health` returns 500

**Root cause:** Next.js catch-all `src/app/api/v1/[[...path]]/route.ts` intercepts the request before `health/route.ts` can handle it.

### Fix 1 — `src/app/api/v1/health/route.ts`

Replace the entire file body with a re-export of the canonical health handler:

```ts
import { GET as canonicalHealth } from '@/app/api/health/route';
export { canonicalHealth as GET };
```

### Fix 2 — `next.config.ts` (only if Fix 1 alone doesn't resolve the 500)

Read the file first. Add `/api/v1/health` → `/api/health` rewrite inside the `rewrites()` array (or create the function if absent):

```ts
{ source: '/api/v1/health', destination: '/api/health', permanent: false }
```

**Acceptance:** `GET /api/v1/health` → HTTP 200, body matches `GET /api/health` (db status, uptime, commit).

---

## Bug P1-2 — `strategy: "custom"` rejected with HTTP 400

**Root cause (two bugs):**
1. `src/lib/router/handler.ts` lines 119–125: params-extraction branch only fires when a query field is present; a body with only `priority` (no `query`) skips extraction → `params` is undefined → returns `VALIDATION_ERROR`.
2. `STRATEGY_ALIASES` (line 35) silently maps `custom` → `balanced`; `priority` array is accepted but ignored.

### Fix 1 — `src/lib/router/handler.ts` lines 119–125

Extend the params-extraction trigger to also fire when `priority`, `priority_tools`, or `priorityTools` is present:

```ts
if (!parsed.params && (
  parsed.query || parsed.q || parsed.text || parsed.input ||
  parsed.url || parsed.ticker || parsed.symbol ||
  parsed.priority || parsed.priority_tools || parsed.priorityTools  // ← add
)) {
```

### Fix 2 — `src/lib/router/handler.ts` line 35 (`STRATEGY_ALIASES`) and `VALID_STRATEGIES`

- Remove `'custom'` from `STRATEGY_ALIASES`.
- Add `'custom'` to `VALID_STRATEGIES`.

### Fix 3 — `src/lib/router/index.ts` — implement `custom` strategy in `routeRequest`

Add a branch: when `strategy === 'custom'`, iterate `params.priority_tools ?? params.priority` in order and return the first available/enabled tool. Fall back to default capability ranking if the list is empty or all tools are unavailable.

### Fix 4 — `src/lib/router/handler.ts` lines 93 and 114 (error message hint)

If `custom` is not fully wired (i.e. Falls back silently), remove it from the error message hint so callers are not misled. If it IS implemented above, leave it in.

**Acceptance:** `POST /api/v1/route/search` with `{"query":"test","strategy":"custom","priority":["tavily","exa-search"]}` → HTTP 200, `meta.tool_used` is the first available tool from the priority array.

---

## Bug P1-3 — Free tier hits 429 after ~8 calls

**Root cause:** `ROUTER_PLAN_MONTHLY_LIMITS.FREE = 500` but register response advertises `monthlyLimit: 3000`. QA accounts exhaust the real 500-call cap across test cycles.

### Fix 1 — `src/lib/router/plans.ts`

- **Line 17**: `ROUTER_PLAN_MONTHLY_LIMITS.FREE` → change `500` to `3000`
- **Line 25**: `ROUTER_PLAN_DAILY_LIMITS.FREE` → change `200` to `100`

### Fix 2 — `src/app/api/v1/router/register/route.ts`

Read the file. In the 201 response body, replace any hardcoded `monthlyLimit` value with a dynamic lookup:

```ts
monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS[plan]
```

Ensure `ROUTER_PLAN_MONTHLY_LIMITS` is imported from `src/lib/router/plans.ts`.

**Acceptance:** A newly registered free-tier key makes 50 sequential calls without 429. `monthlyLimit` in register response equals enforced limit (3000).

---

## Verification Checklist

- [ ] `GET /api/v1/health` → HTTP 200, body matches `/api/health`
- [ ] `POST /api/v1/route/search` with `{"query":"test","strategy":"custom","priority":["tavily","exa-search"]}` → 200, correct `meta.tool_used`
- [ ] `POST /api/v1/route/search` with `{"strategy":"custom","priority":["tool-a","tavily"]}` (no query) → 400 `params object required` (not a strategy rejection)
- [ ] Register response `monthlyLimit` equals `ROUTER_PLAN_MONTHLY_LIMITS.FREE` (3000)
- [ ] 50 sequential calls on a fresh free-tier key → no 429
- [ ] No changes made to files owned by TASK_CODEX.md
