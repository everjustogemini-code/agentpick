# NEXT_VERSION.md — bugfix/cycle-2

**Date:** 2026-03-14
**Type:** BUG FIXES ONLY — QA Round 8 remediation
**Source:** QA_REPORT.md (Round 8, score 30/37)

No new features this cycle. Every change below traces directly to a QA issue number.

---

## Fix 1 — P1-1: `/api/v1/health` returns 500

**QA issue:** `GET /api/v1/health` returns HTTP 500 `INTERNAL_ERROR`. The working health endpoint is `GET /api/health`.

**Root cause:** The file `src/app/api/v1/health/route.ts` exists and its logic is correct, but in production it returns an `INTERNAL_ERROR`-shaped 500 rather than the expected `Response.json(...)` output. The `INTERNAL_ERROR` error shape is produced by `apiError()` — which this file does not call — indicating the request is being handled by a different code path. Most likely a Next.js routing conflict: `src/app/api/v1/[[...path]]/route.ts` (catch-all) or a middleware rewrite intercepts the path before `health/route.ts` resolves.

**What to change:**

1. `src/app/api/v1/health/route.ts` — replace the current standalone DB-query implementation with a re-export of the canonical health handler so both endpoints share one implementation:

   ```ts
   import { GET as canonicalHealth } from '@/app/api/health/route';
   export { canonicalHealth as GET };
   ```

2. If the re-export does not resolve the conflict (e.g. because of the catch-all), add an explicit rewrite in `next.config.ts`:
   ```ts
   { source: '/api/v1/health', destination: '/api/health', permanent: false }
   ```

**Acceptance:** `GET /api/v1/health` → HTTP 200, body matches `GET /api/health` (db status, uptime, commit).

---

## Fix 2 — P1-2: `strategy: "custom"` rejected with HTTP 400

**QA issue:** `POST /api/v1/route/search` with `{"strategy": "custom", "priority": ["tool-a", "tavily"]}` returns `VALIDATION_ERROR`.

**Root cause:** Two bugs in `src/lib/router/handler.ts`:

1. The params-extraction branch (line 119) only fires when a known query field (`query`, `q`, `text`, etc.) is present. A body of `{"strategy":"custom","priority":["tool-a","tavily"],"query":"test"}` hits the branch correctly. But the QA test body `{"strategy":"custom","priority":["tool-a","tavily"]}` (no `query`) skips extraction, leaving `body.params` undefined, and the check at line 137 returns `VALIDATION_ERROR: params object is required`. QA attributes this to strategy rejection.

2. Even with a valid body, `custom` is silently aliased to `balanced` via `STRATEGY_ALIASES` (line 35) and the `priority` array is accepted into `priority_tools` but ignored during tool selection. Strategy `custom` is advertised in error messages (`"Must be one of: ..., custom, manual"`) but behaves identically to `balanced` — so there is no actual custom ordering.

**What to change:**

1. `src/lib/router/handler.ts` lines 119–125 — extend the params-extraction trigger to also fire when `priority` / `priority_tools` / `priorityTools` is present:

   ```ts
   if (!parsed.params && (
     parsed.query || parsed.q || parsed.text || parsed.input ||
     parsed.url || parsed.ticker || parsed.symbol ||
     parsed.priority || parsed.priority_tools || parsed.priorityTools  // ← add
   )) {
   ```

2. `src/lib/router/handler.ts` + `src/lib/router/index.ts` — implement `custom` as a real strategy: add `'custom'` to `VALID_STRATEGIES`, remove it from `STRATEGY_ALIASES`, and in `routeRequest` when `strategy === 'custom'` use `priority_tools` as the ordered tool list (first available tool wins) instead of the default capability ranking.

3. `src/lib/router/handler.ts` lines 93 and 114 — if `custom` is not fully implemented this cycle, remove it from the error message hint so callers are not led to believe it works.

**Acceptance:** `POST /api/v1/route/search` with `{"query":"test","strategy":"custom","priority":["tavily","exa-search"]}` → HTTP 200, `meta.tool_used` is the first available tool from the priority array.

