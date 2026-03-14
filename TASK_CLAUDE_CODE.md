# TASK_CLAUDE_CODE.md — v0.next (2026-03-14)

**Agent:** Claude Code
**Theme:** New features, new components, multi-file architectural changes
**Do NOT touch:** `src/app/globals.css`, `src/app/page.tsx`, `src/app/api/v1/route/crawl/route.ts`, `src/app/api/v1/router/priority/route.ts`

---

## Task 1 — Interactive API Playground (`/playground`)

### 1a. Database: `playground_rate_limits` table

Add a Drizzle migration (or raw SQL migration file) creating:

```sql
CREATE TABLE playground_rate_limits (
  ip        TEXT NOT NULL,
  date      DATE NOT NULL,
  count     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, date)
);
```

Migration file: `drizzle/migrations/0010_playground_rate_limits.sql` (increment if needed)
Update schema file wherever tables are defined (likely `src/lib/db/schema.ts` or similar — check first).

### 1b. API route: `POST /api/v1/playground/run`

Create: `src/app/api/v1/playground/run/route.ts`

- Read `PLAYGROUND_DEMO_KEY` from env. If request has `Authorization: Bearer <key>` matching a real user key, use that instead.
- For demo key requests: look up `ip` + today's date in `playground_rate_limits`. If `count >= 10`, return `429 { "error": "Demo limit reached", "message": "Sign up for free to continue" }`. Otherwise increment count (upsert).
- Route the request to the real internal routing logic (reuse existing handler — check how other endpoints call the router). Pass through `{ query, strategy, endpoint }`.
- Return: `{ result, latency_ms, tool_used, demo: true/false }`.

### 1c. Page: `src/app/playground/page.tsx`

New page. Two-column layout on desktop (60/40), stacked on mobile.

```tsx
// Layout shell only — import the two panel components
// No `use client` on the page itself — panels are client components
<main className="min-h-screen pt-20 pb-16 px-4">
  <div className="max-w-6xl mx-auto">
    <h1 className="text-3xl font-bold tracking-tight mb-2">API Playground</h1>
    <p className="text-neutral-500 mb-8">Try AgentPick live — no signup required.</p>
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
      <PlaygroundRequestBuilder />
      <PlaygroundResponsePanel />
    </div>
  </div>
</main>
```

### 1d. Component: `src/components/PlaygroundRequestBuilder.tsx`

`"use client"` component. Props: none (shares state via a React context or lifted state passed through page — use lifted state via page is fine, pass callbacks as props).

**State owned here:**
- `endpoint`: `'search' | 'crawl' | 'embed' | 'finance'` — default `'search'`
- `query`: string — default `''`
- `strategy`: `'auto' | 'fastest' | 'cheapest' | 'best_quality'` — default `'auto'`
- `useOwnKey`: boolean — default `false`
- `ownKey`: string — default `''`
- `isLoading`: boolean
- `response`: object | null
- `latency`: number | null
- `toolUsed`: string | null
- `error`: string | null

**Expose via callback prop `onResultChange(result, latency, toolUsed, error)`** — called after each run.

**Endpoint tabs** — pill row at top:
```
background when active: #171717 (black)
text when active: white
inactive: bg-neutral-100, text-neutral-600
border-radius: 9999px (fully rounded)
padding: px-4 py-1.5
font: text-sm font-medium
gap between pills: 8px
```
Tabs: `Search` | `Crawl` | `Embed` | `Finance`

**Query textarea:**
```
font-family: 'JetBrains Mono', monospace (add to font imports if not present)
placeholder: "Find the latest research on AI agent benchmarks"
rows: 4
border: 1px solid #E5E5E5
border-radius: 8px
padding: 12px
width: 100%
focus ring: 2px solid #2563EB, outline: none
```

**Strategy pills** — same pill style as endpoint tabs but smaller (`px-3 py-1 text-xs`):
`auto` | `fastest` | `cheapest` | `best_quality`
Active bg: `#2563EB`, active text: white.

