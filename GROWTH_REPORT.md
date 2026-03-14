# Growth Report — Cycle 11 (2026-03-14)

## Metrics Snapshot
- Total Agents: 292 | This Week: 292 | Calls Today: 337 | Paid: 0
- Blog posts: 10 live (up from 9 — added haystack-for-ai-agents)
- New page: /reports/weekly/2026-03-14 — targeting "AI agent API benchmark"
- AEO scores: 0/0/0 for all target queries (verified live)

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — zero revenue. STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env.
2. **Zero search visibility** — invisible for all 3 AEO queries (4 cycles in a row)
3. **Moltbook API unreachable** — DNS failure 4 cycles in a row, deprioritized

## Actions Taken

### 1. New blog post: /blog/haystack-for-ai-agents
- Targets: "haystack search api for ai agents", "haystack vs perplexity", "haystack for RAG"
- Key angle: Haystack is #2 overall (6.9) — just 1% behind Perplexity, best for RAG pipelines
- Includes: full rankings table, use-case guidance, FAQ (3 AEO Q&As), CTA
- Added to blog index (now 10 posts)

### 2. New page: /reports/weekly/2026-03-14
- Targets: "AI agent API benchmark" (query #3 where score is 0)
- Full search + crawl rankings, methodology section, structured data for indexing
- Weekly report format establishes cadence signal for search engines

### 3. AEO scores verified (cycle 11)
- "best search API for AI agents" → 0 (Tavily, Exa, Firecrawl, Brave, KDnuggets dominate)
- "tool routing for AI agents" → 0 (Botpress, Patronus, Arize, LangChain dominate)
- "AI agent API benchmark" → 0 (EvidentlyAI, Sierra, AgentBench, IBM dominate)

## Results
- Haystack blog post live ✅
- Weekly benchmark report live at /reports/weekly/2026-03-14 ✅
- Blog index updated to 10 posts ✅
- Moltbook: DNS failure again, skipped

## Next Cycle Priority
1. **Stripe** — owner action required: STRIPE_SECRET_KEY + STRIPE_PRICE_ID on Vercel
2. **Submit to directory sites** — data4ai.com, aimultiple.com, kdnuggets.com rank for our queries; get listed
3. **Brave Search blog post** — Brave.com/search/api appears for "best search API for AI agents"
4. **Second weekly report** (/reports/weekly/2026-03-21) — demonstrate weekly cadence

## Learnings
- "AI agent API benchmark" query is dominated by academic/evaluation frameworks (AgentBench, EvidentlyAI).
  The /reports/weekly page targets this query more directly than blog posts.
- Haystack was #2 in rankings for 4+ cycles with no dedicated content page. This is a missed SEO gap.
  Any tool ranked in top 3 should have a dedicated post.
- Moltbook has been DNS-unreachable for 4 full cycles. Marking as dead channel, removing from rotation.
- Weekly report format creates fresh content signals + internal linking opportunities.

## Files Changed (Cycle 11)
- `src/app/blog/haystack-for-ai-agents/page.tsx` (new)
- `src/app/blog/page.tsx` — added Haystack post at top (now 10 posts)
- `src/app/reports/weekly/2026-03-14/page.tsx` (new)
- `GROWTH_STATE.md` (updated)
- `GROWTH_REPORT.md` (this file)

---

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
