# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md — bugfix/cycle-21 (QA Round 9, score 49/51)

---

## Files to Modify

| Action | File |
|--------|------|
| MODIFY | `src/lib/router/sdk-handler.ts` |
| MODIFY | `src/lib/auth.ts` |

**DO NOT TOUCH:** `src/lib/router/index.ts`, `src/lib/router/ai-classify.ts`, or any frontend file. Those are owned by TASK_CLAUDE_CODE.

---

## Bug P1-2 — Auth-missing edge case (`7.5-auth-missing`)

**Root cause:**
1. Early-exit 401 responses in `handleSdkRouteRequest` do not set `Cache-Control: no-store` / `Vary: Authorization`, so an upstream proxy/Vercel Edge cache that cached a prior 200 can serve it to an unauthenticated request.
2. `authenticateAgent` may return a non-null agent via a cookie-based session or alternate auth vector even when no Authorization header is present — the guard `if (!agent || !agent.id)` does not verify Bearer token authentication.

---

### Fix 2a — `src/lib/router/sdk-handler.ts` — early-exit 401 responses (lines ~49–76)

**What to change:** All `apiError('UNAUTHORIZED', ...)` calls (at approximately lines 54, 57, 64, 72, 75) must include `Cache-Control: no-store` and `Vary: Authorization` headers.

Option A — Add a `headers` argument to `apiError` (if it supports an options param):
```ts
return apiError('UNAUTHORIZED', 'Missing or invalid API key.', 401, {
  headers: { 'Cache-Control': 'no-store', 'Vary': 'Authorization' },
});
```

Option B — Replace those early-exit calls with explicit Response construction:
```ts
return new Response(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Missing or invalid API key.' }), {
  status: 401,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Authorization',
  },
});
```

Apply whichever option is consistent with how `apiError` is implemented in this file. Every 401 path in the auth section must include these headers.

---

### Fix 2b — `src/lib/router/sdk-handler.ts` — post-`authenticateAgent` guard (line ~74)

**What to change:** After `authenticateAgent` returns, add an explicit check that the resolved agent carries an `ah_`-prefixed API key (i.e. was authenticated via the Bearer token, not a session or alternate vector):

```ts
// Guard: reject if the agent was not authenticated via a valid Bearer token.
const resolvedKey = agent.apiKey ?? agent.key ?? agent.token ?? '';
if (!resolvedKey.startsWith('ah_')) {
  return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401, /* cache headers */);
}
```

Adjust field name (`apiKey`, `key`, `token`) to match the actual shape returned by `authenticateAgent`. If using Option B above, use the same `new Response(...)` pattern here too.

---

### Fix 2c — `src/lib/auth.ts` — audit `authenticateAgent` (read + conditional change)

**What to do:**
1. Read `src/lib/auth.ts` and locate the `authenticateAgent` function.
2. Check: can it return a non-null result when `request.headers.get('authorization')` is falsy/absent?
3. If yes, add an early return at the top of the function:

```ts
export async function authenticateAgent(request: Request, ...) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  // ... rest of existing logic
}
```

If the function already returns `null` when the Authorization header is absent, no change is needed — note this in the PR description.

---

## Verification Checklist

- [ ] `POST /api/v1/router/search` with no Authorization header → HTTP 401, every time, across 10 sequential requests from a cold deployment
- [ ] Same with `Authorization: ` (empty value) → HTTP 401
- [ ] Same with `Authorization: Bearer ` (keyword only, no token) → HTTP 401
- [ ] Valid `Authorization: Bearer ah_live_sk_...` → HTTP 200
- [ ] All 401 responses include `Cache-Control: no-store` and `Vary: Authorization` headers
- [ ] No changes made to files owned by TASK_CLAUDE_CODE.md (`index.ts`, `ai-classify.ts`)
