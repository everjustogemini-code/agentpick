# TASK_CLAUDE_CODE.md — Cycle 2

> Agent: Claude Code | Date: 2026-03-14 | Difficulty: Hard
> Features: F2 (4 API bug fixes) + F3 (Playground) + F1D (AnimatedCounter) + F1E (ScoreRing)

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/api/v1/route/crawl/route.ts` |
| MODIFY | `src/app/api/v1/router/priority/route.ts` |
| MODIFY | `src/app/api/v1/router/usage/route.ts` |
| MODIFY | `src/app/api/v1/router/strategy/route.ts` *(read first — find where strategy enum lives)* |
| MODIFY | `src/app/api/v1/playground/run/route.ts` |
| MODIFY | `src/app/playground/page.tsx` |
| MODIFY | `src/components/PlaygroundShell.tsx` |
| MODIFY | `src/components/SiteHeader.tsx` |
| MODIFY | `src/app/benchmarks/page.tsx` |
| MODIFY | `src/app/products/[slug]/page.tsx` |
| CREATE | `src/components/ScoreRing.tsx` |
| CREATE | `src/components/AnimatedCounter.tsx` |
| MODIFY | `prisma/schema.prisma` |
| CREATE | `prisma/migrations/20260314_playground_rate_limits/migration.sql` |

**DO NOT TOUCH:** `src/app/globals.css`, `src/app/page.tsx`, `src/app/connect/page.tsx`

---

## Feature 2 — Fix 4 P2 API Contract Bugs

### Bug A — `/api/v1/route/crawl` rejects flat body (QA test 1.1b)

File: `src/app/api/v1/route/crawl/route.ts`

**Read the file first.** Then at the handler entry, replace the body parse with a Zod union that accepts both `{ url }` (flat) and `{ params: { url } }` (nested). Use the normalized `url` everywhere below:

```ts
import { z } from 'zod'

const CrawlBody = z.union([
  z.object({ params: z.object({ url: z.string().url() }) }),
  z.object({ url: z.string().url() }),
])
const parsed = CrawlBody.parse(body)
const url = 'params' in parsed ? parsed.params.url : parsed.url
```

Canonical docs shape remains `{ params: { url } }`. Flat shape is silently accepted forever.

---

### Bug B — `/api/v1/router/priority` wrong field name (QA test 2.6)

File: `src/app/api/v1/router/priority/route.ts`

**Read the file first.** At the very top of the handler (before any Zod validation), add normalization:

```ts
const tools = body.tools ?? body.priority_tools ?? body.search
if (!tools?.length) {
  return NextResponse.json(
    { error: 'Provide tools or priority_tools' },
    { status: 400 }
  )
}
// replace all subsequent uses of body.tools / body.priority_tools with `tools`
```

---

### Bug C — Usage endpoint missing account fields (QA test 7.1)

File: `src/app/api/v1/router/usage/route.ts`

**Read the file first.** Extend the `account` object from `{ plan }` to all four fields:

```ts
const plan = user.plan ?? 'free'

const PLAN_LIMITS: Record<string, number> = {
  free: 10_000,
  pro: 100_000,
  enterprise: 10_000_000,
}
const monthlyLimit = PLAN_LIMITS[plan] ?? 10_000

const now = new Date()
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
const callsThisMonth = await prisma.routerCall.count({
  where: { userId: user.id, createdAt: { gte: monthStart } },
})

const strategy = user.strategy ?? 'auto'

