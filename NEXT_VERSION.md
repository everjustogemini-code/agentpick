# NEXT_VERSION — AgentPick v0.35

**Date:** 2026-03-14
**QA Round:** 13 — Score: 58/58 (clean, zero P0/P1/P2 bugs)
**Branch base:** main (post cycle-1 autopilot merge)

---

## Status: No Bugs — Build on Solid Foundation

QA Round 13 passed all 58 tests. Cycle-33 fixes are merged. API Bearer auth,
paid user flow, and visual regression all verified. No bug-first work required.

---

## Must-Have #1 — Major UI Upgrade: Glassmorphism + Motion Design

**What:** The current dark theme is functional but flat. The homepage hero,
pricing cards, and benchmark table need a premium upgrade to match the quality
bar set by Vercel/Linear/Resend. First impressions are the primary signup driver.

**Scope:**
- **Hero:** Add a slow-moving radial mesh gradient background (purple→blue, 8s
  CSS animation loop). Headline stagger-in animation per word (CSS
  `@keyframes`, 40ms delay between words). Bump headline to 72px/800 weight on
  desktop; one accent word in gradient color.
- **Glassmorphism cards:** All pricing cards, benchmark rows, and dashboard
  panels get `backdrop-filter: blur(12px)` + `background: rgba(255,255,255,0.04)`
  + `border: 1px solid rgba(255,255,255,0.08)` + subtle inner glow on hover.
  Replace all solid `#111`/`#0A0A0A` card backgrounds.
- **Frosted nav:** `backdrop-filter: blur(20px)` + `border-bottom:
  1px solid rgba(255,255,255,0.06)` activates on scroll (currently hard border).
- **Benchmark table:** Score bars animate in on scroll via IntersectionObserver
  (600ms ease-out fill). Rank #1 row gets a faint gold shimmer border
  (`conic-gradient` rotation, 4s loop).
- **CTA buttons:** Replace flat gradient with animated border shimmer
  (`conic-gradient` rotation, 3s loop). Add `scale(1.02)` on hover,
  `transition: 150ms`.
- **Typography:** Body line-height 1.75 (currently tighter). Subheadings
  Inter 700 weight. Code blocks keep JetBrains Mono.
- All animations must respect `prefers-reduced-motion: reduce`.

**Acceptance criteria:**
- QA script still passes 58/58 after changes
- Lighthouse Performance ≥ 85, CLS < 0.1
- `/`, `/connect`, `/dashboard`, `/products/tavily` all render correctly
- Visual review confirms glassmorphism on cards in both Chrome and Safari

---

## Must-Have #2 — Node.js / TypeScript SDK (`npm install agentpick`)

**What:** Ship a first-class TypeScript SDK on npm. Every JS/TS developer
building an agent currently must use the REST API manually or switch to Python.
`npm install agentpick` closes the largest single adoption gap.

**Scope:**
- Package `agentpick` on npmjs.com, ESM + CJS dual build, full TypeScript
  types exported.
- Core methods matching Python SDK parity: `route(capability, query, options?)`,
  `account()`, `usage()`, `calls()`, `setStrategy()`, `setBudget()`, `health()`
- Auto-retry on 5xx (max 2 retries, 200ms backoff). Fallback chain reported in
  response metadata, matching Python SDK behavior.
- `/connect` page: add "Node.js / TypeScript" tab alongside `pip install`
  tab. Show `npm install agentpick` as first step, then TypeScript snippet
  with `fetch()` + Bearer auth.
- Homepage code block: add Node.js tab with TypeScript syntax.
- JSDoc on all public methods. README quick-start copy-pasteable in < 30s.

**Acceptance criteria:**
- `npm install agentpick` works on Node 18+ without errors
- `route('search', 'latest AI benchmarks 2026')` returns correct tool + latency
- `/connect` TypeScript tab shows correct examples (QA script Part 3 updated
  to cover new tab)
- Package published with npm provenance attestation

---

## Must-Have #3 — `/dashboard/router` Request Inspector (Per-Call Detail Drawer)

**What:** "Why did my request route to X instead of Y?" is the most common
developer question. The current dashboard shows aggregates only. Per-call
visibility turns support requests into self-service debugging and increases
developer retention.

**Scope:**
- Clicking any row in the "Recent Calls" table opens a right-side drawer
  (slide-in, no page navigation, `300ms ease`).
- Drawer fields (9 total): raw query, capability detected, AI classification
  reasoning (`ai_routing_summary`), strategy applied, tool selected, fallback
  chain (pass/fail per attempted tool), latency breakdown (classify ms + tool
  ms + total ms), cost, response preview (500 char truncated + "copy full"
  button).
- Filter bar above calls table: filter by capability, strategy, tool, date
  range. State persisted in URL search params for shareable deep links.
- "Export JSON" button: downloads currently-filtered calls as `.json` matching
  the `/api/v1/router/calls` response schema.

**Acceptance criteria:**
- Drawer opens within 200ms on click (client-side, no extra network request
  for data already in the list)
- All 9 drawer fields render correctly for a sampled call from the QA test
  account
- Filter URL params are bookmarkable and restore state on reload
- Export JSON is valid and passes schema validation
- Dashboard QA (Part 8) still passes 4/4 after changes

---

## Out of Scope (defer to v0.36)

- OpenAI-compatible passthrough endpoint (`/v1/chat/completions`) — needs
  rate-limit design
- Shareable benchmark embed widgets + SVG badges — good idea, defer
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — ongoing
  Pclaw/OpenClaw collaboration, tracked separately in
  `/Users/pwclaw/.openclaw/workspace/agentpick-benchmark/`
- `npx agentpick init` CLI — defer until npm SDK ships first

---

## Summary Table

| # | Item | Category | Acceptance Gate |
|---|------|----------|-----------------|
| 1 | Glassmorphism + motion design upgrade | UI Upgrade | 58/58 QA + Lighthouse ≥ 85 + visual review |
| 2 | Node.js / TypeScript npm SDK | Developer Adoption | npm install works + /connect TS tab live |
| 3 | Request Inspector drawer in dashboard | Developer Retention | 9 fields + filter + export + 58/58 QA |
