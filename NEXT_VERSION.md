# Version 0.next — "Premium Product"

**Date:** 2026-03-14
**Base commit:** ef1ded2
**QA score:** 40/51 (78%) → target ≥ 46/51 (90%)
**Theme:** AgentPick should look like a product engineers are proud to put in a README — not a hackathon project.

---

## Feature 1 — Visual Overhaul: Premium Design System

**Why:** The current UI is functional but flat — neutral grays, single blue accent, no depth, no motion. AgentPick competes for developer attention against Exa, Tavily, and Perplexity. They have invested heavily in visual identity. A premium look signals production-readiness and earns trust at first glance.

### A. Glassmorphism card layer

Replace the flat `.card` (white bg, `#E5E5E5` border) with a glass variant for pricing cards, strategy cards, benchmark score cards, and the competitive position card on `/dashboard/[slug]`:

```css
.card-glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
```

Background context layer behind cards: a static radial gradient mesh so the blur has something to refract against (flat white produces no effect).

### B. Gradient hero + typography upgrade

Replace the flat `#FAFAFA` hero background with a radial gradient mesh:

```css
background:
  radial-gradient(ellipse 80% 50% at 20% -10%, rgba(37, 99, 235, 0.12) 0%, transparent 60%),
  radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99, 102, 241, 0.10) 0%, transparent 55%),
  #FAFAFA;
```

Hero headline: `font-size: clamp(3rem, 7vw, 5.5rem)`, weight 800, letter-spacing `-0.03em`.
Subhead: Inter 400, `#525252`, `1.25rem`, line-height 1.6.
Keep the existing dark code block (`#0A0A0A`) — it contrasts beautifully against the light gradient.

### C. Animated score counters

On the benchmarks page and dashboard stats grid, count up from 0 on scroll-enter:
- Duration: 1200ms, easing: `cubic-bezier(0.25, 1, 0.5, 1)`
- Integer values (scores, counts): no decimals
- Latency values: one decimal place
- Use `IntersectionObserver` to trigger — no layout shift, no SSR issues

### D. Micro-interactions on strategy/tool cards

```css
/* hover lift */
.card-interactive { transition: transform 200ms ease, box-shadow 200ms ease; }
.card-interactive:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); }
.card-interactive:active { transform: translateY(-1px); }

/* accent underline sweep */
.card-interactive::after {
  content: ''; position: absolute; bottom: 0; left: 0;
  height: 2px; width: 0; background: #2563EB;
  transition: width 200ms ease;
}
.card-interactive:hover::after { width: 100%; }
```

### E. Benchmark score ring (SVG)

Replace raw numeric scores in benchmark result rows with a circular SVG progress ring:
- Radius 20px, stroke-width 3px
- Color: `#22C55E` (≥80), `#F59E0B` (60–79), `#EF4444` (<60)
- Animate `stroke-dashoffset` on mount: 600ms ease-out
- Score number centered inside ring, JetBrains Mono 500

**Acceptance:**
- Lighthouse performance ≥ 90 on homepage (use `will-change: transform` on animated cards, no CLS from animations)
- Glass/gradient effects render correctly in Safari 17+ (test `-webkit-backdrop-filter`)
- All animations respect `prefers-reduced-motion: reduce`

---

## Feature 2 — Fix 3 P2 API Contract Bugs

**Why:** These are silent DX failures. A developer who hits a `400` with no clear fix bounces. They're the primary reason QA is at 78% instead of 90%+. All three are response/schema shaping fixes — no logic changes, ~30 minutes total.

### Bug A — `POST /api/v1/route/crawl` requires `params` wrapper (QA: 1.1b-crawl-routing)

**Current:** `{"url": "..."}` → `400 VALIDATION_ERROR: params object is required`
**Fix:** Accept both shapes via Zod union:

```ts
const CrawlBody = z.union([
  z.object({ params: z.object({ url: z.string().url() }) }),
  z.object({ url: z.string().url() }) // flat shape — auto-wrap internally
])
// Normalize: const url = body.params?.url ?? body.url
```

Canonical shape stays `{ params: { url } }` in docs. Flat shape silently accepted forever.

### Bug B — `POST /api/v1/router/priority` wrong field name (QA: 2.6-set-priority)

**Current:** Sending `{ "search": [...] }` → `400: Provide tools/priority_tools`
**Fix:** Normalize all three accepted keys at handler entry:

```ts
const tools = body.tools ?? body.priority_tools ?? body.search
if (!tools?.length) throw new ValidationError('Provide tools or priority_tools')
```

### Bug C — Usage endpoint missing account fields (QA: 7.1-account-fields)

**Current:** `account` object in `/api/v1/router/usage` response only returns `{ plan }`.
**Fix:** Extend response to include all four fields:

