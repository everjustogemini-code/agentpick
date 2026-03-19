# TASK_CLAUDE_CODE.md — v-next (2026-03-18)
**Agent:** Claude Code
**Source:** NEXT_VERSION.md — Must-Have #3 (Public Leaderboard API hardening)
**QA baseline:** 57/57 — no bugs. This cycle is polish + developer adoption.

---

## Scope Summary

Claude Code owns all API/backend files for this cycle. The leaderboard routes were scaffolded in
cycle 2 but have several gaps to close before the public announcement. Codex owns all
frontend/CSS/animation work.

**DO NOT TOUCH any of these files** (owned by Codex):
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/components/**/*.tsx` (any component file)

---

## Task 1 — `src/app/api/v1/leaderboard/route.ts`: harden for public launch

Read the file first (it currently has ~233 lines). Make the following targeted changes.

### 1a — Add OPTIONS preflight handler
After the `GET` export, add:
```ts
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

### 1b — Add `stale-while-revalidate` to Cache-Control header
Both the cache-HIT and cache-MISS response headers currently set:
```
'Cache-Control': 'public, max-age=300'
```
Change both to:
```
'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
```
There are two places: the HIT branch and the MISS branch.

### 1c — Input validation returning 400
After the `searchParams` parsing block (currently lines 195–199), add validation before the cache
lookup:

```ts
const VALID_DOMAINS = new Set(['finance', 'devtools', 'news', 'general']);
const VALID_TASKS   = new Set(['research', 'realtime', 'simple']);

if (domain && !VALID_DOMAINS.has(domain)) {
  return NextResponse.json(
    { error: `invalid domain — must be one of: ${[...VALID_DOMAINS].join(', ')}` },
    { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
if (task && !VALID_TASKS.has(task)) {
  return NextResponse.json(
    { error: `invalid task — must be one of: ${[...VALID_TASKS].join(', ')}` },
    { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
if (!isNaN(limitParam) && (limitParam < 1 || limitParam > 50)) {
  return NextResponse.json(
    { error: 'limit must be 1–50' },
    { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
```

Note: `limitParam` is already parsed from `searchParams` just before this block. The existing
`Math.min(Math.max(...))` clamp inside `fetchLeaderboardData` can stay as a safety net, but the
explicit 400 must fire first for out-of-range values.

---

## Task 2 — `src/app/api/v1/leaderboard/badge/[slug]/route.ts`: fix 404 + rank coloring

Read the file first (~95 lines).

### 2a — Fix 404: return SVG not JSON
The current 404 path returns `NextResponse.json(...)`. Replace it with an SVG "not ranked" badge:

```ts
if (!result) {
  const notRankedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="130" height="20" fill="#555"/>
  <rect rx="3" x="75" width="55" height="20" fill="#777"/>
  <rect x="75" width="4" height="20" fill="#777"/>
  <rect rx="3" width="130" height="20" fill="url(#s)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="11">
    <text x="38" y="15" fill="#010101" fill-opacity=".3">AgentPick</text>
    <text x="38" y="14">AgentPick</text>
    <text x="102" y="15" fill="#010101" fill-opacity=".3">not ranked</text>
    <text x="102" y="14">not ranked</text>
  </g>
</svg>`;
  return new NextResponse(notRankedSvg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

Returning 200 (not 404) ensures GitHub's image proxy renders the SVG rather than showing a broken
image in READMEs.

### 2b — Rank-based right-panel color in `buildSvgBadge`
Replace the hardcoded `fill="#e05d17"` with a color chosen by rank:
```ts
function buildSvgBadge(rank: number, score: number): string {
  const scoreStr = score.toFixed(1);
  const rightColor = rank <= 3 ? '#e05d17' : rank <= 10 ? '#4c9a2a' : '#777';
  // ... rest of template — replace both occurrences of `fill="#e05d17"` with `fill="${rightColor}"`
```

### 2c — Add `stale-while-revalidate` to the success response Cache-Control
Change:
```
'Cache-Control': 'public, max-age=300'
```
to:
```
'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
```

### 2d — Add ETag with rank included
Current ETag is `"${slug}-${score}"`. Update to include rank so GitHub's proxy re-fetches on rank
change:
```ts
'ETag': `"${slug}-${rank}-${score}"`,
```

---

## Files to Create / Modify

| Action | File                                                        | Reason                                              |
|--------|-------------------------------------------------------------|-----------------------------------------------------|
| MODIFY | `src/app/api/v1/leaderboard/route.ts`                      | OPTIONS preflight, stale-while-revalidate, 400 validation |
| MODIFY | `src/app/api/v1/leaderboard/badge/[slug]/route.ts`         | SVG 404, rank color, stale-while-revalidate, ETag+rank |

Do NOT touch `src/middleware.ts` — the existing CORS handling there is sufficient and leaderboard
routes already have `Access-Control-Allow-Origin: *` set explicitly in every response.

---

## Acceptance Criteria

- [ ] `OPTIONS /api/v1/leaderboard` → 204 with CORS headers
- [ ] `GET /api/v1/leaderboard` response has `Cache-Control: public, max-age=300, stale-while-revalidate=60`
- [ ] `GET /api/v1/leaderboard?limit=51` → 400 `{ "error": "limit must be 1–50" }`
- [ ] `GET /api/v1/leaderboard?domain=invalid` → 400 with error message
- [ ] `GET /api/v1/leaderboard?task=invalid` → 400 with error message
- [ ] `GET /api/v1/leaderboard/badge/nonexistent-slug` → 200 `image/svg+xml` showing "not ranked"
- [ ] `GET /api/v1/leaderboard/badge/tavily` (top-3 tool) → orange right panel `#e05d17`
- [ ] `GET /api/v1/leaderboard/badge/[rank-4-10 tool]` → green right panel `#4c9a2a`
- [ ] Badge ETag includes rank: `"slug-rank-score"`
- [ ] All 57 QA checks remain green post-deploy

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] v-next: Leaderboard API hardening — OPTIONS preflight, 400 validation, SVG 404 badge, rank-color, stale-while-revalidate
```