**Run button:**
```
width: 100%
background: #171717
color: white
height: 44px
border-radius: 8px
font-weight: 600
font-size: 15px
disabled state: opacity-40, cursor-not-allowed
loading state: show inline spinner (20px SVG circle animation) + "Running…" text
transition: opacity 150ms ease
```
Disabled when `query.trim() === ''` OR `isLoading`.

**API key section** (below Run button):
- Default: `<p className="text-xs text-neutral-500">Using demo key · 10 req/day</p>`
- "Use my key" link (text-blue-600 text-xs underline) toggles `useOwnKey`
- When expanded: `<input type="password" placeholder="sk-..." />` same styling as textarea but single-line. `<p className="text-xs text-neutral-400 mt-1">Your key is never stored.</p>`

**Body templates per endpoint** (pre-fill request body display — for the code snippets, not a visible textarea):
```ts
const templates = {
  search: { query: userQuery, strategy },
  crawl:  { url: "https://example.com" },
  embed:  { text: userQuery },
  finance:{ query: userQuery, ticker: "AAPL" }
}
```

### 1e. Component: `src/components/PlaygroundResponsePanel.tsx`

`"use client"` component. Props: `{ result: object | null, latency: number | null, toolUsed: string | null, error: string | null, endpoint: string, query: string, strategy: string, useOwnKey: boolean, ownKey: string }`.

**Tab bar:** `Response` | `cURL` | `Python` | `Node` — same pill style as endpoint tabs but secondary (active: bg-neutral-900).

**Response tab:**

Empty state (result === null):
```
border: 2px dashed #E5E5E5
border-radius: 8px
padding: 48px 24px
text-align: center
color: #A3A3A3
font-size: 14px
text: "Run a query to see results"
```

Loaded state:
- Top bar: tool name pill (`bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded`) on left, latency badge (`bg-neutral-100 text-neutral-600 text-xs font-mono`) on right
- JSON block: `<pre>` with `bg-neutral-950 text-green-400 font-mono text-xs p-4 rounded-lg overflow-auto max-h-96`
- Fade-in: `animate-fadeIn` — define in globals.css as `@keyframes fadeIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }` with `animation: fadeIn 250ms ease-out`
- Error state: red text, `bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm`

Demo key CTA (when `!useOwnKey`, pinned at bottom of panel):
```
background: linear-gradient(135deg, #1E40AF 0%, #4338CA 100%)
color: white
border-radius: 8px
padding: 12px 16px
margin-top: 16px
text: "Get your free API key →" (font-semibold text-sm)
subtext: "1000 free requests/month" (opacity-80 text-xs)
href: /signup
```

**Code tabs (cURL / Python / Node):**

Build snippet strings from props. Update in real-time (no Run needed).

cURL:
```bash
curl -X POST https://agentpick.dev/api/v1/route/{{endpoint}} \
  -H "Authorization: Bearer {{key}}" \
  -H "Content-Type: application/json" \
  -d '{{body}}'
```

Python:
```python
import httpx
res = httpx.post(
    "https://agentpick.dev/api/v1/route/{{endpoint}}",
    headers={"Authorization": "Bearer {{key}}"},
    json={{body_dict}}
)
print(res.json())
```

Node:
```js
const res = await fetch('https://agentpick.dev/api/v1/route/{{endpoint}}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer {{key}}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({{body}})
})
const data = await res.json()
```

Where `{{key}}` = ownKey if `useOwnKey && ownKey` else `'DEMO_KEY'`.

Code block styling: same as response JSON block. Copy button: top-right absolute, `text-xs text-neutral-400 hover:text-white transition-colors`. On copy: flash "Copied!" for 1500ms.

### 1f. Nav: Add `Playground` to `src/components/SiteHeader.tsx`

- Insert `Playground` link between `Benchmarks` and `Docs` (or wherever Docs is).
- `href="/playground"`
- Same styling as existing nav links.

