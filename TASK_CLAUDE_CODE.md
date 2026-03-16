# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-16
**Source:** NEXT_VERSION.md — QA Round 16 (56/57 → target 57/57)

---

## Overview

This file covers:
- **Must-Have #1 (P1):** Fix `/api/v1/account/register` 404 → **CRITICAL, ships first**
- **Must-Have #3 (backend):** Shareable Benchmark Permalinks — API endpoint, OG image, SVG badge

All tasks create **new files only**. No existing files are modified.
TASK_CODEX.md owns the frontend `/b/[runId]` page and all UI upgrade work. No file overlap.

---

## Must-Have #1 — Fix P1: `/api/v1/account/register` Returns 404

**Priority:** CRITICAL — must ship and pass QA before any other feature deploys

### File to CREATE: `src/app/api/v1/account/register/route.ts`

**Goal:** Proxy `POST /api/v1/account/register` to `/api/v1/router/register`, return identical response, add `Deprecation: true` header.

**Before writing:** Read `src/app/api/v1/router/register/route.ts` to match exact request/response shape.

**Implementation:**

```ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const upstream = await fetch(
    new URL('/api/v1/router/register', req.nextUrl.origin).toString(),
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
- `POST /api/v1/account/register` with valid payload → same `{ apiKey, plan, monthlyLimit }` JSON as `/api/v1/router/register`
- Response includes `Deprecation: true` header
- Existing `/api/v1/router/register` behavior unchanged (zero modifications to it)
- QA Round 17 score: 57/57

---

## Must-Have #3 — Shareable Benchmark Permalinks: Backend

**Priority:** High — ships after #1 confirmed 57/57 by QA

### File 1 — CREATE: `src/app/api/v1/benchmarks/[runId]/public/route.ts`

Unauthenticated public endpoint returning sanitized benchmark run data.

**Before writing:** Read `prisma/schema.prisma` lines ~243-278 (BenchmarkRun model) to confirm field names.

**Logic:**
1. Parse `runId` from `params`
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
6. No auth required

---

### File 2 — CREATE: `src/app/b/[runId]/opengraph-image.tsx`

Dynamic OG social card using `@vercel/og` (available as `next/og`).

**Logic:**
1. `export const runtime = 'edge'`
2. Fetch run data via internal call to `/api/v1/benchmarks/{runId}/public`
3. Return `ImageResponse` (1200×630) with:
   - AgentPick wordmark top-left
   - Query text (truncate at 120 chars)
   - Tool comparison row: tool name | latency | relevance
   - Winning tool highlighted in accent green (#2ea44f)
   - Footer: `agentpick.dev/b/{runId}`
4. No external font fetch — use `font-family: sans-serif` to stay under 200ms

---

### File 3 — CREATE: `src/app/b/[runId]/badge.svg/route.ts`

Lightweight SVG badge for GitHub README embedding. Target response: < 200ms.

**Logic:**
1. Fetch run from Prisma (winning tool name + latencyMs) — single DB read, no LLM calls
2. Build shields.io-style flat SVG string:
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" width="210" height="20">
     <rect width="80" height="20" fill="#555"/>
     <rect x="80" width="130" height="20" fill="#2ea44f"/>
     <text x="8" y="14" fill="#fff" font-family="sans-serif" font-size="11">agentpick</text>
     <text x="88" y="14" fill="#fff" font-family="sans-serif" font-size="11">{winningTool} · {latencyMs}ms</text>
   </svg>
   ```
3. Return with headers:
   - `Content-Type: image/svg+xml`
   - `Cache-Control: public, s-maxage=3600`

---

## Files Summary — CLAUDE CODE

| Action | File |
|--------|------|
| **CREATE** | `src/app/api/v1/account/register/route.ts` |
| **CREATE** | `src/app/api/v1/benchmarks/[runId]/public/route.ts` |
| **CREATE** | `src/app/b/[runId]/opengraph-image.tsx` |
| **CREATE** | `src/app/b/[runId]/badge.svg/route.ts` |

**All existing files: READ-ONLY.** Do not modify any file not listed above.

**Files owned by TASK_CODEX.md (do NOT touch):**
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/app/b/[runId]/page.tsx`
- `src/components/ProductCard.tsx`
- `src/components/PricingSection.tsx`
- `src/components/StatsBar.tsx`
- `src/components/AgentCTA.tsx`
- `src/components/RouterCTA.tsx`
- `src/components/HeroCodeBlock.tsx`
- `src/components/LiveRoutingExample.tsx`
