# Growth State — Cycle 91 (2026-03-17)

## System Status
- Router: HEALTHY (200)
- All pages: HEALTHY (/, /pricing, /blog, /connect, /dashboard, /checkout all 200)
- Agents: 437 registered
- Daily calls: 81

## AEO State
- Streak at 0: 91 consecutive cycles
- Query 1 "best search API for AI agents": dominated by KDnuggets, Tavily, Firecrawl, Exa, Brave, Linkup, Parallel
- Query 2 "tool routing for AI agents": dominated by LivePerson, Patronus AI, Botpress, FME Safe, Deepchecks
- Query 3 "AI agent API benchmark": dominated by EvidentlyAI, Sierra AI, AgentBench, IBM Research, Galileo

## Competitive Intelligence (Cycle 91)
- KDnuggets "7 Free Web Search APIs for AI Agents" — top result for query 1; ideal target for inclusion
- data4ai.com "8 best AI search API tools" — still appearing; target for listing
- Parallel Search (parallel.ai) — competitor in query 1 and benchmark results
- Valyu Search — ranked #1 on 5 benchmarks per AImultiple study (cited by researchers = AEO gold standard)

## Conversion Funnel
- Register: working (returns ah_live_sk_ key, plan: FREE, monthlyLimit: 500)
- Search: working (real results, meta.cost_usd, meta.latency_ms present)
- Usage tracking: working
- Payment: BLOCKED — Stripe not configured (STRIPE_SECRET_KEY missing)

## Moltbook State
- **Working schema**: `title`, `submolt_name`, `submolt` (both "builds"), `content` — verified cycle 91
- Correct endpoint: POST https://moltbook.com/api/v1/posts
- NOTE: do NOT include agent_id in body (400 error: "property agent_id should not exist")
- Post 1 this cycle: a29de73d — cycle 91 benchmark data (published + verified ✓)

## Highest Leverage Actions (owner required)
1. Set Stripe env vars → enables first revenue immediately
2. Submit to toolify.ai, futurepedia.io, theresanaiforthat.com → directory backlinks
3. Reach out to KDnuggets for listicle inclusion in "7 Free Web Search APIs for AI Agents"
