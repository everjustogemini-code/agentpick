# NEXT_VERSION.md — Cycle 2
**Date:** 2026-03-18
**Prepared by:** AgentPick PM
**QA Source:** QA_REPORT.md (2026-03-18) — score 56/57; P1 + P2 bugs open
**Rule:** Bugs first. No new features ship while P1/P2 remain.

---

## Must-Have Item 1 — Fix ALL Remaining P1/P2 Bugs

**QA score:** 56/57 — three open issues must be resolved before anything else ships.

### P1-A: Docs and SDK wrappers must reflect actual `meta`/`data` response structure

**Issue:** Every public code example (homepage API carousel, `/connect` page, README snippets) implies a flat response with top-level `tool` and `results` keys. The actual live response is:
```json
{
  "meta": { "tool_used": "...", "latency_ms": 120, "cost_usd": 0.001, "ai_classification": "...", "calls_remaining": 99 },
  "data": { "results": [...] }
}
```
Clients following the docs will silently get `undefined` on `response.tool` and `response.results`.

**Action:**
- Grep codebase and all doc pages for `response.tool`, `response.results`, `.tool_used` at root level — replace every occurrence with `response.meta.tool_used` and `response.data.results`.
- Add an explicit response schema table in the API reference section of `/connect` showing the full two-level shape.
- Update any SDK wrapper types/interfaces to match `{ meta: {...}, data: { results: [...] } }`.

### P1-B: Document that `meta.ai_classification` is null for non-`auto` strategies

**Issue:** `meta.ai_classification` is `null` when `strategy` is `balanced`, `best_performance`, or `cheapest`. This is undocumented — clients expecting a string silently get null.

**Action:**
- Add an inline callout on the strategy selector docs (on `/connect`) and in the API reference: "`ai_classification` is only populated when `strategy=auto`. For all other strategies it is `null`."
- No backend change needed — this is a documentation gap only.

### P2: Remove dead endpoint references; add 301 redirects

**Issue:** `/api/v1/account/usage` and `/api/v1/developer/usage` return 404. The correct path is `/api/v1/router/usage`. Any docs or examples pointing to the old paths silently fail.

**Action:**
- Grep codebase and docs for `/account/usage` and `/developer/usage` — replace all references with `/api/v1/router/usage`.
- Add server-side 301 redirects from both dead paths to `/api/v1/router/usage` so existing client integrations don't hard-fail.

**Done when:** QA score returns to 57/57. No flat-key references in any public doc. Dead endpoints return 301, not 404. `ai_classification` null behavior is documented.

---

## Must-Have Item 2 — Major UI Overhaul (Glassmorphism Design System)

**Why:** Competitors (Exa, Tavily, Firecrawl) have polished, modern landing pages that convert better. The current UI is functional but flat — it undersells the product on first impression.

**Specific changes:**

**Hero section**
- Replace flat dark background with animated gradient mesh (indigo→violet→slate) via CSS `@keyframes` — no external animation lib needed.
- Animated dot/grid overlay using `background-image: radial-gradient(...)`.

**Typography**
- Load `Inter` via `next/font`. Hero headline → 72px / weight 800 / gradient text clip: `bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent`.
- Subheadline → 20px / weight 400 / `text-slate-300`.

**Glassmorphism cards**
- All feature cards, pricing cards, arena tiles: `backdrop-filter: blur(12px)` + `bg-white/5 border border-white/10 rounded-2xl`.

**Navigation**
- Frosted glass fixed nav: `backdrop-blur-md bg-black/30 border-b border-white/10`. Fade-in on scroll via `IntersectionObserver`.

**Code blocks**
- Replace raw `<pre>` with `shiki`-highlighted blocks. Copy button with micro-animation: scale + checkmark swap for 1.5s.

**CTA buttons**
- `bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/40 transition-all`.

**Scroll animations**
- `@keyframes fadeInUp` + `IntersectionObserver` stagger-reveal for each homepage section. Pure CSS + vanilla JS, no Framer Motion.

**Files:** `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, arena and pricing component files.

**Acceptance:**
- Lighthouse ≥ 90 performance (mobile + desktop).
- All 51 automated QA checks remain green.
- Visual: hero gradient animates, cards show blur, nav is frosted glass.

---

## Must-Have Item 3 — Framework Quickstart Templates (LangChain / CrewAI / AutoGen)

**Why:** The #1 adoption blocker for a routing layer is integration friction. Developers using LangChain, CrewAI, or AutoGen need a 30-second path to AgentPick, not a 30-minute one. This is the single highest-leverage developer adoption unlock.

**Deliverables:**

**New page `/quickstart`**
- Three tab-panels: LangChain | CrewAI | AutoGen.
- Each panel: (1) one `pip install` command (copyable), (2) ≤15-line code snippet using `AGENTPICK_API_KEY` env var against the live `/v1/chat/completions` endpoint, (3) "Copy" + "Run in Playground" buttons.

**New API route `GET /api/v1/quickstart/[framework]`**
- Returns `{ framework, installCmd, codeSnippet, playgroundUrl }` for `langchain | crewai | autogen`.
- Allows OpenClaw and external tooling to fetch snippets programmatically.

**Homepage "Works with your stack" logo strip**
- Add LangChain / CrewAI / AutoGen / OpenAI Agents SDK logos below the hero code block, each linking to `/quickstart#<framework>`.
- No new backend logic — snippets target the already-live endpoint.

**Files:** `src/app/quickstart/page.tsx` (new), `src/app/api/v1/quickstart/[framework]/route.ts` (new), `src/app/page.tsx` (logo strip addition).

**Acceptance:**
- `/quickstart` renders all three tabs with correct install + code content.
- `GET /api/v1/quickstart/langchain` → 200 JSON with `installCmd` and `codeSnippet`.
- "Run in Playground" deep-links pre-fill correctly.
- All 51 existing QA checks remain green.

---

## Definition of Done (all 3 items)

- [ ] QA automated suite: 51/51 PASS
- [ ] QA manual score: 57/57 (all P1/P2 resolved)
- [ ] No docs or code examples reference flat `response.tool` or `response.results`
- [ ] Dead endpoints `/api/v1/account/usage` + `/api/v1/developer/usage` return 301 → `/api/v1/router/usage`
- [ ] `ai_classification` null behavior documented on `/connect` and in API reference
- [ ] Lighthouse ≥ 90 on homepage (mobile + desktop)
- [ ] `/quickstart` live with all three framework tabs and working deep-links
- [ ] `GET /api/v1/quickstart/langchain|crewai|autogen` → 200 JSON

## Out of Scope (this cycle)
- Benchmark runner internal endpoint (tracked by Pclaw / OpenClaw separately)
- New blog articles
- Stripe billing changes
- Admin panel changes
