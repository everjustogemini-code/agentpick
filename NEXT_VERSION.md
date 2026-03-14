# NEXT_VERSION.md — AgentPick v0.4

**Cycle date:** 2026-03-14
**PM:** Claude Code
**QA baseline:** 40/51 (78%) — 9 P1 issues open, 0 P0 blockers
**Theme:** Premium product, not a hackathon project.

---

## Feature 1 — Full Visual Overhaul: Glassmorphic Design System

**Why:** The current dashboard and `/connect` page are flat, gray, and forgettable. Every card is
`border border-gray-100 bg-white`. Strategy buttons are `bg-gray-100 text-gray-600`. This reads
like a prototype. We need it to feel like Linear or Vercel — dark, polished, motion-forward.

**Priority surfaces:** `/dashboard/router`, `/connect`, homepage `<Hero>`.

### 1A. Global Design Tokens (`globals.css` + Tailwind config)

```css
/* Dark base + glass surface */
--bg-base:           #0a0a0f;
--bg-surface:        rgba(255,255,255,0.04);
--bg-surface-hover:  rgba(255,255,255,0.07);
--border-subtle:     rgba(255,255,255,0.08);
--border-active:     rgba(249,115,22,0.45);   /* orange glow */

/* Hero gradient mesh */
--gradient-mesh: radial-gradient(ellipse 80% 60% at 50% -10%,
                   rgba(249,115,22,0.15) 0%, transparent 70%),
                 radial-gradient(ellipse 60% 40% at 80% 80%,
                   rgba(99,102,241,0.08) 0%, transparent 60%);
```

Tailwind extension — add these utilities so components stay readable:

```js
// tailwind.config.ts
extend: {
  backdropBlur: { xs: '4px' },
  boxShadow: {
    glass: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)',
    'glow-orange': '0 0 12px rgba(249,115,22,0.35)',
    'glow-cyan':   '0 0 12px rgba(14,165,233,0.3)',
  },
}
```

### 1B. Glass Card Pattern (replace all flat white cards)

**Before:**
```tsx
<div className="rounded-xl border border-gray-100 bg-white p-5">
```
**After:**
```tsx
<div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm
                shadow-glass transition-all duration-200
                hover:border-white/[0.13] hover:bg-white/[0.06]">
```

Applies to: stat cards, tool usage panel, strategy selector, strategy comparison table,
recent calls panel, settings panel, upgrade CTA on router dashboard.

### 1C. Animated Stat Counters (router dashboard stat grid)

- On dashboard load, stat numbers count up 0 → actual value over **600ms**
- Easing: `cubic-bezier(0.25, 1, 0.5, 1)` via `requestAnimationFrame`
- Typography: `text-3xl font-bold tabular-nums bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent`
- Section labels: `text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30`

### 1D. Tool Usage Bars with Stagger + Glow

- Replace flat `bg-orange-400` with `bg-gradient-to-r from-orange-500 to-amber-400`
- Add `shadow-glow-orange` on the filled portion
- Stagger-animate bars in on load: `transition-all duration-500` with `delay: index * 60ms`

### 1E. Homepage Hero: Animated Gradient Mesh

Replace current static background with a slow-shifting gradient mesh:

```css
@keyframes mesh-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.hero-mesh {
  background: var(--gradient-mesh),
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 200% 200%, 64px 64px, 64px 64px;
  animation: mesh-shift 20s ease infinite;
}
```

Hero `<h1>`: `font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-100 to-gray-400`

### 1F. Micro-interactions

- Strategy pills: active state → `ring-1 ring-orange-500/50 shadow-glow-orange`
- Recent call rows: `hover:bg-white/[0.04] transition-colors duration-150`
- Login/register inputs: focus → `border-orange-500/60 shadow-[0_0_0_3px_rgba(249,115,22,0.1)]`
- All animated elements wrapped in `@media (prefers-reduced-motion: no-preference)` — no motion for those who opt out

**Acceptance:**
- No plain `bg-white` cards remain on router dashboard or `/connect`
- Homepage hero has animated mesh background
- Safari 17+ renders glass (`-webkit-backdrop-filter` fallback)
- Lighthouse Performance ≥ 90 on homepage (will-change, no CLS)

---

## Feature 2 — Fix 4 P1 API Contract Bugs (Developer Unblocking)

**Why:** These 4 bugs directly cause `400` errors for developers following the docs. They're the
highest-friction drop-off points between "interested" and "first successful API call". All are
input/output normalization — no core routing logic changes. Estimated ~45 min total.

### 2A. Crawl endpoint rejects flat body (`P1 #2`, test 1.1b)

```
POST /api/v1/route/crawl {"url": "https://example.com"}  →  400: params object required
```

**Fix** — accept both shapes, normalize internally before routing:

```ts
// src/app/api/v1/route/crawl/route.ts
const CrawlBody = z.union([
  z.object({ params: z.object({ url: z.string().url() }) }),
  z.object({ url: z.string().url() }),
])
const parsed = CrawlBody.parse(body)
const url = 'params' in parsed ? parsed.params.url : parsed.url
```

Docs keep `{ params: { url } }` as canonical. Flat shape accepted forever (non-breaking).

### 2B. Priority endpoint field name mismatch (`P1 #5`, test 2.6)

```
POST /api/v1/router/priority {"search": ["exa-search"]}  →  400: Provide tools/priority_tools
```

**Fix** — normalize field name before validation:

```ts
// src/app/api/v1/router/priority/route.ts
const tools = body.tools ?? body.priority_tools ?? body.search
if (!tools?.length) throw new ValidationError('Provide tools or priority_tools')
```

### 2C. classification_ms > total_latency_ms (`P1 #6`, test 6.4)

