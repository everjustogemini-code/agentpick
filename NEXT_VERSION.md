# NEXT_VERSION.md
**Generated:** 2026-03-19
**PM:** AgentPick PM (claude-sonnet-4-6)
**QA baseline:** QA_REPORT.md (Cycle 23, 2026-03-19) — score **57/58** | P0: none | P1: 1 open
**Priority rule:** P1 bug first, then UI upgrade, then new feature.

---

## Must-Have #1 — Fix P1: Normalize & Document API Response Envelope

**Source:** QA_REPORT.md P1 Issue (Cycle 23)

**Problem:** `POST /api/v1/router/search` wraps all payload under a `data` key. Routing metadata fields (`tool`, `resultCount`, `latencyMs`) are nested inside `data` rather than accessible at the top level. The QA suite compensates for this, but SDK consumers regularly miss these fields and open support issues.

**Fix:**
1. Add a top-level `meta` object to every search response:
   ```json
   {
     "meta": { "tool": "tavily", "latencyMs": 151, "resultCount": 10, "strategy": "balanced" },
     "data": { "query": "...", "answer": "...", "results": [...] }
   }
   ```
2. Update `/connect` page API reference with the exact response shape, including an explicit note about the `data` envelope.
3. Add a dedicated "Reading routing metadata" code example to `/connect` showing `response.meta.tool` and `response.meta.latency_ms`.
4. Update the `agentpick` PyPI package to expose `response.meta` as a first-class attribute alongside `response.data`.

**Acceptance:** `POST /api/v1/router/search` returns `meta` at the top level. `/connect` QA suite 7/7 still passes. No SDK consumer needs to drill into `data` to find tool or latency.

---

## Must-Have #2 — Major UI Overhaul: Glassmorphism Design System

Full visual upgrade across all pages. All existing QA checks must pass unchanged.

**Typography:**
- Hero headline: Geist (or Inter Variable), `64px` desktop, `bold 700`
- Code/metrics: JetBrains Mono — all inline code blocks and latency numbers
- Body `line-height: 1.6`, minimum contrast `4.5:1` (WCAG AA)

**Color palette:**
- Background: `#0a0a0f` (near-black)
- Primary accent: `#7c3aed` (violet)
- Secondary accent: `#06b6d4` (cyan)
- Card surface: `rgba(255,255,255,0.06)`
- Keep existing brand green `#2fe92b` for status/live indicators only

**Glass cards:**
```css
backdrop-filter: blur(16px);
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.12);
border-radius: 16px;
```

**Animations (CSS-only — no new JS bundle weight):**
- Hero stat counters count up on first paint
- Cards: `fade-in-up` on scroll via `IntersectionObserver` + `@keyframes`
- Tool card hover: `transform: translateY(-4px)` + box-shadow bloom
- Animated hero gradient mesh background (slow-moving CSS `@keyframes`, no canvas/JS)
- Hero headline: typewriter reveal cycling tool names (Tavily → Exa → Perplexity → Polygon → Voyage)

**Homepage hero:** Split layout — left: headline + pip install CTA; right: live syntax-highlighted routing code snippet with pulsing latency badge (`151ms ✓`).

**Rankings page:** Replace card grid with sortable leaderboard table — rank badge, tool logo, composite score, delta sparkline vs. last week. Filter tabs: Search / Embed / Crawl.

**Mobile:** Full responsive pass — nav collapse `< 768px`, card stacking, code block overflow fix.

**Acceptance:** Lighthouse performance ≥85. All QA page load + content tests pass unchanged.

---

## Must-Have #3 — No-Auth Live Playground (Developer Adoption)

**Goal:** Reduce time-to-first-real-API-result from ~10 minutes (register → key → docs → code) to under 60 seconds — with zero sign-up required.

**Deliverable: `agentpick.dev/playground`**
- In-browser Monaco editor pre-loaded with a Python/JS/curl snippet
- Backed by a rate-limited anonymous key (10 req/day per IP, no registration)
- User types a query, clicks **Run**, sees real JSON response rendered inline — tool used, latency, results, answer
- Response panel shows: `meta.tool`, `meta.latencyMs`, `data.answer`, top 3 results with scores
- Sticky "Get your own key →" CTA fires after first successful run
- Shareable URL: `agentpick.dev/playground?q=<query>` so developers can share live demos

**Why this drives adoption:**
- Removes the sign-up wall before value — biggest known drop-off point
- Shared playground links act as warm referrals
- Showcases AI routing quality (realtime vs deep-research) before any commitment
- Pairs directly with the `pip install agentpick` CTA already on the homepage

**Acceptance:** Anonymous user can run a search and see real results in under 60s. Rate limiting (10/day/IP) enforced server-side. Shared `?q=` links render correctly.

---

## Ship Order

```
1. P1 envelope fix     →  deploy immediately, isolated change, no QA regression
2. UI overhaul         →  single batch deploy (never ship partial redesign)
3. Playground          →  deploy after UI; announce together on launch day
```

Never invert this order. A developer who shares a playground link must land on a polished, bug-free product.

---

## Out of Scope This Cycle
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`)
- New search tool integrations (Brave, Serpapi)
- Pricing page changes
