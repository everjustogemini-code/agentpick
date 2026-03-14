# Growth Report — Cycle 4 (2026-03-14)

## Metrics Snapshot
- Total Agents: 288 | This Week: 288 | Calls Today: 337 | Paid: 0
- Blog posts: 9 live (up from 8)
- AEO scores: 0/0/0 for all target queries

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — zero revenue. STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env.
2. **Zero search visibility** — AgentPick invisible in all 3 AEO target queries
3. **Moltbook unreachable** — api.moltbook.com DNS fails every cycle (3 cycles in a row)

## Actions Taken

### 1. Fixed skill.md — stale benchmark data corrected
- Was: Tavily #1 (score 6.2)
- Now: Perplexity API #1 (7.0), Haystack #2 (6.9), Exa #3 (6.4, 50% faster), Tavily #4 (6.1)
- Updated example JSON, practical guidance, and summary sections
- Impact: AI assistants reading skill.md now get accurate current rankings

### 2. New blog post: /blog/exa-search-for-ai-agents
- Targets: "exa search api for ai agents", "exa vs tavily", "fastest search api for agents"
- Key angle: Exa is 50% faster than Perplexity — best for speed-critical agent loops
- Includes: benchmark ranking table, FAQ (3 Q&As for AEO), clear use-case guidance
- Added to blog index

### 3. AEO score audit — all 3 target queries scored
- "best search API for AI agents" → 0 (Tavily, Exa, Firecrawl, Brave, Parallel dominate)
- "tool routing for AI agents" → 0 (LangChain, CrewAI, DigitalOcean dominate)
- "AI agent API benchmark" → 0 (Parallel, AIMultiple, BrowseComp, Valyu dominate)

## Results
- skill.md fixed and deployed ✅
- New Exa blog post live ✅
- Blog has 9 posts ✅
- Moltbook: DNS failure, skipped

## Next Cycle Priority
1. **Stripe** — owner action required: set STRIPE_SECRET_KEY + STRIPE_PRICE_ID on Vercel
2. **Create /blog/haystack-for-ai-agents** — Haystack at #2 (6.9), no dedicated page
3. **Directory listings** — data4ai.com, aimultiple.com, kdnuggets rank for target queries; submit AgentPick
4. **Weekly benchmark report** — /reports/weekly/2026-03-14 with live data

## Learnings
- skill.md staleness is an active AEO liability. AI assistants reading stale data recommend wrong tools.
  Must update skill.md every cycle with current #1 and scores.
- "Tool routing for AI agents" search space is dominated by agent-to-agent routing (LangChain/CrewAI),
  NOT API tool routing. Need content explicitly addressing the API routing angle.
- data4ai.com, aimultiple.com, kdnuggets.com rank for our target queries and cite other tools.
  Getting listed there is higher leverage than new blog posts at this stage.
- Moltbook api.moltbook.com DNS has been failing for 3 cycles. Deprioritizing this channel.

## Files Changed (Cycle 4)
- `src/app/skill.md/route.ts` — Perplexity #1 (7.0), updated all rankings and examples
- `src/app/blog/exa-search-for-ai-agents/page.tsx` (new)
- `src/app/blog/page.tsx` — added Exa post at top
- `GROWTH_STATE.md` (updated)
- `GROWTH_REPORT.md` (this file)
