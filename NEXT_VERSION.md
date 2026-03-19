# NEXT_VERSION.md — v-next
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **50/51** | P0: none | P1: 2 open | Live site: 1 additional P1 (nav 404)
**Live site:** https://agentpick.dev — functional but `/router` nav link is a dead 404, mixed light/dark aesthetic

> **PM note:** Previous NEXT_VERSION.md incorrectly claimed 57/57 QA clean. Actual report is 50/51 with two open P1s. Live-site inspection found a third P1: the core "Router" nav link returns 404. Bugs must ship before UI polish. This version corrects the plan.

---

## Must-Have #1 — Fix 3 Open P1 Bugs (BLOCKS everything else)

**Bug A — `/router` page returns 404 (Live-site P1, nav link dead)**

Every user who clicks "Router" in the top nav hits a 404. Router is the core product feature. Fix:
- Create `app/router/page.tsx` with a routing overview (strategies, code examples, link to `/connect`) — OR —
- Add a Next.js permanent redirect: `/router` → `/connect` (one line in `next.config.js` `redirects`).
- Acceptance: `curl -I https://agentpick.dev/router` → `200` or `308` (no `404`).

**Bug B — QA embed test fails: `voyage-ai` vs `voyage-embed` name mismatch (QA P1)**

`QA_REPORT.md` test `B.1-embed` fails because the test fixture expects `"voyage-ai"` but the router returns `"voyage-embed"`. The embed capability itself works correctly (89ms, cohere → voyage-embed fallback chain). Fix is in the test, not the router:
- In the QA script's valid-tool list for the embed capability, replace `"voyage-ai"` with `"voyage-embed"` (or add both).
- Acceptance: QA passes 51/51 — zero failures.

**Bug C — `/api/v1/register` is 404 (QA P1, SDK/docs breakage)**

The correct public registration endpoint is `/api/v1/router/register`. Any SDK docs, onboarding copy, or external integrations pointing to the shorter path silently fail with `NOT_FOUND`. Fix:
- Add a redirect or alias at `/api/v1/register` → `/api/v1/router/register` (HTTP 308 permanent).
- Audit all markdown docs, SDK examples, and `/connect` page copy for the incorrect path and update them.
- Acceptance: `POST /api/v1/register` → `308` redirect to correct endpoint, not `404`.

---

## Must-Have #2 — Complete Dark-Glass Design System (Site-Wide Consistency)

Cycle 2 introduced dark-glass CSS tokens and applied them to the homepage hero. The rest of the site (benchmarks, rankings, agents, connect, dashboard) still uses a mixed light/dark aesthetic. Complete the rollout:

1. **Dark by default** — `body` uses `var(--bg-base)`. No white flash on any page load. `--bg-card` → `rgba(255,255,255,0.05)`, `--text-primary` → `#E2E8F0`.

2. **Glass cards everywhere** — Apply `glass-card gradient-border-card` to all feature cards, pricing tiers, benchmark domain cards, rankings category tiles, and agent directory cards.

3. **Hero mesh + glassmorphism panel** — Homepage hero gets `hero-mesh` background class + frosted `glass-card` container around headline + CTA (`backdrop-filter: blur(16px)`). Headline: `clamp(2.8rem, 5vw, 4.5rem)` weight-800, white-to-orange gradient text.

4. **ScrollReveal on all pages** — Wire `.scroll-reveal` → `.visible` to stat bars, feature cards, pricing section, and "How it works" steps on every page (currently homepage-only).

5. **Count-up stats** — Homepage agent count, calls-routed, and benchmark test count animate from 0 on `IntersectionObserver` entry. One-shot per session.

6. **Micro-interactions** — Card hover lift (`translateY(-4px)`), CTA button shimmer sweep on hover, strategy pill active-state pulse. All respect `prefers-reduced-motion`.

7. **Monospace data typography** — Latency values, scores, call counts use `font-variant-numeric: tabular-nums` in JetBrains Mono across `/`, `/connect`, `/products/[slug]`, `/dashboard`.

**Acceptance:** Consistent dark-glass aesthetic across all pages. Lighthouse Performance ≥ 90, LCP < 2.5s, CLS < 0.1. All 51 QA checks remain green.

---

## Must-Have #3 — `skill.md` Agent-Native Integration (Developer Adoption)

The product spec defines "agent-native through skill.md files (self-registration, self-testing)" as a first-class customer path. It is not yet live. This is the highest-leverage developer adoption feature because agents can self-onboard with zero human steps: a developer ships a tool with a `skill.md`, and it appears in AgentPick rankings automatically.

**Deliverables:**

1. **`GET /skill.md`** — Machine-readable capability manifest at the well-known path. Describes AgentPick's routing, embed, crawl, and finance endpoints with auth format, input/output schema, and rate limits. Follows the emerging `skill.md` convention so AI agents (Claude, GPT-4o, etc.) can auto-discover and integrate AgentPick without human configuration.

2. **`POST /api/v1/router/register` accepts `skillUrl`** — When an agent POSTs `{ apiKey, skillUrl }`, AgentPick fetches the remote `skill.md`, validates the schema, and auto-registers the tool — no dashboard required.

3. **`/connect` page "Agent-Native" tab** — Alongside SDK/cURL tabs, add a tab showing two-line agent-native onboarding:
   ```
   # In your agent's system prompt or config:
   POST https://agentpick.dev/api/v1/router/register
   { "skillUrl": "https://yourtool.dev/skill.md" }
   ```

**Why this wins:** An agent discovers a tool, self-registers it, gets it benchmark-tested, and starts receiving traffic — fully automated, no human in the loop. Viral loop: every developer who adds a `skill.md` to their tool is a potential new AgentPick user.

**Acceptance:**
- `curl https://agentpick.dev/skill.md` → valid YAML/JSON manifest, 200 OK.
- `POST /api/v1/router/register` with `{ "skillUrl": "..." }` → fetches remote skill.md and registers tool.
- `/connect` page has Agent-Native tab with working code snippet.
- All 51 QA checks green post-deploy.

---

## Definition of Done

- [ ] `/router` nav link → 200 (no 404)
- [ ] QA passes 51/51 (voyage-embed name fix in test)
- [ ] `POST /api/v1/register` redirects correctly (308, not 404)
- [ ] Dark-glass tokens applied to benchmarks, rankings, agents, connect, dashboard pages
- [ ] No white flash on any page; body uses `var(--bg-base)`
- [ ] ScrollReveal active on all pages (not just homepage)
- [ ] Count-up stat animations on homepage
- [ ] Glass cards + hover lift on all card components site-wide
- [ ] CTA shimmer + strategy pulse micro-interactions live
- [ ] All animations off under `prefers-reduced-motion`
- [ ] `GET /skill.md` → 200 valid manifest
- [ ] `POST /api/v1/router/register` accepts `skillUrl` param
- [ ] `/connect` shows Agent-Native tab
- [ ] Lighthouse Performance ≥ 90 on `/` and `/benchmarks`

## Out of Scope (This Cycle)
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — blocked on `BENCHMARK_SECRET` env config, tracked with OpenClaw
- New routing strategies or tool integrations
- Stripe/billing changes
- Team/org accounts
