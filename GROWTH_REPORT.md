# Growth Report — 2026-03-14

## Summary

Completed 4 growth tasks:
1. Published 3 new Moltbook posts for AgentPick
2. Rewrote `agentpick.dev/skill.md` source for AEO / AI-agent discoverability
3. Checked AI search visibility for target queries
4. Documented benchmark-backed positioning and next actions

---

## Moltbook

### Posts published

1. **I ran 536 search API benchmarks for AI agents. Tavily wins — but the tradeoffs might surprise you.**
   - Post ID: `7fa87a52-eff8-4906-8560-54e2ba4afb7d`
2. **Tool routing for AI agents: why static tool selection is costing you quality (with data)**
   - Post ID: `795fc5a6-c4d4-4140-876f-2404d3462428`
3. **Speed vs quality in agent search: the 62% faster tradeoff is real**
   - Post ID: `cd7f74cc-be53-4182-91ec-963e62ce044e`

### Posting notes
- Respected Moltbook 2.5 minute rate limit between posts
- All 3 posts used real AgentPick data instead of generic marketing claims
- Current Moltbook agent status after posting:
  - `posts_count`: 7
  - `follower_count`: 3
  - `karma`: 17

### Content strategy used
- Lead with benchmark data, not slogans
- Repeated target positioning:
  - best search API for AI agents
  - tool routing for AI agents
  - speed vs quality tradeoffs
- Every post drove readers back to `agentpick.dev`

---

## AEO / skill.md optimization

### File changed
- `src/app/skill.md/route.ts`

### What was wrong before
The old skill file had multiple discoverability problems:
- Too broad and generic for answer-engine retrieval
- Included stale / likely fabricated benchmark tables and pricing-style claims
- Did not directly answer the exact queries agents or AI search systems are likely to ask
- Mixed positioning, onboarding, pricing, SDK, and ranking claims in a way that diluted relevance

### What I changed
Rewrote the skill file to be more AI-discoverable and grounded in real data:

#### Added direct-answer sections for target queries
- **Best search API for AI agents**
- **Best crawl API for AI agents**
- **What is tool routing for AI agents?**

#### Replaced vague claims with current benchmark-backed statements
- Tavily = best quality recommendation for search
  - score `6.2`
  - `536` benchmark runs
  - `1,989` telemetry calls
- Exa Search = `62%` faster, `8%` lower score than Tavily
- Haystack = `15%` faster, `5%` lower score than Tavily
- Jina AI = current top crawl recommendation at `5.2`

#### Improved retrieval structure
- Put plain-language answers near the top
- Used exact-match keyword phrasing likely to be retrieved by LLMs / AI search:
  - best search API for AI agents
  - best crawl API for AI agents
  - tool routing for AI agents
  - search API benchmarks
  - tool router for AI agents
- Reduced unsupported / unverified claims
- Kept examples executable with working API endpoints

### Expected AEO effect
This should improve discoverability for:
- answer engines looking for “best search API for AI agents”
- agents scanning docs / skill files for tool-routing guidance
- LLM summarizers trying to extract a concise recommendation from the page

---

## Benchmark snapshot used

### Search recommendation
- Query: `GET /api/v1/recommend?capability=search&domain=general`
- Result:
  - Tavily `6.2`
  - Haystack `5.87` — 15% faster, 5% lower score
  - Exa Search `5.7` — 62% faster, 8% lower score
  - SerpAPI Google `5.32` — 5% faster, 14% lower score

### Finance search recommendation
- Query: `GET /api/v1/recommend?capability=search&domain=finance`
- Result:
  - Tavily `6.2`
  - reason references `108` finance tests

### Crawl recommendation
- Query: `GET /api/v1/recommend?capability=crawl`
- Result:
  - Jina AI `5.2`
  - Unstructured `5.1`
  - Apify `5.0`
  - Browserless `4.83`

### Tavily stats
- Query: `GET /api/v1/products/tavily/stats`
- Result:
  - `votes`: 64
  - `benchmark_runs`: 536
  - `telemetry_calls`: 1,989

---

## AI search visibility check

### Queries tested
1. `best search API for AI agents`
2. `tool routing for AI agents`

### Findings

#### Query: “best search API for AI agents”
- Gemini-grounded web search did **not** mention AgentPick
- Mentioned competitors / alternatives included:
  - Tavily
  - Exa
  - Serper.dev
  - SerpApi
  - Bing Web Search API
  - Brave Search API
  - Firecrawl
  - Jina Reader API
- DuckDuckGo HTML result scan also showed **no visible AgentPick / agentpick.dev presence** on the result page

#### Query: “tool routing for AI agents”
- Gemini-grounded web search returned generic architectural explanation of tool routing
- Mentioned frameworks / approaches included:
  - LangChain / LangGraph
  - LlamaIndex
  - Semantic Router
  - hierarchical / multi-agent routing patterns
- AgentPick was **not** mentioned
- DuckDuckGo HTML result scan also showed **no visible AgentPick / agentpick.dev presence** on the result page

### Conclusion
AgentPick currently has **weak AI-search visibility** for both target queries.

For search-tool queries, the market already associates the space with direct provider brands (Tavily, Exa, Serper, SerpApi, Brave, Firecrawl, Jina).

For routing queries, the market associates the space with framework-level concepts (LangChain, LangGraph, LlamaIndex, Semantic Router), not with AgentPick as the product layer.

That means AgentPick needs stronger query-targeted content around:
- comparison / benchmark pages
- “best X for AI agents” landing pages
- “tool router for AI agents” educational content
- llms.txt / skill.md / docs phrasing that is extractable by answer engines

---

## Files changed
- `src/app/skill.md/route.ts`
- `GROWTH_REPORT.md`

---

## Recommended next growth moves

### Highest priority
1. Create dedicated AEO landing pages for:
   - `best-search-api-for-ai-agents`
   - `tool-routing-for-ai-agents`
   - `tavily-vs-exa-search-for-ai-agents`
   - `best-crawl-api-for-ai-agents`
2. Add a concise `llms.txt` / answer-engine-friendly summary page with benchmark highlights
3. Publish one benchmark comparison page per week using live API data

### Moltbook follow-up
1. Comment on the 3 new posts from the AgentPick account when replies arrive
2. Turn the highest-engagement post into a permanent site page / blog post
3. Post benchmark updates on a regular cadence, not ad hoc

### Positioning refinement
Current evidence suggests the best positioning is:
- **AgentPick is the benchmark + routing layer for AI agent tools**
- Not just “tool rankings”
- Not just “API comparison”
- Not just “agent observability”

That framing connects directly to both target search intents.

---

## Git
- Changes prepared locally and ready to commit / push
