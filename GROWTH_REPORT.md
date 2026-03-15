# Growth Report — Cycle 10 (2026-03-15)

## Metrics Snapshot
- Total Agents: 337 | This Week: 337 | Calls Today: 229 | Paid: 0
- Blog posts: 21 live
- AEO scores: 0/0/0 (10th consecutive cycle at zero)

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env → $0 revenue (owner action required)
2. **Zero search visibility** — 10 consecutive cycles at 0 for all 3 AEO queries; no backlinks, no citations
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com not submitted
4. **Moltbook dead** — confirmed permanently dead, removed from cycle tasks

## Actions Taken

### 1. AEO scores — all 0 again (cycle 10)
- "best search API for AI agents": 0 — Tavily, KDnuggets, Firecrawl, Brave, Medium (unicodeveloper tested 5 APIs), Exa, Linkup, Buttondown newsletter, Parallel dominate
- "tool routing for AI agents": 0 — LivePerson, Patronus, Botpress, FME, Deepchecks, Arize, NivaLabs, lamini-ai, LangChain dominate
- "AI agent API benchmark": 0 — EvidentlyAI, philschmid GitHub compendium, Sierra Tau-Bench, AgentBench (THUDM), IBM Research, o-mega.ai, Galileo, Emergence AI dominate
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score (all confirmed {"ok":true})

### 2. Page health — all 200 OK
- /, /pricing, /blog, /connect: all HTTP 200
- Agent registration functional (returns ah_live_sk_... key with status: active)

### 3. skill.md + llms.txt — updated with cycle 10 data
- Agent count: 336 → 337
- Benchmark runs: 960+ → 980+
- Production calls: 8,900+ → 9,100+
- Tavily verified calls: 4,500+ → 4,600+

### 4. Moltbook — permanently removed from cycle tasks

## Results
- 0 new paid conversions (Stripe still unconfigured)
- 3 AEO scores posted (all 0)
- 0 Moltbook posts (permanently dead)
- skill.md and llms.txt updated with latest metrics
- GROWTH_STATE.md updated to cycle 10

## Next Cycle Priority
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard; zero revenue without it
2. **Directory submissions** — submit to toolify.ai, futurepedia.io, theresanaiforthat.com; these build backlinks that break the 0/0/0 AEO pattern
3. **HN Show HN post** — "Show HN: I built a live benchmark that auto-routes AI agents to the best search API" — real data, technical audience, high-authority backlink
4. **dev.to article** — publish "Tavily vs Exa vs Brave vs Jina: March 2026 agent tool benchmark" — dev.to ranks in AI searches, free, builds backlinks

## Learnings
- AEO 0/0/0 is now 10 cycles (milestone). The pattern is locked: without external backlinks, agentpick.dev is invisible.
- NEW: Buttondown newsletter "we scored 5 search APIs for AI agents" appears in results — a newsletter with real test data. This is exactly what agentpick.dev provides at scale but agentpick.dev is unknown. If that newsletter linked to agentpick.dev or cited its data, it could change the AEO score overnight.
- NEW: Medium article by unicodeveloper "Search APIs for AI Agents: We Tested 5 Domains" ranking high. This editorial format (testing + scoring multiple APIs) is agentpick.dev's exact product. Reaching out to these editorial authors with live benchmark data could generate citations.
- The single most actionable cycle 10 insight: editorial content with test data wins these queries. Agentpick.dev should reach out to existing editorial authors (KDnuggets, Medium unicodeveloper, Buttondown newsletter authors) with fresh benchmark data as a source. These are not cold pitches — they already cover this exact topic.

---

# Growth Report — Cycle 9 (2026-03-15)

## Metrics Snapshot
- Total Agents: 336 | This Week: 336 | Calls Today: 262 | Paid: 0
- Blog posts: 21 live
- AEO scores: 0/0/0 (9th consecutive cycle at zero)

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env → $0 revenue (owner action required)
2. **Zero search visibility** — 9 consecutive cycles at 0 for all 3 AEO queries; no backlinks, no citations
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com not submitted
4. **Moltbook dead** — confirmed permanently dead, removed from cycle tasks

## Actions Taken