---

## Task 2 — SVG Score Ring Component

Create: `src/components/ScoreRing.tsx`

```tsx
'use client'
// Props: { score: number } — score is 0–100
// Renders an SVG circular progress ring with score centered inside

// Radius: 20, stroke-width: 3
// Color logic:
//   score >= 80: #22C55E
//   score >= 60: #F59E0B
//   score < 60:  #EF4444
//
// SVG viewBox="0 0 48 48", total size: 48x48px
// Background ring: stroke="#E5E5E5"
// Progress ring: stroke=color, stroke-linecap="round"
// circumference = 2 * Math.PI * 20 = ~125.66
// dashoffset = circumference * (1 - score/100)
//
// Animate on mount:
//   useEffect: set dashoffset from circumference → final value
//   transition: stroke-dashoffset 600ms ease-out
//   Use useState for animated offset
//
// Score text: centered, font="JetBrains Mono" font-size="11" font-weight="500"
// Text color: same as ring color
```

### Use ScoreRing in benchmark pages

Modify: `src/app/benchmarks/[task]/page.tsx`
- Find where relevance/score numbers are rendered in result rows.
- Replace `<span>{score}</span>` (or similar) with `<ScoreRing score={score} />`.
- Import `ScoreRing` from `@/components/ScoreRing`.

Modify: `src/app/benchmarks/page.tsx`
- Same — find score numeric displays in result tables/cards and replace with `<ScoreRing score={score} />`.

---

## Task 3 — Animated Counter Component

Create: `src/components/AnimatedCounter.tsx`

```tsx
'use client'
// Props: { value: number, decimals?: number }
// Uses IntersectionObserver to trigger on scroll-enter
// Duration: 1200ms, easing: cubic-bezier(0.25, 1, 0.5, 1)
// Counts from 0 to value once, does NOT replay on re-enter
// decimals=0: Math.round, decimals=1: toFixed(1)
// Returns a <span> with the animated number
// SSR-safe: initial render shows "0" (or "0.0"), no hydration mismatch
// Respects prefers-reduced-motion: if reduced, show final value immediately
```

### Use AnimatedCounter in dashboard + benchmarks

Modify: `src/app/dashboard/[slug]/page.tsx`
- Find stat numbers in the stats grid (call count, latency averages, scores).
- Wrap numeric values: `<AnimatedCounter value={statValue} decimals={isLatency ? 1 : 0} />`.

Modify: `src/app/benchmarks/page.tsx`
- Same for any summary stat numbers shown above the results table.

---

## Task 4 — Bug Fix C: Usage endpoint account fields

Modify: `src/app/api/v1/router/usage/route.ts`

**Current:** `account` object only returns `{ plan }`.
**Fix:** Extend to return all four fields:

```json
{
  "plan": "free",
  "monthlyLimit": 10000,
  "callsThisMonth": 247,
  "strategy": "auto"
}
```

- `callsThisMonth`: count rows in calls table for this user where `created_at >= start of current month`. Use the same DB query pattern already in the file.
- `monthlyLimit`: derive from plan. Read the plan config (check `src/lib/plans.ts` or similar). Expected values: `free → 10000`, `pro → 100000`, `enterprise → unlimited` (use `null` for unlimited).
- `strategy`: read from user settings row (`strategy` column on users/settings table — check schema).

No logic changes to routing. Response-shaping only. Keep all currently returned fields, just extend `account`.

---

## Acceptance Criteria

- `/playground` loads in <1s (no API call on mount)
- All 4 endpoint tabs return real responses with demo key
- Code snippets update in real-time as query/strategy changes
- Rate limit returns 429 + signup CTA on 11th demo request
- Mobile playground stacks vertically with no horizontal scroll
- ScoreRing animates stroke-dashoffset on mount
- AnimatedCounter triggers only on IntersectionObserver, not on page load
- Usage endpoint returns all 4 `account` fields without breaking existing fields
