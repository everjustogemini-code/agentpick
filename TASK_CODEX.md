# TASK_CODEX.md — vNext
> Agent: Codex | Date: 2026-03-14 | Source: NEXT_VERSION.md
> Scope: Must-Have #2 (Glassmorphism UI overhaul) + Must-Have #3 (Playground frontend component)

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |
| MODIFY | `src/app/page.tsx` |
| MODIFY | `src/app/connect/page.tsx` |
| MODIFY | `src/components/SiteHeader.tsx` |
| MODIFY | `src/app/benchmarks/page.tsx` |
| MODIFY | `src/app/products/[slug]/page.tsx` |
| CREATE | `src/components/Playground.tsx` |

**DO NOT TOUCH:**
`src/app/api/**` (any API route),
`src/lib/router/**`,
`src/app/dashboard/router/page.tsx`,
`src/app/api/v1/route/crawl/route.ts`,
`src/app/api/v1/router/priority/route.ts`,
`src/app/api/v1/router/usage/route.ts`

---

## Task 1 — Global Design Tokens (`src/app/globals.css`)

Read the file first. Add the following blocks.

**Step 1 — CSS variables in `@layer base`:**
```css
@layer base {
  :root {
    --bg-base:          #07070A;
    --bg-surface:       rgba(255,255,255,0.05);
    --bg-surface-hover: rgba(255,255,255,0.08);
    --border-subtle:    rgba(255,255,255,0.08);
    --border-active:    rgba(255,255,255,0.25);
  }
}
```

**Step 2 — `@theme` extensions (Tailwind v4 syntax):**
```css
@theme {
  --shadow-glass: 0 8px 32px rgba(0,0,0,0.12);
  --shadow-glow-indigo: 0 0 24px rgba(99,102,241,0.5);
}
```

**Step 3 — Helper classes and animations:**
```css
/* Conic gradient mesh background for hero */
.hero-mesh {
  background:
    conic-gradient(from 180deg at 50% 50%, #07070A 0deg, #0f0f1a 360deg),
    radial-gradient(ellipse 80% 60% at 10% 20%, rgba(79,70,229,0.12) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 90% 80%, rgba(249,115,22,0.08) 0%, transparent 55%);
}

/* Glass card base */
.glass-card {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1rem;
  box-shadow: var(--shadow-glass);
}

.glass-card:hover {
  border-color: rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.08);
  transform: translateY(-4px);
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Animated stat counter entrance */
@keyframes count-up-fade {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stat-counter {
  animation: count-up-fade 0.8s ease-out forwards;
}

/* Score badge colors */
.badge-emerald { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
.badge-amber   { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
.badge-rose    { background: rgba(244,63,94,0.15);  color: #fb7185; border: 1px solid rgba(244,63,94,0.3); }

@media (prefers-reduced-motion: reduce) {
  .hero-mesh        { animation: none; }
  .glass-card       { transition: none; }
  .glass-card:hover { transform: none; }
  .stat-counter     { animation: none; }
}
```

---

## Task 2 — Hero Section (`src/app/page.tsx`)

Read the file. Make targeted changes only.

### 2A. Background
Find the outermost hero wrapper (likely a `<section>` or `<div>` with `min-h-screen` or similar). Replace its background-related classes with `hero-mesh` and set base color `bg-[#07070A]`:
```tsx
// Before (example — actual classes will differ):
className="bg-gradient-to-b from-gray-50 ..."
// After:
className="hero-mesh bg-[#07070A] ..."
```
Keep all existing layout classes (`min-h-screen`, `flex`, `items-center`, `px-*`, etc.).

### 2B. Hero card — add glass panel
If there is a central hero card/box, add the `glass-card` class. If there is no card, wrap the headline + CTA in:
```tsx
<div className="glass-card px-8 py-10 max-w-2xl mx-auto text-center">
  {/* existing headline + CTA content */}
</div>
```

### 2C. Headline gradient
Find the `<h1>`. Apply gradient text fill:
```tsx
className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-[#A78BFA]
           [keep existing text-size classes]"
```

### 2D. Animated stat counters
Find the stat numbers (latency ms, tool count, total calls). For each:
1. Add `'use client'` at the top of the file if not present.
2. Add this hook before the component:
   ```tsx
   function useCountUp(target: number, duration = 800): number {
     const [val, setVal] = React.useState(0)
     React.useEffect(() => {
       if (!target) return setVal(0)
       if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
         return setVal(target)
       }
       const start = performance.now()
       const frame = (now: number) => {
         const t = Math.min((now - start) / duration, 1)
         const eased = 1 - Math.pow(1 - t, 3)
         setVal(Math.round(eased * target))
         if (t < 1) requestAnimationFrame(frame)
       }
       requestAnimationFrame(frame)
     }, [target, duration])
     return val
   }
   ```
3. Replace each static stat number `{someValue}` with `{useCountUp(someValue)}`.
4. Add `className="stat-counter"` to the stat container elements.