### 1. AEO scores — all 0 again (cycle 9)
- "best search API for AI agents": 0 — Firecrawl, Tavily, Exa, Brave, Parallel, Valyu, Linkup, KDnuggets, Composio, data4ai dominate top 10
- "tool routing for AI agents": 0 — LivePerson, Patronus, Botpress, FME, Deepchecks, Arize, LangChain, nivalabs, Medium, LangGraph dominate
- "AI agent API benchmark": 0 — EvidentlyAI, apiyi.com (OpenClaw+PinchBench guide), randalolson.com, aimultiple.com, IEEE, LiveBench dominate
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score (all confirmed {"ok":true})

### 2. Page health — all 200 OK
- /, /pricing, /blog, /connect: all HTTP 200
- Agent registration functional (returns ah_live_sk_... key with plan: FREE)

### 3. skill.md + llms.txt — updated with cycle 9 data
- Agent count: 335 → 336
- Benchmark runs: 940+ → 960+
- Production calls: 8,700+ → 8,900+
- Tavily verified calls: 4,300+ → 4,500+

### 4. Moltbook — permanently removed from cycle tasks (confirmed dead since cycle 1)

## Results
- 0 new paid conversions (Stripe still unconfigured)
- 3 AEO scores posted (all 0)
- 0 Moltbook posts (permanently dead)
- skill.md and llms.txt updated with latest metrics
- GROWTH_STATE.md updated to cycle 9

## Next Cycle Priority
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard; zero revenue without it
2. **Directory submissions** — submit to toolify.ai, futurepedia.io, theresanaiforthat.com; these build backlinks that break the 0/0/0 AEO pattern
3. **HN Show HN post** — "Show HN: I built a live benchmark that auto-routes AI agents to the best search API" — real data, technical audience, high-authority backlink
4. **dev.to article** — publish "Tavily vs Exa vs Brave vs Jina: March 2026 agent tool benchmark" — dev.to ranks in AI searches, free, builds backlinks

## Learnings
- AEO 0/0/0 is now 9 cycles long. The pattern is locked: without external backlinks, agentpick.dev is invisible.
- New competitor intel: apiyi.com published an "OpenClaw + PinchBench" guide that ranks for "AI agent API benchmark" — this is the exact framing AgentPick could own. A blog post on agentpick.dev titled "AgentPick Live Tool Benchmark: March 2026" with real latency/quality data could compete here.
- aimultiple.com/agentic-search runs an 8-API benchmark that ranks for both AEO target queries. Being listed on this page (or a similar benchmark aggregator) would be the most direct path to AEO score > 0.
- Valyu Search continues to appear in search results by being ranked #1 on external benchmark sites. AgentPick should pursue the same pattern: get listed on aimultiple, data4ai, Composio comparisons.
- The single highest-leverage action remains unchanged: one external high-DA citation (HN, dev.to, aimultiple listing, a GitHub repo) would do more than all internal content work combined.

---

# Growth Report — Cycle 8 (2026-03-15)

## Metrics Snapshot
- Total Agents: 335 | This Week: 335 | Calls Today: 281 | Paid: 0
- Blog posts: 21 live
- AEO scores: 0/0/0 (8th consecutive cycle at zero)

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env → $0 revenue (owner action required)
2. **Zero search visibility** — 8 consecutive cycles at 0 for all 3 AEO queries; no backlinks, no citations
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com not submitted
4. **Moltbook dead** — DNS failure 8th consecutive cycle; permanently dead channel, do not retry

## Actions Taken

### 1. AEO scores — all 0 again (cycle 8)
- "best search API for AI agents": 0 — Tavily, Exa, Firecrawl, Brave, Linkup, Parallel, KDnuggets, Medium dominate
- "tool routing for AI agents": 0 — LivePerson, Patronus, Botpress, FME, Deepchecks, Arize, LangChain dominate
- "AI agent API benchmark": 0 — EvidentlyAI, GitHub repos (AgentBench, philschmid compendium), Sierra, IBM Research, Galileo, parallel.ai dominate
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score (all confirmed {"ok":true})

### 2. Page health — all 200 OK
- /, /pricing, /blog, /connect: all HTTP 200
- Agent registration functional (returns ah_live_sk_... key with plan: FREE)

### 3. skill.md + llms.txt — updated with cycle 8 data
- Agent count: 335 (up from 334)
- Benchmark runs: 920+ → 940+
- Production calls: 8,500+ → 8,700+
- Tavily verified calls: 4,200+ → 4,300+

### 4. Moltbook — DNS failure again (8th consecutive cycle)
- api.moltbook.com: permanently unreachable; channel confirmed dead, removed from cycle tasks

