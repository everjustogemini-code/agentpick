# Codex Task: AgentPick Router SDK — Server-Side Infrastructure

## Project Context

AgentPick (https://agentpick.dev) is an agent-native review platform where AI agents discover, benchmark, vote for, and route requests to developer tools (APIs). The codebase is a **Next.js 16 App Router** project with **Turbopack**, **Prisma 7.4** (PostgreSQL via Neon), and **Upstash Redis** for rate limiting.

A basic router already exists at `/api/v1/route/{capability}`. Your job is to add the **Router SDK infrastructure**: developer accounts, usage tracking, strategy configuration, fallback engine enhancements, monitoring APIs, and an OpenClaw skill file.

---

## Critical Codebase Patterns — Follow These Exactly

### Prisma Client Import
```typescript
import { prisma } from '@/lib/prisma';
```
The generated client lives at `@/generated/prisma/client` (configured in `prisma/schema.prisma` with `output = "../src/generated/prisma"`). **Always import from `@/lib/prisma`**, never from the generated path directly.

### Auth Middleware
```typescript
import { authenticateAgent } from '@/lib/auth';
// In route handler:
const agent = await authenticateAgent(request);
if (!agent) {
  return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
}
```
- Auth supports both `Authorization: Bearer ah_live_sk_...` header AND `?token=ah_live_sk_...` query param
- API keys are SHA256 hashed: `hashApiKey(token)` → lookup by `apiKeyHash`
- Key format: `ah_live_sk_${randomBytes(32).toString('hex')}`
- Import `hashApiKey` and `generateApiKey` from `@/lib/auth`

### API Error Helper
```typescript
import { apiError } from '@/types';
// Usage:
return apiError('ERROR_CODE', 'Human message.', 400, { details: { ... } });
```
Defined in `src/types/index.ts`.

### Rate Limiting
```typescript
import { checkRateLimit, telemetryLimiter } from '@/lib/rate-limit';
// Usage:
const { limited, retryAfter } = await checkRateLimit(telemetryLimiter, agent.id);
if (limited) {
  return apiError('RATE_LIMITED', 'Too many requests.', 429, { retry_after: retryAfter });
}
```
Create new limiters in `src/lib/rate-limit.ts`:
```typescript
export const routerLimiter = createLimiter(200, '1m', 'agentpick:router');
```

### Route Handler Pattern (Next.js 16)
```typescript
// src/app/api/v1/example/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) { ... }
export async function GET(request: NextRequest) { ... }

// Dynamic routes use Promise<{param}> pattern:
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // ...
}
```

### Tool Adapter Interface
```typescript
// src/lib/benchmark/adapters/types.ts
export interface ToolCallResult {
  statusCode: number;
  latencyMs: number;
  resultCount: number;
  response: unknown;
  costUsd: number;
}
```

### Existing Router Core (DO NOT MODIFY — extend only)
- `src/lib/router/index.ts` — `routeRequest()`, `callWithKey()`, `getBestToolForCapability()`, `recordTrace()`
- `src/lib/router/handler.ts` — `handleRouteRequest()` with auth + rate limit + parse
- `src/app/api/v1/route/[capability]/route.ts` — Dynamic capability routing
- `src/app/api/v1/route/search/route.ts` — Static search route
- `src/app/api/v1/route/crawl/route.ts` — Static crawl route
- `src/app/api/v1/route/embed/route.ts` — Static embed route
- `src/app/api/v1/route/finance/route.ts` — Static finance route

### Existing Adapters (19 tools with working adapters)
Search: `tavily`, `exa-search`, `serpapi`, `jina-ai`, `firecrawl`, `perplexity-search`, `you-search`, `serpapi-google`, `bing-web-search`
Crawling: `apify`, `scrapingbee`, `browserbase`
Finance: `polygon-io`, `alpha-vantage`, `financial-modeling-prep`
Embedding: `openai-embed`, `cohere-embed`, `voyage-embed`, `jina-embed`

All slugs above are canonical Product.slug values in the database.

### SLUG_TO_ENV_VAR mapping in `src/lib/router/index.ts`
Maps tool slugs to environment variable names for BYOK key injection (50+ entries). Already handles all 19 adapters and their aliases.

### CAPABILITY_TO_CATEGORY mapping in `src/lib/router/index.ts`
```typescript
const CAPABILITY_TO_CATEGORY: Record<string, string> = {
  search: 'search_research', crawl: 'web_crawling', embed: 'storage_memory',
  finance: 'finance_data', code: 'code_compute', storage: 'storage_memory',
  communication: 'communication', payments: 'payments_commerce',
  auth: 'auth_identity', scheduling: 'scheduling', ai: 'ai_models',
  observability: 'observability',
};
```

---

## Task 1: Prisma Schema Additions

**File: `prisma/schema.prisma`**

Add these models at the end of the file (before any closing comments). Do NOT modify existing models.

```prisma
// ============================================================
// ROUTER SDK — Developer Accounts & Usage Tracking
// ============================================================

model DeveloperAccount {
  id              String   @id @default(cuid())
  agentId         String   @unique
  agent           Agent    @relation("developerAccount", fields: [agentId], references: [id])

  // Billing
  plan            RouterPlan  @default(FREE)
  monthlyBudgetUsd Float?           // null = unlimited (for paid plans with no cap)
  spentThisMonth   Float     @default(0)
  billingCycleStart DateTime @default(now())

  // Strategy
  strategy        RouterStrategy @default(BALANCED)
  priorityTools   String[]       // Preferred tool slugs (tried first)
  excludedTools   String[]       // Never use these
  fallbackEnabled Boolean        @default(true)
  maxFallbacks    Int            @default(3)
  latencyBudgetMs Int?           // Max acceptable latency per call

  // Usage stats
  totalCalls      Int      @default(0)
  totalFallbacks  Int      @default(0)
  totalCostUsd    Float    @default(0)
  avgLatencyMs    Float?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  routerCalls     RouterCall[]

  @@index([plan])
  @@index([agentId])
}

model RouterCall {
  id              String   @id @default(cuid())
  developerId     String
  developer       DeveloperAccount @relation(fields: [developerId], references: [id])

  capability      String           // "search", "crawl", "embed", "finance"
  query           String
  toolRequested   String?          // Tool the dev asked for (null = auto-route)
  toolUsed        String           // Tool actually used
  fallbackUsed    Boolean          @default(false)
  fallbackFrom    String?          // Original tool that failed
  fallbackChain   String[]         // All tools tried in order

  // Performance
  statusCode      Int
  latencyMs       Int
  resultCount     Int?
  costUsd         Float    @default(0)
  success         Boolean

  // Strategy applied
  strategyUsed    RouterStrategy
  byokUsed       Boolean  @default(false)  // Did they use their own key?

  traceId         String?          // Links to TelemetryEvent.id

  createdAt       DateTime @default(now())

  @@index([developerId, createdAt])
  @@index([capability, createdAt])
  @@index([toolUsed, createdAt])
  @@index([success])
}

enum RouterPlan {
  FREE        // 100 calls/day, AgentPick keys only
  STARTER     // 1000 calls/day, BYOK supported
  PRO         // 10000 calls/day, priority routing
  ENTERPRISE  // Unlimited, SLA, dedicated support
}

enum RouterStrategy {
  BALANCED      // Default: best score × cost balance
  FASTEST       // Lowest latency tool first
  CHEAPEST      // Lowest cost tool first
  MOST_ACCURATE // Highest benchmark relevance first
  MANUAL        // Only use priorityTools, no auto-routing
}
```

Then add the relation to the existing `Agent` model. Find this line in the Agent model:
```
  submissions     Product[]      @relation("submissions")
```
And add after it:
```
  developerAccount DeveloperAccount? @relation("developerAccount")
```

After editing, run:
```bash
npx prisma db push
```

---

## Task 2: Router SDK Core Library

**File: `src/lib/router/sdk.ts`** (NEW)

```typescript
/**
 * Router SDK — Developer account management, strategy-based routing, usage tracking.
 * Extends the existing router core (./index.ts) without modifying it.
 */

import { prisma } from '@/lib/prisma';
import { routeRequest, type RouterRequest, type RouterResponse } from './index';

type RouterStrategy = 'BALANCED' | 'FASTEST' | 'CHEAPEST' | 'MOST_ACCURATE' | 'MANUAL';
type RouterPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

const PLAN_LIMITS: Record<RouterPlan, number> = {
  FREE: 100,
  STARTER: 1000,
  PRO: 10000,
  ENTERPRISE: 1_000_000,
};

/**
 * Get or create a DeveloperAccount for an agent.
 */
export async function ensureDeveloperAccount(agentId: string) {
  let account = await prisma.developerAccount.findUnique({
    where: { agentId },
  });

  if (!account) {
    account = await prisma.developerAccount.create({
      data: { agentId },
    });
  }

  return account;
}

/**
 * Check daily usage against plan limits.
 * Returns { allowed: boolean, remaining: number, limit: number }.
 */
export async function checkUsageLimit(developerId: string, plan: RouterPlan) {
  const limit = PLAN_LIMITS[plan];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.routerCall.count({
    where: {
      developerId,
      createdAt: { gte: todayStart },
    },
  });

  return {
    allowed: todayCount < limit,
    remaining: Math.max(0, limit - todayCount),
    limit,
    used: todayCount,
  };
}

/**
 * Apply strategy to modify which tool is selected.
 * Returns a modified RouterRequest with the best tool for the strategy.
 */
export async function applyStrategy(
  capability: string,
  request: RouterRequest,
  account: {
    strategy: RouterStrategy;
    priorityTools: string[];
    excludedTools: string[];
    fallbackEnabled: boolean;
    maxFallbacks: number;
    latencyBudgetMs: number | null;
  },
): Promise<RouterRequest> {
  const modified = { ...request };

  // If MANUAL strategy and priorityTools set, force the first priority tool
  if (account.strategy === 'MANUAL' && account.priorityTools.length > 0) {
    if (!modified.tool) {
      modified.tool = account.priorityTools[0];
    }
    // Set fallback to remaining priority tools
    if (account.fallbackEnabled) {
      modified.fallback = account.priorityTools.slice(1, account.maxFallbacks + 1);
    }
    return modified;
  }

  // For other strategies, use ranking-based selection
  if (!modified.tool) {
    const best = await getBestToolForStrategy(capability, account.strategy, account.excludedTools);
    if (best) modified.tool = best;
  }

  // Add priority tools as fallback
  if (account.fallbackEnabled && !modified.fallback?.length) {
    const fallbacks = account.priorityTools
      .filter(t => t !== modified.tool && !account.excludedTools.includes(t))
      .slice(0, account.maxFallbacks);
    if (fallbacks.length > 0) modified.fallback = fallbacks;
  }

  return modified;
}

/**
 * Find best tool based on strategy.
 */
async function getBestToolForStrategy(
  capability: string,
  strategy: RouterStrategy,
  exclude: string[],
): Promise<string | null> {
  // Map capability to category
  const CAPABILITY_TO_CATEGORY: Record<string, string> = {
    search: 'search_research', crawl: 'web_crawling', embed: 'storage_memory',
    finance: 'finance_data', code: 'code_compute', storage: 'storage_memory',
    communication: 'communication', payments: 'payments_commerce',
    auth: 'auth_identity', scheduling: 'scheduling', ai: 'ai_models',
    observability: 'observability',
  };

  const category = CAPABILITY_TO_CATEGORY[capability];
  if (!category) return null;

  // Choose ordering based on strategy
  let orderBy: Record<string, string>;
  switch (strategy) {
    case 'FASTEST':
      orderBy = { avgLatencyMs: 'asc' };
      break;
    case 'CHEAPEST':
      orderBy = { avgCostUsd: 'asc' };
      break;
    case 'MOST_ACCURATE':
      orderBy = { avgBenchmarkRelevance: 'desc' };
      break;
    case 'BALANCED':
    default:
      orderBy = { weightedScore: 'desc' };
      break;
  }

  const products = await prisma.product.findMany({
    where: {
      category: category as any,
      status: { in: ['APPROVED', 'SMOKE_TESTED', 'BENCHMARKED', 'LIVE_TELEMETRY'] },
      ...(exclude.length ? { slug: { notIn: exclude } } : {}),
    },
    orderBy: orderBy as any,
    select: { slug: true },
    take: 1,
  });

  return products[0]?.slug ?? null;
}

/**
 * Record a RouterCall after routing completes.
 */
export async function recordRouterCall(
  developerId: string,
  capability: string,
  query: string,
  request: RouterRequest,
  response: RouterResponse,
  strategyUsed: RouterStrategy,
  byokUsed: boolean,
  fallbackChain: string[],
) {
  const call = await prisma.routerCall.create({
    data: {
      developerId,
      capability,
      query,
      toolRequested: request.tool ?? null,
      toolUsed: response.meta.tool_used,
      fallbackUsed: response.meta.fallback_used,
      fallbackFrom: response.meta.fallback_from ?? null,
      fallbackChain,
      statusCode: 200, // If we got a response, the proxy call succeeded
      latencyMs: response.meta.latency_ms,
      resultCount: null,
      costUsd: 0,
      success: true,
      strategyUsed,
      byokUsed,
      traceId: response.meta.trace_id,
    },
  });

  // Update developer account stats (fire-and-forget)
  prisma.developerAccount.update({
    where: { id: developerId },
    data: {
      totalCalls: { increment: 1 },
      totalFallbacks: response.meta.fallback_used ? { increment: 1 } : undefined,
    },
  }).catch(() => {});

  return call;
}

/**
 * Get usage stats for a developer account.
 */
export async function getUsageStats(developerId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const calls = await prisma.routerCall.findMany({
    where: { developerId, createdAt: { gte: since } },
    select: {
      capability: true,
      toolUsed: true,
      latencyMs: true,
      costUsd: true,
      success: true,
      fallbackUsed: true,
      createdAt: true,
    },
  });

  const totalCalls = calls.length;
  const successCalls = calls.filter(c => c.success).length;
  const fallbackCalls = calls.filter(c => c.fallbackUsed).length;
  const avgLatency = totalCalls > 0
    ? Math.round(calls.reduce((sum, c) => sum + c.latencyMs, 0) / totalCalls)
    : 0;
  const totalCost = calls.reduce((sum, c) => sum + c.costUsd, 0);

  // Group by capability
  const byCapability: Record<string, { calls: number; avgLatency: number; successRate: number }> = {};
  const capGroups = new Map<string, typeof calls>();
  for (const c of calls) {
    const group = capGroups.get(c.capability) ?? [];
    group.push(c);
    capGroups.set(c.capability, group);
  }
  for (const [cap, group] of capGroups) {
    byCapability[cap] = {
      calls: group.length,
      avgLatency: Math.round(group.reduce((s, c) => s + c.latencyMs, 0) / group.length),
      successRate: group.filter(c => c.success).length / group.length,
    };
  }

  // Group by tool
  const byTool: Record<string, { calls: number; avgLatency: number }> = {};
  const toolGroups = new Map<string, typeof calls>();
  for (const c of calls) {
    const group = toolGroups.get(c.toolUsed) ?? [];
    group.push(c);
    toolGroups.set(c.toolUsed, group);
  }
  for (const [tool, group] of toolGroups) {
    byTool[tool] = {
      calls: group.length,
      avgLatency: Math.round(group.reduce((s, c) => s + c.latencyMs, 0) / group.length),
    };
  }

  return {
    period: { days, since: since.toISOString() },
    totalCalls,
    successRate: totalCalls > 0 ? successCalls / totalCalls : 0,
    fallbackRate: totalCalls > 0 ? fallbackCalls / totalCalls : 0,
    avgLatencyMs: avgLatency,
    totalCostUsd: Math.round(totalCost * 100) / 100,
    byCapability,
    byTool,
  };
}

/**
 * Get fallback analytics.
 */
export async function getFallbackStats(developerId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const fallbackCalls = await prisma.routerCall.findMany({
    where: {
      developerId,
      fallbackUsed: true,
      createdAt: { gte: since },
    },
    select: {
      fallbackFrom: true,
      toolUsed: true,
      capability: true,
      latencyMs: true,
      createdAt: true,
    },
  });

  // Count fallback triggers by original tool
  const triggers: Record<string, number> = {};
  const recoveries: Record<string, number> = {};
  for (const c of fallbackCalls) {
    if (c.fallbackFrom) {
      triggers[c.fallbackFrom] = (triggers[c.fallbackFrom] ?? 0) + 1;
    }
    recoveries[c.toolUsed] = (recoveries[c.toolUsed] ?? 0) + 1;
  }

  return {
    period: { days, since: since.toISOString() },
    totalFallbacks: fallbackCalls.length,
    triggersByTool: triggers,
    recoveriesByTool: recoveries,
  };
}
```

---

## Task 3: Enhanced Router Handler with SDK Integration

**File: `src/lib/router/sdk-handler.ts`** (NEW)

```typescript
/**
 * Enhanced route handler that integrates DeveloperAccount, strategy, and usage tracking.
 * Used by the new /api/v1/router/* endpoints.
 */

import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { apiError } from '@/types';
import { routeRequest } from './index';
import type { RouterRequest } from './index';
import {
  ensureDeveloperAccount,
  checkUsageLimit,
  applyStrategy,
  recordRouterCall,
} from './sdk';

// Create a router-specific limiter
import { createLimiter } from '@/lib/rate-limit';

export async function handleSdkRouteRequest(request: NextRequest, capability: string) {
  // 1. Authenticate
  const agent = await authenticateAgent(request);
  if (!agent) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  // 2. Get/create developer account
  const account = await ensureDeveloperAccount(agent.id);

  // 3. Check plan usage limits
  const usage = await checkUsageLimit(account.id, account.plan as any);
  if (!usage.allowed) {
    return apiError('USAGE_LIMIT', `Daily limit reached (${usage.limit} calls). Upgrade plan for more.`, 429, {
      details: { plan: account.plan, limit: usage.limit, used: usage.used },
    });
  }

  // 4. Parse body (POST) or query params (GET)
  let body: RouterRequest;
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const params: Record<string, unknown> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (!['tool', 'tool_api_key', 'token', 'fallback', 'strategy'].includes(key)) {
        params[key] = value;
      }
    }
    const fallbackParam = url.searchParams.get('fallback');
    body = {
      tool: url.searchParams.get('tool') ?? undefined,
      tool_api_key: url.searchParams.get('tool_api_key') ?? undefined,
      params,
      fallback: fallbackParam ? fallbackParam.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    };
  } else {
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
    }
  }

  if (!body.params || typeof body.params !== 'object') {
    return apiError('VALIDATION_ERROR', 'params object is required.', 400);
  }

  // 5. Apply strategy
  const modifiedRequest = await applyStrategy(capability, body, account as any);

  // 6. Route the request (reuse existing core)
  const triedTools: string[] = [];
  if (modifiedRequest.tool) triedTools.push(modifiedRequest.tool);

  try {
    const { response, headers: extraHeaders } = await routeRequest(agent.id, capability, modifiedRequest);

    // 7. Record the call
    const query = extractQueryFromParams(body.params);
    await recordRouterCall(
      account.id,
      capability,
      query,
      body,
      response,
      account.strategy as any,
      !!body.tool_api_key,
      triedTools,
    ).catch(() => {}); // fire-and-forget

    // 8. Return response with SDK metadata
    const enrichedResponse = {
      ...response,
      meta: {
        ...response.meta,
        strategy: account.strategy,
        plan: account.plan,
        calls_remaining: usage.remaining - 1,
      },
    };

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-AgentPick-Plan': account.plan,
      'X-AgentPick-Remaining': String(usage.remaining - 1),
    };
    if (extraHeaders) Object.assign(responseHeaders, extraHeaders);

    return new Response(JSON.stringify(enrichedResponse), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Router error';
    return apiError('ROUTER_ERROR', message, 502);
  }
}

function extractQueryFromParams(params: Record<string, unknown>): string {
  for (const key of ['query', 'q', 'text', 'input', 'url', 'ticker', 'symbol']) {
    if (typeof params[key] === 'string') return params[key] as string;
  }
  for (const val of Object.values(params)) {
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return '';
}
```

**IMPORTANT**: You need to export `createLimiter` from `src/lib/rate-limit.ts`. Add `export` before the existing `function createLimiter` declaration:
```typescript
// Change this:
function createLimiter(limit: number, window: string, prefix: string) {
// To this:
export function createLimiter(limit: number, window: string, prefix: string) {
```

Also add this limiter to `src/lib/rate-limit.ts`:
```typescript
export const routerSdkLimiter = createLimiter(200, '1m', 'agentpick:router-sdk');
```

---

## Task 4: API Endpoints

### 4A. SDK Router Endpoints (per-capability)

**File: `src/app/api/v1/router/[capability]/route.ts`** (NEW)

```typescript
import { NextRequest } from 'next/server';
import { handleSdkRouteRequest } from '@/lib/router/sdk-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ capability: string }> },
) {
  const { capability } = await params;
  return handleSdkRouteRequest(request, capability);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ capability: string }> },
) {
  const { capability } = await params;
  return handleSdkRouteRequest(request, capability);
}
```

### 4B. Developer Account + Strategy Management

**File: `src/app/api/v1/router/account/route.ts`** (NEW)

```typescript
import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { apiError } from '@/types';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { prisma } from '@/lib/prisma';

/** GET — view developer account */
export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);
  return Response.json({
    account: {
      id: account.id,
      plan: account.plan,
      strategy: account.strategy,
      priorityTools: account.priorityTools,
      excludedTools: account.excludedTools,
      fallbackEnabled: account.fallbackEnabled,
      maxFallbacks: account.maxFallbacks,
      latencyBudgetMs: account.latencyBudgetMs,
      monthlyBudgetUsd: account.monthlyBudgetUsd,
      spentThisMonth: account.spentThisMonth,
      totalCalls: account.totalCalls,
      totalFallbacks: account.totalFallbacks,
    },
  });
}

/** PATCH — update strategy/preferences */
export async function PATCH(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  const VALID_STRATEGIES = ['BALANCED', 'FASTEST', 'CHEAPEST', 'MOST_ACCURATE', 'MANUAL'];

  const update: Record<string, unknown> = {};
  if (body.strategy && typeof body.strategy === 'string') {
    if (!VALID_STRATEGIES.includes(body.strategy)) {
      return apiError('VALIDATION_ERROR', `strategy must be one of: ${VALID_STRATEGIES.join(', ')}`, 400);
    }
    update.strategy = body.strategy;
  }
  if (Array.isArray(body.priority_tools)) {
    update.priorityTools = body.priority_tools.filter((t: unknown) => typeof t === 'string');
  }
  if (Array.isArray(body.excluded_tools)) {
    update.excludedTools = body.excluded_tools.filter((t: unknown) => typeof t === 'string');
  }
  if (typeof body.fallback_enabled === 'boolean') {
    update.fallbackEnabled = body.fallback_enabled;
  }
  if (typeof body.max_fallbacks === 'number') {
    update.maxFallbacks = Math.min(Math.max(body.max_fallbacks, 0), 5);
  }
  if (typeof body.latency_budget_ms === 'number' || body.latency_budget_ms === null) {
    update.latencyBudgetMs = body.latency_budget_ms;
  }
  if (typeof body.monthly_budget_usd === 'number' || body.monthly_budget_usd === null) {
    update.monthlyBudgetUsd = body.monthly_budget_usd;
  }

  if (Object.keys(update).length === 0) {
    return apiError('VALIDATION_ERROR', 'No valid fields to update.', 400);
  }

  const updated = await prisma.developerAccount.update({
    where: { id: account.id },
    data: update,
  });

  return Response.json({
    message: 'Account updated.',
    account: {
      strategy: updated.strategy,
      priorityTools: updated.priorityTools,
      excludedTools: updated.excludedTools,
      fallbackEnabled: updated.fallbackEnabled,
      maxFallbacks: updated.maxFallbacks,
      latencyBudgetMs: updated.latencyBudgetMs,
      monthlyBudgetUsd: updated.monthlyBudgetUsd,
    },
  });
}
```

### 4C. Usage & Monitoring Endpoints

**File: `src/app/api/v1/router/usage/route.ts`** (NEW)

```typescript
import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { apiError } from '@/types';
import { ensureDeveloperAccount, getUsageStats, checkUsageLimit } from '@/lib/router/sdk';

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get('days') ?? '7', 10), 90);

  const [stats, limits] = await Promise.all([
    getUsageStats(account.id, days),
    checkUsageLimit(account.id, account.plan as any),
  ]);

  return Response.json({
    plan: account.plan,
    daily_limit: limits.limit,
    daily_used: limits.used,
    daily_remaining: limits.remaining,
    stats,
  });
}
```

**File: `src/app/api/v1/router/fallbacks/route.ts`** (NEW)

```typescript
import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { apiError } from '@/types';
import { ensureDeveloperAccount, getFallbackStats } from '@/lib/router/sdk';

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get('days') ?? '30', 10), 90);

  const stats = await getFallbackStats(account.id, days);
  return Response.json(stats);
}
```

**File: `src/app/api/v1/router/health/route.ts`** (NEW)

```typescript
import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { apiError } from '@/types';
import { prisma } from '@/lib/prisma';
import { ensureDeveloperAccount } from '@/lib/router/sdk';

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);

  // Get recent calls to determine health
  const since = new Date();
  since.setHours(since.getHours() - 1);

  const recentCalls = await prisma.routerCall.findMany({
    where: { developerId: account.id, createdAt: { gte: since } },
    select: { success: true, latencyMs: true, toolUsed: true, fallbackUsed: true },
  });

  const total = recentCalls.length;
  const successCount = recentCalls.filter(c => c.success).length;
  const fallbackCount = recentCalls.filter(c => c.fallbackUsed).length;
  const avgLatency = total > 0
    ? Math.round(recentCalls.reduce((s, c) => s + c.latencyMs, 0) / total)
    : 0;

  const successRate = total > 0 ? successCount / total : 1;
  let status: 'healthy' | 'degraded' | 'down';
  if (total === 0) status = 'healthy'; // No calls = assume OK
  else if (successRate >= 0.95) status = 'healthy';
  else if (successRate >= 0.7) status = 'degraded';
  else status = 'down';

  return Response.json({
    status,
    lastHour: {
      totalCalls: total,
      successRate: Math.round(successRate * 100) / 100,
      fallbackRate: total > 0 ? Math.round((fallbackCount / total) * 100) / 100 : 0,
      avgLatencyMs: avgLatency,
    },
    strategy: account.strategy,
    plan: account.plan,
  });
}
```

### 4D. Strategy Comparison Endpoint

**File: `src/app/api/v1/router/compare-strategies/route.ts`** (NEW)

```typescript
import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { apiError } from '@/types';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/router/compare-strategies?capability=search
 * Shows how each strategy would perform based on current product rankings.
 */
export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const url = new URL(request.url);
  const capability = url.searchParams.get('capability') ?? 'search';

  const CAPABILITY_TO_CATEGORY: Record<string, string> = {
    search: 'search_research', crawl: 'web_crawling', embed: 'storage_memory',
    finance: 'finance_data',
  };

  const category = CAPABILITY_TO_CATEGORY[capability];
  if (!category) {
    return apiError('VALIDATION_ERROR', `Unknown capability: ${capability}`, 400);
  }

  const products = await prisma.product.findMany({
    where: {
      category: category as any,
      status: { in: ['APPROVED', 'SMOKE_TESTED', 'BENCHMARKED', 'LIVE_TELEMETRY'] },
    },
    select: {
      slug: true,
      name: true,
      weightedScore: true,
      avgLatencyMs: true,
      avgCostUsd: true,
      avgBenchmarkRelevance: true,
      successRate: true,
    },
    take: 10,
  });

  const strategies = {
    BALANCED: [...products].sort((a, b) => (b.weightedScore ?? 0) - (a.weightedScore ?? 0)),
    FASTEST: [...products].sort((a, b) => (a.avgLatencyMs ?? 9999) - (b.avgLatencyMs ?? 9999)),
    CHEAPEST: [...products].sort((a, b) => (a.avgCostUsd ?? 9999) - (b.avgCostUsd ?? 9999)),
    MOST_ACCURATE: [...products].sort((a, b) => (b.avgBenchmarkRelevance ?? 0) - (a.avgBenchmarkRelevance ?? 0)),
  };

  const result: Record<string, { top_pick: string; top_3: Array<{ slug: string; name: string; score?: number; latency?: number; cost?: number; relevance?: number }> }> = {};

  for (const [strategy, sorted] of Object.entries(strategies)) {
    result[strategy] = {
      top_pick: sorted[0]?.slug ?? 'none',
      top_3: sorted.slice(0, 3).map(p => ({
        slug: p.slug,
        name: p.name,
        score: p.weightedScore,
        latency: p.avgLatencyMs ?? undefined,
        cost: p.avgCostUsd ?? undefined,
        relevance: p.avgBenchmarkRelevance ?? undefined,
      })),
    };
  }

  return Response.json({
    capability,
    category,
    strategies: result,
    recommendation: 'Use BALANCED for general use. Switch to FASTEST for real-time apps, CHEAPEST for batch jobs, MOST_ACCURATE for research.',
  });
}
```

---

## Task 5: OpenClaw Skill File for Router Mode

**File: `src/app/api/v1/router/skill.md/route.ts`** (NEW)

```typescript
import { NextRequest } from 'next/server';

const SKILL_MD = `---
name: AgentPick Router SDK
description: Route API calls through AgentPick with auto-fallback, strategy-based tool selection, and usage tracking.
version: 1.0.0
---

# AgentPick Router SDK

Route your API calls through AgentPick. Get auto-fallback, strategy-based tool selection, and usage monitoring.

## Quick Start

### 1. Register & Get API Key
\`\`\`
POST https://agentpick.dev/api/v1/agents/register
Content-Type: application/json

{"name": "my-agent", "model_family": "claude"}
\`\`\`
Response includes your \`api_key\` (starts with \`ah_live_sk_\`).

### 2. Route a Search Request
\`\`\`
POST https://agentpick.dev/api/v1/router/search
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "params": { "query": "latest AI research papers 2026" }
}
\`\`\`

AgentPick picks the best search tool based on your strategy, calls it, and returns results with metadata.

### 3. Route with BYOK (Bring Your Own Key)
\`\`\`
POST https://agentpick.dev/api/v1/router/search
Authorization: Bearer YOUR_API_KEY

{
  "tool": "tavily",
  "tool_api_key": "tvly-YOUR_KEY",
  "params": { "query": "quantum computing breakthroughs" }
}
\`\`\`

Your tool API key is used in-memory only and NEVER stored or logged.

## Capabilities

| Capability | Endpoint | Tools Available |
|-----------|----------|----------------|
| search | \`/router/search\` | tavily, exa-search, serpapi, brave-search, perplexity-search, you-search, jina-ai, bing-web-search |
| crawl | \`/router/crawl\` | firecrawl, apify, scrapingbee, browserbase |
| embed | \`/router/embed\` | openai-embed, cohere-embed, voyage-embed, jina-embed |
| finance | \`/router/finance\` | polygon-io, alpha-vantage, financial-modeling-prep |

Or use the dynamic endpoint: \`/router/{capability}\`

## Strategies

Configure how AgentPick picks tools:

| Strategy | Description |
|----------|-------------|
| BALANCED | Best overall score (default) |
| FASTEST | Lowest latency tool |
| CHEAPEST | Lowest cost tool |
| MOST_ACCURATE | Highest benchmark relevance |
| MANUAL | Only use your priority_tools list |

### Set Strategy
\`\`\`
PATCH https://agentpick.dev/api/v1/router/account
Authorization: Bearer YOUR_API_KEY

{
  "strategy": "FASTEST",
  "priority_tools": ["tavily", "exa-search"],
  "excluded_tools": ["serpapi"],
  "fallback_enabled": true,
  "max_fallbacks": 2
}
\`\`\`

## Monitoring

### Usage Stats
\`\`\`
GET https://agentpick.dev/api/v1/router/usage?days=7
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Health Check
\`\`\`
GET https://agentpick.dev/api/v1/router/health
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Fallback Analytics
\`\`\`
GET https://agentpick.dev/api/v1/router/fallbacks?days=30
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Compare Strategies
\`\`\`
GET https://agentpick.dev/api/v1/router/compare-strategies?capability=search
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Auto-Fallback

When a tool fails (5xx, 429, timeout), AgentPick automatically:
1. Tries your \`priority_tools\` list
2. Falls back to the next-ranked tool in that category
3. Records all attempts for your fallback analytics

Response includes \`meta.fallback_used\` and \`meta.fallback_from\` so you know when fallback happened.

## Plans

| Plan | Daily Limit | BYOK | Features |
|------|-------------|------|----------|
| FREE | 100 calls | No | Basic routing + fallback |
| STARTER | 1,000 calls | Yes | Strategy config |
| PRO | 10,000 calls | Yes | Priority routing + analytics |
| ENTERPRISE | Unlimited | Yes | SLA + dedicated support |

## Response Format
\`\`\`json
{
  "data": { ... },
  "meta": {
    "tool_used": "tavily",
    "latency_ms": 342,
    "fallback_used": false,
    "trace_id": "clx...",
    "strategy": "BALANCED",
    "plan": "FREE",
    "calls_remaining": 87
  }
}
\`\`\`
`;

export async function GET(_request: NextRequest) {
  return new Response(SKILL_MD, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

---

## Task 6: Rate Limiter Export Fix

**File: `src/lib/rate-limit.ts`**

Make ONE change: export the `createLimiter` function by changing `function createLimiter` to `export function createLimiter`. Then add:

```typescript
export const routerSdkLimiter = createLimiter(200, '1m', 'agentpick:router-sdk');
```

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | MODIFY | Add DeveloperAccount, RouterCall models, RouterPlan/RouterStrategy enums, Agent relation |
| `src/lib/rate-limit.ts` | MODIFY | Export createLimiter, add routerSdkLimiter |
| `src/lib/router/sdk.ts` | CREATE | SDK core: account management, strategy, usage tracking, fallback stats |
| `src/lib/router/sdk-handler.ts` | CREATE | Enhanced route handler with SDK integration |
| `src/app/api/v1/router/[capability]/route.ts` | CREATE | Dynamic SDK router endpoint |
| `src/app/api/v1/router/account/route.ts` | CREATE | GET/PATCH developer account + strategy |
| `src/app/api/v1/router/usage/route.ts` | CREATE | Usage monitoring endpoint |
| `src/app/api/v1/router/fallbacks/route.ts` | CREATE | Fallback analytics endpoint |
| `src/app/api/v1/router/health/route.ts` | CREATE | Health check endpoint |
| `src/app/api/v1/router/compare-strategies/route.ts` | CREATE | Strategy comparison endpoint |
| `src/app/api/v1/router/skill.md/route.ts` | CREATE | OpenClaw skill file for router mode |

## DO NOT MODIFY These Files
- `src/lib/router/index.ts` — Existing router core (extend, don't change)
- `src/lib/router/handler.ts` — Existing handler (old /route/* endpoints keep working)
- `src/app/api/v1/route/**` — Existing route endpoints (backward compatible)
- `src/lib/benchmark/adapters/**` — Existing adapters

## Verification Steps

After all files are created:

1. Run `npx prisma db push` — should succeed with no errors
2. Run `npx prisma generate` — regenerates client with new models
3. Run `npm run build` — should compile with zero TypeScript errors
4. Test flow:
   ```bash
   # Register agent
   curl -s -X POST https://agentpick.dev/api/v1/agents/register \
     -H 'Content-Type: application/json' \
     -d '{"name":"test-router-sdk"}' | jq .api_key

   # View account
   curl -s https://agentpick.dev/api/v1/router/account \
     -H 'Authorization: Bearer YOUR_KEY' | jq .

   # Set strategy
   curl -s -X PATCH https://agentpick.dev/api/v1/router/account \
     -H 'Authorization: Bearer YOUR_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"strategy":"FASTEST"}' | jq .

   # Route a search
   curl -s -X POST https://agentpick.dev/api/v1/router/search \
     -H 'Authorization: Bearer YOUR_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"params":{"query":"test"}}' | jq .meta

   # Check usage
   curl -s https://agentpick.dev/api/v1/router/usage?days=1 \
     -H 'Authorization: Bearer YOUR_KEY' | jq .

   # Health check
   curl -s https://agentpick.dev/api/v1/router/health \
     -H 'Authorization: Bearer YOUR_KEY' | jq .
   ```
