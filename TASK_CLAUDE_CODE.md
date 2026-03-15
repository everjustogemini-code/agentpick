# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-15
**Cycle:** 53
**Source:** NEXT_VERSION.md — v0.35, QA Round 13, score 58/58 (no bugs)

---

## Bug Fixes

None. QA 58/58 clean. No P0/P1/P2 issues.

---

## Must-Have #2 — Node.js / TypeScript SDK (`npm install agentpick`)

**Scope owned by CLAUDE_CODE:** SDK package implementation + wiring backend data into `/connect` page.

**DO NOT TOUCH:**
- `src/app/page.tsx` (owned by TASK_CODEX)
- `src/components/SiteHeader.tsx` (owned by TASK_CODEX)
- `src/components/PricingPageClient.tsx` (owned by TASK_CODEX)
- `src/app/benchmarks/page.tsx` (owned by TASK_CODEX)
- `src/components/dashboard/RouterAnalyticsDashboard.tsx` (owned by TASK_CODEX)
- `src/app/dashboard/router/page.tsx` (owned by TASK_CODEX)
- `src/components/ConnectTabs.tsx` (owned by TASK_CODEX)

---

### Task 2A — Complete `sdk/` package

The `sdk/` directory already exists with `src/client.ts`, `src/types.ts`, `src/retry.ts`, `src/index.ts`. Read each file before editing. Complete/update as follows:

#### `sdk/package.json`
- Set `name: "agentpick"`, `version: "0.1.0"`, `engines: { "node": ">=18" }`
- Add `publishConfig: { "provenance": true }`
- Ensure dual build exports:
  ```json
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
  ```
- `main: "./dist/index.cjs"`, `module: "./dist/index.js"`, `types: "./dist/index.d.ts"`

#### `sdk/tsup.config.ts`
- Ensure: `format: ["esm", "cjs"]`, `dts: true`, `clean: true`, `entry: ["src/index.ts"]`

#### `sdk/src/types.ts`
Export all public TypeScript interfaces (add any missing):
```ts
export type Strategy = 'MOST_ACCURATE' | 'FASTEST' | 'CHEAPEST' | 'auto';

export interface RouteOptions {
  strategy?: Strategy;
  budget?: number;
  tools?: string[];
}

export interface FallbackAttempt {
  tool: string;
  success: boolean;
  latency_ms: number;
  error?: string;
}

export interface RouteResult {
  tool: string;
  latency_ms: number;
  resultCount: number;
  relevance: number;
  success: boolean;
  ai_routing_summary?: string;
  fallback_chain: FallbackAttempt[];
  cost?: number;
  response_preview?: string;
}

export interface CallRecord {
  id: string;
  query: string;
  capability: string;
  strategy: Strategy;
  tool_used: string;
  latency_ms: number;
  classification_ms: number;
  total_ms: number;
  cost?: number;
  success: boolean;
  ai_routing_summary?: string;
  fallback_chain: FallbackAttempt[];
  created_at: string;
}

export interface AccountInfo {
  id: string;
  email: string;
  plan: string;
  calls_remaining: number;
}

export interface UsageInfo {
  calls_today: number;
  calls_this_month: number;
  cost_this_month: number;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  latency_ms: number;
}

export interface BudgetConfig {
  max_cost_per_call?: number;
  max_cost_per_day?: number;
}

export interface CallFilters {
  capability?: string;
  strategy?: Strategy;
  tool?: string;
  from?: string;   // ISO date
  to?: string;     // ISO date
  limit?: number;
}

export interface AgentPickClientOptions {
  apiKey: string;
  baseUrl?: string;
}
```

#### `sdk/src/retry.ts`
Implement/verify:
- `AgentPickError extends Error` with `status?: number` and `fallback_reported = false`
- `withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T>`
  - Delays: 200ms, 400ms after attempts 1 and 2
  - Do NOT retry on 4xx (status < 500)
  - Set `fallback_reported = true` on last failure before re-throwing

#### `sdk/src/client.ts`
Implement all 7 public methods with JSDoc. Each method calls the real AgentPick REST API via `withRetry`. Bearer auth: `Authorization: Bearer ${apiKey}`.

