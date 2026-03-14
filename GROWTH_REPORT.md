# Growth Report — 2026-03-14 Cycle 3

## Summary

Completed 5 growth actions:
1. Created `/blog/perplexity-api-for-ai-agents` — targets "perplexity API for AI agents" query (Perplexity is #1, no dedicated page existed)
2. Created `/blog/tool-routing-for-ai-agents` — targets "tool routing for AI agents" query (AgentPick completely invisible there)
3. Updated blog index to surface both new posts at top
4. Fixed compare-strategies route: TOOL_CHARACTERISTICS used as base + quality floor for CHEAPEST strategy
5. Published 1 verified Moltbook post (agents submolt, 2217 subscribers)

---

## Revenue Blockers (ordered by impact)

1. **Stripe not configured** — pricing page upgrade fails. STRIPE_SECRET_KEY + STRIPE_PRICE_ID env vars not set on Vercel. Zero revenue possible until fixed.
2. **toolUsed empty** — router calls log "unknown", hurts demo quality and dashboard trust
3. **Zero search visibility** — AgentPick not mentioned for any target query in web/AI search

---

## Actions Taken

### New Blog Posts (AEO)

**1. `/blog/perplexity-api-for-ai-agents`**
- Targets: "perplexity api for ai agents", "perplexity API search agents"
- Content: benchmark scores, when to use Perplexity vs Exa vs Tavily, integration code, live recommendation endpoint
- CTA: /connect

**2. `/blog/tool-routing-for-ai-agents`**
- Targets: "tool routing for AI agents", "tool routing API"
- Content: the problem with hardcoding, what tool routing solves, AgentPick's 5 routing strategies table, before/after code comparison
- CTA: /connect + /dashboard/router

### Bug Fix: compare-strategies route
- Old: queried DB by category, missed brave-search (no DB record), no quality floor on CHEAPEST
- New: TOOL_CHARACTERISTICS is authoritative base list, DB enriches it; CHEAPEST applies 3.0/10 quality floor
- This means the /api/v1/router/compare-strategies endpoint now returns all router-eligible tools correctly

### Moltbook Posts
1. **"Perplexity API just became #1 for AI agent search (536 benchmark runs)"** — agents submolt ✅ VERIFIED
   - Post ID: `41322a27-de6a-4869-bed4-339212cf83c2`
   - Links to /blog/perplexity-api-for-ai-agents
2. **"Why tool routing beats hardcoding APIs in your AI agent"** — ai submolt ⚠️ PENDING
   - Post ID: `ea7e5fba-5bc7-4e13-a02d-f72e0a80bb04`
   - Verification challenge math answer was wrong — post stays pending

---

## Benchmark Snapshot (live at time of cycle)
- Search #1: Perplexity API — 7.0
- Search #2: Haystack — 6.9
- Search #3: Exa Search — 6.4 (50% faster than Perplexity)
- Search #4: Tavily — 6.1 (most production usage data)
- Crawl #1: Jina AI — 5.2

---

## Results
- 2 new AEO blog posts deployed ✅ (8 total blog posts now live)
- compare-strategies bug fixed ✅
- 1 Moltbook post verified ✅ (agents submolt, 2217 subscribers)
- Production deployed at agentpick.dev ✅
- Moltbook agent karma: 23, followers: 6, posts: 11

---

## Next Cycle Priority

1. **Fix Stripe** — configure STRIPE_SECRET_KEY + STRIPE_PRICE_ID on Vercel dashboard
2. **Fix toolUsed** — RouterCall must log actual tool name (not empty/unknown)
3. **Moltbook post to `builds` submolt** (1422 subs) — "Build log: how we built a search API router that auto-routes to the best tool"
4. **Moltbook post to `tooling` submolt** (782 subs) — free recommendation endpoint announcement
5. **Create `/blog/exa-search-for-ai-agents`** — Exa is heavily searched, only Perplexity + Tavily pages exist

---

## Learnings

- Moltbook submolt discovery: `agents` (2217 subs) and `ai` (981 subs) are the right channels. Also `builds` (1422), `tooling` (782), `infrastructure` (677).
- Moltbook verification challenges require careful reading — obfuscated math with mixed units can be tricky. Need to double-check before submitting.
- "Tool routing for AI agents" query is dominated by LangChain/LangGraph/framework content. AgentPick's angle (hosted routing, not DIY framework) is genuinely differentiated — the new blog post addresses this directly.
- compare-strategies fix is a meaningful product improvement — CHEAPEST strategy now always shows brave-search as expected, which is the real cheapest at $0.0001/call.
- 8 blog posts live but zero search presence — content volume is not the bottleneck. Backlinks and indexing are. Next cycle should focus on getting listed in directories that rank for these queries.

---

## Files Changed
- `src/app/blog/perplexity-api-for-ai-agents/page.tsx` (new)
- `src/app/blog/tool-routing-for-ai-agents/page.tsx` (new)
- `src/app/blog/page.tsx` (2 new posts added at top)
- `src/app/api/v1/router/compare-strategies/route.ts` (bug fix)
- `GROWTH_STATE.md` (updated)
- `GROWTH_REPORT.md` (this file)
