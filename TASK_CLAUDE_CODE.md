# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-16
**Source:** NEXT_VERSION.md — Must-Have #1 (P1) + Must-Have #3 (backend)

---

## Overview

This file covers:
- **Must-Have #1 (P1 — ships first):** Fix `/api/v1/keys/register` 404 + add `apiKey` camelCase alias
- **Must-Have #3 (backend):** Shareable Benchmark Permalinks — public API endpoint, OG image, SVG badge

TASK_CODEX.md owns all frontend files. No file overlap.

---

## Must-Have #1 — Fix P1: `/api/v1/keys/register` 404 + `apiKey` Inconsistency

**Priority:** CRITICAL — must ship and pass QA (56/56) before any other feature deploys.

---

### File 1 — CREATE: `src/app/api/v1/keys/register/route.ts`

**Goal:** Alias `/api/v1/keys/register` → `/api/v1/agents/register`. Proxy the full POST body, add `Deprecation: true` header.

**Before writing:** Read `src/app/api/v1/agents/register/route.ts` to confirm request/response shape.

**Implementation:**

```ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const upstream = await fetch(
    new URL('/api/v1/agents/register', req.nextUrl.origin).toString(),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  const data = await upstream.json()

  return NextResponse.json(data, {
    status: upstream.status,
    headers: { Deprecation: 'true' },
  })
}
```

**Acceptance:**
- `POST /api/v1/keys/register` with valid payload returns same body as `/api/v1/agents/register`
- Response includes header `Deprecation: true`
- Existing `/api/v1/agents/register` is NOT modified by this task

---

### File 2 — MODIFY: `src/app/api/v1/agents/register/route.ts`

**Goal:** Add `apiKey` (camelCase) as a backwards-compatible alias alongside the existing `api_key` field.

**Change:** Find the `NextResponse.json(...)` call that returns the registration response. Add `apiKey` mirroring the same value as `api_key`.

```ts
// BEFORE (example — match actual field names in file)
return NextResponse.json({ api_key: generatedKey, plan, monthlyLimit })

// AFTER
return NextResponse.json({ api_key: generatedKey, apiKey: generatedKey, plan, monthlyLimit })
```

- Do NOT remove `api_key` — this is a backwards-compatible addition only.
- Do NOT change any other logic in this file.

**Acceptance:**
- `POST /api/v1/agents/register` response body contains both `api_key` and `apiKey` with identical values
- No regression on existing behavior
- QA score: 55/56 → 56/56

---

## Must-Have #3 — Shareable Benchmark Permalinks: Backend

**Priority:** High — ships after #1 confirmed 56/56 by QA.

---

### File 3 — CREATE: `src/app/api/v1/benchmarks/[runId]/public/route.ts`

Unauthenticated public endpoint returning sanitized benchmark run data.

**Before writing:** Read `prisma/schema.prisma` to confirm `BenchmarkRun` model field names.

**Logic:**
1. Parse `runId` from route `params`
2. Query: `prisma.benchmarkRun.findUnique({ where: { id: runId }, include: { benchmarkQuery: true, benchmarkAgent: true } })`
3. If not found → `NextResponse.json({ error: 'not found' }, { status: 404 })`
4. Return sanitized shape (strip apiKey, userId, internal fields):
   ```ts
   {
     id,
     query: run.benchmarkQuery?.queryText,
     domain: run.benchmarkQuery?.domain,
     tools: [{
       name: run.benchmarkAgent?.name,
       latencyMs: run.latencyMs,
       resultCount: run.resultCount,
       relevanceScore: run.relevanceScore,
       success: run.statusCode === 200,
     }],
     createdAt: run.createdAt,
     winningTool: run.benchmarkAgent?.name,
   }
   ```
5. Set `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
6. No authentication required

---

### File 4 — CREATE: `src/app/b/[runId]/opengraph-image.tsx`

Dynamic OG social card using `@vercel/og` (`next/og`).

**Logic:**
1. `export const runtime = 'edge'`
2. Fetch run data via internal call to `/api/v1/benchmarks/{runId}/public`
3. Return `ImageResponse` (1200×630) with:
   - AgentPick wordmark top-left
   - Query text (truncate at 120 chars)
   - Tool comparison row: tool name | latency | relevance
   - Winning tool highlighted in accent green (`#2ea44f`)
   - Footer: `agentpick.dev/b/{runId}`
4. Use `font-family: sans-serif` — no external font fetch (keeps response < 200ms)
5. Set `Cache-Control: public, max-age=86400`

---

### File 5 — CREATE: `src/app/b/[runId]/badge.svg/route.ts`

Lightweight SVG badge for GitHub README embedding. Target response: **< 200ms**.

**Logic:**
1. Query Prisma directly (single DB read — winning tool name + latencyMs)
2. Build shields.io-style flat SVG:
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" width="210" height="20">
     <rect width="80" height="20" fill="#555"/>
     <rect x="80" width="130" height="20" fill="#2ea44f"/>
     <text x="8" y="14" fill="#fff" font-family="sans-serif" font-size="11">agentpick</text>
     <text x="88" y="14" fill="#fff" font-family="sans-serif" font-size="11">{winningTool} · {latencyMs}ms</text>
   </svg>
   ```
3. Return:
   ```ts
   new Response(svgString, {
     headers: {
       'Content-Type': 'image/svg+xml',
       'Cache-Control': 'public, s-maxage=3600',
     },
   })
   ```

---

## Files Summary — CLAUDE CODE

| Action     | File                                                        |
|------------|-------------------------------------------------------------|
| **CREATE** | `src/app/api/v1/keys/register/route.ts`                     |
| **MODIFY** | `src/app/api/v1/agents/register/route.ts`                   |
| **CREATE** | `src/app/api/v1/benchmarks/[runId]/public/route.ts`         |
| **CREATE** | `src/app/b/[runId]/opengraph-image.tsx`                     |
| **CREATE** | `src/app/b/[runId]/badge.svg/route.ts`                      |

**Files owned by TASK_CODEX.md (do NOT touch):**
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/b/[runId]/page.tsx`
- `src/components/ProductCard.tsx`
- `src/components/PricingSection.tsx`
- `src/components/StatsBar.tsx`
- `src/components/AgentCTA.tsx`
- `src/components/RouterCTA.tsx`
- `src/app/globals.css`
