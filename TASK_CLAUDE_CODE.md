# TASK_CLAUDE_CODE.md — Cycle 5 (Backend / API)

**Agent:** Claude Code
**Source:** NEXT_VERSION.md (2026-03-18)
**QA baseline:** 51/52 — 1 open P1
**Do NOT touch any file listed in TASK_CODEX.md**

---

## Files to Create / Modify

| Action | File |
|--------|------|
| CREATE | `src/app/api/v1/register/route.ts` |
| MODIFY | `next.config.ts` |
| CREATE | `src/lib/rate-limit.ts` |
| MODIFY | `src/app/api/v1/playground/run/route.ts` |

---

## Task 1 — Fix P1: POST /api/v1/register → 308 (Must-Have #1)

**Root cause:** `next.config.ts` `redirects()` only intercepts GET during Next.js routing.
A POST to a non-existent path hits the 404 JSON catch-all before the redirect fires.
The cycle-4 `next.config.ts` entry is silently ignored for POST.

### 1a — Create real route handler

**File to CREATE:** `src/app/api/v1/register/route.ts`

```ts
import { NextRequest } from 'next/server'

function redirect308(req: NextRequest) {
  return Response.redirect(new URL('/api/v1/router/register', req.url), 308)
}

export const GET    = redirect308
export const POST   = redirect308
export const PUT    = redirect308
export const PATCH  = redirect308
export const DELETE = redirect308
```

This file must not import anything beyond `next/server`.

### 1b — Remove dead redirect from next.config.ts

**File to MODIFY:** `next.config.ts`

Remove the following object from the `redirects()` array (it is now redundant and misleading):

```ts
// REMOVE THIS ENTRY:
{ source: '/api/v1/register', destination: '/api/v1/router/register', permanent: true }
```

Keep all other existing redirect entries untouched (`/router → /connect`, `/api/v1/account/usage`, `/api/v1/developer/usage`).

### Acceptance
```bash
curl -i -X POST https://agentpick.dev/api/v1/register
# Expected: HTTP 308   Location: /api/v1/router/register
```
QA score rises from 51/52 → 52/52.

---

## Task 2 — Demo-Key Rate Limiter (Must-Have #3, backend half)

The `/connect` page playground UI (built by Codex) calls `POST /api/v1/playground/run`
with `process.env.DEMO_API_KEY`. That route must enforce **3 req / IP / hour** via an
in-memory sliding-window counter and return `429` with `Retry-After` on overflow.

### 2a — Create rate-limit helper

**File to CREATE:** `src/lib/rate-limit.ts`

```ts
// In-memory sliding-window rate limiter (resets on server restart — acceptable for demo keys)
const store = new Map<string, number[]>()

export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSecs: number } {
  const now = Date.now()
  const cutoff = now - windowMs
  const hits = (store.get(ip) ?? []).filter(t => t > cutoff)
  if (hits.length >= limit) {
    const retryAfterSecs = Math.ceil((hits[0] + windowMs - now) / 1000)
    return { allowed: false, retryAfterSecs }
  }
  hits.push(now)
  store.set(ip, hits)
  return { allowed: true, retryAfterSecs: 0 }
}
```

### 2b — Apply rate limit in playground route

**File to MODIFY:** `src/app/api/v1/playground/run/route.ts`

Add the following block near the top of the `POST` handler, **after** parsing the request
body but **before** any key lookup or tool dispatch:

```ts
import { checkRateLimit } from '@/lib/rate-limit'

// Inside POST handler, after body parse:
const isDemoKey = (body.apiKey ?? '') === (process.env.DEMO_API_KEY ?? '__unset__')
if (isDemoKey) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, retryAfterSecs } = checkRateLimit(ip, 3, 3_600_000)
  if (!allowed) {
    return Response.json(
      { error: { code: 'RATE_LIMITED', message: 'Demo key: max 3 requests per hour per IP.' } },
      { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } },
    )
  }
}
```

**Rules:**
- Only demo-key requests are rate-limited; real user API keys are unaffected.
- A missing or empty `DEMO_API_KEY` env var must not crash the handler (`'__unset__'` sentinel).

### Acceptance
- First 3 `POST /api/v1/playground/run` calls with demo key from same IP → success
- 4th call within the same hour → `HTTP 429`, `Retry-After` header present
- Calls with a real user API key → unaffected, no rate-limit applied

---

## Verification Checklist

- [ ] `src/app/api/v1/register/route.ts` created, exports handlers for all 5 HTTP methods
- [ ] `next.config.ts` no longer contains the `/api/v1/register → /api/v1/router/register` redirect
- [ ] `curl -X POST /api/v1/register` → 308 with correct `Location` header
- [ ] `src/lib/rate-limit.ts` created with sliding-window logic
- [ ] `src/app/api/v1/playground/run/route.ts` imports `checkRateLimit` and guards demo-key calls
- [ ] 4th demo-key request within an hour → 429 + `Retry-After`
- [ ] Real API key calls are not rate-limited
- [ ] Zero overlap with files in TASK_CODEX.md

---

## DO NOT TOUCH (owned by Codex)

- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/app/benchmarks/page.tsx`
- `src/app/rankings/page.tsx`
- `src/app/agents/page.tsx`
- `src/components/dashboard/RouterAnalyticsDashboard.tsx`
- `src/components/dashboard/UsagePanel.tsx`
