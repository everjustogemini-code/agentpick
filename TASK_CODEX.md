# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #2 (UI upgrade) + Must-Have #3 (frontend permalink page)

---

## Coverage Check — Every NEXT_VERSION.md Item Assigned to Codex

| Must-Have | Item | File(s) |
|-----------|------|---------|
| #2 | Glassmorphic nav (blur, pulse dot, active underline) | `src/components/SiteHeader.tsx` |
| #2 | Glass cards + panels (all feature cards, stat panels, pricing) | `src/app/globals.css`, `src/app/page.tsx` |
| #2 | Hero h1 gradient + clamp font size | `src/app/page.tsx` |
| #2 | JetBrains Mono via next/font/google across all pages | `src/app/layout.tsx` |
| #2 | Animated radial gradient mesh background (CSS @keyframes, 20s) | `src/app/globals.css` |
| #2 | Hero stat counters count-up via IntersectionObserver, 800ms | `src/app/page.tsx` |
| #2 | CTA button glow pulse on hover | `src/app/page.tsx` |
| #2 | Leaderboard score bars red→yellow→green gradient | `src/app/rankings/page.tsx` |
| #2 | `pip install` one-click copy with "Copied! ✓" tooltip | `src/app/page.tsx` or wherever the snippet lives |
| #2 | All motion behind `@media (prefers-reduced-motion: no-preference)` | `src/app/globals.css` |
| #3 | `/b/[runId]` public permalink page (ISR, reproduce snippets, OG meta) | `src/app/b/[runId]/page.tsx` **CREATE** |

---

## Task 1 — Global CSS Tokens + Animations (`src/app/globals.css`)

Read the file first. Add/replace the following blocks. Zero new npm packages — pure CSS.

### 1A. CSS variables
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

### 1B. Animated gradient mesh background
```css
@keyframes mesh-drift {
  0%   { background-position: 0% 50%, 100% 0%; }
  50%  { background-position: 100% 50%, 0% 100%; }
  100% { background-position: 0% 50%, 100% 0%; }
}

.hero-mesh {
  background:
    radial-gradient(ellipse 80% 60% at 10% 20%, rgba(79,70,229,0.14) 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 90% 80%, rgba(249,115,22,0.09) 0%, transparent 50%),
    #07070A;
  background-size: 200% 200%, 200% 200%;
  animation: mesh-drift 20s ease-in-out infinite;
}
```

### 1C. Glass card utility
```css
.glass-card {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  transition: transform 200ms cubic-bezier(0.34,1.56,0.64,1),
              box-shadow 200ms ease,
              background 200ms ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  background: rgba(255,255,255,0.08);
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
}
```

### 1D. Score bar gradient (for leaderboard)
```css
.score-bar {
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%);
  border-radius: 9999px;
  height: 6px;
}
```

### 1E. Live pulse dot (nav)
```css
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.4); }
}
.live-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: live-pulse 2s ease-in-out infinite;
  display: inline-block;
}
```

### 1F. Reduced-motion guard (REQUIRED — wrap all motion)
```css
@media (prefers-reduced-motion: reduce) {
  .hero-mesh     { animation: none; }
  .glass-card    { transition: none; }
  .glass-card:hover { transform: none; }
  .live-dot      { animation: none; }
}
```

---

## Task 2 — Root Layout: JetBrains Mono font (`src/app/layout.tsx`)

Read the file. Load JetBrains Mono via `next/font/google` and apply it to all `font-mono` elements.

```tsx
import { JetBrains_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})
```

In the root `<html>` or `<body>` element, add the variable class:
```tsx
<body className={`${jetbrainsMono.variable} ...existing classes...`}>
```

In `globals.css` (or Tailwind config if using v4), map the variable:
```css
@theme {
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}
```

---

## Task 3 — Hero Section (`src/app/page.tsx`)

Read the file. Make targeted changes only. Add `'use client'` at top if not already present.

### 3A. Background
Find the outermost `<section>` or wrapper `<div>` for the hero. Add `hero-mesh` class and ensure `bg-[#07070A]` base:
```tsx
// Find the element with min-h-screen / hero styling. Add:
className="hero-mesh bg-[#07070A] [keep all other layout classes]"
```

### 3B. Hero h1 gradient with clamp size
Find the `<h1>`. Replace its text color / size classes:
```tsx
className="font-bold bg-clip-text text-transparent
           bg-gradient-to-br from-white via-white/90 to-[#A78BFA]
           [font-size:clamp(2.5rem,6vw,4.5rem)] leading-tight"
```

### 3C. Stat counters — count-up via IntersectionObserver, 800ms ease-out
Add this hook before the component (or in a separate `src/hooks/useCountUp.ts` if the file is getting large):

```tsx
function useCountUp(target: number, duration = 800): number {
  const [val, setVal] = React.useState(0)
  const ref = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return setVal(target)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setVal(target)

    const el = ref.current
    if (!el) return setVal(target)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - t, 3)
          setVal(Math.round(eased * target))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return val
}
```

Replace each static stat number with `{useCountUp(theValue)}`. Attach the returned `ref` to the stat container span.

