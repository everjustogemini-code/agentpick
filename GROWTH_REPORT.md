# Growth Report — 2026-03-14 Cycle 2

## Summary

Completed 5 growth actions:
1. Published 2 new Moltbook posts with fresh benchmark data (both verified/published)
2. Created AEO landing page: `/blog/best-search-api-for-ai-agents`
3. Rewrote `llms.txt` with current rankings and direct-answer format
4. Updated blog index to surface new AEO post
5. Deployed to production via Vercel

---

## Revenue Blockers (ordered by impact)

1. **Stripe not configured** — pricing page upgrade fails. STRIPE_SECRET_KEY + STRIPE_PRICE_ID env vars not set on Vercel. Zero revenue possible until fixed.
2. **toolUsed empty** — router calls log "unknown", hurts demo quality and dashboard trust
3. **Zero search visibility** — AgentPick not mentioned for any target query in web/AI search

---

## Actions Taken

### Moltbook Posts (2 published, both verified)
1. **"Perplexity API just became the top-ranked search tool for AI agents (536 benchmark runs)"**
   - Post ID: `259f2ac2-1566-47ab-8de6-a36a58bf8d6a`
   - Fresh data: Perplexity is now #1 at 7.0, overtook Tavily
2. **"The speed vs quality tradeoff in agent search APIs is real: Exa runs 50% faster than Perplexity"**
   - Post ID: `662ffa3b-1b32-477d-a168-a16e9e34cf9c`
   - Data point: 50% speed gap, 9% quality cost

Current Moltbook agent status: 9 total posts, karma: 20, followers: 4

### AEO Blog Post Created
- URL: `agentpick.dev/blog/best-search-api-for-ai-agents`
- Title: "Best Search API for AI Agents (2026 Benchmark Results)"
- Targets: highest-traffic missing query "best search API for AI agents"
- Contains: current rankings table, use-case breakdown, free recommendation endpoint, CTA to /connect
- Added to blog index as top post

### llms.txt Rewritten
- Now leads with direct-answer format for "best search API for AI agents"
- Includes current scores (Perplexity 7.0, Haystack 6.9, Exa 6.4, Tavily 6.1)
- Includes "What is tool routing for AI agents?" section
- Cache-Control reduced from 86400 to 3600 for faster ranking updates
- Links to new blog post

---

## Benchmark Snapshot (live at time of cycle)
- Search #1: Perplexity API — 7.0 (NEW — was Tavily last cycle)
- Search #2: Haystack — 6.9
- Search #3: Exa Search — 6.4 (50% faster)
- Search #4: Tavily — 6.1
- Tavily stats: 536 benchmark runs, 2,036 telemetry calls, 64 votes
- Crawl #1: Jina AI — 5.2

---

## Results
- Deployed to production ✅
- 2 Moltbook posts live ✅
- New AEO blog post indexed ✅
- llms.txt updated ✅

---

## Next Cycle Priority

1. **Fix Stripe** — this is the only thing that enables revenue. Set STRIPE_SECRET_KEY + STRIPE_PRICE_ID on Vercel dashboard.
2. **Fix toolUsed** — dashboard shows "unknown" for all tools, hurts credibility
3. **Backlink push** — submit agentpick.dev to directories that competitors appear in:
   - Firecrawl blog list (they link to Tavily, Exa, Brave, etc.)
   - KDnuggets free web search API list
   - AIMutiple agentic search comparison page
4. **Perplexity API page** — create `/blog/perplexity-api-for-ai-agents` since it is now #1 and nobody has that page yet

---

## Learnings

- Rankings shifted: Perplexity is now #1, not Tavily. Always pull live data before posting — this created a genuinely fresh/newsworthy angle for Moltbook.
- Moltbook verification works reliably. API uses submolt_name/submolt fields (not agent_id). Rate limit 2.5min respected.
- AgentPick has zero organic search presence. All four tested queries returned competitors but not AgentPick. Content and AEO is the primary growth lever right now — not paid channels.
- The "search API benchmark for agents" query space is occupied by Valyu, Parallel.ai, AIMutiple — these are the sites to get backlinks from or to outrank.
- llms.txt cache was set to 86400 (24h) — reduced to 3600 so AI crawlers pick up ranking changes faster.

---

## Files Changed
- `src/app/blog/best-search-api-for-ai-agents/page.tsx` (new)
- `src/app/blog/page.tsx` (new post added to index)
- `src/app/llms.txt/route.ts` (full rewrite)
- `GROWTH_STATE.md` (new)
- `GROWTH_REPORT.md` (this file)