---

## Fix 3 — P1-3: Free tier hits 429 after ~8 calls during developer testing

**QA issue:** After ~8 sequential API calls, all further calls return HTTP 429. The register endpoint advertises `monthlyLimit: 3000` but the per-minute burst cap is exhausted almost immediately.

**Root cause:** The per-minute middleware limiter (`src/middleware.ts` line 35, `perMin: 200`) and the Upstash limiter (`src/lib/rate-limit.ts` line 29, `500/1m`) are both generous enough that 8 calls should not trigger them. The real constraint is the **plan enforcement layer** in `src/lib/router/sdk.ts` → `checkUsageLimit`: `ROUTER_PLAN_MONTHLY_LIMITS.FREE = 500` and `ROUTER_PLAN_DAILY_LIMITS.FREE = 200`. A QA account that ran prior test cycles accumulates calls against the same billing period; by cycle 8, the 500-call monthly hard cap is exhausted.

The compounding bug: `src/app/api/v1/router/register/route.ts` returns `monthlyLimit: 3000` in the registration response, but the actual enforced cap is 500 (`plans.ts` line 25). Developers see 3000, hit 429 at 500, and conclude the per-minute limiter is broken.

**What to change:**

1. `src/lib/router/plans.ts` lines 17 and 25 — raise the FREE tier limits to match what is advertised on the pricing page and in the register response:
   - `ROUTER_PLAN_MONTHLY_LIMITS.FREE`: `500` → `3000`
   - `ROUTER_PLAN_DAILY_LIMITS.FREE`: `200` → `100` (daily spread of the monthly allowance)

2. `src/app/api/v1/router/register/route.ts` — ensure the `monthlyLimit` field in the 201 response is read from `ROUTER_PLAN_MONTHLY_LIMITS[plan]` rather than a hardcoded value, so advertised and enforced limits stay in sync automatically.

3. `src/app/connect/page.tsx` (or equivalent onboarding doc) — add a visible note: "Free tier: 3,000 calls/month, 100/day. Add a 100ms delay between calls in integration tests to stay within per-minute burst limits."

**Acceptance:** A newly registered free-tier key can make 50 sequential calls without receiving a 429. `monthlyLimit` in the register response equals the actually enforced limit.

---

## Fix 4 — P2-1: `/products/tavily` cold-start 500

**QA issue:** `/products/tavily` returned HTTP 500 on first cold-load, then 200 on all retries. Self-heals in under 1 second. Low severity.

**Root cause:** SSR cold-start — the product page data fetch throws or times out on the first invocation of a cold serverless function, bubbling up as an unhandled 500. Subsequent calls hit a warm instance.

**What to change:**

1. `src/app/products/[slug]/page.tsx` — wrap the top-level data fetch in try/catch and return a graceful 503 with `Retry-After: 1` instead of letting the unhandled error become a 500.

2. Add `export const revalidate = 300` to the product detail page (ISR 5-min cache). A cached response serves immediately on cold start and eliminates the race condition entirely.

**Acceptance:** `/products/tavily` returns 200 on first request to a cold Vercel deployment.

---

## Files changed (summary)

| File | Issue |
|------|-------|
| `src/app/api/v1/health/route.ts` | P1-1: re-export from canonical health handler |
| `next.config.ts` | P1-1: fallback rewrite if re-export insufficient |
| `src/lib/router/handler.ts` | P1-2: fix params extraction; add real `custom` strategy |
| `src/lib/router/index.ts` | P1-2: route using priority_tools when strategy is `custom` |
| `src/lib/router/plans.ts` | P1-3: raise FREE monthly limit to 3000 |
| `src/app/api/v1/router/register/route.ts` | P1-3: derive monthlyLimit from plans constants |
| `src/app/products/[slug]/page.tsx` | P2-1: catch cold-start errors, add ISR revalidate |

---

## What is NOT in this version

- Benchmark data product
- RouterCall DB indexes / scale prep
- API Submit Portal
- Any new endpoints, pages, or UI features

This cycle is done when all four fixes above pass QA re-test and the score reaches 37/37.