### 3D. CTA button glow
Find the primary CTA (likely "Get API Key" or similar). Add hover glow:
```tsx
className="... bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full
           hover:shadow-[0_0_32px_rgba(99,102,241,0.6)] hover:scale-[1.03]
           transition-all duration-200"
```

### 3E. `pip install` one-click copy with "Copied! ✓" tooltip
Find the `pip install agentpick` code snippet. Wrap it in a copy button component:

```tsx
function CopySnippet({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-white/[0.08]
                    bg-black/40 px-4 py-2 font-mono text-sm text-white/70 group">
      <span>{code}</span>
      <button
        onClick={copy}
        className="ml-auto text-white/30 hover:text-white/70 transition-colors"
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <span className="text-emerald-400 text-xs font-medium animate-in fade-in duration-150">
            Copied! ✓
          </span>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </button>
    </div>
  )
}
```

Replace the static `pip install agentpick` code block with `<CopySnippet code="pip install agentpick" />`.

---

## Task 4 — Navigation (`src/components/SiteHeader.tsx`)

Read the file. Apply glassmorphic nav styling.

### 4A. Nav container — frosted glass
Find the `<header>` or root nav element. Add:
```tsx
className="sticky top-0 z-50 backdrop-blur-[12px] bg-black/60 border-b border-white/[0.08]
           [keep any existing layout / flex classes]"
```

### 4B. Live green pulse dot next to logo
Find where the logo/brand name renders. Add immediately after it:
```tsx
<span className="live-dot ml-2" aria-label="System live" title="System online" />
```

### 4C. Active page underline
Find the active link indicator. Replace static underline/color-only with 2px animated bar:
```tsx
// For active links, add this relative/after pattern:
className={isActive
  ? 'relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-indigo-400'
  : 'relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-transparent'
}
```

---

## Task 5 — Leaderboard Score Bars (`src/app/rankings/page.tsx`)

Read the file. Find the score/bar elements that currently use a single color fill.

Replace each bar's fill class with the gradient:
```tsx
// Before (example):
className="h-1.5 rounded-full bg-indigo-500"
style={{ width: `${score}%` }}

// After:
className="score-bar"
style={{ width: `${score}%` }}
```

The `.score-bar` class is defined in `globals.css` (Task 1D above) as `linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%)`.

Also add section labels for each tier heading (per NEXT_VERSION.md spec):
```tsx
<span className="font-mono tracking-widest text-xs uppercase opacity-60">
  {sectionLabel}
</span>
```

---

## Task 6 — Benchmark Permalink Page (Must-Have #3) — CREATE

**File to create:** `src/app/b/[runId]/page.tsx`

This is a Next.js ISR page. No auth required. Fetches data from the public API.

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

interface Tool {
  name: string | null
  latencyMs: number | null
  resultCount: number | null
  relevanceScore: number | null
  success: boolean
}

interface BenchmarkData {
  id: string
  query: string
  domain: string | null
  tools: Tool[]
  winningTool: string | null
  createdAt: string
}

