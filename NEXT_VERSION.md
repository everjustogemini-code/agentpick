# NEXT_VERSION.md
**Generated:** 2026-03-19
**PM:** AgentPick PM (claude-sonnet-4-6)
**QA baseline:** QA_REPORT.md (2026-03-19) — score **62/62** | P0: none | P1: 2 open
**Priority rule:** All P1 bugs first, then UI upgrade, then new feature.

---

## Must-Have #1 — Fix Both P1 Bugs

### P1-A: `/api/v1/developer/register` returns 404

**Problem:** Any client or doc that uses the `/developer/` path prefix gets a silent 404. The only working registration endpoint is `POST /api/v1/router/register`.

**Fix:**
- Add a permanent 308 redirect: `/api/v1/developer/*` → `/api/v1/router/*` in `next.config.js` redirects array (or equivalent routing layer).
- Audit every reference in `/connect` page code snippets, README, SDK clients, and any OpenClaw benchmark scripts — replace `/api/v1/developer/` with `/api/v1/router/`.

**Acceptance:** `POST /api/v1/developer/register` returns 308 → forwards to `/api/v1/router/register` → 200. No existing docs or code examples reference the dead path.

---

### P1-B: `/products/tavily` missing Tavily API pricing

**Problem:** The product page shows AgentPick benchmark data but omits Tavily's own pricing tiers. Developers comparing total cost are left guessing.

**Fix:**
- Add a static "Tavily API Pricing" section to `/products/tavily` (and scaffold the same section for all future product pages).
- Show Tavily's three public tiers: Free (1,000 searches/mo), Researcher ($35/mo, 10k), Business ($200/mo, 100k).
- Include a side-by-side "Via AgentPick" column showing the AgentPick cost for equivalent volume using the routing fee model.
- Mark data as "as of [date], verify at tavily.com" — do not scrape dynamically; static is fine.

**Acceptance:** `/products/tavily` renders a pricing comparison table. QA page load test still passes 200.

---

## Must-Have #2 — Major UI Overhaul: Glassmorphism Design System

Full visual upgrade across all pages. No content removed; all existing QA checks must still pass.

**Typography:**
- Headings: Inter Variable (or `font-display: swap` CDN load). Hero `≥56px` desktop, `bold`.
- Code/metrics: JetBrains Mono. All inline code blocks and latency numbers.
- Body line-height `1.6`, min contrast ratio `4.5:1` (WCAG AA) everywhere.

**Color palette:**
- Background: `#0a0a0f` (near-black)
- Primary accent: `#7c3aed` (violet)
- Secondary accent: `#06b6d4` (cyan)
- Card surface: `rgba(255,255,255,0.06)`

**Glass cards:**
```css
backdrop-filter: blur(16px);
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.12);
border-radius: 16px;
```

**Animations (CSS-only, no new JS bundle weight):**
- Hero stat counters count up on first paint.
- Section/card `fade-in-up` on scroll (`IntersectionObserver` + `@keyframes`).
- Tool card hover: `transform: translateY(-4px)` + box-shadow bloom.
- Live feed rows: slide in from left with 80ms stagger.

**Homepage hero:** Split layout — left: headline + CTA button; right: animated syntax-highlighted routing code snippet with a pulsing latency badge (e.g., `725ms ✓`).

**Rankings page:** Replace category card grid with a sortable leaderboard table: rank badge, tool logo, composite score, delta sparkline vs. last week. Filter tabs by capability (search / embed / crawl).

**Mobile:** Full responsive pass — fix nav collapse (`< 768px`), card stacking, code block horizontal overflow.

**Acceptance:** Lighthouse performance ≥85. All QA suite page/content tests pass unchanged.

---

## Must-Have #3 — One-Click SDK Quickstart (Developer Adoption)

**Goal:** Reduce time-to-first-successful-API-call from ~10 min to < 60 seconds.

**Deliverable A — `/quickstart` page (3-step wizard):**
1. Enter email → API key generated inline (no separate `/register` round-trip visible to user).
2. Key auto-injected into a copyable code snippet (curl / Python / JS tabs).
3. "Run it" button executes the search live on the page and renders the JSON response — user sees real data before leaving the page.

**Deliverable B — `agentpick` npm + PyPI packages:**
- Thin wrapper over `POST /api/v1/route/search`. Publish both.
- Install: `npm i agentpick` / `pip install agentpick`
- Usage: `agentpick.search("query", key="ah_live_sk_...")`
- README for each package links back to `agentpick.dev/quickstart`.
- This is the highest-leverage adoption lever: agents embed packages before reading REST docs.

**Deliverable C — `/connect` page tab upgrade:**
- Replace current static code block with three tabs: "REST API" / "Python SDK" / "Node SDK".
- Each tab shows the same search call in its respective style, pre-filled with the signed-in user's key (or `YOUR_API_KEY` placeholder).

**Acceptance:**
- `/quickstart` produces a working API key and live response end-to-end.
- `npm i agentpick` and `pip install agentpick` install and run without errors.
- `/connect` QA suite 7/7 still passes.

---

## Ship Order

```
1. P1-A + P1-B bug fixes   →  deploy immediately, no QA regression
2. UI overhaul              →  single batch deploy (never ship partial redesign)
3. SDK quickstart           →  deploy after UI; announce together on launch day
```

Do not invert this order. Developers who land on the quickstart must hit a polished, bug-free product.

---

## Out of Scope This Cycle
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — no blocking dependency
- New search tool integrations
- Pricing page changes
