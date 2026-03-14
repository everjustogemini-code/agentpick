# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md Must-Have #1 (P1/P2 bugs) + Must-Have #2 (backend verify)

---

## Files to modify (ONLY these — no others)

| Action | File |
|--------|------|
| MODIFY | `src/lib/router/handler.ts` |
| MODIFY | `src/lib/router/index.ts` |
| MODIFY | `src/app/api/v1/router/usage/route.ts` |
| VERIFY (patch only if broken) | `src/app/api/v1/router/priority/route.ts` |
| VERIFY (patch only if broken) | `src/app/api/v1/playground/route/route.ts` |

**DO NOT TOUCH:** Any file in `src/app/connect/`, `src/app/dashboard/`, `src/components/`, `src/app/page.tsx`, or any other frontend file.

---

## Bug 1 — P1: Crawl endpoint rejects bare `{"url":"..."}` body

**File:** `src/lib/router/handler.ts`  
**Current broken line (~117):**
```typescript
if (!parsed.params && (parsed.query || parsed.q || parsed.text || parsed.input)) {
```

**Root cause:** The flat-body → `params` promotion logic does not include `url`. So `POST /api/v1/route/crawl {"url":"https://example.com"}` reaches the guard at line 135:
```typescript
if (!body.params || typeof body.params !== 'object') {
  return apiError('VALIDATION_ERROR', 'params object is required.', 400);
}
```
and fails.

**Fix:** Add `|| parsed.url` to the condition so `url` triggers auto-promotion:
```typescript
// BEFORE:
if (!parsed.params && (parsed.query || parsed.q || parsed.text || parsed.input)) {

// AFTER:
if (!parsed.params && (parsed.query || parsed.q || parsed.text || parsed.input || parsed.url)) {
```

No other changes needed. The `crawl/route.ts` already has belt-and-suspenders normalization via Zod but that path has edge cases (fails if URL format is invalid); the handler fix is the authoritative fix.

**Test:** `POST /api/v1/route/crawl {"url":"https://example.com"}` → 200 or tool error, NOT `400 VALIDATION_ERROR: params object is required`.

---

## Bug 2 — P2: `cheapest` strategy routes to Tavily (wrong cost ranking)

**File:** `src/lib/router/index.ts`

**Current state (TOOL_CHARACTERISTICS ~line 94):**
```typescript
serpapi: { quality: 3.0, cost: 0.0002, latency: 89, stability: 0.98 },
```

**Root cause:** Per correct API pricing, Serper (mapped to `serpapi` slug) costs ~$0.0001/call, same tier as Brave. Current value of `0.0002` may cause it to rank unexpectedly in edge cases. The spec requires `cheapest` to resolve: `brave-search → serper → serpapi-google → tavily → exa-search`.

Costs that produce this order:
- `brave-search`: 0.0001 ✓ (already correct)
- `serpapi`: 0.0001 ← **change from 0.0002**
- `tavily`: 0.001 ✓
- `exa-search`: 0.002 ✓

**Fix:**
```typescript
// BEFORE:
serpapi: { quality: 3.0, cost: 0.0002, latency: 89, stability: 0.98 },

// AFTER:
serpapi: { quality: 3.0, cost: 0.0001, latency: 89, stability: 0.98 },
```

Do NOT change any other field in TOOL_CHARACTERISTICS. Do NOT change routing logic.

**Test:** `getRankedToolsForCapability('search', 'cheapest')[0]` must be `brave-search` or `serpapi`, never `tavily`.

---

## Bug 3 — P2: Priority endpoint field name mismatch (verify + harden)

**File:** `src/app/api/v1/router/priority/route.ts`

**Current state:** Line 23 already reads:
```typescript
const toolsValue = body.tools ?? body.priority_tools ?? body.search;
```
This should already accept `search` as an alias. **Read the file and verify this line exists unchanged.**

If the line is present and correct, the only remaining fix is the error message at line 35. Update it to mention `search` as a valid alias:
```typescript
// BEFORE:
return apiError('VALIDATION_ERROR', 'Provide tools/priority_tools (priority list) or excluded/excluded_tools (exclusion list).', 400);

// AFTER:
return apiError('VALIDATION_ERROR', 'Provide tools/priority_tools/search (priority list) or excluded/excluded_tools (exclusion list).', 400);
```

If the alias handling on line 23 is broken or missing, also fix it:
```typescript
const toolsValue = body.tools ?? body.priority_tools ?? body.search;
```

