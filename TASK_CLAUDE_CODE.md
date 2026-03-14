# TASK_CLAUDE_CODE.md — Cycle 4

> Agent: Claude Code | Date: 2026-03-14 | Difficulty: Hard
> Features: F1 (dark glass design system + dashboard redesign) + F3 (interactive code generator)

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |
| MODIFY | `src/app/dashboard/router/page.tsx` |
| MODIFY | `src/app/connect/page.tsx` |
| CREATE | `src/components/CodeGeneratorWidget.tsx` |

**DO NOT touch:** `src/app/page.tsx`, any file under `src/app/api/`, `src/lib/router/handler.ts`

---

## Task 1 — Global Design Tokens (`src/app/globals.css`)

> **Important:** This project uses **Tailwind CSS v4** via `@tailwindcss/postcss`. There is no
> `tailwind.config.ts`. Custom tokens go in CSS using `@theme` (v4 syntax).

**Step 1** — add CSS variables inside a `@layer base` block:

```css
@layer base {
  :root {
    --bg-base:           #0a0a0f;
    --bg-surface:        rgba(255,255,255,0.04);
    --bg-surface-hover:  rgba(255,255,255,0.07);
    --border-subtle:     rgba(255,255,255,0.08);
    --border-active:     rgba(249,115,22,0.45);
    --gradient-mesh:
      radial-gradient(ellipse 80% 60% at 50% -10%,
        rgba(249,115,22,0.15) 0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 80% 80%,
        rgba(99,102,241,0.08) 0%, transparent 60%);
  }
}
```

**Step 2** — add `@theme` extensions (Tailwind v4 way to extend utilities):

```css
@theme {
  --backdrop-blur-xs: 4px;
  --shadow-glass: 0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4);
  --shadow-glow-orange: 0 0 12px rgba(249,115,22,0.35);
  --shadow-glow-cyan: 0 0 12px rgba(14,165,233,0.3);
}
```

**Step 3** — add `hero-mesh` animation and Safari `-webkit-backdrop-filter` fallback:

```css
@keyframes mesh-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.hero-mesh {
  background:
    var(--gradient-mesh),
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 200% 200%, 64px 64px, 64px 64px;
  animation: mesh-shift 20s ease infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hero-mesh { animation: none; }
  [data-animate] { transition: none !important; animation: none !important; }
}

/* Safari glass fallback */
.glass-card {
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
```

---

## Task 2 — Router Dashboard Redesign (`src/app/dashboard/router/page.tsx`)

Read this file carefully before editing. Make these targeted changes:

### 2A. Glass card pattern — replace ALL flat white cards

Find every element matching these patterns:
- `bg-white` combined with `border-gray-100` or `border-gray-200`
- `bg-gray-50` or `bg-gray-100` used as card backgrounds
- Any `border border-gray-*` wrapping a card-like container

Replace each with this exact class string (keep the element's existing `p-*`, `rounded-*` if present, or upgrade `rounded-xl` → `rounded-2xl`):

```
rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm shadow-glass
transition-all duration-200 hover:border-white/[0.13] hover:bg-white/[0.06] glass-card
```

Applies to: stat cards, tool usage panel, strategy selector, strategy comparison table,
recent calls panel, settings panel, upgrade CTA.

### 2B. Animated Stat Counters

The file needs `'use client'` at the top if not already present.

Add this hook **inside the component file, before the component function**:

```tsx
function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = React.useState(0)
  React.useEffect(() => {
    if (!target) return setValue(0)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return setValue(target)
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // cubic-bezier(0.25, 1, 0.5, 1) approximation
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * target))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
}
```

For each stat number display, replace the static value with the animated one.
Example — if the current stat block looks like:
```tsx
<div className="text-2xl font-bold text-gray-900">{stats.totalCalls}</div>
<div className="text-sm text-gray-500">Total Calls</div>
```

Replace with:
```tsx
// At top of component, one per stat:
const animTotalCalls = useCountUp(stats?.totalCalls ?? 0)

// In JSX:
<div className="text-3xl font-bold tabular-nums bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
  {animTotalCalls.toLocaleString()}
</div>
<div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30 mt-1">
  Total Calls
</div>
```

Apply this pattern to all stat values (total calls, avg latency, success rate, etc.).

### 2C. Tool Usage Bars — Gradient + Stagger

Find the tool usage progress bar fill elements. They likely look like:
```tsx
<div className="... bg-orange-400" style={{ width: `${pct}%` }} />
```

Replace with:
```tsx
<div
  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
  style={{
    width: `${pct}%`,
    boxShadow: '0 0 12px rgba(249,115,22,0.35)',
    transitionDelay: `${index * 60}ms`,
    willChange: 'width',
  }}
  data-animate
/>
```

The `index` comes from the `.map((tool, index) => ...)` iteration.

### 2D. Strategy Pills — Active Glow State

Find the strategy selection buttons/pills. Modify their className logic:

```tsx
// Active pill:
className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
  ${isActive
    ? 'bg-orange-500/15 border-orange-500/50 text-orange-300 ring-1 ring-orange-500/50 shadow-glow-orange'
    : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.07] hover:border-white/[0.15] hover:text-white/70'
  }`}
