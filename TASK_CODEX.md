# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-15
**Cycle:** 90
**Source:** NEXT_VERSION.md — v0.90, QA Round 14, score 62/67 (5 failures: 1 P0, 3 P1)
**Cycle type:** BUG FIX ONLY — zero new features

---

## Overview

This file covers **Fix #2 (P1)** and **Fix #4 (P1)** from NEXT_VERSION.md.
TASK_CLAUDE_CODE.md covers Fix #1 and Fix #3.
No file is touched by both agents.

---

## Fix #2 — P1 · `POST /api/v1/router/priority` → HTTP 400

**QA test:** `2.6-set-priority`
**File:** `src/app/api/v1/router/priority/route.ts` **line 43**

**Root cause:** Growth commits have repeatedly removed capability-name aliases (`body.search`, `body.crawl`, etc.) while "cleaning up" the handler, causing `Object.keys(update).length === 0` → 400. QA test `2.6-set-priority` sends a capability-keyed payload like `{"search": ["tavily", "exa-search"]}`.

**Required change — line 43, add/restore all 6 aliases:**
```ts
// NOTE: Do NOT remove body.search / body.crawl / body.embed / body.finance.
// QA test 2.6-set-priority sends capability-keyed payloads (e.g. {"search": [...]}).
// Removing these aliases causes HTTP 400 — this has regressed 3 times already.
const toolsValue =
  body.tools ??
  body.priority_tools ??
  body.search ??      // QA test 2.6-set-priority sends {"search": [...]}
  body.crawl ??
  body.embed ??
  body.finance;
```

All 6 aliases must be present. Do not remove any of them.

---

## Fix #4 — P1 · `GET /api/v1/router/health` → 401 without auth

**QA test:** `1.4-health-no-auth` (Bearer Auth Test suite)
**File:** `src/app/api/v1/router/health/route.ts`

**Root cause:** A growth commit that added auth guards to `/api/v1/router/*` endpoints also inadvertently added a mandatory auth check to this public endpoint.

**Required change — remove any early-return 401 block from the GET handler:**

The correct pattern:
1. Parse auth header but do NOT return 401 if missing/invalid
2. If auth present and valid → return personalized health data
3. If no auth or invalid auth → return public HTTP 200 response

```ts
// PUBLIC ENDPOINT — no auth required. Do NOT add mandatory auth checks here.
// Unauthenticated requests receive basic status; authenticated requests get per-account stats.
// This endpoint must return 200 for requests with no Authorization header.
// External uptime monitors and status pages hit this endpoint without keys.
if (!agent) {
  return Response.json({ status: 'healthy', message: 'AgentPick router is operational.' });
}
// ... authenticated path continues below
```

The `hasAuth` guard (lines 16–17) must never be replaced with a mandatory auth check. Verify no `if (!agent) return Response.json({error: ...}, {status: 401})` block exists anywhere in this handler.

---

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/app/api/v1/router/priority/route.ts` | 43 | Restore all 6 body aliases + guard comment |
| `src/app/api/v1/router/health/route.ts` | 16–17 area | Remove mandatory 401 block; ensure unauthenticated request returns HTTP 200 + guard comment |

**Do NOT touch:**
- `src/app/api/v1/router/calls/route.ts` — owned by TASK_CLAUDE_CODE.md
- `src/app/api/v1/router/account/route.ts` — owned by TASK_CLAUDE_CODE.md

---

## Acceptance Criteria

- [ ] `POST /api/v1/router/priority` with body `{"search": ["tavily", "exa-search"]}` → HTTP 200 (QA test `2.6-set-priority`)
- [ ] `GET /api/v1/router/health` with no `Authorization` header → HTTP 200 `{"status": "healthy"}` (QA test `1.4-health-no-auth`)
- [ ] No other files modified
