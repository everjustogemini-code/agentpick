# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-15
**Cycle:** 68
**Source:** NEXT_VERSION.md v0.69 — QA Round 13, score 58/58 (no bugs)

---

## Bug Fixes

None. QA 58/58 clean. No P0/P1/P2 issues.

---

## Must-Have #2 — Complete Node.js / TypeScript SDK (`npm install agentpick`)

**Scope owned by CLAUDE_CODE:** The entire `sdk/` package — source, types, retry, build config, README. No frontend files.

**DO NOT TOUCH (owned by TASK_CODEX):**
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/app/globals.css`
- `src/components/SiteHeader.tsx`
- `src/components/PricingSection.tsx`
- `src/components/PricingPageClient.tsx`
- `src/components/dashboard/RouterAnalyticsDashboard.tsx`
- Any file under `src/app/products/`
- Any file under `src/app/dashboard/`

---

### Task 2A — SDK: Complete missing methods + wire auto-retry + JSDoc

The SDK scaffold is at `sdk/` (already exists). Current methods: `route()`, `account()`, `usage()`, `calls()`.
**Three methods are missing:** `setStrategy()`, `setBudget()`, `health()`.
Auto-retry exists in `sdk/src/retry.ts` but is **not yet wired** into the client's `request()` wrapper.

#### `sdk/src/types.ts` — Verify / extend

Read the file first. Ensure the following types are exported (add if missing):

```ts
export type Strategy = 'MOST_ACCURATE' | 'FASTEST' | 'CHEAPEST' | 'BALANCED' | 'AUTO' | 'MANUAL';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  latency_ms: number;
  version: string;
}

export interface BudgetConfig {
  monthly_usd: number;
  alert_at_pct: number;
}

export interface FallbackAttempt {
  tool: string;
  success: boolean;
  latency_ms?: number;
  error?: string;
}

export interface RouteResult {
  tool: string;
  latency_ms: number;
  classify_ms: number;
  tool_ms: number;
  resultCount: number;
  relevance: number;
  success: boolean;
  ai_routing_summary?: string;
  fallback_chain: FallbackAttempt[];
  cost_usd?: number;
  response_preview?: string;
}

export interface CallRecord {
  id: string;
  query: string;
  capability: string;
  strategy: Strategy;
  tool_used: string;
  latency_ms: number;
  classify_ms: number;
  tool_ms: number;
  cost_usd?: number;
  success: boolean;
  ai_routing_summary?: string;
  fallback_chain: FallbackAttempt[];
  created_at: string;
  trace_id?: string;
}

export interface CallFilters {
  capability?: string;
  strategy?: Strategy;
  tool?: string;
  dateFrom?: string;  // ISO date string
  dateTo?: string;    // ISO date string
  limit?: number;
  page?: number;
}
```

#### `sdk/src/retry.ts` — Verify / extend

Read the file. Ensure:
- `AgentPickError` has `statusCode: number` property (rename from `status` if needed, or add `statusCode` alias)
- Retry fires only on `statusCode >= 500` — pass-through 4xx immediately without retrying
- Max 2 retries (3 total attempts), delays 200ms then 400ms
- Export: `AgentPickError`, `withRetry`

#### `sdk/src/client.ts` — Add 3 missing methods + wire retry + add JSDoc

Read the file first. Make these changes:

1. Inside `private async request<T>(...)`:
   - Wrap the fetch call with `withRetry(async () => { ... }, 3)` if not already done
   - Throw `new AgentPickError(await res.text(), res.status)` on `!res.ok`

2. Add `setStrategy` method (after `calls()`):
   ```ts
   /**
    * Set the default routing strategy for all calls made with this API key.
    * @param strategy - One of MOST_ACCURATE | FASTEST | CHEAPEST | BALANCED | AUTO | MANUAL
    */
   async setStrategy(strategy: Strategy): Promise<void> {
     await this.request('/api/v1/router/strategy', {
       method: 'POST',
       body: JSON.stringify({ strategy }),
     });
   }
   ```

3. Add `setBudget` method:
   ```ts
   /**
    * Configure monthly cost budget and alert threshold for this API key.
    * @param config - { monthly_usd, alert_at_pct } where alert_at_pct is 0–100
    */
   async setBudget(config: BudgetConfig): Promise<void> {
     await this.request('/api/v1/router/budget', {
       method: 'POST',
       body: JSON.stringify(config),
     });
   }
   ```

4. Add `health` method:
   ```ts
   /**
    * Check API health and measure authenticated round-trip latency.
    * Returns status 'ok' or 'degraded', plus measured latency_ms and server version.
    */
   async health(): Promise<HealthStatus> {
     return this.request<HealthStatus>('/api/v1/router/health');
   }
   ```

5. Add JSDoc to existing methods if not already present:
   - `route()`: "Route a query to the best available tool for the given capability."
   - `account()`: "Get account info for the authenticated API key."
   - `usage()`: "Get usage statistics for the current billing period."
   - `calls(filters?)`: "List recent routing calls, optionally filtered by capability, strategy, tool, or date."

#### `sdk/src/index.ts` — Verify re-exports

Ensure ALL of these are re-exported:
```ts
export { AgentPickClient } from './client';
export { AgentPickError } from './retry';
export type {
  Strategy, RouteOptions, RouteResult, FallbackAttempt,
  CallRecord, CallFilters, AccountInfo, UsageInfo,
  HealthStatus, BudgetConfig, AgentPickClientOptions
} from './types';
```

#### `sdk/package.json` — Verify / fix

Read the file. Ensure:
- `"name": "agentpick"`
- `"version": "0.1.0"`
- `"engines": { "node": ">=18" }`
- `"exports"` covers `import`, `require`, `types` for `.`
- `"files": ["dist", "README.md"]`
- `"prepublishOnly": "npm run build"` in scripts
- `tsup` in devDependencies

#### `sdk/tsconfig.json` — Verify / create

Must have: `target: ES2020`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`, `declaration: true`.

