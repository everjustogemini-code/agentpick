# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md — Bugfix Cycle 4 (QA Round 8, score 30/37)

---

## Files to Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/products/[slug]/page.tsx` |
| MODIFY | `src/app/connect/page.tsx` |

**DO NOT TOUCH:** `src/lib/router/**`, `src/app/api/**`, `next.config.ts`, `src/middleware.ts`, or any file not listed above.

---

## Bug P2-1 — `/products/tavily` cold-start 500

**Root cause:** SSR data fetch throws/times out on first cold-start invocation of a serverless function; unhandled error bubbles up as 500. Self-heals on warm instances.

### Fix 1 — `src/app/products/[slug]/page.tsx`

Read the file first. Wrap the top-level data fetch in a try/catch and return a graceful error response instead of letting it become an unhandled 500:

```ts
try {
  // existing data fetch logic
} catch (err) {
  return new Response('Service temporarily unavailable', {
    status: 503,
    headers: { 'Retry-After': '1' },
  });
}
```

Alternatively, if the page uses `notFound()` or `redirect()`, the catch block should call the appropriate Next.js helper rather than returning a raw Response.

### Fix 2 — `src/app/products/[slug]/page.tsx`

Add ISR revalidation at the top of the file (outside any function):

```ts
export const revalidate = 300; // 5-minute ISR cache
```

This ensures a cached response is served on cold starts, eliminating the race condition entirely.

**Acceptance:** `GET /products/tavily` → HTTP 200 on first request to a cold deployment (no 500).

---

## Fix — P1-3 onboarding note (frontend portion)

**Source:** NEXT_VERSION.md Fix 3, item 3.

### Fix — `src/app/connect/page.tsx`

Read the file. Find the section that describes free tier limits (look for existing text about monthly limits or rate limits). Add a visible note in that section:

```
Free tier: 3,000 calls/month, 100/day.
Add a 100 ms delay between calls in integration tests to stay within per-minute burst limits.
```

Use the existing styling/component pattern on the page (e.g. a `<p>` or info callout component). Do not introduce new components or styles.

---

## Verification Checklist

- [ ] `GET /products/tavily` → HTTP 200 on cold start (no unhandled 500)
- [ ] `export const revalidate = 300` present in `src/app/products/[slug]/page.tsx`
- [ ] `/connect` page shows free tier note: "3,000 calls/month, 100/day"
- [ ] No changes made to files owned by TASK_CLAUDE_CODE.md
