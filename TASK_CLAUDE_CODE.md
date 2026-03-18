# TASK_CLAUDE_CODE.md
**Cycle:** 10
**Agent:** Claude Code
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — QA-P0-1 (middleware `/v1/` CORS fix)

---

## Coverage Summary

| Issue | Item | Owner |
|-------|------|-------|
| QA-P0-1 | Fix `src/middleware.ts` so `/v1/` paths get CORS headers | **CLAUDE CODE** |

---

## Files to Modify

| Action | File |
|--------|------|
| **VERIFY & FINALIZE** | `src/middleware.ts` |

> **DO NOT TOUCH** any file listed in TASK_CODEX.md.
> Specifically: `QA_REPORT.md`, `NEXT_VERSION.md`.

---

## Task 1 — [QA-P0-1] Verify P0 middleware fix in `src/middleware.ts`

### Background

`POST /v1/chat/completions` returned a 404 HTML page because `src/middleware.ts`
only applied CORS headers and OPTIONS preflight handling to paths matching `/api/`.
The `/v1/` prefix was unhandled — no CORS headers, no preflight 204, no security
headers. Cross-origin clients (including the QA agent) received no CORS headers and
failed before the route handler ever ran.

The route file `src/app/v1/chat/completions/route.ts` and `src/lib/openai-compat.ts`
are correct. Only `src/middleware.ts` needed fixing.

### Required state

**File:** `src/middleware.ts`
**Line 89** must read exactly:

```ts
const isApi = pathname.startsWith('/api/') || pathname.startsWith('/v1/');
```

This change is present as an unstaged modification (`git status` shows ` M src/middleware.ts`).

### Steps

1. **Confirm** line 89 matches the required value above — no accidental whitespace,
   extra conditions, or regression.
2. **Confirm** the rest of `src/middleware.ts` is intact — especially:
   - OPTIONS preflight block (lines ~96–106): returns 204 with CORS headers
   - CORS header block (lines ~143–146): sets `Access-Control-Allow-Origin`,
     `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`
   - Security headers block (lines ~148–166): `X-Content-Type-Options`, `X-Frame-Options`,
     `Cache-Control: no-store`, `x-request-id`
   - `config.matcher` export (lines ~210–212): unchanged
3. **Do not** modify any other file. The route handler
   `src/app/v1/chat/completions/route.ts` and `src/lib/openai-compat.ts` are
   confirmed correct — leave them untouched.

### How the fix works

`isApi` gates three behaviors in the middleware:
1. OPTIONS preflight → returns 204 with CORS headers immediately (line ~96)
2. Rate-limit check applies only to `/api/v1/router/` and `/api/v1/route/` paths
   (unchanged — those inner `startsWith` checks are unaffected)
3. `NextResponse.next()` with CORS + security + cache headers applied

Adding `|| pathname.startsWith('/v1/')` means `/v1/chat/completions` requests
now flow through path 1 (OPTIONS) or path 3 (actual request) — exactly like
`/api/` routes do. No other code changes required.

### Acceptance criteria

- `OPTIONS /v1/chat/completions` → 204 with `Access-Control-Allow-Origin: *`
- `POST /v1/chat/completions` with valid `Authorization: Bearer ah_...` key → 200
  JSON (OpenAI-shaped response)
- `POST /v1/chat/completions` with no key → 401
- All 51 automated checks from cycle 9 continue to pass (no regressions on
  `/api/` routes, rate limiting, router endpoints, security headers)

---

## Progress log

After completing this task, append one line to
`/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:

```
[<ISO timestamp>] [CLAUDE-CODE] [done] QA-P0-1: middleware /v1/ CORS fix verified in src/middleware.ts line 89
```
