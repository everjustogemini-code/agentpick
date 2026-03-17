# TASK_CLAUDE_CODE.md
**Agent:** Claude Code (backend/API/complex multi-file)
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #1 (P1a + P1b) + Must-Have #3 (backend API)

---

## Files to Modify / Create

| File | Action |
|------|--------|
| `src/lib/router/ai-classify.ts` | Modify — LRU cache upgrade + query normalization |
| `src/__tests__/rate-limit-429.test.ts` | Create — automated 429 regression test |
| `src/app/api/v1/benchmarks/[runId]/public/route.ts` | Modify — add multi-tool BenchmarkAgentRun data |

**DO NOT touch any files owned by TASK_CODEX.md:**
`src/app/globals.css`, `src/app/page.tsx`, `src/components/StatsBar.tsx`,
`src/components/AgentCTA.tsx`, `src/components/RouterCTA.tsx`,
`src/app/connect/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/b/[runId]/page.tsx`

---

## Task 1 — P1a: AI Classification Latency Fix

**NEXT_VERSION.md ref:** Must-Have #1a — classification sub-step ≤ 200ms p95
**File:** `src/lib/router/ai-classify.ts`

### Background (read first)
- Current cache: `classificationCache` is a plain `Map` (line 31). Eviction at lines 181–183, 196–198, 204–206 deletes only the oldest-inserted key (`.keys().next().value`), NOT the least-recently-used. Frequently-hit queries can be evicted while stale entries persist.
- Cache key (line 171): `${capability}:${query}` — no normalization. `"What is AI"` and `"what is ai  "` are separate cache misses, both fall through to Haiku.
- LLM timeout is already 150ms (line 192) and Haiku is already used (line 257). Header `X-Classification-Ms` is already emitted in `src/lib/router/index.ts` lines 658/709. **Do not touch index.ts.**

### Change 1 — Add inline LRU class before the import block (top of file, before line 14)

```typescript
class LRUCache<K, V> {
  private map = new Map<K, V>();
  constructor(private maxSize: number) {}
  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val); // promote to MRU position
    return val;
  }
  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.maxSize) {
      this.map.delete(this.map.keys().next().value!); // evict LRU
    }
    this.map.set(key, value);
  }
  get size() { return this.map.size; }
}
```

### Change 2 — Replace `classificationCache` declaration (lines 31–32)

Old:
```typescript
const classificationCache = new Map<string, { result: QueryContext; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
```

New:
```typescript
const classificationCache = new LRUCache<string, { result: QueryContext; timestamp: number }>(500);
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
```

### Change 3 — Add query normalization in `getClassification` (line 171)

Old:
```typescript
const key = `${capability}:${query}`;
```

New:
```typescript
const key = `${capability}:${query.trim().toLowerCase().replace(/\s+/g, ' ')}`;
```

### Change 4 — Remove all 3 manual size-check eviction blocks

Remove ALL occurrences of this 3-line pattern (appears at lines 181–183, 196–198, 204–206):
```typescript
if (classificationCache.size > 1000) {
  classificationCache.delete(classificationCache.keys().next().value!);
}
```
LRUCache handles eviction automatically. Do not keep these.

### Acceptance Criteria
- `"What is AI  "` and `"what is ai"` produce the same cache key and share one cache slot
- Max 500 entries; LRU entry is evicted (not oldest-inserted)
- No new npm dependencies
- `npx vitest run src/__tests__/ai-classify.test.ts` — all existing tests pass

---

## Task 2 — P1b: Automated Rate Limit 429 Test

**NEXT_VERSION.md ref:** Must-Have #1b — `test_rate_limit_429` must run in CI on every PR
**File:** `src/__tests__/rate-limit-429.test.ts` (CREATE — does not exist)

### Background
`checkUsageLimit` in `src/lib/router/sdk.ts` (line 115) returns `{ allowed: false, hardCapped: true }` when `monthCount >= monthlyLimit` for a plan with no overage (`overagePerCall === null`). The handler uses this to return HTTP 429 with `RATE_LIMITED` error code and `Retry-After` header. No test currently validates this path.

**Before writing the test:** Open `src/lib/router/sdk.ts` and confirm:
1. The exact value of `ROUTER_PLAN_MONTHLY_LIMITS['FREE']` (expected: `500`)
2. The exact string key for the free plan in `RouterPlanValue` type (expected: `'FREE'`)
3. Whether `ROUTER_PLAN_OVERAGE_PER_CALL['FREE']` is `null` (confirms hard-cap branch fires)

### Test File to Create

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    routerCall: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { checkUsageLimit } from '@/lib/router/sdk';

const mockCount = prisma.routerCall.count as ReturnType<typeof vi.fn>;