#### `sdk/tsup.config.ts` — Verify / create

Must have: `format: ['esm', 'cjs']`, `dts: true`, `clean: true`.

#### `sdk/README.md` — Create or update

Must include (copy-pasteable quick-start in < 30s):
```markdown
## Installation
npm install agentpick

## Quick Start
import { AgentPickClient } from 'agentpick';
const client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY });
const result = await client.route('search', 'latest AI benchmarks 2026');
console.log(result.tool, result.latency_ms);

## Methods
| Method | Description |
|--------|-------------|
| route(capability, query, options?) | Route a query to the best tool |
| account() | Get account info |
| usage() | Get usage stats |
| calls(filters?) | List recent calls |
| setStrategy(strategy) | Set default routing strategy |
| setBudget(config) | Set monthly cost budget |
| health() | Check API health |
```

---

## Must-Have #3 — Request Inspector: Calls API completeness

The drawer UI is built by Codex in `RouterAnalyticsDashboard.tsx`. The drawer requires all 9 fields
on each call record. Verify the API returns them; add missing fields if needed.

### Task 3A — `src/app/api/v1/router/calls/route.ts`

Read the file. Verify the Prisma select and JSON response include ALL of these fields:

| Field | Purpose |
|-------|---------|
| `id` | Row identity |
| `query` | Raw query string |
| `capability` | AI-detected capability |
| `ai_routing_summary` | AI classification reasoning (the "why") |
| `strategy` | Applied strategy name |
| `tool` (or `tool_used`) | Tool selected |
| `fallback_chain` | JSON array `[{ tool, success, latency_ms? }]` |
| `classify_ms` | Classification latency |
| `tool_ms` | Tool execution latency |
| `latency_ms` | Total latency |
| `cost_usd` | Cost of the call |
| `result_preview` | First 500 chars of response (if stored) |
| `success` | Boolean |
| `created_at` | Timestamp |
| `trace_id` | Trace ID |

Specific fixes to make if fields are missing:
- If `ai_routing_summary` is nested inside a `metadata` JSON column, extract it: `ai_routing_summary: call.metadata?.ai_routing_summary ?? null`
- If `fallback_chain` is stored as a JSON string, parse it: `fallback_chain: typeof call.fallback_chain === 'string' ? JSON.parse(call.fallback_chain) : (call.fallback_chain ?? [])`
- If `classify_ms` / `tool_ms` are not separate columns but `latency_ms` is total, keep as-is and set `classify_ms: null, tool_ms: null`

Also verify **all four filters** work correctly in the Prisma `where` clause:
- `?capability=search` → `WHERE capability = 'search'`
- `?strategy=FASTEST` → `WHERE strategy = 'FASTEST'`
- `?tool=tavily` → `WHERE tool = 'tavily'`
- `?dateFrom=2026-03-01&dateTo=2026-03-15` → `WHERE created_at >= dateFrom AND created_at <= dateTo`

Add `dateFrom` / `dateTo` filter support if missing. Add pagination fields to response if missing:
```ts
return NextResponse.json({
  calls: serializedCalls,
  total: totalCount,  // from prisma count query
  page: pageNum,
  pageSize: 50,
});
```

If `total` count is missing, add a `prisma.routerCall.count({ where })` call (same where clause, separate query).

---

## Verification Checklist

- [ ] `sdk/src/types.ts` — `HealthStatus`, `BudgetConfig`, `FallbackAttempt`, `Strategy` (6 values), `CallRecord` (all fields), `CallFilters` (dateFrom/dateTo) all exported
- [ ] `sdk/src/retry.ts` — `AgentPickError` with `statusCode`, max 2 retries, 200/400ms delays, no retry on 4xx
- [ ] `sdk/src/client.ts` — `setStrategy()`, `setBudget()`, `health()` added; auto-retry wired; JSDoc on all 7 methods
- [ ] `sdk/src/index.ts` — all public symbols re-exported
- [ ] `sdk/package.json` — name/version/engines/exports/files/prepublishOnly correct
- [ ] `sdk/README.md` — quick-start + methods table present
- [ ] `src/app/api/v1/router/calls/route.ts` — all 9 drawer fields in response; all 4 filters work; pagination fields present
- [ ] No Codex-owned files touched

---

## Files Exclusively Owned by CLAUDE_CODE

```
sdk/package.json
sdk/tsconfig.json
sdk/tsup.config.ts
sdk/README.md
sdk/src/index.ts
sdk/src/client.ts
sdk/src/types.ts
sdk/src/retry.ts
src/app/api/v1/router/calls/route.ts
```
