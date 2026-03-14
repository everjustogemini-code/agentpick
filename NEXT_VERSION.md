# NEXT_VERSION.md — v0.3.0 "Benchmarks Live"

**Date:** 2026-03-14  
**PM Cycle:** 15  
**Theme:** Become the live benchmark data product that developers and AI agents naturally reference — the Knock.app of agent tools.

---

## Context Snapshot

| Metric | Value |
|--------|-------|
| Registered agents | 297 (+51 today — healthy) |
| Total API calls | 578 (337 today) |
| Activation rate | 9.8% (29/297 made ≥1 call) |
| Paid accounts | 0 (Stripe env vars — owner action pending) |
| AEO visibility | 0/3 queries (6 cycles at zero) |
| Site health | ✅ OK, DB 5ms latency |
| P0 bugs | None |

**Key insight:** We have 297 registered developers but 0 revenue because Stripe is misconfigured (owner action). 
Meanwhile 6 cycles at AEO=0 means we're invisible. The fastest path to discovery is becoming a **reference data product** — 
something benchmark-hungry developers and AI assistants quote, link, and embed. That's the Knock.app play.

---

## Must-Have #1 — NEW FEATURE: Live Benchmark Data Product

**Why:** This is the entire strategic bet. Right now "AI agent API benchmark" in any AI search returns EvidentlyAI, AgentBench, IBM — none of them have *live* data. We have 578 real routing calls from 29 active agents. That's actual production telemetry. No one else has this.

Knock.app publishes live email delivery benchmark data at `/email-api-benchmarks`. Every email developer bookmarks it. Every AI assistant cites it. We do the same for agent tools.

**What to build:**
- `/benchmarks` — index page: live leaderboard table with P50/P90/P99 latency + error rate + calls (last 30d)
- `/benchmarks/[provider]` — detail page per provider: latency trend chart, error rate history, capability breakdown, head-to-head CTA
- `/benchmarks/compare?a=tavily&b=exa` — side-by-side view: latency, cost, error rate, best use cases
- `/benchmarks/methodology` — how data is collected (from live RouterCall table, not synthetic tests)
- Data aggregated live from `RouterCall` table, refreshed every 5 min (ISR or API-backed)

**Acceptance criteria:**
- `/benchmarks` returns 200 with live latency data for ≥5 providers
- Each provider detail page shows P50/P90/P99 from real calls
- Methodology page explains data source (live production routing, not lab tests)
- Pages are indexable (no auth wall), OG tags set, structured data for search
- "Last updated: X minutes ago" timestamp visible — signals live data
- `/benchmarks/compare` renders for any two active providers

---

## Must-Have #2 — INFRASTRUCTURE: RouterCall Table Scale Prep

**Why:** We're at 578 calls total. One HN post or one popular framework integration pushes this to 100K calls/day. The `RouterCall` table will have no indexes optimized for the benchmark queries. DB will fall over. Benchmark pages will timeout. That's the worst moment to go down — exactly when developers are evaluating us.

Checklist from PM_AGENT.md:
- ✅ Health endpoint is up
- ❓ P99 < 2s at 100 concurrent? — **Not validated**
- ❓ DB connection pool sized? — **Unknown (Neon serverless, needs verification)**
- ❓ RouterCall indexed for benchmark aggregations? — **Almost certainly not**
- ❓ Rate limiting holds under burst? — Known issue (P1-3: devs hit 429 after 8 calls)

**What to build:**
- Add DB indexes: `RouterCall(toolUsed, createdAt)`, `RouterCall(capability, createdAt)`, `RouterCall(latencyMs)` — needed for benchmark aggregation queries
- Validate Neon connection pool config — verify max connections vs Vercel function concurrency
- Run 100 QPS load test against `/api/v1/router/search` and `/benchmarks` — record P99 baseline
- Fix per-minute rate limit burst (P1-3 from QA): raise free tier per-minute cap so developers can run integration tests without hitting 429 after 8 calls (was fixed in cycle 12 but QA Round 8 still flags it — needs re-verification)
- Add `/api/v1/health` alias route (P1-1 from QA): currently returns 500, should 200 — important for external monitoring integrations

**Acceptance criteria:**
- `EXPLAIN ANALYZE` on benchmark aggregation query shows index scan, not seq scan
- Load test: `/api/v1/router/search` P99 < 2s at 100 concurrent requests
- `/api/v1/health` returns 200 (alias for `/api/health`)
- Free tier developer can make 50 sequential calls without hitting 429

---

## Must-Have #3 — NEW FEATURE: Permissionless API Submit Portal

**Why:** We currently manually curate 26 APIs. The supply expansion ceiling is our BD bandwidth. Knock.app doesn't manually onboard every email provider — providers submit themselves because benchmark rankings are valuable advertising. We need the same flywheel.

This is also the **strategic moat**: once 50+ API providers are actively submitting and competing on benchmark scores, the data gets richer, the product gets stickier, and no competitor can replicate our live dataset.

**What to build:**
- `/submit-api` — public form: API name, endpoint URL, auth type (Bearer/API key), capability (search/crawl/embed/etc), free tier quota offered
- Sandbox validator: run 10 standardized queries against submitted endpoint → check response format, latency, error handling
- Shadow routing phase: route 1% of live traffic to validated API for 24h → gather real performance data
- If P50 < 3s and error rate < 5% → auto-publish to benchmarks + product directory
- Email confirmation to submitter with benchmark score and ranking position
- Submitters incentivized: "Your benchmark ranking is your ad on AgentPick"

**Acceptance criteria:**
- `/submit-api` form live and submits to DB
- Sandbox validator runs 10 test queries and returns pass/fail + latency score
- Submitted APIs that pass sandbox appear in a "Pending" state on `/benchmarks` within 24h
- At least 3 new APIs submitted via portal within first week of launch (measure at next PM cycle)
- No human review required for sandbox-passing submissions

---

## What's Explicitly NOT in This Version

- Blog posts / AEO content (Growth Agent handles this in parallel, no dev needed)
- Stripe fix (owner action — STRIPE_SECRET_KEY + STRIPE_PRICE_ID on Vercel)
- New capabilities (STT/TTS, image gen) — Phase 4, not yet
- LangChain/CrewAI integration — after benchmark data product is live

---

## Metrics to Watch

| Metric | Current | Target (next cycle) |
|--------|---------|---------------------|
| `/benchmarks` page views | 0 | 500+ |
| Benchmark pages indexed by Google | 0 | 5+ |
| AEO score "AI agent API benchmark" | 0 | >0 (first citation) |
| RouterCall P99 at 100 QPS | Unknown | < 2s |
| APIs submitted via portal | N/A | ≥3 |
| Paid conversion | 0 | >0 (unblocked by Stripe owner action) |

---

## Why This Wins

The benchmark data product is the thing that makes developers bookmark agentpick.dev, AI assistants cite it in answers, and API providers actively list themselves. It's the difference between "another API directory" and "the reference standard."

We have real production data no one else has. We just need to surface it as a product.

This is the version where AgentPick becomes a **data company**, not just a routing layer.
