# NEXT_VERSION.md — AgentPick Cycle 2
> PM: Claude Code | Date: 2026-03-14 | Base: 7652836 | QA: 82% (42/51)

**Theme:** AgentPick should look like a product engineers are proud to put in a README.
No P0/P1 bugs to fix. Four P2 API contract bugs are the quick wins. One major new surface for developer adoption.

---

## Feature 1 — Premium UI System

**Why:** The homepage is polished (glassmorphism, animated bars, dark bg). The `/connect` page is a flat light-mode card layout that looks like a different product. Product pages have no motion. Close this gap completely.

### 1A. Aurora Animated Hero (homepage + /connect)

Replace the static gradient hero with a three-blob animated aurora background:

```css
/* Three blobs animate independently so they feel alive */
.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}
.aurora-blob-1 { /* indigo */
  width: 600px; height: 400px;
  background: #6366f1;
  animation: aurora-drift-1 12s ease-in-out infinite alternate;
}
.aurora-blob-2 { /* cyan */
  width: 500px; height: 350px;
  background: #0ea5e9;
  animation: aurora-drift-2 8s ease-in-out infinite alternate;
}
.aurora-blob-3 { /* emerald */
  width: 400px; height: 300px;
  background: #10b981;
  animation: aurora-drift-3 10s ease-in-out infinite alternate;
}
@keyframes aurora-drift-1 { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(120px, -60px) rotate(20deg); } }
@keyframes aurora-drift-2 { from { transform: translate(0, 0); } to { transform: translate(-80px, 80px); } }
@keyframes aurora-drift-3 { from { transform: translate(0, 0); } to { transform: translate(60px, 40px) rotate(-15deg); } }
```

Layer a radial vignette mask over blobs to keep text readable: `radial-gradient(ellipse 70% 60% at 50% 40%, transparent 30%, rgba(3,7,18,0.85) 80%)`.

Hero `h1`: `font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-100 to-gray-400`.
Eyebrow label above h1: `uppercase tracking-widest text-xs text-cyan-400`.

### 1B. Dark Glassmorphic /connect Page

Port the entire `/connect` page from light mode to dark glass:

| Current | Replace with |
|---------|-------------|
| `bg-white` cards | `bg-white/5 border border-white/10 backdrop-blur-md rounded-xl` |
| `bg-gray-50` page bg | `bg-gray-950` |
| Blue HTTP badges | `bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-0.5 rounded text-xs font-mono` |
| Strategy chips | Add `hover:shadow-[0_0_14px_rgba(16,185,129,0.35)]` glow ring |

Terminal code block chrome: add three colored dots (red/yellow/green), a filename tab `agentpick_example.py`, and a copy-to-clipboard button with animated `✓ Copied` confirmation (fade in 200ms, auto-reset 2s).

### 1C. Micro-interactions on All Interactive Cards

Apply to: tool cards, strategy cards, pricing tier cards, benchmark result rows, competitive snapshot card.

```css
.card-lift {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out;
}
.card-lift:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 20px 40px rgba(0,0,0,0.35);
  border-color: rgba(14, 165, 233, 0.4); /* cyan glow border */
}
.card-lift:active { transform: translateY(-1px) scale(1.005); }
```

All animations must respect `prefers-reduced-motion: reduce` — wrap in `@media (prefers-reduced-motion: no-preference)`.

### 1D. Animated Metric Counters

On `/benchmarks`, product pages (`/products/[slug]`), and dashboard stats grid: numbers count up from 0 on first viewport entry using `IntersectionObserver`.

- Duration: 1200ms, easing: `cubic-bezier(0.25, 1, 0.5, 1)` (fast-in, ease-out)
- Integers (calls, agents, count): no decimals
- Latency (ms): round to integer
- Scores (0–10): one decimal, e.g. `6.0`
- Use `requestAnimationFrame` loop, no layout shift, no SSR issues (check `typeof window !== 'undefined'`)

### 1E. Benchmark Score Ring (SVG Component)

Replace raw numeric scores in benchmark result rows and product score cards with a circular SVG ring:

