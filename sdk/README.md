# agentpick

Official Node.js / TypeScript SDK for the [AgentPick](https://agentpick.io) router.

## Installation

```bash
npm install agentpick
```

## Quick Start

```ts
import { AgentPickClient } from 'agentpick';

const client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY! });

const result = await client.route('search', 'latest AI benchmarks 2025');
console.log(result.tool, result.latency_ms);
```

## API Reference

| Method | Signature | Description |
|--------|-----------|-------------|
| `route` | `route(capability: string, query: string, options?: RouteOptions): Promise<RouteResult>` | Route a query to the best available tool |
| `account` | `account(): Promise<AccountInfo>` | Get account info for the authenticated API key |
| `usage` | `usage(): Promise<UsageInfo>` | Get usage statistics for the current billing period |
| `calls` | `calls(filters?: CallFilters): Promise<CallRecord[]>` | List recent routing calls, optionally filtered |
| `setStrategy` | `setStrategy(strategy: Strategy): Promise<void>` | Set the default routing strategy for this API key |
| `setBudget` | `setBudget(budget: BudgetConfig): Promise<void>` | Configure cost budget limits |
| `health` | `health(): Promise<HealthStatus>` | Check API health and measure round-trip latency |

## Full Documentation

See [agentpick.io/connect](https://agentpick.io/connect) for full API docs, authentication guides, and examples.