```json
{
  "plan": "free",
  "monthlyLimit": 10000,
  "callsThisMonth": 247,
  "strategy": "auto"
}
```

Data already exists — `callsThisMonth` from calls table count, `monthlyLimit` from plan config, `strategy` from user settings. This is response-shaping only.

**Acceptance:** QA tests 1.1b, 2.6, 7.1 all pass. No regressions on currently passing tests.

---

## Feature 3 — Interactive API Playground (Developer Adoption)

**Why:** The #1 friction for new developers is "does this work for my use case before I integrate?" A live in-browser playground removes that friction entirely. Stripe, Exa, and Tavily all have this. Developers who try the API in-browser convert to signups at 3–5x the rate of those who only read docs. This is the highest-leverage feature for developer adoption this cycle.

**Route:** New page at `/playground`. Add `Playground` to main nav between `Benchmarks` and `Docs`.

### Layout

Two-column split (60/40 on desktop, stacked on mobile):
- Left: Request builder (glass card)
- Right: Live response panel (glass card)

### Request Builder (left)

1. **Endpoint tabs** — pill row: `Search` | `Crawl` | `Embed` | `Finance`. Switching tab updates the request body template.
2. **Query textarea** — full-width, JetBrains Mono, placeholder: `"Find the latest research on AI agent benchmarks"`
3. **Strategy pills** — `auto` | `fastest` | `cheapest` | `best_quality`. Default: `auto`.
4. **Run button** — full-width, black, animated spinner while loading. Disabled until query non-empty.
5. **API key toggle** — "Using demo key (10 req/day)" by default. "Use my key" expands an input field.

### Response Panel (right)

Tabbed: `Response` | `cURL` | `Python` | `Node`

- **Response tab:** Syntax-highlighted JSON with line numbers. Latency badge top-right (`247ms`). Tool name pill (`exa-search`). Fade-in animation on new response. Empty state: dashed border with "Run a query to see results".
- **Code tabs:** Auto-generated snippets that update in real-time as params change (no need to Run first). One-click copy button.

Node.js snippet template:
```js
const res = await fetch('https://agentpick.dev/api/v1/route/search', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "{{userQuery}}",
    strategy: "{{strategy}}"
  })
})
const data = await res.json()
```

### Demo key implementation

- New env var: `PLAYGROUND_DEMO_KEY` — a real API key on a special `demo` plan
- Rate limit: 10 requests/day per IP (tracked in `playground_rate_limits` DB table: `ip`, `date`, `count`)
- Returns **real results** — actual routing, actual tool calls, not mocked data
- 429 response: `{ "error": "Demo limit reached", "message": "Sign up for free to continue" }`
- "Sign up to get your key" CTA pinned at bottom of response panel when on demo key

**Acceptance:**
- Page loads in <1s (no API call on mount)
- All 4 endpoint types return real responses with demo key
- Code snippets update in real-time as user changes query/strategy (no Run click needed)
- Mobile layout stacks cleanly, no horizontal scroll
- Rate limit blocks at 11th request, shows signup CTA

---

## P3 Stretch (if time allows)

- **ai_routing_summary in usage** (QA: 6.5) — add LLM-generated summary sentence to `/api/v1/router/usage?period=7d`
- **Fix cheapest strategy routing** (QA: 1.4b) — audit tool pricing table; `tavily` should not win `cheapest` over `serper`/`brave-search`

---

## Ship Checklist

**Feature 1 — UI**
- [ ] `globals.css`: add `.card-glass`, `.card-interactive`, gradient mesh tokens
- [ ] Hero: gradient background + typography upgrade applied in `app/page.tsx`
- [ ] Benchmark score rows: replace numeric score with SVG ring component
- [ ] Strategy/tool cards: apply `.card-interactive` micro-interactions
- [ ] Scroll-reveal stat counters on benchmarks and dashboard stats grid

**Feature 2 — Bugs**
- [ ] Crawl endpoint: Zod union accepts flat `{url}` shape
- [ ] Priority endpoint: normalize `tools` / `priority_tools` / `search` keys
- [ ] Usage response: return all 4 account fields

**Feature 3 — Playground**
- [ ] `/playground` page with request builder + response panel
- [ ] Demo key provisioned, rate limiting via DB table
- [ ] Code snippets (cURL, Python, Node) auto-generate from params
- [ ] `Playground` added to main nav
- [ ] "Sign up" CTA visible on demo key mode

**QA**
- [ ] Re-run `agentpick-router-qa.py` — target ≥ 46/51 (90%)
- [ ] Lighthouse performance ≥ 90 on homepage
- [ ] Safari 17+ glass effects verified