### 2E. CTA button
Find the primary CTA button. Replace its background/shadow classes:
```tsx
className="... bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full
           hover:scale-[1.03] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)]
           transition-all duration-200"
```
Keep existing `px-*`, `py-*`, `text-*`, `font-*` classes.

---

## Task 3 — Tool/Agent Cards (Rankings + Products)

**Files:** `src/app/products/[slug]/page.tsx` and `src/app/benchmarks/page.tsx`

Read each file. For every agent/tool card element (the repeating items in a grid/list):

### 3A. Apply glass card styles
Replace flat white card backgrounds:
```tsx
// Find patterns like: bg-white border border-gray-200 rounded-xl
// Replace with:
className="glass-card p-5 [keep layout classes]"
```

### 3B. Score badge
Find where score/rating numbers are displayed (e.g. `8.4`, `7.2`). Wrap in a badge pill:
```tsx
const badgeClass = score >= 8.0 ? 'badge-emerald' : score >= 6.0 ? 'badge-amber' : 'badge-rose'

<span className={`${badgeClass} rounded-full px-2 py-0.5 text-xs font-semibold font-mono`}>
  {score.toFixed(1)}
</span>
```

### 3C. 7-day latency sparkline (inline SVG — no library)
If there are latency data points available per tool, add this sparkline after the score badge.
If no data is available, skip this sub-task rather than using fake data.

When data is available:
```tsx
function Sparkline({ values }: { values: number[] }) {
  if (!values?.length) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 64, h = 24
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const area = `M0,${h} L${pts.split(' ').map(p => p).join(' L')} L${w},${h} Z`
    .replace('M0,', 'M0,').replace(/L(\d)/g, ' L$1')
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={pts} fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={`M ${pts.replace(/,/g, ' ').split(' ').map((v,i) => i === 0 ? `0,${h}` : '').join('')}`}
        fill="rgba(124,58,237,0.12)" />
    </svg>
  )
}
```

---

## Task 4 — Navigation (`src/components/SiteHeader.tsx`)

Read the file. Apply frosted glass nav styling.

### 4A. Nav container
Find the `<header>` or `<nav>` root element. Add/replace background:
```tsx
className="sticky top-0 z-50 bg-black/60 backdrop-blur-lg border-b border-white/[0.08]
           [keep any existing layout classes]"
```

### 4B. Active link underline animation
Find the active link indicator. Replace static underline with animated scale:
```tsx
// Active state indicator element:
<span
  className="absolute bottom-0 left-0 h-px w-full bg-white origin-center
             scale-x-100 transition-transform duration-200"
  style={{ transform: isActive ? 'scaleX(1)' : 'scaleX(0)' }}
/>
```
If the nav uses a class toggle, use:
```tsx
className={isActive
  ? 'relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white after:scale-x-100 after:transition-transform after:duration-200'
  : 'relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white after:scale-x-0 after:transition-transform after:duration-200'
}
```

---

## Task 5 — `/connect` Page (`src/app/connect/page.tsx`)

Read the file. Apply targeted changes.

### 5A. Page background
Find the outermost wrapper. Set dark base:
```tsx
// Replace bg-white / bg-gray-50 / bg-slate-50 on the root element with:
className="bg-[#07070A] min-h-screen [keep other layout classes]"
```

### 5B. Section depth labels
For each major section (`<section>` tags), add a large background number label.
Find section headings and add before the heading text:
```tsx
<span className="text-[120px] font-black text-white/[0.04] absolute -top-8 -left-4 leading-none select-none pointer-events-none">
  {sectionIndex.toString().padStart(2, '0')}
</span>
```
Add `relative overflow-hidden` to the section container if not already present.
Use section numbers 01, 02, 03 for the first three sections.

### 5C. Code block terminal component
Find the existing code block(s) on the page. Replace each with:
```tsx
<div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black/50">
  {/* Terminal chrome */}
  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
    <div className="w-3 h-3 rounded-full bg-red-500/70" />
    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
    <div className="w-3 h-3 rounded-full bg-green-500/70" />
    <span className="ml-3 text-xs text-white/30 font-mono">[filename]</span>
  </div>
  {/* Code content — keep existing */}
  <pre className="p-5 text-sm leading-relaxed overflow-x-auto font-mono text-white/80">
    {/* existing code */}
  </pre>
</div>
```

### 5D. Pricing cards
Find pricing tier cards. Apply to each:
```tsx
// Standard tier card:
className="glass-card p-6"

// Active/highlighted tier — add ring:
className="glass-card p-6 ring-2 ring-indigo-500/60 bg-indigo-500/[0.08]"
```

---

## Task 6 — Playground Frontend Component (Must-Have #3)

### CREATE: `src/components/Playground.tsx`

Self-contained React client component. Calls `POST /api/v1/playground/route` (created by Claude Code).

