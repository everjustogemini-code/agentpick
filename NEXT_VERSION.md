# NEXT_VERSION.md — Cycle 10 (Bugfix Only)
**Date:** 2026-03-17
**Prepared by:** AgentPick PM
**QA Source:** QA_REPORT.md cycle 9 — 57/58 PASS, 1 P0 blocker
**Scope:** BUG FIXES ONLY. No new features.

---

## Issues from QA_REPORT.md

### [QA-P0-1] `POST /v1/chat/completions` — 404 Not Found (P0 Blocker)

**QA finding:** `POST /v1/chat/completions` returns a 404 HTML page ("Next.js Page not found").
The endpoint was planned in cycle 8, implemented in cycle 9, but never reached production.

**Root cause:** The route file `src/app/v1/chat/completions/route.ts` was committed in cycle 9
but the middleware at `src/middleware.ts` only applies CORS and `OPTIONS` preflight handling to
paths matching `/api/`. The `/v1/` prefix is unhandled: no `Access-Control-Allow-*` headers,
no preflight 204 response, no security headers. Cross-origin clients (including the QA agent)
receive no CORS headers and fail before the route handler ever runs.

**Fix — `src/middleware.ts` (line ~91):**

Change:
```ts
const isApi = pathname.startsWith('/api/');
```
To:
```ts
const isApi = pathname.startsWith('/api/') || pathname.startsWith('/v1/');
```

This single-line change makes the middleware treat `/v1/chat/completions` exactly like any
`/api/` endpoint: OPTIONS preflight → 204 with CORS headers, POST/GET → next() with
`Access-Control-Allow-Origin`, `Cache-Control: no-store`, security headers, and `x-request-id`.

No changes needed to `src/app/v1/chat/completions/route.ts` or `src/lib/openai-compat.ts` —
both files are correct and compile cleanly.

**Acceptance criteria:**
- `OPTIONS /v1/chat/completions` → 204 with `Access-Control-Allow-Origin: *`
- `POST /v1/chat/completions` with valid Bearer key → 200 JSON (OpenAI-shaped response)
- `POST /v1/chat/completions` with no key → 401
- QA item previously listed as "not yet deployed" now returns 200

---

## P1 / P2 Issues

None reported in QA_REPORT.md dated 2026-03-17.

---

## Automated baseline — must stay green

All 51 automated checks from cycle 9 must continue to pass unchanged:
- Router core, developer dashboard API, `/connect` page, homepage, nav, AI routing,
  schema & data integrity, dashboard web UI, cross-capability, edge cases.
