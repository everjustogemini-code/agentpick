# Growth State — Cycle 11 (2026-03-15)

## Working
- Homepage: HTTP 200
- /pricing, /blog, /checkout?plan=pro: all HTTP 200
- Agent registration: functional (returns ah_live_sk_ key, status: active)
- Recommend endpoint: live, real rankings
- AEO score API: all 3 scores posted ({"ok":true} confirmed)
- skill.md: live at agentpick.dev/skill.md, serving correct content
- llms.txt: live at agentpick.dev/llms.txt, serving correct content

## Broken
- Stripe: not configured — $0 revenue (owner action required)
- Moltbook: DNS failure (exit code 6) — confirmed permanently dead
- AEO: 0/0/0 for all queries, 11 consecutive cycles
- Router health endpoint: returns UNAUTHORIZED (requires API key — expected behavior)

## Metrics
- Total agents: 338 (up from 337)
- Router calls today: 227
- Paid accounts: 0
- AEO scores cycle 11: 0/0/0

## Rankings (cycle 11 — unchanged)
- Search #1: Tavily (6.4) — highest quality, most production-tested (4,700+ verified calls)
- Search #2: Exa Search (5.9) — 61% faster than Tavily
- Search #3: Haystack (5.87) — structured retrieval
- Search #4: SerpAPI Google (5.28)
- Crawl #1: Jina AI (5.2)

## Notable cycle 11 findings
- Query 1 "best search API for AI agents": Firecrawl blog, Medium/unicodeveloper, Tavily, Composio, KDnuggets, data4ai, Parallel, AImultiple, Exa, Linkup dominate. Same pattern as cycle 10.
- Query 2 "tool routing for AI agents": LivePerson, Patronus, Botpress, FME, Deepchecks, Arize, NivaLabs, lamini-ai GitHub, Medium, LangChain dominate. No change.
- Query 3 "AI agent API benchmark": EvidentlyAI, apiyi.com (OpenClaw+PinchBench), randalolson.com, aitools4you, o-mega.ai, modelslab, AImultiple, IEEE Spectrum, Nature/npj, IBM Research dominate.
- NEW: aitools4you.ai now ranks for "AI agent API benchmark" with "APEX-Agents benchmark 75% failure rate" story.
- NEW: Linkup claims #1 on SimpleQA factuality benchmark; modelslab covers AI coding agent benchmark risks.

## Revenue Blockers (ordered by impact)
1. Stripe env vars missing — zero revenue ceiling (owner action required: set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard)
2. Zero search visibility — 11 cycles, 0 AEO score; no backlinks = no discovery
3. No directory listings — not submitted to toolify.ai, futurepedia.io, theresanaiforthat.com
4. No distribution channel — Moltbook dead permanently; HN/Reddit/dev.to posts needed

## Actions Taken (Cycle 11)
- AEO scores: all 3 = 0 posted to growth-metrics (confirmed ok)
- skill.md updated: 1,000+ benchmark runs, 9,300+ production calls, 338 agents, 4,700+ Tavily calls
- llms.txt updated: matching metrics
- GROWTH_STATE.md: updated to cycle 11
- GROWTH_REPORT.md: updated to cycle 11
- Moltbook: DNS failure again (exit code 6) — permanently dead
