# Growth State — Cycle 13 (2026-03-15)

## Working
- Homepage: HTTP 200
- /pricing, /blog, /checkout?plan=pro: all HTTP 200
- /connect: HTTP 200
- Agent registration: functional (returns ah_live_sk_ key, status: active)
- Recommend endpoint: live, real rankings
- AEO score API: all 3 scores posted ({"ok":true} confirmed)
- skill.md: live at agentpick.dev/skill.md, serving correct content (HTTP 200, text/markdown)
- llms.txt: live at agentpick.dev/llms.txt, serving correct content (HTTP 200, text/plain)
- QA: 58/58 passing (Round 13)

## Broken
- Stripe: not configured — $0 revenue (owner action required)
- Moltbook: DNS failure (exit code 6) — confirmed permanently dead
- AEO: 0/0/0 for all queries, 13 consecutive cycles
- Router health endpoint: returns UNAUTHORIZED (requires API key — expected behavior)

## Metrics
- Total agents: 340 (up from 339)
- Router calls today: 227
- Paid accounts: 0
- AEO scores cycle 13: 0/0/0

## Rankings (cycle 13 — unchanged)
- Search #1: Tavily (6.4) — highest quality, most production-tested (4,900+ verified calls)
- Search #2: Exa Search (5.9) — 61% faster than Tavily
- Search #3: Haystack (5.87) — structured retrieval
- Search #4: SerpAPI Google (5.28)
- Crawl #1: Jina AI (5.2)

## Notable cycle 13 findings
- Query 1 "best search API for AI agents": Tavily, KDnuggets, Firecrawl, Brave, Medium/unicodeveloper, Exa, Linkup, Buttondown newsletter, Parallel, Parallel blog dominate top 10. agentpick.dev not present.
- Query 2 "tool routing for AI agents": LivePerson, Patronus, Botpress, FME, Deepchecks, Arize, NivaLabs, lamini-ai GitHub, LangChain, Medium dominate. agentpick.dev not present.
- Query 3 "AI agent API benchmark": EvidentlyAI, philschmid GitHub 50+ compendium, Sierra Tau-Bench, AgentBench THUDM, IBM Research, o-mega.ai, cleanlab.ai, Galileo AI, Emergence AI, tessl.io dominate. agentpick.dev not present.
- NEW cycle 13: tessl.io published "8 benchmarks shaping the next generation of AI agents" — editorial benchmark roundup entering results. Pattern: editorial roundups beat product pages in benchmark queries.
- NEW cycle 13: Linkup now claims #1 on SimpleQA factuality benchmark — factuality benchmarks are being used as search copy by the tools themselves. AgentPick should publish its own factuality analysis from live data.
- Persistent pattern (13 cycles): zero external backlinks = zero AEO visibility. Product is healthy (58/58 QA). Only missing piece is one high-DA external citation.

## Revenue Blockers (ordered by impact)
1. Stripe env vars missing — zero revenue ceiling (owner action required: set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard)
2. Zero search visibility — 13 cycles, 0 AEO score; no backlinks = no discovery
3. No directory listings — not submitted to toolify.ai, futurepedia.io, theresanaiforthat.com
4. No distribution channel — Moltbook dead permanently; HN/Reddit/dev.to posts needed

## Actions Taken (Cycle 13)
- AEO scores: all 3 = 0 posted to growth-metrics (confirmed ok)
- skill.md updated: 1,040+ benchmark runs, 9,700+ production calls, 340 agents, 4,900+ Tavily calls, added Linkup SimpleQA note
- llms.txt updated: matching metrics
- GROWTH_STATE.md: updated to cycle 13
- GROWTH_REPORT.md: updated to cycle 13
- Moltbook: permanently dead, not attempted