```tsx
// ScoreRing.tsx — ~25 lines
// Props: score (0–10), size (default 48px)
// stroke: green (#22c55e) ≥8, amber (#f59e0b) 6–7.9, red (#ef4444) <6
// Animate stroke-dashoffset on mount: 600ms ease-out
// Score number centered, JetBrains Mono font-medium
```

**Acceptance criteria:**
- Lighthouse Performance ≥ 90 on homepage
- Glass effects render in Safari 17+ (`-webkit-backdrop-filter` fallback present)
- Zero CLS from animations (use `will-change: transform` on card-lift elements)
- All motion off when `prefers-reduced-motion: reduce`

---

## Feature 2 — Fix 4 P2 API Contract Bugs

**Why:** Silent `400` errors with no clear fix path = developer bounce. All four are input/output normalization — no business logic changes. ~45 min total.

### Bug A — `/api/v1/route/crawl` rejects flat body (test: 1.1b)

**Current:** `{"url": "https://example.com"}` → `400: params object is required`
**Fix:** Accept both shapes, normalize internally:

```ts
// In crawl route handler
const CrawlBody = z.union([
  z.object({ params: z.object({ url: z.string().url() }) }),
  z.object({ url: z.string().url() })
])
const parsed = CrawlBody.parse(body)
const url = 'params' in parsed ? parsed.params.url : parsed.url
```

Docs: keep `{ params: { url } }` as canonical. Flat shape silently accepted forever (non-breaking).

### Bug B — `/api/v1/router/priority` wrong field name (test: 2.6)

**Current:** `{ "search": ["exa-search", "tavily"] }` → `400: Provide tools/priority_tools`
**Fix:** Normalize at handler entry, before any validation:

```ts
const tools = body.tools ?? body.priority_tools ?? body.search
if (!tools?.length) throw new ValidationError('Provide tools or priority_tools')
```

### Bug C — Usage endpoint missing account fields (test: 7.1)

**Current:** `account` object only returns `{ "plan": "free" }`
**Fix:** Extend to full shape (data already in DB):

```json
{
  "plan": "free",
  "monthlyLimit": 10000,
  "callsThisMonth": 247,
  "strategy": "auto"
}
```

Source: `callsThisMonth` = count from calls table for current calendar month, `monthlyLimit` from plan config map, `strategy` from user settings row.

### Bug D — `custom` strategy not supported for fallback (test: 1.3)

**Current:** `strategy: "custom"` → `400: Invalid strategy "custom"`
**Fix:** Add `custom` as a valid strategy alias that reads the user's saved `priority_tools` list, falls back to `auto` if none set. Update the strategy enum and routing switch statement.

**Acceptance:** QA tests 1.1b, 2.6, 7.1, 1.3 all pass. Zero regressions on currently-passing tests.

---

## Feature 3 — Interactive API Playground (`/playground`)

**Why:** The highest-leverage developer adoption feature. Developers who try an API in-browser convert to signups at 3–5× the rate of those who only read docs. Stripe, Exa, and Tavily all have this. AgentPick's routing intelligence is compelling — let developers *see it work* before committing to an integration.

**Route:** `/playground` — add `Playground` to main nav between `Router` and `Dashboard`.

### Layout (two-column split on desktop, stacked on mobile)

```
┌─────────────────────────────┬──────────────────────────────┐
│   Request Builder (60%)     │   Response Panel (40%)       │
│                             │                              │
│  [Search] [Crawl] [Embed]   │  [Response] [cURL] [Python]  │
│  [Finance]                  │  [Node]                      │
│                             │                              │
│  Query: ________________    │  { "tool": "exa-search",     │
│  ________________________   │    "latency": 247,           │
│                             │    "results": [...] }        │
│  Strategy: auto fastest     │                              │
│            cheapest quality │  247ms  ●  exa-search        │
│                             │                              │
│  [▶ Run Query]              │  Sign up to use your key →   │
└─────────────────────────────┴──────────────────────────────┘
```

### Request Builder Details

