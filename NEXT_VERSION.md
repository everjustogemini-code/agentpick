# NEXT_VERSION.md — Cycle 11
**Date:** 2026-03-18
**Prepared by:** AgentPick PM
**QA Source:** QA_REPORT.md cycle 10 — 51/51 PASS, zero open bugs
**Scope:** UI overhaul + new developer feature

---

## Bug Status

**No P0/P1/P2 bugs.** QA cycle 10 returned 51/51 PASS. All issues from prior cycles are resolved.
Proceeding directly to UI upgrade (priority #2) and developer adoption feature (priority #3).

---

## Must-Have Item 1 — Fix ALL Remaining P1/P2 Bugs
**NONE.** QA cycle 10: 51/51 PASS. No bugs to fix.

---

## Must-Have Item 2 — Major UI Overhaul (Glassmorphism Design System)

**Why:** Current UI is functional but visually flat. Competitors (Exa, Tavily, Firecrawl) have polished, modern landing pages that convert better. First impressions drive trial signups; the current design undersells the product.

**Specific changes:**

**Hero section**
- Replace flat dark background with animated gradient mesh (indigo→violet→slate) using CSS `@keyframes` — no external animation library.
- Animated subtle grid/dot pattern overlay via `background-image: radial-gradient(...)` CSS.

**Typography**
- Load `Inter` via `next/font` (already supported). Hero headline → 72px / weight 800 / gradient text clip: `bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent`.
- Subheadline → 20px / weight 400 / `text-slate-300`.

**Glassmorphism cards**
- All feature cards on homepage, pricing cards, and arena result tiles: `backdrop-filter: blur(12px)` + `bg-white/5 border border-white/10 rounded-2xl`.

**Navigation**
- Frosted glass fixed nav: `backdrop-blur-md bg-black/30 border-b border-white/10`. Fade-in on scroll via `IntersectionObserver`.

**Homepage code block**
- Replace raw `<pre>` with `shiki`-highlighted block (already a common Next.js dep; add if absent).
- Add a copy-button with micro-animation: scale up on click + checkmark icon swap for 1.5s.

**CTA buttons**
- Replace flat buttons with `bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/40 transition-all`.

**Scroll animations**
- `@keyframes fadeInUp` + `IntersectionObserver` stagger-reveals each homepage section as it enters viewport. Pure CSS + vanilla JS — no Framer Motion.

**Files:** `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, arena + pricing component files.

**Acceptance:**
- Lighthouse performance ≥ 90 (mobile + desktop).
- All 51 existing QA checks remain green.
- Visually verified: hero gradient animates, cards show blur effect, nav is frosted.

---

## Must-Have Item 3 — Framework Quickstart Templates (LangChain / CrewAI / AutoGen)

**Why:** The #1 adoption blocker for a routing layer is integration friction. Developers already using LangChain, CrewAI, or AutoGen need a 30-second path to AgentPick, not a 30-minute one. Lowering the copy-paste barrier is the single highest-leverage unlock for developer growth.

**Specific deliverables:**

**New page `/quickstart`**
- Three tab-panels: LangChain | CrewAI | AutoGen.
- Each panel shows:
  1. One `pip install` command (copyable)
  2. A minimal code snippet (≤ 15 lines) that drops AgentPick in as the tool router via `AGENTPICK_API_KEY` env var, pointing at the existing `/v1/chat/completions` endpoint
  3. A "Copy" button + a "Run in Playground" button that deep-links to `/playground?framework=<name>&query=<example>`

**New API route `GET /api/v1/quickstart/[framework]`**
- Returns JSON: `{ framework, installCmd, codeSnippet, playgroundUrl }` for values `langchain | crewai | autogen`.
- Enables OpenClaw agent and external tooling to fetch snippets programmatically.

**Homepage "Works with your stack" row**
- Add LangChain / CrewAI / AutoGen / OpenAI Agents SDK logo strip below the hero code block.
- Each logo links to `/quickstart#<framework>`.
- No new backend logic — all snippets target the already-live `/v1/chat/completions` endpoint.

**Files:** `src/app/quickstart/page.tsx` (new), `src/app/api/v1/quickstart/[framework]/route.ts` (new), `src/app/page.tsx` (logo strip addition).

**Acceptance:**
- `GET /agentpick.dev/quickstart` renders all three framework tabs with correct content.
- Each "Run in Playground" link deep-links correctly and pre-fills the Playground.
- `GET /api/v1/quickstart/langchain` → 200 JSON with `installCmd` and `codeSnippet` fields.
- All 51 existing QA checks remain green.

---

## Out of Scope (Cycle 11)
- Benchmark runner internal endpoint (tracked separately by Pclaw / OpenClaw)
- New blog articles
- Stripe billing changes
- Admin panel changes
