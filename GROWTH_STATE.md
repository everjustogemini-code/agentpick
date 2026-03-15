# Growth State — Cycle 10 (2026-03-15)

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
- AEO: 0/0/0 for all queries, 10 consecutive cycles
- Router health endpoint: returns UNAUTHORIZED (requires API key — expected behavior)

## Metrics
- Total agents: 337 (up from 336)
- Router calls today: 229
- Paid accounts: 0
- AEO scores cycle 10: 0/0/0

## Rankings (cycle 10 — unchanged)
- Search #1: Tavily (6.4) — highest quality, most production-tested (4,600+ verified calls)
- Search #2: Exa Search (5.9) — 61% faster than Tavily
- Search #3: Haystack (5.87) — structured retrieval
- Search #4: SerpAPI Google (5.28)
- Crawl #1: Jina AI (5.2)

## Notable cycle 10 findings
- Query 1 "best search API for AI agents": Tavily, KDnuggets, Firecrawl, Brave, Medium unicodeveloper (tested 5 APIs), Exa, Linkup, Buttondown newsletter, Parallel dominate. A new editorial entry: Buttondown newsletter "we scored 5 search APIs" — this format (testing + scoring) is exactly what agentpick.dev does but with live data.
- Query 2 "tool routing for AI agents": Same competitors as cycle 9. lamini-ai GitHub now appears. Content remains orchestration-focused not API comparison.
- Query 3 "AI agent API benchmark": EvidentlyAI, philschmid GitHub compendium, Sierra Tau-Bench, AgentBench (THUDM), IBM Research, o-mega.ai, Cleanlab, Galileo, Emergence AI dominate.

## Revenue Blockers (ordered by impact)
1. Stripe env vars missing — zero revenue ceiling (owner action required: set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard)
2. Zero search visibility — 10 cycles, 0 AEO score; no backlinks = no discovery
3. No directory listings — not submitted to toolify.ai, futurepedia.io, theresanaiforthat.com
4. No distribution channel — Moltbook dead permanently; HN/Reddit/dev.to posts needed

## Actions Taken (Cycle 10)
- AEO scores: all 3 = 0 posted to growth-metrics (confirmed ok)
- skill.md updated: 980+ benchmark runs, 9,100+ production calls, 337 agents, 4,600+ Tavily calls
- llms.txt updated: matching metrics
- GROWTH_STATE.md: updated to cycle 10
- GROWTH_REPORT.md: updated to cycle 10
- Query 1 "best search API for AI agents": Tavily, KDnuggets, Firecrawl, Brave, Medium, Exa, Linkup, Buttondown, Parallel dominate
- Query 2 "tool routing for AI agents": LivePerson, Patronus, Botpress, FME, Deepchecks, Arize, NivaLabs, lamini-ai, LangChain dominate
- Query 3 "AI agent API benchmark": EvidentlyAI, philschmid compendium, Sierra Tau-Bench, AgentBench, IBM Research, o-mega.ai, Galileo, Emergence dominate