describe('Rate limit 429 path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test_rate_limit_429 — returns allowed:false + hardCapped:true when monthCount equals monthlyLimit', async () => {
    // Free plan monthly limit = 500; seed at limit (501st call scenario)
    mockCount
      .mockResolvedValueOnce(0)   // todayCount
      .mockResolvedValueOnce(500); // monthCount = at monthly limit

    const result = await checkUsageLimit('dev-test-id', 'FREE');

    expect(result.allowed).toBe(false);
    expect(result.hardCapped).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.monthlyUsed).toBe(500);
    expect(result.monthlyLimit).toBe(500);
  });

  it('allows call when monthCount is one below monthly limit', async () => {
    mockCount
      .mockResolvedValueOnce(0)   // todayCount
      .mockResolvedValueOnce(499); // monthCount = one below limit

    const result = await checkUsageLimit('dev-test-id', 'FREE');

    expect(result.hardCapped).toBe(false);
    expect(result.monthlyUsed).toBe(499);
  });
});
```

### Acceptance Criteria
- `npx vitest run src/__tests__/rate-limit-429.test.ts` — `test_rate_limit_429` passes
- No real DB or Redis required (pure mock)
- Included in default vitest run (no special flag)

---

## Task 3 — Must-Have #3 Backend: Benchmark Public API — Multi-Tool Response

**NEXT_VERSION.md ref:** Must-Have #3 — `GET /api/v1/benchmarks/{runId}/public` unauthenticated, sanitized, multi-tool
**File:** `src/app/api/v1/benchmarks/[runId]/public/route.ts` (Modify)

### Current State
Lines 1–43: returns a `tools` array with a single entry built from `BenchmarkRun`'s own columns. Per-agent results from `BenchmarkAgentRun` are not included. The spec requires multi-tool side-by-side comparison.

### Before Writing
Check `prisma/schema.prisma` for the exact relation field name on `BenchmarkRun` that links to `BenchmarkAgentRun` records (look for `@@relation` or field type `BenchmarkAgentRun[]`). The field is likely named `agentRuns` or `BenchmarkAgentRun`. Use the exact name from the schema.

Also confirm `BenchmarkAgentRun` fields: `latencyMs`, `resultCount`, `relevanceScore`, `statusCode`, and its relation back to `BenchmarkAgent` which has a relation to `Product`.

### Replace Entire File With

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const db = prisma as any

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  const run = await db.benchmarkRun.findUnique({
    where: { id: runId },
    include: {
      product: true,
      // Replace 'agentRuns' with actual relation name from prisma/schema.prisma
      agentRuns: {
        include: { agent: { include: { product: true } } },
        orderBy: { latencyMs: 'asc' },
      },
    },
  })

  if (!run) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  // Multi-tool array from BenchmarkAgentRun; fall back to single-tool for legacy rows
  const tools: Array<{
    name: string | null
    latencyMs: number | null
    resultCount: number | null
    relevanceScore: number | null
    success: boolean
  }> =
    Array.isArray(run.agentRuns) && run.agentRuns.length > 0
      ? run.agentRuns.map((ar: any) => ({
          name: ar.agent?.product?.name ?? ar.agent?.name ?? 'Unknown',
          latencyMs: ar.latencyMs ?? null,
          resultCount: ar.resultCount ?? null,
          relevanceScore: ar.relevanceScore ?? null,
          success: ar.statusCode === 200,
        }))
      : [
          {
            name: run.product?.name ?? null,
            latencyMs: run.latencyMs ?? null,
            resultCount: run.resultCount ?? null,
            relevanceScore: run.relevanceScore ?? null,
            success: run.statusCode === 200,
          },
        ]

  const winningTool =
    tools.find((t) => t.success && t.latencyMs != null)?.name ??
    run.product?.name ??
    null

  const sanitized = {
    id: run.id,
    query: run.query,
    domain: run.domain,
    tools,
    winningTool,
    createdAt: run.createdAt,
  }

  return NextResponse.json(sanitized, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
```

### Acceptance Criteria
- `GET /api/v1/benchmarks/{runId}/public` — no auth required, HTTP 200
- `tools` array has one entry per `BenchmarkAgentRun` when available
- Falls back to single-entry array for legacy records with no agent runs
- No internal cost/billing fields in response (`costPerCall`, `billingAmount`, etc.)
- `Cache-Control: public, s-maxage=3600` header present

---

## Final Verification

- [ ] All 3 tasks complete with no changes to CODEX-owned files
- [ ] `npx vitest run` — all tests pass (including new rate-limit-429 test)
- [ ] No new npm dependencies introduced
- [ ] Write progress log entry to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`
