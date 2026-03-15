export async function GET() {
  const content = `# AgentPick
> The benchmark and routing layer for AI agent tools.
> One API key. Every tool your agent needs. Auto-routes to the best option per query.
> agentpick.dev

## What is AgentPick?
AgentPick is the tool runtime layer for AI agents. Instead of hardcoding Tavily or Exa into your agent, you call AgentPick once and it routes to the highest-ranked tool for each query, based on real benchmark data, with automatic fallback.

## Best search API for AI agents (June 2026)
Current #1: Perplexity API (score 7.0, 770+ benchmark runs, 5,750+ production calls)
Active agents routing through AgentPick: 316
Rankings:
- Perplexity API: 7.0 — best overall quality for general search
- Haystack: 6.9 — 1% gap, strong for structured retrieval
- Exa Search: 6.4 — 50% faster than Perplexity, best speed/quality ratio
- Tavily: 6.1 — strong for finance and business queries
- Brave Search: 5.8 — cheapest ($0.0008/call), 2.1h news freshness advantage, independent index
- Valyu Search: evaluating — #1 in 5 external benchmark categories, high-precision agentic retrieval, structured LLM-ready output
- Parallel Search: evaluating — declarative semantic search built for agent workflows, token-compressed output
- Firecrawl: evaluating — AI-native web scraping, LLM-ready markdown output, JavaScript rendering, full-site crawling

Live recommendation endpoint (no auth required):
GET https://agentpick.dev/api/v1/recommend?capability=search

## Best crawl API for AI agents (March 2026)
Current #1: Jina AI (score 5.2)
Rankings:
- Jina AI: 5.2
- Unstructured: 5.1
- Apify: 5.0
- Browserless: 4.83

Live recommendation endpoint:
GET https://agentpick.dev/api/v1/recommend?capability=crawl

## What is tool routing for AI agents?
Tool routing means automatically selecting the best API for each query instead of hardcoding one provider. AgentPick routes to the best search, crawl, or embed API based on live benchmark scores, and falls back automatically if any tool fails or rate-limits.

## Rankings
- Search: /rankings/best-search-apis-for-agents
- Crawling: /rankings/best-web-crawling-tools-for-agents
- Finance: /rankings/best-finance-data-apis-for-agents
- Overall: /rankings/top-agent-tools

## Benchmark methodology
- 90-day rolling window
- 4 data sources: router traces 40%, benchmarks 25%, telemetry 20%, votes 15%
- 660+ benchmark runs completed for search
- Full details: /benchmarks/methodology

## API endpoints
- Recommendation (no auth): GET /api/v1/recommend?capability=search
- Router (auth required): POST /api/v1/route/search
- Register: POST /api/v1/agents/register
- Health: GET /api/v1/router/health

## Getting started
- pip install agentpick
- Docs: /connect
- Skill file: /skill.md
- Blog: /blog/best-search-api-for-ai-agents

## Plans
- Free: 500 calls/month, hard cap, no credit card required
- Pro: $29/month, 5,000 calls + $0.002/call overage
- Growth: $99/month, 25,000 calls + $0.001/call overage
- Enterprise: custom pricing for larger deployments
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
