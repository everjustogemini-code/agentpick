# Growth Report — Cycle 2 (2026-03-15)

## Metrics Snapshot
- Total Agents: 328 | This Week: 328 | Calls Today: 356 | Paid: 0
- Blog posts: 21 live
- Weekly reports: 15 live
- AEO scores: 0/0/0 (25th+ consecutive cycle)

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env → $0 revenue (owner action required, agent cannot fix)
2. **Zero search visibility** — 25+ cycles at 0 for all 3 AEO queries; no backlinks, no discovery
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com not submitted
4. **Moltbook unreliable** — api.moltbook.com DNS failing again; recurring pattern, not dependable

## Actions Taken

### 1. AEO scores — all 0 again (cycle 2)
- "best search API for AI agents": 0 — Firecrawl, Tavily, Exa, Composio, KDnuggets dominate top 10
- "tool routing for AI agents": 0 — Patronus AI, LivePerson, Botpress, Arize, LangChain dominate
- "AI agent API benchmark": 0 — evidentlyai, METR, IEEE Spectrum, AImultiple dominate
- Key intel from search results: Valyu Search ranks #1 in 5 external benchmark categories (FreshQA 79%, Finance 73%, Economics 73%). Brave Search led one 8-API agentic benchmark at 14.89 score with 669ms latency.
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score

### 2. Page health — all 200 OK
- /, /pricing, /blog, /connect, /checkout?plan=pro all return HTTP 200
- Agent registration functional (returns ah_live_sk_ key)
- Checkout page loads but payment blocked without Stripe env vars

### 3. Moltbook — DNS failure, skipped
- api.moltbook.com unreachable (Exit code 6 — network failure)
- Recurring pattern across multiple cycles; treat as opportunistic only

### 4. skill.md + llms.txt — updated with fresh benchmark intel
- Updated agent count from 326/327 to 328
- Added Valyu Search external benchmark data (FreshQA 79%, Finance 73%, Economics 73%)
- Added Brave Search context (led 8-API agentic benchmark, 669ms fastest latency)
- Date updated to 2026-03-15

## Results
- 0 new paid conversions (Stripe still unconfigured)
- 3 AEO scores posted
- 0 Moltbook posts (DNS failure)
- skill.md and llms.txt now contain richer benchmark comparison data from external sources

## Next Cycle Priority
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard; this is the only path to revenue
2. **Backlinks** — submit to toolify.ai, futurepedia.io, theresanaiforthat.com; this is the only path to AEO visibility
3. **Content** — "Valyu vs Exa vs Haystack vs Brave: March 2026 Benchmark Comparison" blog post — timely, data-rich, targets exact search queries that dominate results
4. **Moltbook alternative** — find a working distribution channel; Moltbook DNS has failed multiple cycles in a row

## Learnings
- AEO competitors (Firecrawl, Tavily, Exa, Brave, Valyu) are all either major funded startups or have large community backlinking networks. AgentPick has the data but zero inbound links.
- External validation is key: Valyu appears in results BECAUSE it ranked #1 in published research. AgentPick needs to be cited in an external benchmark study or blog to appear.
- Moltbook is not a reliable distribution channel; it fails more cycles than it works.
- skill.md and llms.txt are the right format for AI-crawler discovery — keep them accurate and data-rich with external cross-references.
- The Brave Search AImultiple benchmark study (8 APIs, 4,000 results) gets indexed. Publishing a similar AgentPick benchmark study as a shareable blog post with methodology could generate backlinks.
