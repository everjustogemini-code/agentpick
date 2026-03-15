# Growth State — Cycle 9 (2026-03-15)

## Working
- Homepage: HTTP 200
- /pricing, /blog, /connect: all HTTP 200
- Agent registration: functional (returns ah_live_sk_ key)
- Recommend endpoint: live, real rankings
- AEO score API: all 3 scores posted ({"ok":true} confirmed)
- skill.md: live at agentpick.dev/skill.md, serving correct content
- llms.txt: live at agentpick.dev/llms.txt, serving correct content

## Broken
- Stripe: not configured — $0 revenue (owner action required)
- Moltbook: DNS failure — confirmed permanently dead, removed from cycles
- AEO: 0/0/0 for all queries, 9 consecutive cycles

## Metrics
- Total agents: 336 (up from 335)
- Router calls today: 262
- Paid accounts: 0
- AEO scores cycle 9: 0/0/0

## Rankings (cycle 9 — unchanged)
- Search #1: Tavily (6.4) — highest quality, most production-tested (4,500+ verified calls)
- Search #2: Exa Search (5.9) — 61% faster than Tavily
- Search #3: Haystack (5.87) — structured retrieval
- Search #4: SerpAPI Google (5.28)
- Crawl #1: Jina AI (5.2)

## Notable cycle 9 finding
- "AI agent API benchmark" query now surfaces apiyi.com's "OpenClaw + PinchBench" guide (49 models, claude-sonnet-4-6 #1 at 86.9%). PinchBench is a direct competitor framing for "AI agent API benchmark" keyword.
- Valyu Search continues to appear in "best search API" results — ranked #1 on 5 external benchmarks (FreshQA 79%, Finance 73%).
- aimultiple.com/agentic-search runs its own 8-API benchmark scoring Brave highest (14.89). This page ranks for both AEO queries we target.

## Revenue Blockers (ordered by impact)
1. Stripe env vars missing — zero revenue ceiling (owner action required: set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard)
2. Zero search visibility — 9 cycles, 0 AEO score; no backlinks = no discovery
3. No directory listings — not submitted to toolify.ai, futurepedia.io, theresanaiforthat.com
4. No distribution channel — Moltbook dead permanently; HN/Reddit/dev.to posts needed

## Actions Taken (Cycle 9)
- AEO scores: all 3 = 0 posted to growth-metrics (confirmed ok)
- skill.md updated: 960+ benchmark runs, 8,900+ production calls, 336 agents, 4,500+ Tavily calls
- llms.txt updated: matching metrics
- GROWTH_STATE.md: updated to cycle 9
- GROWTH_REPORT.md: updated to cycle 9
- Query 1 "best search API for AI agents": Firecrawl, Tavily, Exa, Brave, Parallel, Valyu, Linkup, KDnuggets, Composio, data4ai dominate
- Query 2 "tool routing for AI agents": LivePerson, Patronus, Botpress, FME, Deepchecks, Arize, LangChain, nivalabs, Medium, LangGraph dominate
- Query 3 "AI agent API benchmark": EvidentlyAI, apiyi.com PinchBench, randalolson.com, aitools4you.ai, o-mega.ai, aimultiple.com, IEEE, LiveBench dominate
