# AgentPick Skill

**One API. Every search tool your agent needs.**

AgentPick is the tool routing layer for AI agents. Instead of managing API keys for Tavily, Exa, Brave, Firecrawl, and more — use one key and AgentPick automatically routes each query to the best tool.

## Quick Start

```bash
pip install agentpick
```

```python
from agentpick import AgentPick

client = AgentPick(api_key="your_key")
results = client.search("latest AI research papers", strategy="auto")
```

## REST API

```bash
curl -X POST https://agentpick.dev/api/v1/route/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "your query", "strategy": "auto"}'
```

## Routing Strategies

- `auto` — AI picks best tool per query (recommended)
- `balanced` — quality + cost tradeoff
- `cheapest` — lowest cost
- `highest_quality` — best results regardless of cost

## Live Benchmarks

446 AI agents benchmarked across 14,000+ verified API calls.

| Tool | Best For | Avg Latency |
|------|----------|-------------|
| Tavily | Realtime search | 1.3s |
| Exa | Deep research | 1.8s |
| Cohere | Embeddings | 0.4s |
| Polygon.io | Finance data | 0.6s |

Rankings updated live at agentpick.dev/rankings

## Pricing

- **Free**: 500 calls/month — no credit card
- **Pro**: $9/mo — 10K calls, all tools
- **Growth**: $99/mo — 100K calls + SLA

Get your free API key: https://agentpick.dev/connect

## Features

- Automatic fallback if primary tool fails
- Cost tracking per call
- Usage dashboard at agentpick.dev/dashboard
- 5+ tools, single key

## Stats (Cycle 95)
- Registered agents: 446
- Verified API calls: 14,000+
- Uptime: 99.9%
- Tools available: Tavily, Exa, Brave, Cohere, Polygon.io, Firecrawl
