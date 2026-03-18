# NEXT_VERSION.md — Cycle 3
**Date:** 2026-03-18
**Prepared by:** AgentPick PM
**QA Source:** QA_REPORT.md (2026-03-18) — score 59/60; 2× P1 + 1× P2 open
**Live site:** https://agentpick.dev (checked 2026-03-18)
**Rule:** Bugs first. No new features ship while P1/P2 remain.

---

## Must-Have Item 1 — Fix ALL Remaining P1/P2 Bugs

Three issues flagged in QA_REPORT.md. All are API contract bugs — no core routing logic is broken. Must be resolved before Items 2 or 3 begin.

### P1-A — Flatten `calls` and `cost_usd` in `/api/v1/router/usage` response

**Issue:** `GET /api/v1/router/usage?period=7d` returns:
```json
{
  "callsThisMonth": 42,
  "stats": { "totalCostUsd": 0.087 }
}
```
Documented contract exposes top-level `calls` and `cost_usd`. Any client doing `data['calls']` or `data['cost_usd']` gets `None`/`undefined`. The automated QA script hard-codes `True` for this check, so it silently passes — real client integrations break.

**Actions:**
- Add top-level aliases `calls` and `cost_usd` to the usage response (keep existing fields for backwards compatibility):
  ```json
  { "calls": 42, "cost_usd": 0.087, "callsThisMonth": 42, "stats": { "totalCostUsd": 0.087 } }
  ```
- Update the API reference table on `/connect` to show the canonical field names `calls` and `cost_usd`.
- Fix the QA script to actually assert `data['calls']` and `data['cost_usd']` exist at top-level (remove the hard-coded `True`).

**Done when:** `GET /api/v1/router/usage` returns top-level `calls` (int) and `cost_usd` (float). QA assertion is a real check, not a stub.

---

### P1-B — Document that `meta.ai_classification` is null for non-`auto` strategies

**Issue:** `meta.ai_classification` is `null` when strategy is `balanced`, `best_performance`, or `cheapest`. Undocumented. Clients expecting a non-null string may crash at `classification.toLowerCase()` etc.

**Actions:**
- Add inline callout on `/connect` strategy selector section and in the API reference:
  > `ai_classification` is only populated when `strategy=auto`. For all other strategies the field is `null`.
- No backend change needed — documentation gap only.

**Done when:** Both the strategy selector UI and the API reference table document the null behavior explicitly.

---

### P2 — Add 301 redirect from `/api/v1/account` to `/api/v1/router/usage`

**Issue:** Any docs or third-party guides referencing a standalone `/api/v1/account` path return 404. The correct path is `/api/v1/router/usage`, which already returns `plan`, `monthlyLimit`, `callsThisMonth`, `strategy`, and `account` fields.

**Actions:**
- Add a server-side 301 redirect: `GET /api/v1/account` → `GET /api/v1/router/usage`.
- Grep all doc pages and code for `/api/v1/account` references; update to `/api/v1/router/usage`.

**Done when:** `GET /api/v1/account` returns HTTP 301 → `/api/v1/router/usage`. Zero 404s from account path.

---

## Must-Have Item 2 — Major UI Overhaul (Glassmorphism + Motion Design System)

**Why:** The current dark/green design is functional but static. Competitors (Exa, Tavily, Firecrawl) have polished, animated landing pages that convert better on first impression. The live site has the right bones — it needs polish, not a redesign.

**Specific changes:**

**Hero section**
- Animated gradient mesh background (indigo→violet→slate) via CSS `@keyframes` — no external lib.
- Animated dot/grid overlay using `radial-gradient` for depth.

**Typography**
- Load `Inter` via `next/font`. Hero headline → 72px / weight 800 / gradient text: `bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent`.
- Subheadline → 20px / weight 400 / `text-slate-300` / line-height 1.65.

**Glassmorphism cards**
- Feature cards, pricing cards, arena comparison rows: `backdrop-filter: blur(12px)` + `bg-white/5 border border-white/10 rounded-2xl`. Replace solid card backgrounds.

**Navigation**
- Frosted glass fixed nav: `backdrop-blur-md bg-black/30 border-b border-white/10`. Fade-in at scroll offset 40px via `IntersectionObserver`.

**Code blocks**
- Replace raw `<pre>` with `shiki`-highlighted blocks. Copy button with checkmark micro-animation (1.5s, scale + icon swap).

**CTA buttons**
- `bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/40 transition-all`.

**Scroll animations**
- `@keyframes fadeInUp` + `IntersectionObserver` stagger-reveal per section. Pure CSS + vanilla JS, no Framer Motion dependency.

**Mobile marquee fix** (overflowing on < 640px)
- Constrain marquee items: `white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis` on mobile viewport.

**Files:** `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, arena and pricing component files.

**Acceptance:**
- Lighthouse ≥ 90 performance (mobile + desktop).
- All 51 automated QA checks remain green.
- Visual: hero gradient animates, cards show blur/glass effect, nav is frosted, CTA buttons glow on hover.

---

## Must-Have Item 3 — Framework Quickstart Templates (LangChain / CrewAI / AutoGen)

**Why:** The #1 developer adoption blocker for a routing layer is integration friction. Developers using popular agent frameworks need a 30-second path to AgentPick. No new backend infra required — pure DX investment with the highest leverage per hour of work.

**Deliverables:**

**New page `/quickstart`**
- Three tab-panels: `LangChain` | `CrewAI` | `AutoGen`.
- Each tab: (1) one-line `pip install` (copyable), (2) ≤15-line code snippet using `AGENTPICK_API_KEY` env var, (3) "Copy" + "Run in Playground" buttons.
- No authentication required to view the page.

**New API route `GET /api/v1/quickstart/[framework]`**
- Returns `{ framework, installCmd, codeSnippet, playgroundUrl }` for `langchain | crewai | autogen`.
- Lets OpenClaw and external tooling fetch snippets programmatically without scraping HTML.

**Homepage "Works with your stack" logo strip**
- LangChain / CrewAI / AutoGen / OpenAI Agents SDK logos below the hero code block, each linking to `/quickstart#<framework>`.
- No backend logic — logos are static SVGs, links are shallow anchors.

**Files:** `src/app/quickstart/page.tsx` (new), `src/app/api/v1/quickstart/[framework]/route.ts` (new), `src/app/page.tsx` (logo strip addition).

**Acceptance:**
- `/quickstart` renders all three tabs with correct install + code content.
- `GET /api/v1/quickstart/langchain` → 200 JSON with `installCmd` and `codeSnippet`.
- "Run in Playground" deep-links pre-fill query and strategy correctly.
- All 51 existing QA checks remain green.

---

## Definition of Done (all 3 items)

- [ ] QA automated suite: 51/51 PASS (with real assertion on `calls`/`cost_usd`, not stub)
- [ ] `GET /api/v1/router/usage` returns top-level `calls` (int) and `cost_usd` (float)
- [ ] `GET /api/v1/account` → 301 to `/api/v1/router/usage`
- [ ] `ai_classification` null behavior documented on `/connect` and in API reference
- [ ] Lighthouse ≥ 90 on homepage (mobile + desktop)
- [ ] Glassmorphism cards, animated hero, frosted nav live on https://agentpick.dev
- [ ] `/quickstart` live with three framework tabs and working deep-links
- [ ] `GET /api/v1/quickstart/langchain|crewai|autogen` → 200 JSON

## Out of Scope (this cycle)
- Benchmark runner internal endpoint — tracked separately by Pclaw / OpenClaw
- Stripe/billing changes
- Admin panel changes
- New blog articles
