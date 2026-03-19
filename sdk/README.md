# agentpick

Official Node.js / TypeScript SDK for [AgentPick](https://agentpick.dev) — one key, every tool, AI-powered routing.

## Install

```bash
npm install agentpick
```

## Quick Start

```ts
import { AgentPickClient } from 'agentpick';

const client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY! });

const result = await client.route('search', 'latest AI benchmarks 2026');
console.log(result.tool, result.latency_ms);
```

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `route` | `route(capability: string, query: string, options?: RouteOptions): Promise<RouteResult>` | Route a query to the best available tool |
| `account` | `account(): Promise<AccountInfo>` | Get account info for the authenticated API key |
| `usage` | `usage(): Promise<UsageInfo>` | Get usage stats for current billing period |
| `calls` | `calls(filters?: CallFilters): Promise<CallRecord[]>` | List recent routing calls, optionally filtered |
| `setStrategy` | `setStrategy(strategy: Strategy): Promise<void>` | Set the default routing strategy for this API key |
| `setBudget` | `setBudget(budget: BudgetConfig): Promise<void>` | Configure cost budget limits |
| `health` | `health(): Promise<HealthStatus>` | Check API health |

## Auto-Retry

The SDK automatically retries failed requests on 5xx errors (up to 2 retries, max 3 attempts total). Backoff delays: 200ms after the first failure, 400ms after the second. 4xx errors are never retried.

## Types

```ts
type Strategy = 'MOST_ACCURATE' | 'FASTEST' | 'CHEAPEST' | 'BALANCED' | 'auto';

interface RouteOptions {
  strategy?: Strategy;
  budget?: number;
  tools?: string[];
}

interface RouteResult {
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

interface CallFilters {
  capability?: string;
  strategy?: Strategy;
  tool?: string;
  from?: string;   // ISO date
  to?: string;     // ISO date
  limit?: number;
}

interface BudgetConfig {
  max_cost_per_call?: number;
  max_cost_per_day?: number;
}
```

See [agentpick.dev/quickstart](https://agentpick.dev/quickstart) for a full walkthrough.

## License

MIT