```
classification_ms: 501  vs  total_latency_ms: 233   ← impossible
```

**Fix** — `total_latency_ms` must be wall-clock from request start to response send.
Classification is a sub-timer. Assert `total ≥ classification` before serializing; log a
warning if violated (indicates clock skew or wrong measurement point).

### 2D. Account fields sparse in usage response (`P1 #8`, test 7.1)

```
GET /api/v1/router/usage  →  { "account": { "plan": "free" } }   ← missing fields
```

**Fix** — extend serializer to return full shape:

```json
{
  "account": {
    "plan": "free",
    "monthlyLimit": 10000,
    "callsThisMonth": 247,
    "strategy": "auto"
  }
}
```

Source: `callsThisMonth` = DB count for current calendar month, `monthlyLimit` from plan config,
`strategy` from user row.

**Acceptance:** Tests 1.1b, 2.6, 7.1 pass. `total_latency_ms ≥ classification_ms` on all calls.
QA score moves from 40 → 44+.

---

## Feature 3 — Interactive Code Generator Widget on `/connect`

**Why:** Time-to-first-call is the #1 developer adoption metric. `/connect` currently shows
static code snippets. Developers copy them, hit errors because the payload doesn't match their
use case, and bounce. A live configurator eliminates this — 2 clicks from landing to
copy-pasteable code that *works*.

### Widget Layout (add above existing code block on `/connect`)

```
┌─ Build your request ──────────────────────────────────────────────┐
│  Language:    [Python]  [JavaScript]  [curl]                      │
│  Capability:  [search ▼]  [crawl]  [finance]  [embed]             │
│  Strategy:    [auto ▼]  [balanced]  [cheapest]  [best_performance]│
└───────────────────────────────────────────────────────────────────┘
     ↓ live preview updates as user clicks — no Run needed ↓
┌─ Generated code ─────────────────────────────────── [Copy ✓] ─────┐
│  import agentpick                                                  │
│  client = agentpick.Client(api_key="YOUR_KEY")                    │
│  result = client.search(                                           │
│    query="your query here",                                        │
│    strategy="auto"                                                 │
│  )                                                                 │
│  print(result)                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Implementation Details

- **Pure client-side React state** — zero API calls on configuration change
- Templates are strings with `{{STRATEGY}}`, `{{CAPABILITY}}`, `{{QUERY}}` placeholders; 60
  combinations (3 languages × 4 capabilities × 5 strategies) generated at render time, not
  hardcoded
- **Code block styling:** matches existing homepage code block — dark bg, JetBrains Mono,
  syntax highlighting with orange/blue/green tokens, terminal chrome (•••  dots + filename tab)
- **[Copy] button:** `navigator.clipboard.writeText()` + 1.5s checkmark animation (`✓ Copied`
  fades in at 200ms, auto-resets)
- Widget uses glass card design from Feature 1 — consistent with rest of dark `/connect` page
- Mobile: configurator stacks vertically, code block full-width below

### Why This Drives Adoption

- Developer lands on `/connect`, selects their language + capability in 2 clicks, gets
  production-ready code
- Replaces the current static Python snippet that only covers `search`
- No registration wall before seeing value — code works on demo key immediately
- Directly addresses the 3 most common support questions: "what's the payload shape?",
  "which strategy should I use?", "how do I call this in Node?"

**Acceptance:**
- Widget renders on `/connect` below the nav, above existing endpoint docs
- All 3 languages × 4 capabilities × 5 strategies generate valid, copy-pasteable code
- Copy button works and shows animated confirmation
- No API calls on interaction — purely template rendering
- Mobile layout correct (stacked, no horizontal scroll)

---

## P1 Issue Triage Summary

| # | Issue | This cycle | Owner |
|---|-------|-----------|-------|
| 1 | `serpapi-google` naming | QA script fix, not product | QA |
| 2 | Crawl flat payload → 400 | **Fix (2A)** | Codex |
| 3 | `custom` strategy → 400 | Backlog v0.5 | — |
| 4 | `cheapest` routes to Tavily | Backlog v0.5 (cost table audit) | — |
| 5 | Priority field name mismatch | **Fix (2B)** | Codex |
| 6 | classification_ms > total | **Fix (2C)** | Codex |
| 7 | No `ai_routing_summary` | Backlog v0.5 | — |
| 8 | Account fields sparse | **Fix (2D)** | Codex |
| 9 | `jina-embed` naming | QA script fix, not product | QA |

---

## Definition of Done

**F1 — UI**
- [ ] No plain `bg-white` cards on router dashboard or `/connect`
- [ ] Glass tokens in `globals.css` / Tailwind config
- [ ] Homepage hero has animated gradient mesh
- [ ] Stat counters animate on dashboard load (0 → value, 600ms)
- [ ] Tool usage bars use gradient fill + stagger animation
- [ ] Strategy pills have glow ring on active state
- [ ] All motion disabled when `prefers-reduced-motion: reduce`

**F2 — Bugs**
- [ ] `POST /api/v1/route/crawl {"url": "..."}` → 200 (not 400)
- [ ] `POST /api/v1/router/priority {"search": [...]}` → 200 (not 400)
- [ ] `total_latency_ms ≥ classification_ms` in all responses
- [ ] `/api/v1/router/usage` returns `monthlyLimit`, `callsThisMonth`, `strategy`

**F3 — Code Generator**
- [ ] Widget live on `/connect` (language × capability × strategy configurator)
- [ ] All 60 combinations generate valid code (3 × 4 × 5)
- [ ] Copy button with animated confirmation
- [ ] Zero API calls on interaction
- [ ] Mobile layout correct

**QA**
- [ ] Re-run `agentpick-router-qa.py` — target ≥ 44/51
- [ ] Lighthouse Performance ≥ 90 on homepage
