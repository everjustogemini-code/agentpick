# NEXT_VERSION.md — Cycle 3
**Date:** 2026-03-18
**Prepared by:** AgentPick PM
**QA Source:** QA_REPORT.md (2026-03-18) — score 56/57; 1× P1 + 1× P2 open
**Live site:** https://agentpick.dev (checked 2026-03-18)
**Rule:** Bugs first. No new features ship while P1/P2 remain.

---

## Must-Have Item 1 — Fix ALL Remaining P1/P2 Bugs (QA 56/57 → 57/57)

Three issues flagged in QA_REPORT.md. All are documentation/contract bugs — no core routing logic is broken. They must be resolved before Item 2 or 3 begins.

### P1-A — Docs must reflect actual `meta`/`data` response shape

**Issue:** Public code examples (homepage API carousel, `/connect` page, any README snippets) imply a flat response with top-level `tool` and `results` keys. The live response is:
```json
{
  "meta": { "tool_used": "...", "latency_ms": 120, "cost_usd": 0.001, "ai_classification": "...", "calls_remaining": 99 },
  "data": { "results": [...] }
}
```
Any client following current docs does `response.results` → `undefined`. Silent breakage.

**Actions:**
- Grep codebase for `response.tool`, `response.results`, `.tool_used` at root — replace with `response.meta.tool_used` and `response.data.results`.
- Add a response schema table in the API reference section of `/connect` showing the full two-level shape.
- Update SDK wrapper type definitions to `{ meta: { tool_used, latency_ms, cost_usd, ai_classification, calls_remaining }, data: { results: [] } }`.

### P1-B — Document that `meta.ai_classification` is null for non-`auto` strategies

**Issue:** `meta.ai_classification` is `null` when strategy is `balanced`, `best_performance`, or `cheapest`. Undocumented. Clients expecting a string silently get null and may crash.

**Actions:**
- Add inline callout on `/connect` strategy selector and in the API reference: *"`ai_classification` is only populated when `strategy=auto`. For all other strategies the field is `null`."*
- No backend change needed — documentation gap only.

### P2 — Remove dead endpoint references; add 301 redirects

**Issue:** `/api/v1/account/usage` and `/api/v1/developer/usage` return 404. Correct path is `/api/v1/router/usage`. Any docs or client code on old paths fails silently.

**Actions:**
- Grep codebase + all doc pages for `/account/usage` and `/developer/usage`; replace with `/api/v1/router/usage`.
- Add server 301 redirects from both dead paths to `/api/v1/router/usage` so existing integrations don't hard-fail.

**Done when:** QA score 57/57. Zero flat-key references in public docs. Dead endpoints return 301. `ai_classification` null behavior is documented inline.

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

**Mobile marquee fix** (noted as overflowing on < 640px)
- Constrain marquee items: `white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis` on mobile viewport.

**Files:** `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, arena and pricing component files.

**Acceptance:**
- Lighthouse ≥ 90 performance (mobile + desktop).
- All 51 automated QA checks remain green.
- Visual: hero gradient animates, cards show blur/glass effect, nav is frosted, CTA buttons glow on hover.

---

## Must-Have Item 3 — Framework Quickstart Templates (LangChain / CrewAI / AutoGen)

**Why:** The #1 developer adoption blocker for a routing layer is integration friction. Developers using popular agent frameworks need a 30-second path to AgentPick. This is the single highest-leverage unlock — no new backend infra required, pure DX investment.

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

- [ ] QA automated suite: 51/51 PASS
- [ ] QA manual score: 57/57 (all P1/P2 resolved)
- [ ] Zero doc or code references to flat `response.tool` / `response.results`
- [ ] `/api/v1/account/usage` + `/api/v1/developer/usage` → 301 to `/api/v1/router/usage`
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