const account = { plan, monthlyLimit, callsThisMonth, strategy }
```

---

### Bug D — `custom` strategy not supported for fallback (QA test 1.3)

**Read `src/app/api/v1/router/strategy/route.ts` first** (and any strategy enum/switch in `src/lib/router/`). Find where the strategy enum is defined and where routing dispatches by strategy name.

1. Add `"custom"` to the valid strategy values (Zod enum or string union).
2. In the routing dispatch switch/if-else, handle `"custom"`:

```ts
case 'custom': {
  const saved: string[] = user.priorityTools ?? []
  if (saved.length === 0) {
    return resolveAuto(context)   // fall back to auto
  }
  return resolvePriority(saved, context)
}
```

If `resolveAuto` / `resolvePriority` have different names in the codebase, use the actual function names — do not rename them.

---

## Feature 3 — Interactive API Playground (`/playground`)

### 3A. Database Migration

Create file: `prisma/migrations/20260314_playground_rate_limits/migration.sql`

```sql
CREATE TABLE IF NOT EXISTS playground_rate_limits (
  id    SERIAL  PRIMARY KEY,
  ip    TEXT    NOT NULL,
  date  DATE    NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE (ip, date)
);
```

Add the Prisma model to `prisma/schema.prisma` (read the file to find the right place to insert):

```prisma
model PlaygroundRateLimit {
  id    Int      @id @default(autoincrement())
  ip    String
  date  DateTime @db.Date
  count Int      @default(1)

  @@unique([ip, date])
  @@map("playground_rate_limits")
}
```

---

### 3B. Playground API Route

File: `src/app/api/v1/playground/run/route.ts`

**Read the file first.** Rewrite the POST handler with demo-key rate limiting:

```
POST /api/v1/playground/run
Body: { endpoint: 'search'|'crawl'|'embed'|'finance', query: string, strategy: string, apiKey?: string }

Logic:
1. If apiKey is provided AND is NOT equal to process.env.PLAYGROUND_DEMO_KEY:
   → forward to real route /api/v1/route/{endpoint} with the user's key, no rate limit check.

2. Otherwise (demo key path):
   a. Extract IP from x-forwarded-for header (first value) or req socket remoteAddress.
   b. Upsert playground_rate_limits: increment count for ip + today's UTC date.
      SQL: INSERT INTO playground_rate_limits (ip, date, count)
           VALUES ($1, CURRENT_DATE, 1)
           ON CONFLICT (ip, date) DO UPDATE SET count = playground_rate_limits.count + 1
           RETURNING count;
   c. If returned count > 10:
      → return 429 { error: "Demo limit reached", cta: "Sign up free to continue" }
   d. Otherwise: forward to /api/v1/route/{endpoint} with Authorization: Bearer {PLAYGROUND_DEMO_KEY}.

3. Return the real route's JSON response unchanged.
```

Use `prisma.playgroundRateLimit.upsert` or a raw `prisma.$executeRaw` — whichever fits cleanly.

---

### 3C. Playground Page

File: `src/app/playground/page.tsx`

**Read the file first.** Replace/update with:

```tsx
import type { Metadata } from 'next'
import PlaygroundShell from '@/components/PlaygroundShell'

export const metadata: Metadata = {
  title: 'API Playground — AgentPick',
  description: 'Try the AgentPick router live in your browser. No signup required.',
}

export default function PlaygroundPage() {
  return (
    <main className="bg-gray-950 min-h-screen pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <p className="uppercase tracking-widest text-xs text-cyan-400 mb-2">Interactive Demo</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">API Playground</h1>
        <p className="mt-2 text-gray-400 text-sm max-w-lg">
          Run live routing queries against the AgentPick API. No signup needed — demo key included.
        </p>
      </div>
      <PlaygroundShell />
    </main>
  )
}
```

---

### 3D. PlaygroundShell Component

File: `src/components/PlaygroundShell.tsx`

**Read the file first.** Rewrite as a full `"use client"` component with the two-panel layout below.

#### State shape

```ts
const [endpoint, setEndpoint] = useState<'search'|'crawl'|'embed'|'finance'>('search')
const [query, setQuery] = useState('')
const [strategy, setStrategy] = useState<'auto'|'fastest'|'cheapest'|'best_quality'>('auto')
const [apiKey, setApiKey] = useState('')        // '' = use demo key
const [showKeyInput, setShowKeyInput] = useState(false)
const [loading, setLoading] = useState(false)
const [result, setResult] = useState<object | null>(null)
const [latency, setLatency] = useState<number | null>(null)
const [toolUsed, setToolUsed] = useState<string | null>(null)
const [error429, setError429] = useState(false)
const [activeTab, setActiveTab] = useState<'response'|'curl'|'python'|'node'>('response')
```

#### Layout

```tsx
<div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
  {/* LEFT: Request Builder */}
  {/* RIGHT: Response Panel */}
