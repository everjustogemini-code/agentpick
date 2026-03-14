# TASK_CLAUDE_CODE.md — vNext
> Agent: Claude Code | Date: 2026-03-14 | Source: NEXT_VERSION.md
> Scope: Must-Have #1 (all P1/P2 bug fixes) + Must-Have #3 (Playground backend)

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/api/v1/route/crawl/route.ts` |
| MODIFY | `src/lib/router/handler.ts` |
| MODIFY | `src/app/api/v1/router/priority/route.ts` |
| MODIFY | `src/app/api/v1/router/usage/route.ts` |
| MODIFY | `src/lib/router/ai-classify.ts` |
| CREATE | `src/app/api/v1/playground/route/route.ts` |

**DO NOT TOUCH:** `src/app/page.tsx`, `src/app/connect/page.tsx`, `src/app/globals.css`,
`src/app/benchmarks/**`, `src/app/products/**`, `src/components/**`, `src/app/dashboard/router/page.tsx`

---

## Bug 1 — P1: Fix crawl endpoint rejects bare `{"url":"..."}`

**File:** `src/app/api/v1/route/crawl/route.ts`

**Problem:** `POST /api/v1/route/crawl {"url": "https://example.com"}` returns
`400 VALIDATION_ERROR: params object is required`.

**Fix:**
1. Read the file and find the body validation/parsing block.
2. Replace the URL extraction so it accepts both shapes:
   ```ts
   const url = body.url ?? body.params?.url
   if (!url) {
     return NextResponse.json({ error: 'VALIDATION_ERROR: url is required' }, { status: 400 })
   }
   ```
3. Remove any hard guard that rejects requests without a `params` wrapper.
4. Replace all downstream `body.params.url` / `parsed.params.url` references with the normalized `url` variable.
5. The old shape `{ params: { url } }` must continue to work (backward compat).

---

## Bug 2 — P2: Fix `cheapest` strategy routes to Tavily

**File:** `src/lib/router/handler.ts` (primary; also check `src/lib/router/index.ts` and `src/lib/router/sdk-handler.ts` if not found)

**Problem:** `cheapest` strategy returns `toolUsed: "tavily"`. Tavily costs ~$0.001/call;
Brave/Serper cost ~$0.0001/call — Tavily is 10× more expensive and must rank last.

**Fix:**
1. Search for a cost map / ranking array (e.g. `TOOL_COSTS`, `costMap`, or an ordered array).
2. Update numeric cost values so the sort order (ascending = cheapest first) becomes:
   ```
   brave-search  → cheapest
   serper
   serpapi-google
   tavily
   exa-search    → most expensive
   ```
   Example corrected map:
   ```ts
   const TOOL_COSTS: Record<string, number> = {
     'brave-search':    0.0001,
     'serper':          0.0002,
     'serpapi-google':  0.0003,
     'tavily':          0.001,
     'exa-search':      0.002,
   }
   ```
3. Do NOT change any routing logic — only fix the cost values.

---

## Bug 3 — P2: Priority endpoint rejects `search` field alias

**File:** `src/app/api/v1/router/priority/route.ts`

**Problem:** `POST /api/v1/router/priority {"search": ["exa-search"]}` returns
`400 Provide tools/priority_tools`. API expects `priority_tools`; docs/SDK send `search`.

**Fix:**
1. Find where `tools` / `priority_tools` is extracted from `body`.
2. Normalize all three aliases before any validation:
   ```ts
   const priority_tools = body.priority_tools ?? body.tools ?? body.search
   if (!priority_tools?.length) {
     return NextResponse.json(
       { error: 'Provide tools or priority_tools' },
       { status: 400 }
     )
   }
   ```
3. Use `priority_tools` for the rest of the handler. Replace all `body.tools` /
   `body.priority_tools` / `body.search` references downstream with `priority_tools`.

---

## Bug 4 — P2: Usage response missing `monthlyLimit`, `callsThisMonth`, `strategy`

**File:** `src/app/api/v1/router/usage/route.ts`

**Problem:** `GET /api/v1/router/usage` returns only `{ plan }` inside the account object.
Dashboard and SDK clients display blank values.

**Fix:**
1. Read the file. Find where the `account` object is assembled for the response.
2. Add these computed fields:

   ```ts
   // Derive monthly limit from plan
   const PLAN_LIMITS: Record<string, number> = {
     free: 10_000,
     pro: 100_000,
     enterprise: 1_000_000,
   }
   const monthlyLimit = PLAN_LIMITS[user.plan ?? 'free'] ?? 10_000

   // Count calls this calendar month
   const now = new Date()
   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
   const callsThisMonth = await prisma.routerCall.count({
     where: { userId: user.id, createdAt: { gte: startOfMonth } },
   })
   // If RouterCall is not the correct model name, check prisma/schema.prisma

   // Strategy: check all possible field names
   const strategy = user.strategy ?? user.defaultStrategy ?? user.routerStrategy ?? 'auto'
   ```

3. Return the complete account object:
   ```ts
   return NextResponse.json({
     account: { plan: user.plan ?? 'free', monthlyLimit, callsThisMonth, strategy },
     // ...keep any other existing response fields
   })
   ```

---

## Bug 5 — P2: `ai_routing_summary` never populated

**Files:** `src/lib/router/ai-classify.ts`, `src/lib/router/handler.ts`

**Problem:** The `ai_routing_summary` field is documented but always absent after AI-strategy calls.

**Decision — implement or remove, no partial contract:**

- **Option A (implement):** In `ai-classify.ts`, after classification runs, build a summary object and return it alongside the classification result:
  ```ts
  return {
    tool: selectedTool,
    ai_routing_summary: {
      model: 'gpt-4o-mini',       // or whichever model is used
      confidence: score,           // numeric 0–1 if available
      category: classifiedCategory,
      latency_ms: Date.now() - start,
    }
  }
  ```
  Then in `handler.ts`, propagate `ai_routing_summary` into the final response object when strategy is `ai` or `auto`.

- **Option B (remove contract):** If AI classification is not yet reliable, search for every occurrence of `ai_routing_summary` across all route handlers and response types and remove the field. Delete any OpenAPI/JSDoc comments that reference it.

Pick whichever option is simpler given the current code. Either outcome is acceptable — no partial states.

---

## Must-Have #3 — New Playground Backend Endpoint

### CREATE: `src/app/api/v1/playground/route/route.ts`

> Check `src/app/api/v1/playground/run/route.ts` first — if it can be extended to match
> this spec, extend it instead of creating a duplicate.

**Spec:**
- `POST /api/v1/playground/route`
- **No API key required** (unauthenticated)
- **IP rate limit:** 5 requests/minute per IP
  - Check for `UPSTASH_REDIS_REST_URL` env var; if present use Upstash
  - Otherwise use an in-memory `Map<string, { count: number; resetAt: number }>` (resets per minute)
  - Return `429 { error: 'Rate limit exceeded. Try again in 60 seconds.' }` when over limit
- **Input:**
  ```ts
  { query: string; type: 'search' | 'embed' | 'finance' }
  ```
- **Processing:**
  - Use `process.env.PLAYGROUND_KEY` as the API key for the downstream routing call
  - Call the same routing logic as the capability endpoints (`/api/v1/route/search`, etc.)
    based on the `type` field
- **Output:** Same shape as `/api/v1/route/search` PLUS:
  ```ts
  {
    // ...standard route response fields...
    results: [...].slice(0, 2),  // cap to 2 items
    _playground: true,
    traceId: string,
    tool: string,                // which tool was selected
    classification_reason?: string,  // AI reasoning if available
    latency_ms: number,
  }
  ```
- **Billing:** Do NOT write calls to any user's RouterCall / usage records

---

## Acceptance Checklist

- [ ] `POST /api/v1/route/crawl {"url":"https://example.com"}` → HTTP 200
- [ ] `POST /api/v1/route/crawl {"params":{"url":"https://example.com"}}` → HTTP 200 (old shape still works)
- [ ] `POST /api/v1/route/search {"strategy":"cheapest"}` → `toolUsed` is `brave-search` or `serper` (not `tavily`)
- [ ] `POST /api/v1/router/priority {"search":["exa-search"]}` → HTTP 200
- [ ] `POST /api/v1/router/priority {"tools":["exa-search"]}` → HTTP 200 (still works)
- [ ] `GET /api/v1/router/usage` returns `monthlyLimit`, `callsThisMonth`, `strategy` in account object
- [ ] `ai_routing_summary` is either always present (when AI strategy used) or removed from all docs/code
- [ ] `POST /api/v1/playground/route` returns `_playground: true`, ≤2 results, `latency_ms`
- [ ] 6th request from same IP within 1 minute → HTTP 429
