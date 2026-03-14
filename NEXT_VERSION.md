# NEXT_VERSION.md — AgentPick vNext
**Generated:** 2026-03-14
**Based on:** QA_REPORT.md (2026-03-14 03:20 run, score 40/51 raw / ~84% adjusted), git log, live site

---

## Must-Have #1 — Fix All Remaining P1 + P2 Bugs

**NOTHING ELSE SHIPS UNTIL THESE ARE DONE.**

### P1 — Crawl endpoint broken
`POST /api/v1/route/crawl {"url": "..."}` returns `400 VALIDATION_ERROR: params object is required`.
The most basic documented use case fails.
**Fix:** Accept bare `{"url": "..."}` by reading `body.url ?? body.params?.url` in the handler. Remove the hard requirement for the `params` wrapper. File: `src/app/api/v1/route/crawl/route.ts`.

### P2 — `cheapest` strategy routes to Tavily (wrong cost ranking)
Tavily costs ~$0.001/call; Serper/Brave cost ~$0.0001/call — Tavily is 10× more expensive.
**Fix:** Update cost ranking map so `cheapest` resolves `brave-search → serper → serpapi-google → tavily → exa-search`. File: strategy routing table (likely `src/lib/router/strategies.ts`).

### P2 — Priority endpoint field name mismatch
`POST /api/v1/router/priority {"search": [...]}` → `400 Provide tools/priority_tools`.
API expects `priority_tools`; docs/SDK reference `search`.
**Fix:** Accept `search`, `tools`, and `priority_tools` as aliases, mapping all to `priority_tools` internally. File: `src/app/api/v1/router/priority/route.ts`.

### P2 — Account fields missing from usage response
`/api/v1/router/usage` returns only `plan`; `monthlyLimit`, `callsThisMonth`, `strategy` are absent.
Dashboard and SDK clients display blank values.
**Fix:** Join the user record and return the full account object: `{ plan, monthlyLimit, callsThisMonth, strategy }`. File: `src/app/api/v1/router/usage/route.ts`.

### P2 — `ai_routing_summary` never populated
Field is documented but absent after multiple AI-strategy calls.
**Fix:** Either implement the field (aggregate AI classification metadata from recent RouterCall records) or remove it from docs. No partial contracts.

---

## Must-Have #2 — Major UI Upgrade (Glassmorphism + Motion)

Full visual overhaul of `/`, `/connect`, `/products/*`, and `/benchmarks`. The site looks like a prototype; it needs to signal "premium infrastructure product" on first impression.

**Hero (`/`):**
- Full-viewport dark base `#07070A` with conic-gradient mesh + two radial bursts (indigo `#4F46E5` top-left, amber `#F97316` bottom-right) at low opacity.
- Floating glass hero card: `backdrop-blur-xl bg-white/8 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.12)]`.
- Headline: Inter 700 72px with `background-clip: text` gradient fill (`#FFFFFF → #A78BFA`).
- Animated stat counters (latency ms, tool count, total API calls) count up from 0 on scroll-enter (800ms ease-out).
- CTA button: pill, `bg-gradient-to-r from-indigo-500 to-violet-600`, hover `scale-[1.03]` + glow `0 0 24px rgba(99,102,241,0.5)`.

**Tool/Agent cards (Rankings, Products):**
- `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`.
- Hover: `translateY(-4px)` lift + border brightens to `border-white/25` + inner glow. Spring easing 200ms.
- Score badge: color-coded pill (emerald ≥8.0, amber 6–8, rose <6). JetBrains Mono 600 12px.
- 7-day latency sparkline as inline SVG (no library), violet stroke, subtle area fill.

**Navigation:**
- Frosted sticky nav: `bg-black/60 backdrop-blur-lg border-b border-white/8`.
- Active link: center-out underline via `scaleX` transform.

**`/connect` page:**
- Section depth labels (01, 02, 03) in `text-white/10` behind titles.
- Code block: terminal component with traffic-light dots, language tabs (Python / TypeScript / cURL), tokyo-night syntax highlight.
- Pricing cards: glass panels, active tier gets `ring-2 ring-indigo-500/60 bg-indigo-500/10`.

---

## Must-Have #3 — Interactive API Playground (Developer Adoption)

An embedded Try-It panel on `/connect` that requires no login for 3 trial calls, then soft-prompts registration. No competitor in this space has one.

**UX:** User types a query, picks Search / Embed / Finance, clicks **"Route it →"**, and immediately sees: which tool was selected, AI classification reasoning, latency in ms, first 2 result items, and the `traceId`.
After 3 uses (tracked in `localStorage`), an inline prompt appears: *"Get 3,000 free calls/month →"*.

**Backend:** `POST /api/v1/playground/route` — unauthenticated, IP rate-limited (5 req/min via Upstash or in-memory), uses a shared `PLAYGROUND_KEY` env var. Returns same shape as `/api/v1/route/search` but adds `_playground: true` and caps results to 2 items. Calls are not billed to any user account.

**Frontend:** `src/components/Playground.tsx` — self-contained React client component. Glass panel matching the Must-Have #2 design system. Result animates in with `opacity-0 → opacity-100 translateY(8px → 0)` over 300ms.

---

## Ship Order

```
Must-Have #1 (bug fixes) → Must-Have #2 (UI) → Must-Have #3 (Playground)
```

**Target QA score after #1:** ≥90% (up from 84%)
**Zero new P0/P1 regressions permitted at any stage.**
