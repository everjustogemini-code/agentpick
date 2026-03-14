# Growth State — Cycle 15 (2026-03-14)

## Live Health Check (Cycle 15)
- Router health: UNAUTHORIZED without key → 200 with valid key ✅
- Agent registration: 200 OK ✅
- Homepage: HTTP/2 200 ✅
- /pricing: HTTP/2 200 ✅
- /blog: HTTP/2 200 ✅
- /connect: HTTP/2 200 ✅
- /checkout?plan=pro: zsh "no matches" (Stripe not configured — no Stripe env vars)
- Moltbook: DNS failure — permanently skipped

## AEO Scores (Cycle 15)
- "best search API for AI agents" → 0 (Tavily, KDnuggets, Firecrawl, Brave, Exa dominate)
- "tool routing for AI agents" → 0 (LivePerson, Patronus AI, Botpress, FME, Deepchecks dominate)
- "AI agent API benchmark" → 0 (EvidentlyAI, GitHub/philschmid, Sierra, AgentBench, IBM dominate)
- All scores posted to /api/v1/admin/growth-metrics/aeo-score ✅ (8th cycle at 0)

## New Competitors Spotted This Cycle
- Valyu Search — new benchmark entrant; ranked #1 across 5 categories (FreshQA, SimpleQA, finance, economics, medical) in independent study

## Actions Taken (Cycle 15)
1. New blog: /blog/valyu-search-api-for-ai-agents (Valyu enters evaluation, dedicated post same cycle)
2. New weekly report: /reports/weekly/2026-04-11 (5th weekly report — cadence maintained)
3. Forward nav added: 2026-04-04 → 2026-04-11
4. llms.txt updated: 301 agents, 3,338 calls, Valyu Search added
5. AEO scores posted (3 queries, all 0)

## Key Blockers
1. Zero paid conversions — Stripe still not configured
2. Zero search visibility — 8 cycles at 0 for all 3 queries
3. No backlinks from KDnuggets, data4ai, aimultiple

---

# Growth State — Cycle 14 (2026-03-14)

## Live Health Check
- Router health: UNAUTHORIZED (as expected — requires API key)
- Agent registration: 200 OK — `{"agent_id":"cmmqqgdqy...","api_key":"ah_live_sk_...","reputation_score":0.1,"status":"active"}`
- Homepage: HTTP/2 200
- /pricing: HTTP/2 200
- /blog: HTTP/2 200
- /connect: HTTP/2 200
- /checkout?plan=pro: no response (Stripe not configured)
- Moltbook: DNS failure (exit code 6) — confirmed dead channel (7th consecutive failure)

## AEO Scores (Cycle 14)
- "best search API for AI agents" → 0 (Tavily, Firecrawl, KDnuggets, Exa, Parallel, Linkup, data4ai, aimultiple, SerpAPI, Medium article all above)
- "tool routing for AI agents" → 0 (LivePerson, Patronus AI, Botpress, FME, Deepchecks, Arize AI, LangChain, GitHub, NivaLabs all above)
- "AI agent API benchmark" → 0 (apiyi.com/PinchBench, EvidentlyAI, RandalOlson, aitools4you, o-mega, modelslab, Nature, IEEE, LiveBench, IBM all above)
- All scores posted to /api/v1/admin/growth-metrics/aeo-score ✅

## New Competitors Spotted This Cycle
- Parallel Search (parallel.ai) — now in "best search API for AI agents" results; built for AI agents; declarative semantic objectives
- Valyu Search — ranked #1 across 5 benchmarks in new Medium article (FreshQA, SimpleQA, finance, economics, medical)
- PinchBench — new AI agent leaderboard (49 models, real-time scoring); appears in "AI agent API benchmark" query

## Key Findings
1. Zero paid conversions — Stripe still not configured (/checkout returns no response)
2. 300 agents milestone crossed (was 297 last cycle)
3. Moltbook dead — skip permanently
4. Content gap filled: Parallel Search blog post created this cycle
5. "tool routing for AI agents" is dominated by agent-to-agent routing content, not API routing — different content angle needed