```

### 2E. Recent Call Rows

Find the recent calls list. Add to each row:
```tsx
className="... hover:bg-white/[0.04] transition-colors duration-150"
```

### 2F. Form Inputs (login / settings inputs)

If this page has any input fields, add focus styling:
```tsx
className="... focus:border-orange-500/60 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] focus:outline-none"
```

---

## Task 3 — Create `src/components/CodeGeneratorWidget.tsx`

This is a **pure client-side** component. No API calls. All 60 combinations (3 langs × 4 capabilities × 5 strategies) are generated via template strings at render time.

```tsx
'use client'

import React, { useState } from 'react'

type Language   = 'python' | 'javascript' | 'curl'
type Capability = 'search' | 'crawl' | 'finance' | 'embed'
type Strategy   = 'auto' | 'balanced' | 'cheapest' | 'best_performance' | 'fastest'

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'python',     label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'curl',       label: 'curl' },
]
const CAPABILITIES: { id: Capability; label: string }[] = [
  { id: 'search',  label: 'search' },
  { id: 'crawl',   label: 'crawl' },
  { id: 'finance', label: 'finance' },
  { id: 'embed',   label: 'embed' },
]
const STRATEGIES: { id: Strategy; label: string }[] = [
  { id: 'auto',             label: 'auto' },
  { id: 'balanced',         label: 'balanced' },
  { id: 'cheapest',         label: 'cheapest' },
  { id: 'best_performance', label: 'best_performance' },
  { id: 'fastest',          label: 'fastest' },
]

const CAP_PARAMS: Record<Capability, { key: string; value: string }> = {
  search:  { key: 'query',  value: '"your query here"' },
  crawl:   { key: 'url',    value: '"https://example.com"' },
  finance: { key: 'symbol', value: '"AAPL"' },
  embed:   { key: 'text',   value: '"your text here"' },
}

const CAP_PATH: Record<Capability, string> = {
  search:  'route/search',
  crawl:   'route/crawl',
  finance: 'route/finance',
  embed:   'route/embed',
}

function generateCode(lang: Language, cap: Capability, strategy: Strategy): string {
  const { key, value } = CAP_PARAMS[cap]

  if (lang === 'python') return `import agentpick

client = agentpick.Client(api_key="YOUR_KEY")
result = client.${cap}(
    ${key}=${value},
    strategy="${strategy}"
)
print(result)`

  if (lang === 'javascript') return `import AgentPick from 'agentpick'

const client = new AgentPick({ apiKey: 'YOUR_KEY' })
const result = await client.${cap}({
  ${key}: ${value},
  strategy: '${strategy}',
})
console.log(result)`

  // curl
  return `curl -X POST https://agentpick.com/api/v1/${CAP_PATH[cap]} \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "${key}": ${value},
    "strategy": "${strategy}"
  }'`
}

// Minimal syntax colorizer
function CodeLine({ text, lang }: { text: string; lang: Language }) {
  const t = text.trimStart()
  let color = 'text-white/70'

  if (lang === 'curl') {
    if (t.startsWith('-H') || t.startsWith('-X') || t.startsWith('-d')) color = 'text-sky-400'
    else if (t.startsWith('"') || t.startsWith("'")) color = 'text-green-400/80'
    else if (t.startsWith('curl')) color = 'text-orange-400'
  } else {
    if (t.startsWith('import') || t.startsWith('from') || t.startsWith('const') || t.startsWith('print') || t.startsWith('console')) {
      color = 'text-orange-400'
    } else if (t.startsWith('client') || t.startsWith('result')) {
      color = 'text-sky-300'
    } else if (t.includes('"') || t.includes("'")) {
      color = 'text-green-400/80'
    }
  }

  return <span className={color}>{text}</span>
}

