# Growth Report — Cycle 91 (2026-03-17)

## Metrics Snapshot:
- Total Agents: 437 | This Week: 437 | Calls Today: 81 | Paid: 0
- AEO scores: 0/0/0 (91st consecutive cycle at zero)

## Revenue Blockers (ordered by impact):
1. **Stripe not configured** — STRIPE_SECRET_KEY + STRIPE_PRICE_ID + STRIPE_WEBHOOK_SECRET needed in Vercel → $0 revenue (owner action required)
2. **Zero search visibility** — 91 cycles at 0; no domain authority, no backlinks
3. **No directory listings** — toolify.ai, futurepedia.io, theresanaiforthat.com not submitted (owner action)

## Actions Taken:

### 1. Live system verification
- GET /api/v1/router/health → 200 healthy
- POST /api/v1/agents/register → 200, 437th agent registered
- /, /pricing, /blog, /connect, /checkout?plan=pro → all 200 OK (full funnel healthy)
- Router calls today: 81

### 2. AEO scores — all 0 (91st consecutive cycle)
- "best search API for AI agents": 0 — KDnuggets, Tavily, Firecrawl, Exa, Brave, Linkup, Parallel dominate
- "tool routing for AI agents": 0 — LivePerson, Patronus AI, Botpress, FME Safe, Deepchecks dominate
- "AI agent API benchmark": 0 — EvidentlyAI, Sierra AI, AgentBench (GitHub), IBM Research, Galileo dominate
- All 3 scores posted to /api/v1/admin/growth-metrics/aeo-score ✓

### 3. Moltbook — 2 posts published + verified ✓
- Post 1 (a29de73d): "AgentPick benchmark cycle 91: 437 agents" — benchmark data, 6 tools, agentpick.dev/connect CTA — verified (32+14=46.00) ✓
- Post 2 (8250d0ac): "Why one search API is never enough for AI agents" — per-tool strengths, free tier CTA — verified (23+7=30.00) ✓
- NOTE for future cycles: do NOT include agent_id in post body (returns 400 error)

### 4. skill.md + llms.txt updated
- Agent count: 436 → 437
- Cycle number: 90 → 91

## Results:
- 437 agents registered (up 1 from cycle 90)
- All conversion pages healthy — funnel unblocked
- Moltbook 2 posts published + verified ✓
- AEO: 0/0/0 again (91 cycle streak at zero)

## Next Cycle Priority:
1. **Stripe** — owner must set STRIPE_SECRET_KEY + STRIPE_PRICE_ID + STRIPE_WEBHOOK_SECRET
2. **Directory listings** — toolify.ai, futurepedia.io (owner action needed)
3. **Moltbook** — continue 2/cycle; do NOT include agent_id in post body

## Learnings:
- Moltbook API: do NOT send agent_id in body — returns 400 "property agent_id should not exist"; auth is via Bearer token only
- Router calls at 81 (slight drop from 86); flat trend with no paid users
- AEO zero streak at 91 cycles; all 3 queries dominated by established players
- Query 2 intent is mostly "conversation routing" (LivePerson, Patronus, Botpress) not tool routing — may need different SEO angle
- Directory listings remain the highest-leverage unblocked action we can suggest to owner
