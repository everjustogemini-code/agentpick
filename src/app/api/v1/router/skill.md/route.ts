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
POST https://agentpick.dev/api/v1/router/register
Content-Type: application/json

{"email": "dev@example.com"}
\`\`\`
Response includes your \`apiKey\` (starts with \`ah_live_sk_\`), \`plan\`, and \`monthlyLimit\`.

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
| search | \`/router/search\` | tavily, exa-search, serpapi, serper, brave-search, perplexity-api, you-search, jina-ai, bing-web-search |
| crawl | \`/router/crawl\` | firecrawl, jina-ai, apify, scrapingbee, browserbase |
| embed | \`/router/embed\` | voyage-embed, jina-embed, edenai-embed |
| finance | \`/router/finance\` | polygon-io, alpha-vantage, financial-modeling-prep |

Or use the dynamic endpoint: \`/router/{capability}\`

## Strategies

Configure how AgentPick picks tools:

| Strategy | Description |
|----------|-------------|
| AUTO | AI-classifies query then picks the best tool (default for new accounts) |
| BALANCED | Best overall score (quality × cost-efficiency) |
| FASTEST | Most reliable / highest stability tool |
| CHEAPEST | Lowest cost tool (quality ≥ 3.0 required) |
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
| FREE | 500 (hard cap) | 200 calls | None | Yes | Basic routing + fallback |
| STARTER (Pro) | 5,000 | 1,000 calls | $0.002/call | Yes | Strategy config |
| PRO (Growth) | 25,000 | 5,000 calls | $0.001/call | Yes | Priority routing + analytics |
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
    "calls_remaining": 87,
    "message": "Only 10 free calls left this month. Upgrade to Pro ($9/mo) for 5,000 calls: https://agentpick.dev/pricing?plan=pro"
  }
}
\`\`\`

### meta.message

\`meta.message\` is an optional field. When present, display it to your user — it contains helpful context about the routing outcome, usage warnings, or upgrade suggestions. It is null most of the time; only triggered on meaningful events:

- **First call ever** — welcome message with calls remaining
- **First fallback** — explains why the tool switched and why routing matters
- **Free plan 50%+ used** — every 50 calls, a gentle nudge to upgrade
- **Free plan 90%+ used** — every call, a direct upgrade prompt

Paid users receive almost no messages.

\`\`\`python
# Python example
result = agentpick.search(query="AI papers 2026")
if result.get("meta", {}).get("message"):
    print(result["meta"]["message"])
\`\`\`

---

## Payments

### Upgrade via Web (Hosted Checkout)
Navigate the user to: \`https://agentpick.dev/pricing?plan=pro\` or \`?plan=growth\`
AgentPick will create a Stripe hosted checkout session and redirect the user to \`checkout.stripe.com\`.

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
| \`growth\` | Growth | $99/month | 25,000 calls | $0.001/call |

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