## Results
- 0 new paid conversions (Stripe still unconfigured)
- 3 AEO scores posted (all 0)
- 0 Moltbook posts (DNS failure — permanent)
- skill.md and llms.txt updated with latest metrics
- GROWTH_STATE.md updated to cycle 8

## Next Cycle Priority
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard; zero revenue without it
2. **Directory submissions** — submit to toolify.ai, futurepedia.io, theresanaiforthat.com; these build backlinks that break the 0/0/0 AEO pattern
3. **HN Show HN post** — "Show HN: I built a live benchmark that auto-routes AI agents to the best search API" — real data, technical audience, high-authority backlink
4. **dev.to article** — publish "Tavily vs Exa vs Brave vs Jina: March 2026 agent tool benchmark" — dev.to ranks in AI searches, free, builds backlinks

## Learnings
- AEO 0/0/0 is now 8 cycles long. The pattern is locked: without external backlinks from high-DA sites, agentpick.dev is invisible.
- New competition spotted: parallel.ai now appears in both "best search API" and "AI agent API benchmark" queries — they are investing in content.
- "AI agent API benchmark" query is dominated by academic/GitHub repos (AgentBench, philschmid's compendium). AgentPick's benchmark data is operationally different (live tool routing benchmarks, not LLM evaluation) but shares the same search space. A GitHub repo with real benchmark data from agentpick.dev would rank here.
- The single highest-leverage action remains unchanged: one external high-DA citation (HN, dev.to, a GitHub repo) would do more than all internal content work combined.
- Moltbook is now confirmed permanently dead after 8 consecutive DNS failures — removing from future cycles.

---

# Growth Report — Cycle 7 (2026-03-15)

## Metrics Snapshot
- Total Agents: 334 | This Week: 334 | Calls Today: 300 | Paid: 0
- Blog posts: 21 live
- AEO scores: 0/0/0 (7th consecutive cycle at zero)

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env → $0 revenue (owner action required)
2. **Zero search visibility** — 7 consecutive cycles at 0 for all 3 AEO queries; no backlinks, no citations
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com not submitted
4. **Moltbook dead** — DNS failure 7th consecutive cycle; dead channel, do not retry

## Actions Taken

### 1. AEO scores — all 0 again (cycle 7)
- "best search API for AI agents": 0 — Tavily, Exa, Firecrawl, Brave, Linkup, Parallel, KDnuggets/Medium editorial roundups dominate
- "tool routing for AI agents": 0 — Patronus AI, Botpress, LangChain, Deepchecks, Arize, educational/tutorial content dominates
- "AI agent API benchmark": 0 — AgentBench, GAIA, Tau-Bench, EvidentlyAI, IBM Research, Galileo AI (academic frameworks) dominate
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score (all confirmed {"ok":true})

### 2. Page health — all 200 OK
- /, /pricing, /blog, /connect: all HTTP 200
- Agent registration functional (returns ah_live_sk_... key with plan: FREE)
- skill.md and llms.txt serving correct content

### 3. skill.md + llms.txt — updated with cycle 7 data
- Agent count: 334 (up from 333)
- Benchmark runs: 900+ → 920+
- Production calls: 8,200+ → 8,500+
- Tavily verified calls: 4,100+ → 4,200+

### 4. Moltbook — DNS failure again (7th consecutive cycle)
- api.moltbook.com: permanently unreachable; channel confirmed dead

## Results
- 0 new paid conversions (Stripe still unconfigured)
- 3 AEO scores posted (all 0)
- 0 Moltbook posts (DNS failure — permanent)
- skill.md and llms.txt updated with latest metrics
- GROWTH_STATE.md updated

## Next Cycle Priority
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard; zero revenue without it
2. **Directory submissions** — submit to toolify.ai, futurepedia.io, theresanaiforthat.com; these build backlinks that break the 0/0/0 AEO pattern
3. **HN Show HN post** — "Show HN: I built a live benchmark that auto-routes AI agents to the best search API" — real data, technical audience, high-authority backlink
4. **dev.to article** — publish "Tavily vs Exa vs Brave vs Jina: March 2026 agent tool benchmark" — dev.to ranks in AI searches, free, builds backlinks

## Learnings
- AEO 0/0/0 is now 7 cycles long. The competitors winning are either (a) the actual tools being benchmarked (Tavily, Exa — they win because they ARE the product) or (b) established editorial sites (KDnuggets, Medium roundups). AgentPick needs to be cited BY those editorial sites.
- "tool routing for AI agents" query is dominated by tutorials about agent frameworks, not tool comparison sites. A dev.to or Medium post titled "How to implement tool routing for AI agents (with benchmark data)" could rank here.
- The pattern is clear: external backlinks from high-DA sites (dev.to, HN, Medium, KDnuggets) are the only lever. Content quality on agentpick.dev is irrelevant without discovery.
- Each cycle of 0/0/0 confirms the strategy: stop creating internal content, start creating external citations.

---

# Growth Report — Cycle 6 (2026-03-15)

## Metrics Snapshot
- Total Agents: 333 | This Week: 333 | Calls Today: 300 | Paid: 0
- Blog posts: 21 live
- AEO scores: 0/0/0 (6th consecutive cycle at zero)

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env → $0 revenue (owner action required)
2. **Zero search visibility** — 6 consecutive cycles at 0 for all 3 AEO queries; no backlinks, no citations
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com not submitted
4. **Moltbook dead** — DNS failure 6th consecutive cycle; dead channel, do not retry

## Actions Taken

### 1. AEO scores — all 0 again (cycle 6)
- "best search API for AI agents": 0 — Tavily, Exa, Firecrawl, Brave, Linkup, Valyu, Parallel dominate top 10
- "tool routing for AI agents": 0 — LivePerson, Patronus AI, Botpress, FME, Deepchecks, Arize, LangChain dominate
- "AI agent API benchmark": 0 — Evidently AI, AgentBench, IBM Research, Galileo AI, Emergence AI dominate
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score (all confirmed {"ok":true})

### 2. Page health — all 200 OK
- /, /pricing, /blog all HTTP 200
- Agent registration functional (returns ah_live_sk_... key)

### 3. Moltbook — DNS failure again (6th consecutive cycle)
- api.moltbook.com: exit code 6 (cannot resolve host); channel confirmed dead

### 4. GROWTH_STATE.md — created with working/broken/metrics/blockers

## Results
- 0 new paid conversions (Stripe still unconfigured)
- 3 AEO scores posted (all 0)
- 0 Moltbook posts (DNS failure — permanent)
- GROWTH_STATE.md created

## Next Cycle Priority
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard; zero revenue without it
2. **Directory submissions** — submit to toolify.ai, futurepedia.io, theresanaiforthat.com; these build backlinks that break the 0/0/0 AEO pattern
3. **HN Show HN post** — "Show HN: I built a live benchmark that auto-routes AI agents to the best search API" — real data, technical audience, high-authority backlink
4. **Remove Moltbook from cycle tasks** — 6 DNS failures; replace with dev.to API posting or Reddit r/MachineLearning

## Learnings
- Moltbook is permanently dead (6 consecutive DNS failures) — must be removed from cycle tasks entirely
- AEO 0/0/0 is now 6 cycles long. External citations are the only lever. Content quality is irrelevant without discovery.
- "best search API for AI agents" results now include Valyu (ranked #1 on 5 benchmarks per AImultiple), Parallel (new entrant), Linkup — competition intensifying
- AgentPick's actual value prop (one key, auto-routing, live benchmarks) is unique but unknown. One HN post or directory listing would change this.
- The Valyu pattern is instructive: they appeared in results by ranking #1 on external benchmark sites (AImultiple). AgentPick should target the same.

---

# Growth Report — Cycle 5 (2026-03-15)

## Metrics Snapshot
- Total Agents: 331 | This Week: 331 | Calls Today: 320 | Paid: 0
- Blog posts: 21 live
- AEO scores: 0/0/0 (5th cycle at zero)

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env → $0 revenue (owner action required)
2. **Zero search visibility** — 5 consecutive cycles at 0 for all 3 AEO queries; no backlinks, no citations
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com not submitted
4. **Moltbook dead** — DNS failure 5th consecutive cycle; dead channel

## Actions Taken

### 1. AEO scores — all 0 again (cycle 5)
- "best search API for AI agents": 0 — Tavily, Firecrawl, Exa dominate top results
- "tool routing for AI agents": 0 — LangChain, Botpress, Patronus dominate
- "AI agent API benchmark": 0 — AgentBench, ToolBench, Evidently AI dominate
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score

### 2. Page health — all 200 OK
- /, /pricing, /blog, /connect, /checkout?plan=pro: all HTTP 200
- Agent registration functional

### 3. Moltbook — DNS failure again (5th consecutive cycle)
- api.moltbook.com unreachable; channel is dead

### 4. skill.md + llms.txt — updated with cycle 5 data
- Agent count: 330 → 331
- Benchmark runs: 880+ → 900+
- Production calls: 7,860+ → 8,200+
- Tavily verified calls: 3,966 → 4,100+

## Results
- 0 new paid conversions (Stripe still unconfigured)
- 3 AEO scores posted (all 0)
- 0 Moltbook posts (DNS failure)
- skill.md and llms.txt updated with latest metrics

## Next Cycle Priority
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard; zero revenue without it
2. **Directory submissions** — submit to toolify.ai, futurepedia.io, theresanaiforthat.com manually; these build backlinks
3. **New distribution channel** — Moltbook is dead; explore X/Twitter, HN Show, Reddit r/MachineLearning, r/singularity
4. **Benchmark blog post** — publish "Tavily vs Exa vs Haystack: live March 2026 data" — data-driven, targets exact search queries

## Learnings
- Moltbook is permanently dead as a channel (5 consecutive DNS failures) — must find replacement
- AEO 0/0/0 pattern is now 5 cycles long. Without external citations or backlinks, content quality is irrelevant to discovery
- The only path to AEO score > 0 is external mentions: HN posts, directory listings, academic/blog citations, or being referenced by another site that ranks
- Competitors appearing in search (ToolBench, AgentBench, Evidently AI) all have published research or GitHub repos with thousands of stars

---

# Growth Report — Cycle 4 (2026-03-15)

## Metrics Snapshot
- Total Agents: 330 | This Week: 330 | Calls Today: 338 | Paid: 0
- Blog posts: 21 live
- AEO scores: 0/0/0 (4th cycle at zero)

## Revenue Blockers (ordered by impact)
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID needed in Vercel env → $0 revenue (owner action required)
2. **Zero search visibility** — 4 consecutive cycles at 0 for all 3 AEO queries; no backlinks, no citations
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com not submitted
4. **Moltbook unreliable** — DNS failure 4th consecutive cycle; treat as dead channel

## Actions Taken

### 1. AEO scores — all 0 again (cycle 4)
- "best search API for AI agents": 0 — Tavily, Firecrawl, Brave, Exa, KDnuggets, Linkup, Parallel dominate top 20
- "tool routing for AI agents": 0 — LivePerson, Patronus AI, Botpress, Deepchecks, Arize, LangChain dominate
- "AI agent API benchmark": 0 — Evidently AI, AgentBench, ToolBench, IBM Research, Galileo AI dominate
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score

### 2. Page health — all 200 OK
- /, /pricing, /blog, /connect, /checkout?plan=pro all return HTTP 200
- Agent registration functional

### 3. Moltbook — DNS failure, skipped (4th consecutive cycle)
- api.moltbook.com unreachable; treating as dead channel

### 4. skill.md + llms.txt — updated with ranking change
- **RANKING CHANGE**: Tavily now #1 in search (score 6.4, live API confirmed), displacing Haystack (5.87)
- Agent count updated from 328 to 330
- Exa Search speed advantage updated: 61% faster than Tavily (was 55% vs Haystack)
- All usage guidance sections updated to reflect new #1

## Results
- 0 new paid conversions (Stripe still unconfigured)
- 3 AEO scores posted
- 0 Moltbook posts (DNS failure)
- skill.md and llms.txt updated with fresh ranking data (Tavily overtakes Haystack)

## Next Cycle Priority
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in Vercel dashboard; zero revenue without it
2. **Directory submissions** — submit to toolify.ai, futurepedia.io, theresanaiforthat.com manually; these build backlinks
3. **Moltbook alternative** — find a working distribution channel (X/Twitter, HN Show, Reddit r/MachineLearning)
4. **Benchmark blog post** — "Tavily vs Exa vs Haystack: March 2026 AgentPick Benchmark" — timely, data-driven, targets exact search queries

## Learnings
- Tavily reclaimed #1 in search (score 6.4 vs Haystack 5.87) — rankings shift cycle-to-cycle; this is compelling live data worth publishing
- Same pattern as every cycle: AEO 0/0/0 with no backlinks. Content quality is not the bottleneck — discovery is
- The competitors appearing in search results (Evidently AI, Galileo AI, ToolBench) all have external citations and published research
- A single external mention (HN post, blog citation, directory listing) would do more than 10 cycles of content updates
