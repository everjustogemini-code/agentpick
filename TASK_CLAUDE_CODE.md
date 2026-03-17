# TASK_CLAUDE_CODE.md — 2026-03-16
**Agent:** Claude Code
**Source:** NEXT_VERSION.md — Must-Have #1 (P1a + P1b) + Must-Have #3 (backend routes)

---

## Overview

This task covers:
- **P1a:** AI classification latency optimization — reduce timeout, extend cache TTL, cap cache size, add `X-Classification-Ms` response header
- **P1b:** Automated rate limit regression test — add `test_rate_limit_429` vitest case
- **#3 backend:** Review and fix the three already-existing benchmark permalink backend files

TASK_CODEX.md owns all frontend/component files. **Zero file overlap.**

Ship order: P1a + P1b must pass before #3 merges to main.

---

## P1a — AI Classification Latency Fix

**Problem:** `POST /api/v1/route/search` classification step clocks ~500ms (Haiku timeout). Target ≤200ms.

### File: `src/lib/router/ai-classify.ts`

**Change 1 — Reduce Haiku timeout (line 189):**
Lower the `Promise.race` timeout from `500` ms to `150` ms:
```ts
// BEFORE
new Promise<QueryContext>((_, reject) => setTimeout(() => reject(new Error('timeout')), 500)),
// AFTER
new Promise<QueryContext>((_, reject) => setTimeout(() => reject(new Error('timeout')), 150)),
```

**Change 2 — Extend cache TTL (line ~32):**
Increase `CACHE_TTL_MS` from 2 minutes to 10 minutes. Queries repeat heavily in production; longer TTL eliminates most Haiku calls:
```ts
// BEFORE
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
// AFTER
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
```

**Change 3 — Cap cache size (after every `classificationCache.set(...)` call):**
The cache is a bare `Map` with no eviction. Add size capping (1000 entries max, LRU-style via insertion-order deletion) after every `classificationCache.set(key, ...)` call. There are 3 such calls (lines ~174, ~180, ~192, ~197). After each one, add:
```ts
if (classificationCache.size > 1000) {
  classificationCache.delete(classificationCache.keys().next().value!);
}
```

### File: `src/lib/router/index.ts`

**Goal:** Surface `classificationMs` as `X-Classification-Ms` HTTP response header.

The `routeRequest` function (line ~442) already tracks `classificationMs` (line ~449) and returns `{ response, headers?: Record<string, string> }`.

Find the two return sites that include `headers:`:

**Return 1 — success path (line ~654–657):**
```ts
// BEFORE
headers: isFallbackAttempt ? { 'X-AgentPick-Fallback': candidateSlug } : undefined,

// AFTER
headers: {
  ...(isFallbackAttempt ? { 'X-AgentPick-Fallback': candidateSlug } : {}),
  ...(classificationMs > 0 ? { 'X-Classification-Ms': String(classificationMs) } : {}),
},
```

**Return 2 — failure/fallback path (line ~701):**
Find the final `return {` that ends the function. Add `headers:` to it:
```ts
return {
  response: { ... },
  headers: classificationMs > 0 ? { 'X-Classification-Ms': String(classificationMs) } : undefined,
};
```

`src/lib/router/handler.ts` (line ~337) already spreads `extraHeaders` into the HTTP response — **no handler changes needed**.

**Acceptance criteria:**
- `X-Classification-Ms` header present on search route responses using `strategy: "auto"`
- Fast regex path: value `"0"` (still acceptable — indicates sub-ms)
- Haiku path: value ≤ `"150"` due to new timeout
- Cache hit: value `"0"`
- All 51 existing QA tests still pass

---

## P1b — Automated Rate Limit 429 Test

**Problem:** The 429 path (501st monthly call → `RATE_LIMITED`) has no automated regression test.

### File: `src/__tests__/router.test.ts`

Append a new `describe` block at the end of the file:

```ts
describe('Rate limit — 429 on monthly exhaustion', () => {
  it('returns 429 RATE_LIMITED with Retry-After when monthly limit is reached', async () => {
    // Mock rate-limit module to report exhausted
    vi.doMock('@/lib/rate-limit', () => ({
      checkRateLimit: vi.fn().mockResolvedValue({ limited: true, retryAfter: 3600 }),
    }));

    const { handleRouteRequest } = await import('@/lib/router/handler');

    const req = new Request('http://localhost/api/v1/route/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ah_test_rate_limit_key',
      },
      body: JSON.stringify({ query: 'test query', strategy: 'balanced' }),
    });

    const response = await handleRouteRequest(req as any, 'search');

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(response.headers.get('Retry-After')).not.toBeNull();
  });
});
```

**Fallback:** If `router.test.ts` has setup that makes `vi.doMock` impractical, add the test to `src/__tests__/enterprise-qa.test.ts` inside (or after) the existing `describe('P0-3: Rate limiting response...')` block instead. Same assertions apply.

**Acceptance criteria:**
- `npx vitest run` includes a passing test matching "rate limit" / "429" / "RATE_LIMITED"
- No existing tests broken
- Test runs in CI on every PR to `main` (no skip flags)

---

## Must-Have #3 — Benchmark Permalink Backend (review + fix existing files)

These three files **already exist** in the repository. Read each one, verify correctness against the spec, and fix any gaps. Do not create new files.

### File: `src/app/api/v1/benchmarks/[runId]/public/route.ts`

Verify and fix:
- [ ] Unauthenticated (no API key check)
- [ ] Returns HTTP 404 with `{ error: { code: "NOT_FOUND" } }` if runId missing
- [ ] Reads from `BenchmarkRun` Prisma model
- [ ] Strips internal cost fields (`costUsd`, `apiKey`, `userId`, etc.) from response
- [ ] Returns: `{ id, query, domain, tools: [{ name, latencyMs, resultCount, relevanceScore, success }], createdAt, winningTool }`
- [ ] Sets `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`

### File: `src/app/b/[runId]/badge.svg/route.ts`

Verify and fix:
- [ ] Returns `Content-Type: image/svg+xml`
- [ ] Adds `X-Response-Time` header (measure ms from handler start to response write)
- [ ] Returns a fallback 404 SVG (not a 500/crash) if runId not found
- [ ] Badge shows: winning tool name + best latency in ms on dark background
- [ ] No authentication required
- [ ] Single `prisma.benchmarkRun.findUnique` call only — no heavy joins

### File: `src/app/b/[runId]/opengraph-image.tsx`

Verify and fix:
- [ ] Uses `ImageResponse` from `next/og`
- [ ] `size = { width: 1200, height: 630 }`
- [ ] Shows: tool winner name, query snippet (truncated ≤60 chars), latency
- [ ] Handles missing runId gracefully (fallback OG image, not a 500)
- [ ] `export const runtime = 'edge'`

---

## Files This Task Touches (exhaustive — no other files)

| Action | File |
|--------|------|
| MODIFY | `src/lib/router/ai-classify.ts` |
| MODIFY | `src/lib/router/index.ts` |
| MODIFY | `src/__tests__/router.test.ts` (or `enterprise-qa.test.ts` as fallback) |
| REVIEW + FIX | `src/app/api/v1/benchmarks/[runId]/public/route.ts` |
| REVIEW + FIX | `src/app/b/[runId]/badge.svg/route.ts` |
| REVIEW + FIX | `src/app/b/[runId]/opengraph-image.tsx` |

**DO NOT touch (Codex owns these):**
- `src/app/b/[runId]/page.tsx`
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/globals.css`
- `src/components/*`
