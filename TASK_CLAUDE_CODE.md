# TASK_CLAUDE_CODE.md — v-next
**Agent:** Claude Code (API / backend / database)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md v-next

---

## Coverage Summary

| NEXT_VERSION.md Item | Task | Files |
|---|---|---|
| Item 1 — Fix `/api/v1/account` (P2) | Rewrite account route as alias with deprecation header | `src/app/api/v1/account/route.ts` |
| Item 3 — Public Leaderboard API | New leaderboard + badge routes; new rate limiter | `src/app/api/v1/leaderboard/route.ts` (new), `src/app/api/v1/leaderboard/badge/[slug]/route.ts` (new), `src/lib/rate-limit.ts` |

---

## Files Owned by This Agent (Codex must NOT touch these)

| Action | File |
|---|---|
| **MODIFY** | `src/app/api/v1/account/route.ts` |
| **CREATE** | `src/app/api/v1/leaderboard/route.ts` |
| **CREATE** | `src/app/api/v1/leaderboard/badge/[slug]/route.ts` |
| **MODIFY** | `src/lib/rate-limit.ts` |

> **DO NOT TOUCH** any file in Codex's list:
> `src/app/globals.css`, `src/app/page.tsx`, `src/app/connect/page.tsx`,
> or any file under `src/components/`.

---

## Task 1 — Fix `GET /api/v1/account` (Item 1 — backend)

**File:** `src/app/api/v1/account/route.ts`

The route currently exists but returns 404. Rewrite it as an alias for `/api/v1/router/usage`.

**Actions:**
1. Read both `src/app/api/v1/account/route.ts` and `src/app/api/v1/router/usage/route.ts`.
2. Identify how `/router/usage` fetches account data — reuse the same helper function(s) or DB queries.
3. Rewrite `account/route.ts` so `GET /api/v1/account` returns HTTP 200 with this exact shape:
   ```json
   {
     "plan": "<user plan>",
     "monthlyLimit": <number>,
     "callsThisMonth": <number>,
     "strategy": "<strategy>",
     "_note": "Prefer /api/v1/router/usage — this alias will be removed in v2"
   }
   ```
4. Add response header `Deprecation: true` on every 200 response (use `NextResponse.json(body, { headers: { 'Deprecation': 'true' } })`).
5. Apply the same Bearer-key auth that `/router/usage` uses — reuse the existing auth middleware/helper, do not weaken it.
6. On auth failure, return 401 as normal.

**Done when:**
- `GET /api/v1/account` (valid key) → 200 JSON with all five fields including `_note`; response header `Deprecation: true` present.
- `GET /api/v1/account` (no key) → 401.
- No 404.

---

## Task 2 — Public Leaderboard API (Item 3 — backend)

### 2a — `GET /api/v1/leaderboard`

**File to create:** `src/app/api/v1/leaderboard/route.ts`

**Requirements:**
- **No auth required.**
- **Rate limit:** 60 req/min per IP (unauthenticated). Use the new `leaderboardLimiter` added in Task 2c below.
- **Cache:** 5-minute in-memory TTL. Set `Cache-Control: public, max-age=300` on responses.
- **CORS:** `Access-Control-Allow-Origin: *` (required for badge images and third-party tooling).
- **Data source:** Same benchmark/score tables powering `/api/v1/products/[slug]`. Aggregate by tool slug. No new computation.

**Query params:**
```
?domain=finance|devtools|news|general|...   (optional, filter by domain)
?task=research|realtime|simple              (optional, filter by task type)
?limit=10                                   (default 10, max 50 — clamp to 1–50)
```

**Response 200:**
```json
{
  "updated_at": "<ISO timestamp of last benchmark run>",
  "tools": [
    {
      "rank": 1,
      "slug": "tavily",
      "name": "Tavily",
      "score": 8.4,
      "latency_p50_ms": 898,
      "success_rate": 1.0,
      "best_for": ["research", "realtime"],
      "domains": ["general", "news", "finance"]
    }
  ]
}
```

**Implementation notes:**
- Apply `domain` and `task` filters before ranking if query params are present.
- Rank tools by `score` descending; assign sequential `rank` starting at 1.
- `latency_p50_ms`: 50th-percentile latency from benchmark runs for that tool.
- `success_rate`: fraction of successful runs (0.0–1.0).
- `best_for`: top 2–3 task types by result quality for that tool.
- `domains`: distinct domain values from benchmark runs for that tool.

### 2b — `GET /api/v1/leaderboard/badge/[slug]`

**File to create:** `src/app/api/v1/leaderboard/badge/[slug]/route.ts`

- Look up current rank and score for `slug` from the leaderboard data (reuse the leaderboard helper — no second DB query).
- Return a Shields.io-compatible SVG badge. Use this template (substitute `{{RANK}}` and `{{SCORE}}`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="130" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="130" height="20" fill="#555"/>
  <rect rx="3" x="75" width="55" height="20" fill="#e05d17"/>
  <rect x="75" width="4" height="20" fill="#e05d17"/>
  <rect rx="3" width="130" height="20" fill="url(#s)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="11">
    <text x="38" y="15" fill="#010101" fill-opacity=".3">AgentPick</text>
    <text x="38" y="14">AgentPick</text>
    <text x="102" y="15" fill="#010101" fill-opacity=".3">#{{RANK}} · {{SCORE}}</text>
    <text x="102" y="14">#{{RANK}} · {{SCORE}}</text>
  </g>
</svg>
```

- Response headers: `Content-Type: image/svg+xml`, `Cache-Control: public, max-age=300`, `ETag: "<slug>-<score>"`, `Access-Control-Allow-Origin: *`.
- If slug not found: return 404 with `Content-Type: application/json` and body `{ "error": "tool not found" }`.

### 2c — Add `leaderboardLimiter` to rate-limit module

**File to modify:** `src/lib/rate-limit.ts`

Read the file first. Add and export a new limiter following the exact same pattern as existing limiters (e.g., `productsLimiter`, `voteLimiter`):

```ts
export const leaderboardLimiter = ratelimit(60, '1 m')  // 60 req/min per IP, unauthenticated
```

Apply it in the leaderboard route handler (Task 2a): extract client IP from the request, call `leaderboardLimiter.limit(ip)`, return 429 with `{ "error": "rate limit exceeded" }` if `!success`.

---

## Verification Checklist

- [ ] `GET /api/v1/account` (valid key) → 200, body contains `_note` field, header `Deprecation: true` present
- [ ] `GET /api/v1/account` (no key) → 401
- [ ] `GET /api/v1/leaderboard` (no key) → 200 JSON, `tools[0].rank === 1`
- [ ] `GET /api/v1/leaderboard?domain=finance&limit=3` → ≤3 results, all finance domain
- [ ] `GET /api/v1/leaderboard` response has `Cache-Control: public, max-age=300` and `Access-Control-Allow-Origin: *`
- [ ] `GET /api/v1/leaderboard/badge/tavily` → `Content-Type: image/svg+xml`, valid SVG
- [ ] `GET /api/v1/leaderboard/badge/tavily` response has `Access-Control-Allow-Origin: *`
- [ ] `GET /api/v1/leaderboard/badge/nonexistent-slug` → 404 JSON `{ "error": "tool not found" }`
- [ ] 61st unauthenticated request to `/api/v1/leaderboard` within 1 min → 429
- [ ] Zero files from Codex's list (`globals.css`, `page.tsx`, `connect/page.tsx`, `src/components/`) were modified

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] v-next: /api/v1/account alias+deprecation, leaderboard API + badge SVG route
```
