# NEXT_VERSION — AgentPick v0.34

**Date:** 2026-03-14
**QA Round:** 12 — Score: 57/57 (clean, no bugs)
**Branch base:** bugfix/cycle-33

---

## Status: No Bugs — Build on Solid Foundation

QA Round 12 passed all 57 tests. No P0, P1, or P2 issues exist.
Cycle-33 fixes (deep-research misclassification, latency metadata, models plural) are merged and verified.
No bug-first work required. Proceeding to UI + feature priorities.

---

## Must-Have #1 — Homepage Dark-Mode Overhaul with Glassmorphism + Motion

**What:** Rebuild the homepage (and sibling pages `/rankings`, `/benchmarks`, `/agents`, `/live`) with the same premium dark design language already present on `/connect`.

**Scope:**
- Replace `#FAFAFA` light hero with a deep dark base (`#08080f`) and an animated radial gradient mesh (purple + blue glow, subtle motion)
- Apply glassmorphism to all card components: `backdrop-blur-md`, `rgba(255,255,255,0.04)` fill, `1px solid rgba(255,255,255,0.08)` border, `box-shadow` glow on hover
- Scroll-reveal animations: staggered fade-up for hero text lines, counter animations on live stats (calls routed, tools integrated, uptime %), card lift (`translateY(-4px)`) on hover
- Typography upgrade: hero headline to 72px/800 weight with one gradient-colored accent word; subheadline to 20px/400 at 1.6 line-height; improved spacing rhythm throughout
- Dark nav with `backdrop-blur` and no hard border — consistent across all dark pages
- Apply dark glass treatment to `/rankings`, `/benchmarks`, `/agents`, `/live` (currently inconsistent with the `/connect` aesthetic)

**Acceptance criteria:**
- QA script still passes 57/57 after changes
- Homepage, /rankings, /benchmarks, /agents, /live all render in dark mode with glass card components
- Lighthouse performance score does not regress below pre-change baseline

---

## Must-Have #2 — Node.js / TypeScript SDK (`npm install agentpick`)

**What:** Ship a first-class TypeScript SDK on npm mirroring the Python SDK's surface area.

**Scope:**
- Package: `agentpick` on npm, ESM + CJS dual build, full TypeScript types exported
- Core methods: `route(capability, query, options?)`, `account()`, `usage()`, `calls()`, `setStrategy()`, `setBudget()`, `health()`
- Auto-retry and fallback reporting behavior matching the Python SDK
- `/connect` page: add `npm install agentpick` tab alongside existing `pip install agentpick`
- Homepage code examples: add Node.js tab with TypeScript syntax alongside Python tab
- JSDoc comments on all public methods; README with copy-paste quick-start

**Acceptance criteria:**
- `npm install agentpick` installs without errors on Node 18+
- `route('search', 'latest AI benchmarks 2025')` returns correct tool and latency
- Listed on `/connect` with full parity to the Python code examples
- Package published to npmjs.com under `agentpick`

**Why:** Every JS/TS developer building an agent — the primary target audience — currently must use the REST API manually or switch to Python. `npm install agentpick` closes the largest single adoption gap for the biggest developer segment.

---

## Must-Have #3 — `/dashboard/router` Request Inspector (Per-Call Detail Drawer)

**What:** Add a drill-down call detail panel to the Router Dashboard so developers can self-serve debug individual routing decisions without filing support requests.

**Scope:**
- Clicking any row in the "Recent Calls" table opens a right-side drawer (no page navigation)
- Drawer fields: raw query, capability detected, AI classification reasoning (`ai_routing_summary`), strategy applied, tool selected, fallback chain attempted (with pass/fail per tool), latency breakdown (classify ms + tool ms + total ms), cost, response preview (truncated at 500 chars with "copy full" button)
- Filter bar above the calls table: filter by capability, strategy, tool, date range — state persisted in URL params for shareable deep links
- "Export JSON" button: downloads currently filtered calls as a `.json` file

**Acceptance criteria:**
- Any call row click opens the drawer within 200ms (client-side, no extra network request for data already in the calls list)
- All 9 fields render correctly for a sampled call from the live QA test account
- Filter URL params are bookmarkable and restore filter state on reload
- Export produces valid JSON matching the `/api/v1/router/calls` response schema

**Why:** "Why did my request route to X instead of Y?" is the most common developer question. The current dashboard shows only aggregates. Per-call visibility converts support tickets into self-service debugging and directly increases developer trust and retention.

---

## Out of Scope (defer to v0.35)

- OpenAI-compatible passthrough endpoint (`/v1/chat/completions`) — valuable but requires careful rate-limit design
- GitHub Actions workflow template — defer until Node SDK ships so the action can use it
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — ongoing Pclaw/OpenClaw collaboration, tracked separately in `/Users/pwclaw/.openclaw/workspace/agentpick-benchmark/`

---

## Summary Table

| # | Item | Category | Acceptance Gate |
|---|------|----------|-----------------|
| 1 | Dark-mode homepage + sibling pages | UI Upgrade | 57/57 QA + visual review |
| 2 | Node.js / TypeScript npm SDK | Developer Adoption | npm install works + /connect updated |
| 3 | Request Inspector drawer in dashboard | Developer Adoption | All 9 fields + filter + export |
