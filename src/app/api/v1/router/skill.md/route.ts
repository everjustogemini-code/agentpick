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

### Analytics Dashboard Feed
\`\`\`
GET https://agentpick.dev/api/v1/router/analytics?range=24h
Authorization: Bearer YOUR_API_KEY
\`\`\`

Supported ranges: \`24h\`, \`7d\`, \`30d\`

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

| Plan | Monthly Included | Daily Limit | Overage | BYOK | Features |
|------|-----------------|-------------|---------|------|----------|
| FREE | 500 (hard cap) | 100 calls | None | No | Basic routing + fallback |
| STARTER (Pro) | 5,000 | 1,000 calls | $0.002/call | Yes | Strategy config |
| PRO (Growth) | 25,000 | 5,000 calls | $0.001/call | Yes | Priority routing + analytics |
| SCALE | 100,000 | 20,000 calls | $0.0008/call | Yes | High-volume + multi-team |
| ENTERPRISE | Unlimited | Unlimited | Custom | Yes | SLA + dedicated support |

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

---

## Payments

### Upgrade via Web (Embedded Checkout)
Navigate the user to: \`https://agentpick.dev/checkout?plan=pro\`, \`?plan=growth\`, or \`?plan=scale\`
The user pays without leaving agentpick.dev using Stripe Embedded Checkout.

### Upgrade via Telegram (In-Chat Payment)

Send a native Telegram invoice so the user can upgrade without leaving the chat:

\`\`\`
POST https://agentpick.dev/api/v1/payments/telegram-invoice
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "plan": "pro",
  "telegram_chat_id": "123456789"
}
\`\`\`

Telegram will display a payment card in the chat. The user taps "Pay" and completes the Stripe payment inside Telegram. No browser redirect required.

**Plans:**
| plan | Label | Price | Included | Overage |
|------|-------|-------|----------|---------|
| \`pro\` | Pro | $9/month | 5,000 calls | $0.002/call |
| \`growth\` | Growth | $29/month | 25,000 calls | $0.001/call |
| \`scale\` | Scale | $79/month | 100,000 calls | $0.0008/call |

**Response:**
\`\`\`json
{
  "ok": true,
  "message_id": 42,
  "plan": "pro",
  "planLabel": "Pro",
  "chatId": "123456789"
}
\`\`\`

### Telegram Webhook (internal)
Register your bot webhook to: \`https://agentpick.dev/api/v1/payments/telegram-webhook\`
This handles \`pre_checkout_query\` (auto-approves) and \`successful_payment\` (upgrades plan).
\`\`\`
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://agentpick.dev/api/v1/payments/telegram-webhook
\`\`\`
`;

export async function GET() {
  return new Response(SKILL_MD, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