</div>
```

Both panels: `bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-6`

#### Request Builder (left panel)

**Endpoint tabs** — pill row, `flex gap-2 mb-5`:
- Pill: `px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors`
- Active: `bg-cyan-500 text-white`
- Inactive: `bg-white/10 text-gray-400 hover:bg-white/20`
- Options: `Search` | `Crawl` | `Embed` | `Finance`

**Query textarea:**
```tsx
<label className="block text-xs text-gray-500 uppercase tracking-widest mb-1">Query</label>
<textarea
  rows={3}
  value={query}
  onChange={e => setQuery(e.target.value)}
  placeholder="Find the latest research on LLM benchmarks"
  className="w-full font-mono text-sm bg-black/30 border border-white/10 rounded-lg px-3 py-2
             text-gray-100 placeholder:text-gray-600 resize-none focus:outline-none
             focus:border-cyan-500/50 transition-colors"
/>
```

**Strategy pills** — below textarea, same pill style as endpoint tabs:
- Label: `<p className="text-xs text-gray-500 uppercase tracking-widest mt-4 mb-2">Strategy</p>`
- Options: `auto` | `fastest` | `cheapest` | `best_quality` (display as `Auto` | `Fastest` | `Cheapest` | `Best Quality`)

**API key row** (below strategy pills):
```tsx
{!showKeyInput ? (
  <div className="flex items-center gap-3 mt-4">
    <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
      Using demo key (10 req/day)
    </span>
    <button onClick={() => setShowKeyInput(true)}
      className="text-xs text-cyan-400 hover:text-cyan-300">
      Use my own key →
    </button>
  </div>
) : (
  <input
    type="text"
    value={apiKey}
    onChange={e => setApiKey(e.target.value)}
    placeholder="sk-..."
    className="mt-4 w-full font-mono text-sm bg-black/30 border border-white/10 rounded-lg
               px-3 py-2 text-gray-100 placeholder:text-gray-600 focus:outline-none
               focus:border-cyan-500/50 transition-colors"
  />
)}
```

**Run button:**
```tsx
<button
  onClick={handleRun}
  disabled={!query.trim() || loading}
  className="mt-5 w-full py-3 rounded-lg font-semibold text-white
             bg-gradient-to-r from-cyan-600 to-blue-600
             hover:from-cyan-500 hover:to-blue-500
             transition-all disabled:opacity-40 disabled:cursor-not-allowed
             flex items-center justify-center gap-2"
>
  {loading
    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    : '▶ Run Query'}
