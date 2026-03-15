# agentpick

Official Node.js / TypeScript SDK for the [AgentPick](https://agentpick.dev) router.

## Installation

```bash
npm install agentpick
```

## Quick Start

```ts
import { AgentPickClient } from 'agentpick';

const client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY });
const result = await client.route('search', 'latest AI benchmarks 2026');
console.log(result.tool, result.latency_ms);
```

## Methods

| Method | Description |
|--------|-------------|
| `route(capability, query, options?)` | Route a query to the best tool |
| `account()` | Get account info |
| `usage()` | Get usage stats |
| `calls(filters?)` | List recent calls |
| `setStrategy(strategy)` | Set default routing strategy |
| `setBudget(config)` | Set monthly cost budget |
| `health()` | Check API health |

## Full Documentation

See [agentpick.dev/connect](https://agentpick.dev/connect) for full API docs, authentication guides, and examples.