Methods (signatures are the acceptance target):
```ts
/** Route a query to the best available tool for the given capability. */
async route(capability: string, query: string, options?: RouteOptions): Promise<RouteResult>
// POST /api/v1/router/{capability}  body: { query, ...options }

/** Get account info for the authenticated API key. */
async account(): Promise<AccountInfo>
// GET /api/v1/router/account

/** Get usage stats for current billing period. */
async usage(): Promise<UsageInfo>
// GET /api/v1/router/usage

/** List recent routing calls, optionally filtered. */
async calls(filters?: CallFilters): Promise<CallRecord[]>
// GET /api/v1/router/calls?{URLSearchParams(filters)}

/** Set the default routing strategy for this API key. */
async setStrategy(strategy: Strategy): Promise<void>
// POST /api/v1/router/strategy  body: { strategy }

/** Configure cost budget limits. */
async setBudget(budget: BudgetConfig): Promise<void>
// POST /api/v1/router/budget  body: budget

/** Check API health. */
async health(): Promise<HealthStatus>
// GET /api/v1/router/health
```

#### `sdk/src/index.ts`
Re-export `AgentPickClient` (named + default), `AgentPickError`, and all types from `types.ts`.

#### `sdk/README.md`
Create/update with:
1. `npm install agentpick` install command
2. 5-line TypeScript quick-start (copy-pasteable in < 30s):
   ```ts
   import { AgentPickClient } from 'agentpick';
   const client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY! });
   const result = await client.route('search', 'latest AI benchmarks 2026');
   console.log(result.tool, result.latency_ms);
   ```
3. Table of all 7 public methods with TypeScript signatures
4. Auto-retry behavior note (max 2 retries on 5xx, 200ms backoff)

---

### Task 2B — Wire `/connect` page with TypeScript examples data

**File to MODIFY:** `src/app/connect/page.tsx`

Read the file. Find where Python code examples are defined (likely a `pyExamples` constant or inline strings). Add a parallel `tsExamples` constant:

```ts
const tsExamples = {
  install: `npm install agentpick`,
  quickstart:
`import { AgentPickClient } from 'agentpick';

const client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY! });

const result = await client.route('search', 'latest AI benchmarks 2026');
console.log(result.tool, result.latency_ms);`,
  route: `const result = await client.route('search', 'query', { strategy: 'MOST_ACCURATE' });`,
  account: `const acct = await client.account();`,
  usage:   `const stats = await client.usage();`,
};
```

Pass `tsExamples` as a prop to the `<ConnectTabs>` component (new component created by CODEX in `src/components/ConnectTabs.tsx`). Import it at the top of the file. Do NOT add any tab-switching JSX — that is CODEX's responsibility.

---

## Must-Have #3 — `/dashboard/router` Request Inspector (backend portion)

**Scope owned by CLAUDE_CODE:** Filter query param support + export mode in the calls API endpoint.

### Task 3A — Complete filter + export in `src/app/api/v1/router/calls/route.ts`

This file has existing unstaged changes (per git status). Read it before editing. Complete the filter and export logic:

**In the `GET` handler, read from `request.nextUrl.searchParams`:**
- `capability` → `WHERE call.capability = capability`
- `strategy` → `WHERE call.strategy = strategy`
- `tool` → `WHERE call.toolUsed = tool` (check actual DB field name)
- `date_from` → `WHERE call.createdAt >= new Date(date_from)`
- `date_to` → `WHERE call.createdAt <= new Date(date_to)`
- `export` → when `"true"`: set `Content-Disposition: attachment; filename="calls-export.json"` header and remove pagination limit (max 10 000 rows)

All filters are optional and additive (AND). Existing user-scoping and auth must be preserved.

When `export` is not set, keep existing pagination behaviour. When `export=true`, override limit to 10 000.

Response schema must stay identical to current shape. Only the `Content-Disposition` header and row limit change for export mode.

**Verify the response includes all 9 fields needed by the drawer:**
`id`, `query`, `capability`, `ai_routing_summary`, `strategy`, `tool_used`/`toolUsed`, `fallback_chain`, `classification_ms`+`latency_ms`+`total_ms`, `cost`, `response_preview` — add any missing fields to the Prisma select.

---

## Verification Checklist

- [ ] `cd sdk && npm run build` produces `dist/index.js` (ESM) + `dist/index.cjs` (CJS) + `.d.ts` types
- [ ] `route('search', 'latest AI benchmarks 2026')` returns object with `tool` and `latency_ms`
- [ ] `sdk/package.json` has `name: "agentpick"`, `engines: { node: ">=18" }`, `publishConfig.provenance: true`
- [ ] `GET /api/v1/router/calls?capability=search&tool=tavily` returns only matching rows
- [ ] `GET /api/v1/router/calls?export=true` returns header `Content-Disposition: attachment; filename="calls-export.json"`
- [ ] Response from calls endpoint includes all 9 drawer fields
- [ ] `src/app/connect/page.tsx` exports `tsExamples` and passes it to `<ConnectTabs>`
- [ ] QA script 58/58 still passes

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
src/app/connect/page.tsx
src/app/api/v1/router/calls/route.ts
```