- **Endpoint tabs:** pill row, switching updates the JSON template in the body preview below
- **Query textarea:** full-width, JetBrains Mono, 3 rows, placeholder: `"Find the latest research on LLM benchmarks"`
- **Strategy pills:** `auto` (default) | `fastest` | `cheapest` | `best_quality` — single-select, pill style with active state
- **Run button:** full-width, dark bg, animated spinner (`animate-spin` border) while loading; disabled when query empty
- **API key toggle:** "Using demo key (10 req/day)" shown as a muted badge. "Use my own key →" expands an inline input.

### Response Panel Details

- **Response tab:** syntax-highlighted JSON (Shiki or Prism), line numbers, fade-in on new result
  - Top-right badge row: latency chip (`247ms`), tool name chip (`exa-search`)
  - Empty state: dashed `border-white/20` box, centered text "Run a query to see live routing"
- **Code tabs (cURL, Python, Node):** snippets auto-update in real-time as user changes query or strategy — no Run click needed. One-click copy button on each.

Node.js snippet (template updates live):
```js
const res = await fetch('https://agentpick.dev/api/v1/route/search', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer {{apiKey}}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: "{{query}}", strategy: "{{strategy}}" })
})
const data = await res.json()
console.log(data.tool, data.latency + 'ms')
```

### Demo Key Implementation

- New env var: `PLAYGROUND_DEMO_KEY` — a provisioned API key on a special `demo` plan
- Rate limit: 10 requests/day per IP, tracked in a new `playground_rate_limits` table (`ip TEXT, date DATE, count INT`)
- Returns **real routing results** — actual tool calls, not mocked data
- On 11th request: `429 { "error": "Demo limit reached", "cta": "Sign up free to continue" }`
- "Get your free API key →" CTA pinned at the bottom of the response panel when in demo mode; hides when user has entered own key

**Acceptance criteria:**
- Page load < 1s (no API call on mount, code snippets render client-side only)
- All 4 endpoint types (search, crawl, embed, finance) return real responses on demo key
- Code snippets update live as query/strategy changes (React state → template string)
- Rate limit fires at request 11, CTA appears
- Mobile layout: stacks to single column, no horizontal scroll
- `Playground` appears in main nav (desktop + mobile drawer)

---

## P3 Stretch (only if F1–F3 ship clean)

- **ai_routing_summary in usage** (QA 6.5): LLM-generated one-sentence routing summary in `GET /api/v1/router/usage?period=7d`
- **Fix cheapest strategy** (QA 1.4b): audit tool pricing config; `tavily` wins cheapest over `serper`/`brave-search` — likely a cost-per-call value error in the routing table

---

## Ship Checklist

**F1 — UI**
- [ ] `globals.css` / Tailwind config: aurora blob keyframes, `.card-lift`, glass tokens
- [ ] Homepage hero: aurora background + gradient h1 typography
- [ ] `/connect` page: full dark glassmorphic port
- [ ] Strategy/tool/pricing cards: `.card-lift` micro-interactions
- [ ] Code blocks: terminal chrome (dots + filename) + copy button
- [ ] `ScoreRing.tsx` SVG component — replace numeric scores on benchmarks + product pages
- [ ] Scroll-reveal metric counters (IntersectionObserver) on benchmarks + product pages

**F2 — Bugs**
- [ ] Crawl endpoint: accept flat `{url}` shape (Zod union)
- [ ] Priority endpoint: normalize `tools` / `priority_tools` / `search` field names
- [ ] Usage endpoint: return all 4 account fields
- [ ] Add `custom` strategy → reads user's saved priority_tools

**F3 — Playground**
- [ ] `/app/playground/page.tsx` — request builder + response panel layout
- [ ] Demo key provisioned (`PLAYGROUND_DEMO_KEY` env var), rate limit table migration
- [ ] Live code snippet generation (cURL, Python, Node) from React state
- [ ] `Playground` in main nav (desktop + mobile)
- [ ] "Sign up" CTA in response panel on demo key mode

**QA**
- [ ] Re-run `agentpick-router-qa.py` — target ≥ 46/51 (90%)
- [ ] Lighthouse Performance ≥ 90 on homepage
- [ ] Safari 17+ glass effects verified manually