**Test:** `POST /api/v1/router/priority {"search":["exa-search"]}` → 200 JSON response.

---

## Bug 4 — P2: Usage response missing `monthlyLimit`, `callsThisMonth`, `strategy` at top level

**File:** `src/app/api/v1/router/usage/route.ts`

**Current state:** These fields ARE returned but only nested under `account`. The response shape is:
```json
{
  "plan": "FREE",
  "daily_limit": ...,
  "stats": {...},
  "account": { "plan": "FREE", "monthlyLimit": 10000, "callsThisMonth": 42, "strategy": "AUTO" }
}
```

Dashboard and SDK clients read top-level fields. They see `plan` but not `monthlyLimit`, `callsThisMonth`, or `strategy`.

**Fix:** Also expose these three fields at the top level of the response (keep the `account` sub-object for backwards compat with any client already reading it):

```typescript
// BEFORE (return statement):
return Response.json({
  plan: account.plan,
  daily_limit: limits.limit,
  daily_used: limits.used,
  daily_remaining: limits.remaining,
  stats,
  account: {
    plan: account.plan,
    monthlyLimit: MONTHLY_LIMITS[account.plan as string] ?? null,
    callsThisMonth,
    strategy: account.strategy,
  },
});

// AFTER:
return Response.json({
  plan: account.plan,
  monthlyLimit: MONTHLY_LIMITS[account.plan as string] ?? null,
  callsThisMonth,
  strategy: account.strategy,
  daily_limit: limits.limit,
  daily_used: limits.used,
  daily_remaining: limits.remaining,
  stats,
  account: {
    plan: account.plan,
    monthlyLimit: MONTHLY_LIMITS[account.plan as string] ?? null,
    callsThisMonth,
    strategy: account.strategy,
  },
});
```

**Test:** `GET /api/v1/router/usage` response body must have `monthlyLimit`, `callsThisMonth`, `strategy` as direct top-level keys (not only nested under `account`).

---

## Bug 5 — P2: `ai_routing_summary` never populated

**File:** `src/lib/router/handler.ts`

**Root cause:** The field is documented but never emitted. The response currently includes `meta.ai_classification` (when strategy=auto) but no `ai_routing_summary` at the root level.

**Fix:** After the `routeRequest(...)` call in the POST handler, add `ai_routing_summary` to the response JSON when AI classification was used. Find the `Response.json(...)` call that returns the route result and augment it:

```typescript
// When result.response.meta.ai_classification exists, add to root of response:
const responseBody: Record<string, unknown> = { ...result.response };
if (result.response.meta.ai_classification) {
  responseBody.ai_routing_summary = {
    strategy_used: body.strategy ?? account.strategy ?? 'balanced',
    tool_selected: result.response.meta.tool_used,
    reasoning: result.response.meta.ai_classification.reasoning ?? null,
    classification_ms: result.response.meta.classification_ms ?? null,
  };
}
return Response.json(responseBody, { headers: responseHeaders });
```

Replace the existing `return Response.json(result.response, ...)` call with this block. Do not create a new one.

**Test:** `POST /api/v1/route/search {"query":"test","strategy":"auto"}` response body must contain `ai_routing_summary` with non-null `tool_selected`.

---

## Must-Have #2 Backend — Verify playground/route endpoint

**File:** `src/app/api/v1/playground/route/route.ts`

This endpoint already exists and is substantially complete. **Read it and verify:**
1. Rate limit is 5 req/min per IP (in-memory fallback + Upstash if configured) ✓
2. `PLAYGROUND_KEY` env var is used as auth for upstream call ✓
3. Results capped to 2 items ✓
4. `_playground: true` in response ✓
5. `traceId` included ✓

If all 5 checks pass, make no changes. If any are broken, patch in-place.

---

## Verification checklist

- [ ] `POST /api/v1/route/crawl {"url":"https://example.com"}` → not 400
- [ ] `POST /api/v1/route/search {"strategy":"cheapest"}` → `tool_used` is `brave-search` or `serpapi`
- [ ] `POST /api/v1/router/priority {"search":["exa-search"]}` → 200
- [ ] `GET /api/v1/router/usage` top-level has `monthlyLimit`, `callsThisMonth`, `strategy`
- [ ] `POST /api/v1/route/search {"strategy":"auto"}` response has `ai_routing_summary`
