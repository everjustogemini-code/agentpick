# Growth State — Cycle 15 (2026-03-15)

## Working
- Homepage: HTTP 200
- /pricing, /blog, /checkout?plan=pro, /connect: all HTTP 200
- Agent registration: functional (returns ah_live_sk_ key, status: active)
- Recommend endpoint: live, real rankings
- AEO score API: all 3 scores posted ({"ok":true} confirmed)
- skill.md: live at agentpick.dev/skill.md, serving correct content (HTTP 200, text/markdown)
- llms.txt: live at agentpick.dev/llms.txt, serving correct content (HTTP 200, text/plain)
- QA: 58/58 passing (Round 13)

## Broken
- Stripe: not configured — $0 revenue (owner action required)
- Moltbook: DNS failure — confirmed permanently dead (15 consecutive cycles)
- AEO: 0/0/0 for all queries, 15 consecutive cycles
- Router health endpoint: returns UNAUTHORIZED (requires API key — expected behavior)

## Metrics
- Total agents: 342 (up from 341)
- Router calls today: 178
- Paid accounts: 0
- AEO scores cycle 15: 0/0/0
- Benchmark runs: 1,080+
- Production calls: 10,100+
- Tavily verified calls: 5,100+

## Rankings (cycle 15 — unchanged)
- Search #1: Tavily (6.4) — highest quality, most production-tested (5,100+ verified calls)
- Search #2: Exa Search (5.9) — 61% faster than Tavily
- Search #3: Haystack (5.87) — structured retrieval
- Search #4: SerpAPI Google (5.28)
- Crawl #1: Jina AI (5.2)

## Notable cycle 15 findings
- Query 1 "best search API for AI agents": Tavily, KDnuggets, Firecrawl, Brave, Medium/unicodeveloper, Exa, Linkup, Buttondown, Parallel x2 dominate. agentpick.dev not present.
- Query 2 "tool routing for AI agents": LivePerson, Patronus, Botpress, FME, Deepchecks, Arize, NivaLabs, lamini-ai GitHub, Medium, LangChain dominate. agentpick.dev not present.
- Query 3 "AI agent API benchmark": EvidentlyAI, philschmid GitHub, Sierra Tau-Bench, THUDM AgentBench, o-mega.ai, IBM Research, cleanlab.ai, Galileo AI, Emergence AI, Parallel dominate. agentpick.dev not present.
- Pattern (15 cycles): zero external backlinks = zero AEO visibility. Product is healthy (58/58 QA). Only missing piece is one high-DA external citation.
- 10,100+ production calls milestone reached — strong social proof data, needs publishing

## Revenue Blockers (ordered by impact)
1. Stripe env vars missing — zero revenue ceiling (owner action required: set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard)
2. Zero search visibility — 15 cycles, 0 AEO score; no backlinks = no discovery
3. No directory listings — not submitted to toolify.ai, futurepedia.io, theresanaiforthat.com
4. No distribution channel — Moltbook dead permanently; HN/Reddit/dev.to posts needed

## Actions Taken (Cycle 15)
- AEO scores: all 3 = 0 posted to growth-metrics (confirmed ok)
- skill.md updated: 1,080+ benchmark runs, 10,100+ production calls, 342 agents
- llms.txt updated: matching metrics, 5,100+ Tavily calls
- GROWTH_STATE.md: updated to cycle 15
- GROWTH_REPORT.md: updated to cycle 15
- Moltbook: permanently dead (15 consecutive failures), not attempted