</button>
```

**handleRun function:**
```ts
async function handleRun() {
  if (!query.trim() || loading) return
  setLoading(true)
  setError429(false)
  const t0 = Date.now()
  try {
    const res = await fetch('/api/v1/playground/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        query,
        strategy,
        apiKey: apiKey || undefined,
      }),
    })
    const data = await res.json()
    if (res.status === 429) {
      setError429(true)
      setResult(null)
    } else {
      setResult(data)
      setLatency(data.latency ?? Date.now() - t0)
      setToolUsed(data.tool ?? null)
      setActiveTab('response')
    }
  } finally {
    setLoading(false)
  }
}
```

#### Response Panel (right panel)

**Tab row:**
```tsx
<div className="flex gap-2 mb-4 flex-wrap">
  {(['response','curl','python','node'] as const).map(tab => (
    <button key={tab} onClick={() => setActiveTab(tab)}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        activeTab === tab
          ? 'bg-cyan-500 text-white'
          : 'bg-white/10 text-gray-400 hover:bg-white/20'
      }`}>
      {tab === 'curl' ? 'cURL' : tab === 'node' ? 'Node' : tab === 'python' ? 'Python' : 'Response'}
    </button>
  ))}
</div>
```

**429 error banner** (show when `error429 === true`):
```tsx
<div className="mb-3 p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm">
  Demo limit reached.{' '}
  <a href="/connect" className="underline underline-offset-2">Sign up free to continue</a>
</div>
```

**Response tab content:**
- Empty state (result is null):
  ```tsx
  <div className="border border-dashed border-white/20 rounded-lg h-48 flex items-center
                  justify-center text-gray-500 text-sm">
    Run a query to see live routing
  </div>
  ```
- With result:
  ```tsx
  <div className="relative">
    {/* Badge row */}
    <div className="flex gap-2 mb-2">
      {latency && (
        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono">
          {latency}ms
        </span>
      )}
      {toolUsed && (
        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-mono">
          {toolUsed}
        </span>
      )}
    </div>
    <pre className="text-xs font-mono bg-black/40 rounded p-4 text-gray-100 overflow-auto max-h-80
                    transition-opacity duration-300">
      {JSON.stringify(result, null, 2)}
    </pre>
  </div>
  ```

**Code tabs** — each tab is a `<div className="relative">` containing:
```tsx
<button
  onClick={() => copyToClipboard(snippet)}
  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-xs text-gray-400 px-2 py-1 rounded transition-colors"
>
  {copied ? '✓ Copied' : 'Copy'}
</button>
<pre className="text-xs font-mono bg-black/40 rounded p-4 text-gray-300 overflow-auto max-h-80 pt-8">
  {snippet}
</pre>
```

Use a single `const [copied, setCopied] = useState(false)` with a `setTimeout` reset at 2000ms.

**Live code snippet generation** (no Run click needed — derive from state):

```ts
const effectiveKey = apiKey || 'demo_key'

const curlSnippet = `curl -X POST https://agentpick.dev/api/v1/route/${endpoint} \\
  -H "Authorization: Bearer ${effectiveKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "${query || 'your query here'}", "strategy": "${strategy}"}'`

const pythonSnippet = `import requests

res = requests.post(
    "https://agentpick.dev/api/v1/route/${endpoint}",
    headers={"Authorization": "Bearer ${effectiveKey}"},
    json={"query": "${query || 'your query here'}", "strategy": "${strategy}"}
)
print(res.json()["tool"], res.json()["latency"])`

const nodeSnippet = `const res = await fetch('https://agentpick.dev/api/v1/route/${endpoint}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${effectiveKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: "${query || 'your query here'}", strategy: "${strategy}" })
})
const data = await res.json()
console.log(data.tool, data.latency + 'ms')`
```

**CTA banner** (demo key mode only — hide when `apiKey` is non-empty):
```tsx
{!apiKey && (
  <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-cyan-900/40 to-blue-900/40
                  border border-cyan-500/20 text-sm text-center">
    <span className="text-gray-300">Get your free API key →</span>{' '}
    <a href="/connect"
       className="text-cyan-400 font-semibold hover:text-cyan-300 underline underline-offset-2">
      Sign up free
    </a>
  </div>
)}
```

---

### 3E. Add Playground to Main Nav

File: `src/components/SiteHeader.tsx`

**Read the file first.** Find the nav links array (desktop nav + mobile drawer). Add a `Playground` entry between `Router` and `Dashboard`, matching the exact className/style of the surrounding nav items. If nav links are defined as an array of objects, add:

```ts
{ label: 'Playground', href: '/playground' }
```

---

## Feature 1D — Animated Metric Counters

### AnimatedCounter Component

Create: `src/components/AnimatedCounter.tsx`

```tsx
"use client"

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  decimals?: 0 | 1
  duration?: number
}

export default function AnimatedCounter({ value, decimals = 0, duration = 1200 }: Props) {
  const [display, setDisplay] = useState(decimals === 1 ? '0.0' : '0')
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          observer.disconnect()

          // Check prefers-reduced-motion
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setDisplay(decimals === 1 ? value.toFixed(1) : Math.round(value).toLocaleString())
            return
          }

          const start = performance.now()
          function tick(now: number) {
            const elapsed = now - start
            const t = Math.min(elapsed / duration, 1)
            // ease-out cubic: cubic-bezier(0.25, 1, 0.5, 1)
            const progress = 1 - Math.pow(1 - t, 3)
            const current = value * progress
            setDisplay(
              decimals === 1
                ? current.toFixed(1)
                : Math.round(current).toLocaleString()
            )
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, decimals, duration])

  return (
    <span ref={ref} style={{ display: 'inline-block', minWidth: 'max-content' }}>
      <span aria-hidden>{display}</span>
      {/* Hidden clone prevents layout shift */}
      <span className="sr-only">{decimals === 1 ? value.toFixed(1) : Math.round(value).toLocaleString()}</span>
    </span>
  )
}
```

### Integrate into Benchmarks Page

File: `src/app/benchmarks/page.tsx`

**Read the file first.** Find all numeric stats (latency ms, counts, scores 0–10). Import `AnimatedCounter` from `@/components/AnimatedCounter` and wrap:
- Latency/ms: `<AnimatedCounter value={latencyMs} decimals={0} />ms`
- Counts: `<AnimatedCounter value={count} decimals={0} />`
- Scores: `<AnimatedCounter value={score} decimals={1} />`

Also import and integrate `ScoreRing` (see below) in the same file edit pass.

### Integrate into Product Pages

File: `src/app/products/[slug]/page.tsx`

Same pattern — **read first**, then wrap numeric stats with `AnimatedCounter` and replace score displays with `ScoreRing`.

---

## Feature 1E — Benchmark Score Ring (SVG Component)

### ScoreRing Component

Create: `src/components/ScoreRing.tsx`

```tsx
"use client"