async function getBenchmark(runId: string): Promise<BenchmarkData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://agentpick.dev'
  const res = await fetch(`${baseUrl}/api/v1/benchmarks/${runId}/public`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: { params: Promise<{ runId: string }> }): Promise<Metadata> {
  const { runId } = await params
  const data = await getBenchmark(runId)
  if (!data) return { title: 'Benchmark Not Found — AgentPick' }
  return {
    title: `Benchmark: "${data.query}" — AgentPick`,
    description: `Benchmark comparing ${data.tools.length} tools. Winner: ${data.winningTool ?? 'N/A'}. Powered by AgentPick.`,
    openGraph: {
      title: `AgentPick Benchmark: "${data.query}"`,
      description: `Winner: ${data.winningTool} · ${data.tools.length} tools compared`,
      images: [{ url: `/b/${runId}/opengraph-image` }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/b/${runId}/opengraph-image`],
    },
  }
}

export default async function BenchmarkPermalinkPage({
  params,
}: {
  params: Promise<{ runId: string }>
}) {
  const { runId } = await params
  const data = await getBenchmark(runId)
  if (!data) notFound()

  const pySnippet = `import agentpick
client = agentpick.Client()
result = client.route("${data.query.replace(/"/g, '\\"')}", domain="${data.domain ?? 'general'}")
print(result)`

  const curlSnippet = `curl -X POST https://agentpick.dev/api/v1/route/search \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"params":{"query":"${data.query.replace(/'/g, "\\'")}"}}'`

  return (
    <main className="min-h-screen bg-[#07070A] text-white px-4 py-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <span className="font-mono tracking-widest text-xs uppercase opacity-60">
          AgentPick Benchmark
        </span>
        <h1 className="mt-2 text-2xl font-bold text-white/90 leading-snug">
          &ldquo;{data.query}&rdquo;
        </h1>
        {data.domain && (
          <p className="mt-1 text-sm text-white/40">Domain: {data.domain}</p>
        )}
      </div>

      {/* Tool comparison table */}
      <section className="glass-card p-6 mb-8">
        <h2 className="font-mono tracking-widest text-xs uppercase opacity-60 mb-4">
          Results
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-white/40 text-left">
                <th className="pb-2 pr-4 font-medium">Tool</th>
                <th className="pb-2 pr-4 font-medium">Latency</th>
                <th className="pb-2 pr-4 font-medium">Results</th>
                <th className="pb-2 pr-4 font-medium">Relevance</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.tools.map((tool, i) => (
                <tr key={i} className="border-b border-white/[0.04] last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-white/80">
                    {tool.name ?? 'Unknown'}
                    {tool.name === data.winningTool && (
                      <span className="ml-2 text-xs text-emerald-400">★ winner</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-white/60">
                    {tool.latencyMs != null ? `${tool.latencyMs}ms` : '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-white/60">
                    {tool.resultCount ?? '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-white/60">
                    {tool.relevanceScore != null
                      ? (tool.relevanceScore * 100).toFixed(0) + '%'
                      : '—'}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        tool.success
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {tool.success ? 'OK' : 'ERR'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reproduce section */}
      <section className="glass-card p-6 mb-8">
        <h2 className="font-mono tracking-widest text-xs uppercase opacity-60 mb-4">
          Reproduce this benchmark
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-white/40 mb-1.5">Python</p>
            <pre className="rounded-lg bg-black/40 border border-white/[0.08] p-4 text-xs text-white/70 overflow-x-auto font-mono">
              {pySnippet}
            </pre>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1.5">curl</p>
            <pre className="rounded-lg bg-black/40 border border-white/[0.08] p-4 text-xs text-white/70 overflow-x-auto font-mono">
              {curlSnippet}
            </pre>
          </div>
        </div>
      </section>

      {/* Badge embed */}
      <section className="glass-card p-6 mb-8">
        <h2 className="font-mono tracking-widest text-xs uppercase opacity-60 mb-4">
          Embed this badge
        </h2>
        <pre className="rounded-lg bg-black/40 border border-white/[0.08] p-4 text-xs text-white/70 overflow-x-auto font-mono">
          {`![AgentPick Benchmark](https://agentpick.dev/b/${runId}/badge.svg)`}
        </pre>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/b/${runId}/badge.svg`}
          alt="AgentPick benchmark badge"
          className="mt-4"
        />
      </section>

      {/* Footer CTA */}
      <div className="text-center">
        <a
          href="/connect"
          className="inline-block px-6 py-3 rounded-full text-sm font-semibold
                     bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                     hover:shadow-[0_0_32px_rgba(99,102,241,0.6)] hover:scale-[1.03]
                     transition-all duration-200"
        >
          Get API Key — run your own benchmarks →
        </a>
        <p className="mt-3 text-xs text-white/30">
          Powered by <a href="/" className="underline underline-offset-2 hover:text-white/50">AgentPick</a>
        </p>
      </div>
    </main>
  )
}
```

---

## Files Modified / Created by Codex

| File | Action |
|------|--------|
| `src/app/globals.css` | Modify — CSS variables, animations, glass-card, score-bar, live-dot, reduced-motion |
| `src/app/layout.tsx` | Modify — JetBrains Mono font loading and variable |
| `src/app/page.tsx` | Modify — hero-mesh background, h1 gradient, count-up stats, CTA glow, copy snippet |
| `src/components/SiteHeader.tsx` | Modify — frosted nav, live pulse dot, 2px active underline |
| `src/app/rankings/page.tsx` | Modify — score bars gradient, section labels |
| `src/app/b/[runId]/page.tsx` | **CREATE** — public permalink page (ISR revalidate=3600) |

## DO NOT TOUCH (Claude Code files — merge conflict risk)

- `src/lib/router/handler.ts`
- `src/lib/router/sdk-handler.ts`
- `src/__tests__/rate-limit-429.test.ts`
- `src/__tests__/benchmark-permalink.test.ts`
- `package.json`
- `.github/workflows/ci.yml`
- `agentpick-router-qa.py`
- `src/app/b/[runId]/badge.svg/route.ts`
- `src/app/b/[runId]/opengraph-image.tsx`
- `src/app/api/**` (any API route)
- `src/lib/**` (any library file)

---

## Acceptance Criteria

- Lighthouse Performance ≥ 90 mobile (no regression)
- All 51+ QA tests still pass
- No CLS on 375px viewport
- All animations gated behind `@media (prefers-reduced-motion: no-preference)`
- Hero h1 uses `clamp(2.5rem, 6vw, 4.5rem)` and gradient text
- Stat counters animate 0→value on scroll-into-view
- CTA button has `box-shadow: 0 0 32px rgba(99,102,241,0.6)` on hover
- `pip install agentpick` snippet has working one-click copy with "Copied! ✓"
- Nav has `backdrop-filter: blur(12px)`, live pulse dot, 2px accent active underline
- Leaderboard bars use red→yellow→green gradient
- `/b/{runId}` page renders without auth, shows query, tools table, reproduce snippets, badge embed
- JetBrains Mono loads via `next/font/google` and applies via CSS variable