```tsx
'use client'

import React, { useState } from 'react'

type PlaygroundType = 'search' | 'embed' | 'finance'
type PlaygroundResult = {
  tool: string
  classification_reason?: string
  latency_ms: number
  results: unknown[]
  traceId: string
  _playground: boolean
}

const TYPES: { id: PlaygroundType; label: string }[] = [
  { id: 'search',  label: 'Search' },
  { id: 'embed',   label: 'Embed' },
  { id: 'finance', label: 'Finance' },
]

const TRIAL_KEY = 'agentpick_playground_uses'
const MAX_FREE_USES = 3

export function Playground() {
  const [query, setQuery]     = useState('')
  const [type, setType]       = useState<PlaygroundType>('search')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<PlaygroundResult | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [showCta, setShowCta] = useState(false)

  function getUses(): number {
    try { return parseInt(localStorage.getItem(TRIAL_KEY) ?? '0', 10) } catch { return 0 }
  }
  function incrementUses() {
    try { localStorage.setItem(TRIAL_KEY, String(getUses() + 1)) } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/v1/playground/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResult(data)
      incrementUses()
      if (getUses() >= MAX_FREE_USES) setShowCta(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const pillBase = 'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer'
  const pillOn   = 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/50'
  const pillOff  = 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.07] hover:border-white/[0.15] hover:text-white/70'

  return (
    <div className="glass-card p-6 w-full max-w-2xl mx-auto space-y-5">
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40">
        Try it — no login required
      </div>

      {/* Type selector */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setType(t.id)}
            className={`${pillBase} ${type === t.id ? pillOn : pillOff}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Query input + submit */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={type === 'finance' ? 'e.g. AAPL stock price' : 'Enter your query…'}
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5
                     text-sm text-white placeholder:text-white/25
                     focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30
                     transition-all duration-150"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 rounded-lg text-sm font-medium
                     bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                     hover:scale-[1.03] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)]
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                     transition-all duration-200"
        >
          {loading ? '…' : 'Route it →'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ opacity: 1 }}
        >
          {/* Metadata row */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-1">
              tool: {result.tool}
            </span>
            <span className="rounded-md bg-white/[0.04] border border-white/[0.08] text-white/50 px-2 py-1">
              {result.latency_ms}ms
            </span>
            {result.traceId && (
              <span className="rounded-md bg-white/[0.04] border border-white/[0.08] text-white/30 px-2 py-1 font-mono">
                {result.traceId.slice(0, 12)}…
              </span>
            )}
          </div>

          {/* Classification reason */}
          {result.classification_reason && (
            <p className="text-xs text-white/40 italic">
              AI: {result.classification_reason}
            </p>
          )}

          {/* Results preview */}
          {Array.isArray(result.results) && result.results.length > 0 && (
            <div className="space-y-2">
              {(result.results as Array<{ title?: string; url?: string; snippet?: string }>).map((item, i) => (
                <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  {item.title && <div className="text-sm text-white/80 font-medium">{item.title}</div>}
                  {item.url && <div className="text-xs text-indigo-400/70 truncate mt-0.5">{item.url}</div>}
                  {item.snippet && <div className="text-xs text-white/40 mt-1 line-clamp-2">{item.snippet}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Soft CTA after 3 uses */}
      {showCta && (
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/[0.08] px-5 py-4 text-center space-y-2">
          <p className="text-sm font-medium text-white/80">Enjoying the router?</p>
          <p className="text-xs text-white/50">Get 3,000 free calls/month with a free account.</p>
          <a
            href="/connect"
            className="inline-block mt-1 px-4 py-2 rounded-lg text-xs font-semibold
                       bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                       hover:scale-[1.02] transition-transform duration-150"
          >
            Get 3,000 free calls/month →
          </a>
        </div>
      )}
    </div>
  )
}
```

After creating the component, **wire it into `/connect`** (`src/app/connect/page.tsx`):
1. Add import: `import { Playground } from '@/components/Playground'`
2. Insert the component in a prominent section above the existing code snippets:
   ```tsx
   <section className="w-full max-w-2xl mx-auto px-4 py-10">
     <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-5">
       Interactive playground
     </p>
     <Playground />
   </section>
   ```

---

## Acceptance Checklist

- [ ] `globals.css`: CSS vars (`--bg-base`, etc.), `@theme` block, `.glass-card`, `.hero-mesh`, badge classes, reduced-motion guard all present
- [ ] Homepage: `hero-mesh` class on hero wrapper, gradient `<h1>`, CTA pill button with indigo gradient + glow
- [ ] Homepage stat counters: animate 0→value over 800ms on page load; `prefers-reduced-motion` shows static values
- [ ] Tool/agent cards on `/products/*` and `/benchmarks`: use `glass-card`, hover lift, score badge pill
- [ ] Nav: frosted `bg-black/60 backdrop-blur-lg`, center-out underline on active link
- [ ] `/connect`: dark `#07070A` background, section depth labels (01/02/03), terminal chrome on code blocks, glass pricing cards
- [ ] `src/components/Playground.tsx` created and exported
- [ ] Playground renders on `/connect` page above existing code snippets
- [ ] 3 free uses tracked in `localStorage`; CTA prompt appears after 3rd use
- [ ] Loading state shows `…` in button; disabled when empty query
- [ ] Result animates in with fade+slide-up; shows tool name, latency, traceId, ≤2 result items
- [ ] No files outside the listed 7 touched
