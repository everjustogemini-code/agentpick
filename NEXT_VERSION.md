# Version 0.9 — "Apples to Apples"

## Theme: Ship controlled batch benchmarks (the missing data backbone) and give tool makers a reason to come back every week.

## Analysis (PM Framework)

**1. What's the #1 thing blocking developer adoption right now?**
The benchmarks page exists and looks great, but the data behind it is still uncontrolled — random queries hitting random tools at random times. A developer can't answer "Is Exa or Tavily better for finance queries?" because the runs aren't apples-to-apples. The `batchId` controlled comparison system was the #1 must-have in v0.8 and was never shipped. Without it, the benchmark data is anecdotal, not scientific. This is the single biggest gap between what the site promises and what it delivers.

**2. What would make a tool maker want to pay us?**
Two things: (a) seeing their competitive position clearly, and (b) having a way to show off their ranking. Right now, a tool maker who claims their product sees a dashboard with raw counts (telemetry events, votes, benchmark runs) — useful but not compelling. They need to see "You're #2 in finance, 340ms behind Exa" with a trend line. And they need an embeddable badge they can put on their docs site that says "Ranked #1 on AgentPick — Finance" which drives backlinks to us and creates social proof for them. The badge is free viral distribution.

**3. What's the cheapest/fastest thing we can ship that moves the needle?**
Controlled batch benchmarks (~2h) unlock everything downstream — credible rankings, fair comparisons, trend data. An embeddable badge widget (~1h) is pure growth leverage with minimal engineering. Together they create a flywheel: better data → credible rankings → badges tool makers want to display → backlinks → developer discovery → more data.

---

## Must Have (ship or fail):

### 1. Controlled Batch Benchmark Engine
**Why:** Carried over from v0.8 — still the most critical unshipped feature. Every other data feature (compare, trends, reports, digests) depends on having controlled, same-query-across-all-tools benchmark data. Without `batchId`, we can't do fair head-to-head comparisons and the "data moat" is a data puddle.

**Acceptance Criteria:**
- `POST /api/v1/benchmark/run` internal endpoint (auth via `BENCHMARK_SECRET` env var)
- Input: `{ secret, domain, query, tools[] }` — empty tools = all benchmarkable tools
- Each batch run gets a unique `batchId` (UUID) — all results from the same query share it
- Add `batchId String?` field to `BenchmarkRun` model in Prisma schema
- Update `/api/cron/benchmark-run` to use batch mode: pick a query, run it against ALL eligible tools, tag results with shared `batchId`
- LLM evaluation (Claude Haiku) scores each result: relevance (0-5), freshness, completeness
- Recalculate product weighted scores after each batch
- Minimum: 3 batch runs/hour across rotating domains = 18 tool-runs/hour
- Batch results visible on `/benchmarks` page grouped by `batchId` (click to expand side-by-side comparison)

### 2. Embeddable Score Badge Widget
**Why:** Tool makers who claim their product need a way to show off their ranking. An SVG badge (like npm download badges or GitHub stars) that says "AgentPick: #1 in Finance — 4.8/5" is free viral distribution. Every badge on a tool maker's docs site is a backlink driving developer discovery. This is the cheapest growth mechanic we can build.

**Acceptance Criteria:**
- `GET /api/v1/products/[slug]/badge.svg` returns a dynamic SVG badge
- Badge shows: tool name, overall rank, top domain, benchmark score
- Query param `?domain=finance` shows domain-specific ranking
- Query param `?style=flat|plastic` for badge style variants (like shields.io)
- Badge is cacheable (5-minute `Cache-Control`) but reflects latest data
- `/dashboard/[slug]` page shows a "Embed your badge" section with markdown/HTML snippets for claimed products
- Badge links back to the product page on AgentPick (`/products/[slug]`)

## Should Have (if time):

### 3. Tool Maker Competitive Snapshot on Dashboard
**Why:** The current maker dashboard (`/dashboard/[slug]`) shows raw counts. A claimed tool maker should see their competitive position at a glance: rank by domain, trend arrows (up/down/stable vs last week), and their strongest/weakest domain. This is the teaser for paid analytics.

**Acceptance Criteria:**
- On the claimed product dashboard, add a "Competitive Position" card
- Shows: overall rank out of N tools, rank per domain (top 3 domains shown)
- 7-day trend indicator per domain (↑ ↓ →)
- "Strongest domain" and "Needs improvement" callouts
- Link to full benchmarks page filtered to that tool's results
- Data sourced from `BenchmarkRun` with `batchId` (depends on Feature 1)

## Won't Do This Version:
- **Tool Maker Weekly Digest Email:** Still valuable, but email delivery infra (Resend integration, templates, unsubscribe) is a rabbit hole. Build the data layer (Feature 1) first; digest becomes trivial once batch data exists. Target for v1.0.
- **Dynamic RAG-based Tool Selection:** Needs significantly more benchmark data to train heuristics. The batch engine (Feature 1) is the prerequisite. Target for v1.0+.
- **Pricing/Payment Integration:** Pre-revenue is fine at this stage. Focus on building the data moat and tool maker engagement loop first. Revenue follows value.
- **MCP Tool Count Expansion:** 20 MCP servers is sufficient. Quality of benchmark data matters more than breadth of tool catalog right now.

## Metrics to Watch:
- **Controlled benchmark runs/day:** Target 432/day (18 runs/hour × 24 hours) — up from 0 controlled runs today
- **Products with >50 batch benchmark runs:** Target all 6 primary search tools within 5 days of launch
- **Badge embeds in the wild:** Target 3+ tool makers embedding badges within 2 weeks (track via Referer headers on badge requests)
- **Maker dashboard visits/week:** Target 10+ visits from claimed product owners (indicates tool maker engagement)
- **Compare page usage:** Track clicks on batch drill-down comparisons (indicates developer trust in data)

## Data Sources:
- **Internal audit (March 2026):** Benchmarks page is live with domain filters, task breakdowns, and recent runs — but all runs are uncontrolled (no `batchId` in schema). Compare page exists but lacks controlled head-to-head data. Router SDK is functional with 23 APIs. Claim flow works. Maker dashboard shows raw counts but no competitive positioning.
- **Competitor gap:** Toolhouse.ai has no public benchmarks. Composio has no head-to-head comparison data. Nobody in the space offers embeddable ranking badges — first-mover advantage. OpenRouter has model-level badges but not tool-level.
- **Growth mechanics research:** Shields.io-style badges have proven viral in open source (npm, GitHub, CI status). Adapting this pattern to AI tool rankings is novel and low-effort to implement.
- **v0.8 retrospective:** Benchmark Report Page shipped successfully. Controlled Batch Benchmarks and Tool Maker Digest did not ship. Batch benchmarks remain the #1 blocker for data credibility.

## Estimated Effort:
- Feature 1 (Controlled Batch Benchmarks): ~2 hours — schema migration + endpoint + cron update + batch grouping UI
- Feature 2 (Embeddable Badge Widget): ~1 hour — SVG generation endpoint + dashboard embed snippet
- Feature 3 (Competitive Snapshot): ~1 hour — dashboard card + aggregation query

## Dependencies:
- `BENCHMARK_SECRET` env var must be set in production
- Prisma schema migration for `batchId` field on `BenchmarkRun`
- Claude Haiku API key for LLM evaluation (already configured)
- Feature 3 depends on Feature 1 (needs batch data to compute fair rankings)
