# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-14
**Cycle:** 34
**Source:** NEXT_VERSION.md — QA Round 12, score 57/57 (no bugs)

---

## Bug Fixes

None. QA 57/57 clean. No P0/P1/P2 issues.

---

## Must-Have #2 — Node.js / TypeScript SDK (`npm install agentpick`)

**Scope owned by CLAUDE_CODE:** Create the entire SDK package + wire backend data in `/connect`.

**DO NOT TOUCH:**
- `src/app/page.tsx` (owned by TASK_CODEX)
- `src/app/rankings/page.tsx`, `src/app/benchmarks/page.tsx`, `src/app/agents/page.tsx`, `src/app/live/page.tsx` (owned by TASK_CODEX)
- `src/components/dashboard/RouterAnalyticsDashboard.tsx` (owned by TASK_CODEX)
- `src/components/SiteHeader.tsx` (owned by TASK_CODEX)

---

### Task 2A — Create `sdk/` package directory

Create all files below as a new top-level `sdk/` directory (sibling to `src/`, `prisma/`).

#### `sdk/package.json`

```json
{
  "name": "agentpick",
  "version": "0.1.0",
  "description": "Official Node.js / TypeScript SDK for AgentPick router",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### `sdk/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

#### `sdk/tsup.config.ts`

```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
});
```

---

#### `sdk/src/types.ts`

Define all public TypeScript interfaces. Mirror the `/api/v1/router/calls` response schema exactly:

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
  from?: string;  // ISO date
  to?: string;    // ISO date
  limit?: number;
}

export interface AgentPickClientOptions {
  apiKey: string;
  baseUrl?: string;
}
```

---

#### `sdk/src/retry.ts`

```ts
export class AgentPickError extends Error {
  status?: number;
  fallback_reported = false;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AgentPickError';
    this.status = status;
  }
}

export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const delays = [200, 400, 800];
  let lastError: AgentPickError | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const apiErr = err instanceof AgentPickError ? err : new AgentPickError(String(err));
      lastError = apiErr;
      if (apiErr.status && apiErr.status < 500) throw apiErr; // don't retry 4xx
      if (attempt < maxAttempts - 1) await new Promise(r => setTimeout(r, delays[attempt]));
    }
  }
  lastError!.fallback_reported = true;
  throw lastError;
}
```

---

#### `sdk/src/client.ts`

Implement `AgentPickClient` with all 7 public methods. Each method must have JSDoc:

```ts
import type {
  AgentPickClientOptions, RouteOptions, RouteResult, AccountInfo,
  UsageInfo, CallRecord, CallFilters, HealthStatus, BudgetConfig, Strategy
} from './types';
import { withRetry, AgentPickError } from './retry';

export class AgentPickClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: AgentPickClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://agentpick.io';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    return withRetry(async () => {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(options?.headers ?? {}),
        },
      });
      if (!res.ok) throw new AgentPickError(await res.text(), res.status);
      return res.json() as Promise<T>;
    });
  }

  /** Route a query to the best available tool for the given capability. */
  async route(capability: string, query: string, options?: RouteOptions): Promise<RouteResult> {
    return this.request<RouteResult>(`/api/v1/router/${capability}`, {
      method: 'POST',
      body: JSON.stringify({ query, ...options }),
    });
  }

  /** Get account info for the authenticated API key. */
  async account(): Promise<AccountInfo> {
    return this.request<AccountInfo>('/api/v1/router/account');
  }

  /** Get usage statistics for the current billing period. */
  async usage(): Promise<UsageInfo> {
    return this.request<UsageInfo>('/api/v1/router/usage');
  }

  /** List recent routing calls, optionally filtered. */
  async calls(filters?: CallFilters): Promise<CallRecord[]> {
    const params = new URLSearchParams(filters as Record<string, string>);
    return this.request<CallRecord[]>(`/api/v1/router/calls?${params}`);
  }

  /** Set the default routing strategy for this API key. */
  async setStrategy(strategy: Strategy): Promise<void> {
    await this.request('/api/v1/router/strategy', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    });
  }

  /** Configure cost budget limits. */
  async setBudget(budget: BudgetConfig): Promise<void> {
    await this.request('/api/v1/router/budget', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }

  /** Check API health and measure round-trip latency. */
  async health(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/v1/router/health');
  }
}
```

---

#### `sdk/src/index.ts`

```ts
export { AgentPickClient } from './client';
export { AgentPickError } from './retry';
export type {
  RouteResult, RouteOptions, CallRecord, CallFilters,
  AccountInfo, UsageInfo, HealthStatus, BudgetConfig,
  Strategy, FallbackAttempt, AgentPickClientOptions
} from './types';
```

---

#### `sdk/README.md`

Include:
- `npm install agentpick` install command
- 5-line TypeScript quick-start example using `client.route('search', 'latest AI benchmarks 2025')`
- Table of all 7 public methods with TypeScript signatures
- Links to agentpick.io/connect for full docs

---

### Task 2B — Wire `/connect` page with TypeScript examples data

**File to MODIFY:** `src/app/connect/page.tsx`

Read the file first. Find where the Python code examples are defined (likely a constant named `pyExamples` or similar, or inline JSX strings). Add a parallel `tsExamples` constant with the TypeScript equivalents:

```ts
const tsExamples = {
  install: `npm install agentpick`,
  quickstart:
`import { AgentPickClient } from 'agentpick';

const client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY! });

const result = await client.route('search', 'latest AI benchmarks 2025');
console.log(result.tool, result.latency_ms);`,
  route: `const result = await client.route('search', 'query', { strategy: 'MOST_ACCURATE' });`,
  account: `const acct = await client.account();`,
  usage:   `const stats = await client.usage();`,
};
```

Pass `tsExamples` as a prop to whatever client component renders the code block. The tab-switching UI and styling are handled by CODEX in `src/components/ConnectTabs.tsx` (new component). Do not add any JSX tab-switching logic in this file.

---

## Verification Checklist

- [ ] `sdk/package.json` — name `agentpick`, ESM+CJS exports, engines node>=18
- [ ] `sdk/src/types.ts` — all 10 interfaces exported, `CallRecord` mirrors `/api/v1/router/calls` schema
- [ ] `sdk/src/retry.ts` — `AgentPickError` exported, max 3 retries, 200/400/800ms backoff, `fallback_reported` on final fail
- [ ] `sdk/src/client.ts` — all 7 methods with JSDoc (`route`, `account`, `usage`, `calls`, `setStrategy`, `setBudget`, `health`)
- [ ] `sdk/src/index.ts` — re-exports all public symbols
- [ ] `sdk/README.md` — quick-start present
- [ ] `src/app/connect/page.tsx` — `tsExamples` constant added, passed to child component
- [ ] No files under `src/app/page.tsx`, `src/app/rankings/`, `src/app/benchmarks/`, `src/app/agents/`, `src/app/live/`, `src/components/SiteHeader.tsx`, or `src/components/dashboard/RouterAnalyticsDashboard.tsx` touched

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
```
