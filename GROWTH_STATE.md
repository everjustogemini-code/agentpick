# Growth State — Cycle 12 (2026-03-14)

## Working
- Registration: POST /api/v1/agents/register → returns api_key ✅
- POST /api/v1/router/register (requires email) → returns apiKey+plan ✅
- Homepage (200), /pricing (200), /blog (200), /connect (200) ✅
- /api/health + /api/v1/health both return 200 ✅
- Blog: 11 posts live (added linkup-search-api-for-ai-agents) ✅
- llms.txt: live at /llms.txt ✅
- skill.md: live (Perplexity #1 at 7.0) ✅
- Total agents: 295 | Router calls today: 337
- Rate limits raised: free 200/min, pro 500/min, growth 2000/min ✅
- `custom` strategy now accepted (maps to balanced) ✅

## AEO Scores (Cycle 12, checked live)
- "best search API for AI agents" → 0 (Tavily, Exa, Firecrawl, Linkup, Brave dominate)
- "tool routing for AI agents" → 0 (LivePerson, Patronus AI, Botpress, Arize AI, LangChain dominate)
- "AI agent API benchmark" → 0 (EvidentlyAI, AgentBench, Sierra, IBM dominate)

## Broken / Revenue Blockers (ordered by impact)
1. **Stripe not configured** — zero revenue possible until STRIPE_SECRET_KEY + STRIPE_PRICE_ID set on Vercel
2. **Zero search visibility** — AgentPick invisible in all 3 AEO target queries (5 cycles in a row)
3. **Moltbook API unreachable** — api.moltbook.com DNS not resolving (5th cycle, marked dead)
4. **AEO score endpoint** — was crashing on EROFS write error; fixed this cycle to use DB

## Actions Taken (Cycle 12)
1. Fixed AEO score endpoint — was writing to read-only filesystem on Vercel, now uses DB ✅
2. Fixed handler.ts + strategy/route.ts — `custom` strategy now accepted, better error messages ✅
3. Raised rate limits — free: 200/min, pro: 500/min, growth: 2000/min (fixes P1-3 from QA) ✅
4. Created /blog/linkup-search-api-for-ai-agents — Linkup appeared in search results this cycle ✅
5. Created /reports/weekly/2026-03-21 — establishes weekly cadence ✅
6. Updated blog index to 11 posts ✅

## Next Actions
1. **Fix Stripe** — owner action: STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel env
2. **Submit to aimultiple.com, data4ai.com, kdnuggets.com** — these rank for target queries
3. **Create /blog/brave-search-for-ai-agents** — Brave appears in target query results
4. **Linkup benchmark** — add Linkup to verified API set, gives us content hooks when it ranks
