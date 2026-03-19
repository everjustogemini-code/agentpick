# TASK_CLAUDE_CODE.md — cycle 21
**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-19
**QA baseline:** 55/56 — P1 open (embed B.1-embed still failing on `best_performance` strategy)
**Target:** 56/56
**Source:** NEXT_VERSION.md Must-Have #1 + Must-Have #3 (backend portion)
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Task 1 — Fix P1: `best_performance` branch missing capability filter

**File:** `src/lib/router/index.ts`
**Function:** `routeRequest()`

### Background

The `auto` strategy path (lines ~460–464) already applies the capability filter after `aiRoute()` — that fix shipped last cycle. The `best_performance` branch (~line 475) calls `aiRoute(fastResult, capability)` **without** the same post-filter, so embed requests routed via `best_performance` still return `tavily` instead of `voyage-embed`.

### Exact Change

Locate this exact assignment inside the `best_performance` branch:
```typescript
aiRankedTools = aiRoute(fastResult, capability);
```
(~line 475 — confirm by searching for `aiRoute(fastResult, capability)`)

Immediately after that line, insert:
```typescript
if (aiRankedTools) {
  const allowed = new Set(CAPABILITY_TOOLS[capability] ?? []);
  aiRankedTools = aiRankedTools.filter((t) => allowed.has(t));
  if (aiRankedTools.length === 0) aiRankedTools = undefined;
}
```

**Do NOT touch** lines 460–464 (the `auto` path already has this fix — do not duplicate or modify it).

### Acceptance
- `POST /api/v1/router/search` with `strategy: "best_performance"` and `capability: "embed"` returns `meta.tool_used: "voyage-embed"` for any query, never `tavily`
- QA B.1-embed passes with both `auto` and `best_performance` strategies
- Full QA suite: **56/56**

---

## Task 2 — Verify QA Script: `voyage-ai` → `voyage-embed`

**File:** `/Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py`

Run `grep -n "voyage-ai" /Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py`. If any hits remain, replace each `"voyage-ai"` with `"voyage-embed"`. If already clean (0 hits), no change needed.

---

## Task 3 — New Feature Backend: Demo key + IP rate limiting

**Goal:** The frontend "Try it live" panel (built by Codex on `/connect`) needs a shared demo API key that enforces 10 requests/hour per IP with a friendly error message.

### Files to Modify

#### `src/app/api/v1/router/route.ts`
Add IP-based rate limiting for demo-key requests at the top of the `POST` handler, before billing/auth logic:

1. Detect demo key: if the request's API key equals `process.env.DEMO_API_KEY`, apply the demo rate-limit path.
2. Extract IP from `x-forwarded-for` header (fall back to `"anonymous"` if missing).
3. Use existing `@upstash/ratelimit` + `@upstash/redis` (imports already present or add them):
   ```typescript
   const ratelimit = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(10, "1 h"),
     prefix: "demo-ip",
   });
   const { success, reset } = await ratelimit.limit(ip);
   ```
4. On limit exceeded, return HTTP 429:
   ```json
   { "error": "Demo limit reached — get your own key at /connect#register", "retryAfter": <seconds until reset> }
   ```
   Do NOT return a raw/unformatted 429.
5. On success, continue normally (demo key uses `auto` strategy, no other special handling).
6. Non-demo-key requests: skip this block entirely.

#### `.env.example`
Add one line documenting the new env var:
```
DEMO_API_KEY=demo_live_agentpick_shared
```

### Acceptance
- Demo key requests #1–10 per IP per hour succeed (real API response)
- Request #11 returns `{ "error": "Demo limit reached..." }` with HTTP 429
- Real user API keys are completely unaffected
- No new npm packages needed (use existing `@upstash/ratelimit` + `@upstash/redis`)

---

## Files This Task Owns (exhaustive)

| File | Action |
|------|--------|
| `src/lib/router/index.ts` | Add capability filter after `aiRoute(fastResult, capability)` in `best_performance` branch (~line 475) |
| `/Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py` | Verify/fix `voyage-ai` → `voyage-embed` |
| `src/app/api/v1/router/route.ts` | Add demo-key IP rate-limit block |
| `.env.example` | Add `DEMO_API_KEY` entry |

**Do NOT touch:** `src/app/globals.css`, any page under `src/app/` (homepage, connect, dashboard, products), any component file.

---

## Coverage: Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1a — Router `best_performance` branch capability filter | **This file** |
| Must-Have #1b — QA script `voyage-ai` → `voyage-embed` | **This file** |
| Must-Have #2 — Glassmorphism UI upgrade | **TASK_CODEX.md** |
| Must-Have #3 backend — Demo key + IP rate limiting | **This file** |
| Must-Have #3 frontend — "Try it live" panel on /connect | **TASK_CODEX.md** |

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] Cycle 21: best_performance capability filter fix + demo key rate limiting
```