import { useEffect, useRef, useState } from 'react'

interface Props {
  score: number   // 0–10
  size?: number   // default 48
}

function scoreColor(score: number) {
  if (score >= 8) return '#22c55e'   // green-500
  if (score >= 6) return '#f59e0b'   // amber-500
  return '#ef4444'                    // red-500
}

export default function ScoreRing({ score, size = 48 }: Props) {
  const r = size / 2 - 4
  const circumference = 2 * Math.PI * r
  const finalOffset = circumference * (1 - score / 10)
  const [offset, setOffset] = useState(circumference)
  const reduced = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced.current) {
      setOffset(finalOffset)
      return
    }
    // Trigger animation: start at circumference, set to final after one frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOffset(finalOffset))
    })
  }, [finalOffset])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Score: ${score.toFixed(1)}`}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#1f2937" strokeWidth={4}
      />
      {/* Score arc */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={scoreColor(score)}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: reduced.current ? 'none' : 'stroke-dashoffset 600ms ease-out',
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      />
      {/* Label */}
      <text
        x="50%" y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.28}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="500"
        fill="white"
      >
        {score.toFixed(1)}
      </text>
    </svg>
  )
}
```

### Integrate ScoreRing into Pages

- **`src/app/benchmarks/page.tsx`** — find benchmark result rows that show a raw score number; replace with `<ScoreRing score={score} size={48} />`. Do this in the same edit pass as AnimatedCounter integration.
- **`src/app/products/[slug]/page.tsx`** — find score cards; replace raw score display with `<ScoreRing score={score} size={56} />`. Same edit pass as AnimatedCounter.

---

## Acceptance Criteria

- [ ] QA tests 1.1b, 2.6, 7.1, 1.3 all pass; zero regressions on currently-passing tests
- [ ] `/playground` two-column on desktop, single-column on mobile, no horizontal scroll
- [ ] Demo key rate limit fires at request 11 → 429 + CTA banner
- [ ] All 4 endpoint types (search, crawl, embed, finance) return real responses on demo key
- [ ] Code snippets update live as query/strategy/endpoint/apiKey state changes
- [ ] `Playground` in main nav (desktop + mobile drawer)
- [ ] `ScoreRing` animates stroke-dashoffset on mount with correct color thresholds
- [ ] `AnimatedCounter` counts up from 0 on viewport entry, no SSR errors
- [ ] `prefers-reduced-motion: reduce` skips all animations
