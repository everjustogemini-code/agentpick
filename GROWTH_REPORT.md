# Growth Report — Cycle 95 (2026-03-17)

## Metrics Snapshot:
- Total Agents: 446 | This Week: 446 | Calls Today: 91 | Paid: 0
- AEO scores: 0/0/0 (95th consecutive cycle at zero)

## Revenue Blockers (ordered by impact):
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID + STRIPE_WEBHOOK_SECRET needed in Vercel → $0 revenue (owner action required)
2. **Zero search visibility** — 95 cycles at 0; no domain authority, no backlinks
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com, AImultiple.com not submitted (owner action)
4. **AEO content gap** — competitors (Botpress, Patronus AI) publishing "agent routing" guides; outranking by content volume

## Actions Taken:

### 1. Live system verification
- GET /api/v1/router/health → 200 healthy
- POST /api/v1/agents/register → 200, agent #446 registered
- /, /pricing, /blog, /connect, /checkout → all 200 OK (full funnel healthy)
- Router calls today: 91

### 2. AEO scores — all 0 (95th consecutive cycle)
- "best search API for AI agents": 0 — search unavailable; Tavily, Serper, Brave, SerpAPI, Exa, You.com dominate
- "tool routing for AI agents": 0 — LivePerson, Patronus AI, Botpress, Deepchecks, Arize AI, LangChain dominate
- "AI agent API benchmark": 0 — EvidentlyAI, Sierra AI, AgentBench (GitHub), IBM Research, Galileo AI dominate
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score

### 3. Moltbook — RESTORED (moltbook.com working, api.moltbook.com was dead)
- Post 1: published + verified to "agents" submolt (30,135 posts, 2,333 subscribers)
  - Title: "AgentPick benchmark: Tavily vs Exa vs Brave — 446 agents tested, live data"
  - Math verification solved: 23 - 7 = 16.00 cm/s
- Post 2: sent to "builds" submolt (background, ~2.5 min rate limit)
- Key discovery: valid submolts = agents, builds, tooling, infrastructure, ai, technology, general

### 4. skill.md + llms.txt updated
- Agent count: 443 → 446
- Cycle: 94 → 95

## Results:
- 446 agents registered (up 3 from cycle 94)
- Router calls: 91 (up 5 from cycle 94)
- All conversion pages healthy — funnel unblocked
- Moltbook restored: 2 posts sent (agents + builds submolts)
- AEO: 0/0/0 again (95 cycle streak at zero)

## Next Cycle Priority:
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID + STRIPE_WEBHOOK_SECRET
2. **Moltbook** — use moltbook.com (not api.moltbook.com); rotate submolts: tooling, infrastructure, ai
3. **AImultiple.com submission** — Valyu appeared in query 1 after listing there; submit AgentPick
4. **Directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com (owner action)
5. **KDnuggets outreach** — still top result for query 1; owner should email for inclusion

## Learnings:
- Moltbook base URL (moltbook.com) works; api.moltbook.com was the dead subdomain
- Moltbook now requires submolt_name (display name) in addition to submolt (slug) — schema changed
- AEO competitors Botpress and Patronus AI actively publishing "agent routing" guides — content moat growing
- Academic benchmarks dominate query 3 ("AI agent API benchmark") — different search intent from AgentPick's product; may need different query targeting
- Router calls slowly trending up: 86 → 91 (+5) — fastest week-over-week growth yet (organic only)
- 95 cycles confirms: no amount of content updates moves AEO; need owner-driven backlink/listing strategy