export function CodeGeneratorWidget() {
  const [lang, setLang]         = useState<Language>('python')
  const [cap, setCap]           = useState<Capability>('search')
  const [strategy, setStrategy] = useState<Strategy>('auto')
  const [copied, setCopied]     = useState(false)

  const code = generateCode(lang, cap, strategy)
  const filename = lang === 'python' ? 'example.py' : lang === 'javascript' ? 'example.mjs' : 'request.sh'

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const pillBase   = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer'
  const pillOn     = 'bg-orange-500/15 border-orange-500/50 text-orange-300 ring-1 ring-orange-500/50'
  const pillOff    = 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.07] hover:border-white/[0.15] hover:text-white/70'

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm glass-card p-5 space-y-4 w-full">
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">
        Build your request
      </div>

      <div className="space-y-3">
        {/* Language row */}
        <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-xs text-white/30 w-20 shrink-0 pt-1">Language</span>
          <div className="flex gap-1.5 flex-wrap">
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => setLang(l.id)}
                className={`${pillBase} ${lang === l.id ? pillOn : pillOff}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Capability row */}
        <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-xs text-white/30 w-20 shrink-0 pt-1">Capability</span>
          <div className="flex gap-1.5 flex-wrap">
            {CAPABILITIES.map(c => (
              <button key={c.id} onClick={() => setCap(c.id)}
                className={`${pillBase} ${cap === c.id ? pillOn : pillOff}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy row */}
        <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-xs text-white/30 w-20 shrink-0 pt-1">Strategy</span>
          <div className="flex gap-1.5 flex-wrap">
            {STRATEGIES.map(s => (
              <button key={s.id} onClick={() => setStrategy(s.id)}
                className={`${pillBase} ${strategy === s.id ? pillOn : pillOff}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Code block */}
      <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-black/40">
        {/* Terminal chrome bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="ml-2 text-[10px] text-white/20 font-mono">{filename}</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-[11px] font-medium transition-all duration-200 active:scale-95
                       text-white/30 hover:text-white/70 select-none"
          >
            {copied
              ? <span className="text-green-400">✓ Copied</span>
              : 'Copy'}
          </button>
        </div>

        {/* Code lines */}
        <pre
          className="p-4 text-[12px] leading-relaxed overflow-x-auto"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace" }}
        >
          {code.split('\n').map((line, i) => (
            <div key={i} className="min-h-[1.25rem]">
              <CodeLine text={line} lang={lang} />
            </div>
          ))}
        </pre>
      </div>

      <p className="text-[10px] text-white/20">
        Replace{' '}
        <span className="font-mono text-orange-400/70">YOUR_KEY</span>
        {' '}with your API key from{' '}
        <a href="/dashboard/router" className="text-white/40 hover:text-white/60 underline underline-offset-2">
          Settings
        </a>.
      </p>
    </div>
  )
}
```

---

## Task 4 — Wire Widget into `/connect` (`src/app/connect/page.tsx`)

Read the file first. Then:

1. Add import at the top of the file:
   ```tsx
   import { CodeGeneratorWidget } from '@/components/CodeGeneratorWidget'
   ```

2. Find the first content section (after any nav/header). Insert the widget block **before** the existing docs/code-snippet content:
   ```tsx
   <section className="w-full max-w-3xl mx-auto px-4 pt-10 pb-6">
     <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-4">
       Interactive code generator
     </p>
     <CodeGeneratorWidget />
   </section>
   ```

3. Replace the page root background:
   - Find `bg-white`, `bg-gray-50`, or `bg-slate-50` on the outermost wrapper
   - Replace with `bg-[#0a0a0f]` (or `style={{ backgroundColor: 'var(--bg-base)' }}`)

4. Apply glass card pattern to any remaining flat white cards (same pattern as Task 2A).

---

## Acceptance Checklist

- [ ] `globals.css` has `@layer base` vars, `@theme` block, `hero-mesh` class, `@keyframes mesh-shift`
- [ ] Dashboard router: zero `bg-white` flat cards remain
- [ ] Stat counters animate 0→value over 600ms on load; reduced-motion users see static values
- [ ] Tool bars: gradient fill `from-orange-500 to-amber-400` + stagger delay 0/60/120ms…
- [ ] Strategy pills: active state has `ring-1 ring-orange-500/50` glow
- [ ] Recent call rows: `hover:bg-white/[0.04]` hover state
- [ ] `CodeGeneratorWidget` exported from `src/components/CodeGeneratorWidget.tsx`
- [ ] Widget renders on `/connect` above existing endpoint docs
- [ ] All 60 combos generate non-empty, syntactically valid code strings
- [ ] Copy button: `navigator.clipboard.writeText` + `✓ Copied` for 1500ms then resets
- [ ] Zero API calls triggered by widget interaction
- [ ] Mobile: all rows stack vertically, no horizontal overflow
- [ ] `-webkit-backdrop-filter` fallback via `.glass-card` class
