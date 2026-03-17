# TASK_CODEX.md
**Agent:** Codex (frontend/UI/components)
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #2 (UI Upgrade) + Must-Have #3 (frontend page)

---

## Files to Modify / Create

| File | Action |
|------|--------|
| `src/app/globals.css` | Modify — gradient mesh keyframes, glassmorphism vars, reduced-motion guards |
| `src/app/page.tsx` | Modify — glassmorphism stat cards, hero h1 gradient typography |
| `src/components/StatsBar.tsx` | Modify — hero stat counter animation (IntersectionObserver + CSS count-up) |
| `src/components/AgentCTA.tsx` | Modify — CTA glow pulse on hover |
| `src/components/RouterCTA.tsx` | Modify — CTA glow pulse on hover |
| `src/app/connect/page.tsx` | Modify — glassmorphism feature grid cards |
| `src/app/dashboard/page.tsx` | Modify — glassmorphism stat panels |
| `src/app/b/[runId]/page.tsx` | Create — ISR benchmark permalink page |

**DO NOT touch any files owned by TASK_CLAUDE_CODE.md:**
`src/lib/router/ai-classify.ts`, `src/__tests__/rate-limit-429.test.ts`,
`src/app/api/v1/benchmarks/[runId]/public/route.ts`

---

## Task 1 — Must-Have #2: UI Upgrade

**NEXT_VERSION.md ref:** Must-Have #2 — Glassmorphism + Motion + Typography
**Constraint:** Lighthouse Performance ≥ 90 mobile. No CLS on 375px. All motion gated behind `@media (prefers-reduced-motion: no-preference)`. No animation library, no canvas, no WebGL.

---

### 1a — `src/app/globals.css`

**Read the file first.** Then make the following additions:

**Add CSS custom properties** (in the `:root` block or a new `:root` block):
```css
/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-blur: 12px;

/* Gradient mesh animation */
--mesh-cycle: 20s;
```

**Add gradient mesh keyframes** (after existing keyframes, or at end of file):
```css
@keyframes mesh-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(60px, -40px) scale(1.1); }
  66% { transform: translate(-30px, 50px) scale(0.95); }
}
@keyframes mesh-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  40% { transform: translate(-50px, 30px) scale(1.05); }
  70% { transform: translate(40px, -60px) scale(0.9); }
}
@keyframes mesh-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 40px) scale(1.08); }
}

/* Gradient mesh background container */
.mesh-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: #0a0a0a;
}
.mesh-bg::before,
.mesh-bg::after,
.mesh-bg > span {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}
.mesh-bg::before {
  width: 600px;
  height: 600px;
  top: -100px;
  left: -100px;
  background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
}
.mesh-bg::after {
  width: 500px;
  height: 500px;
  bottom: -80px;
  right: 10%;
  background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
}
.mesh-bg > span {
  width: 400px;
  height: 400px;
  top: 40%;
  left: 50%;
  background: radial-gradient(circle, #4f46e5 0%, transparent 70%);
}

@media (prefers-reduced-motion: no-preference) {
  .mesh-bg::before { animation: mesh-drift-1 var(--mesh-cycle) ease-in-out infinite; }
  .mesh-bg::after  { animation: mesh-drift-2 var(--mesh-cycle) ease-in-out infinite 7s; }
  .mesh-bg > span  { animation: mesh-drift-3 var(--mesh-cycle) ease-in-out infinite 14s; }
}

/* Glassmorphism card utility */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 12px;
}

/* CTA glow pulse */
.cta-glow {
  transition: box-shadow 0.3s ease;
}
@media (prefers-reduced-motion: no-preference) {
  .cta-glow:hover {
    box-shadow: 0 0 32px rgba(99, 102, 241, 0.6), 0 0 64px rgba(99, 102, 241, 0.2);
  }
}

/* Hero gradient text */
.hero-gradient-text {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* Hero h1 fluid size */
.hero-h1 {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  line-height: 1.1;
}

/* Category label */
.category-label {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  letter-spacing: 0.15em;
  font-size: 0.75rem;
  text-transform: uppercase;
  opacity: 0.6;
}

/* Stat counter */
@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: no-preference) {
  .stat-animate {
    animation: count-up 0.8s ease-out both;
  }
}
```

---

### 1b — `src/app/page.tsx`

**Read the file first.** Make the following targeted changes:

**1. Add gradient mesh background** — add `<div className="mesh-bg"><span /></div>` as the very first child of the root layout element (before the `<header>` or first section).

**2. Hero h1 typography** — find the main hero `<h1>` element. Add classes `hero-h1 hero-gradient-text` (remove any existing hard-coded font-size classes that conflict).

**3. Glassmorphism on stat cards** — find the hero stat counter widgets / network-stats cards (look for `bg-card`, `bg-white/5`, or similar solid card classes on small stat display elements). Replace solid background classes with `glass-card` class.

**4. Category labels** — find any existing section label spans with `text-xs uppercase tracking-widest` (or similar). Add class `category-label` to them (keep existing classes, just add this one).

**Do NOT:** change page routing, server components to client components, or any data-fetching logic.

---

### 1c — `src/components/StatsBar.tsx`

**Read the file first.** Add animated count-up to the live stats display.

**Add at top of file (after existing imports):**
```typescript
'use client';
import { useEffect, useRef, useState } from 'react';
```
(Only add `'use client'` if the component is not already a client component.)

**Add a `CountUp` helper component inside the file** (before the default export):
```typescript
function CountUp({ target, duration = 800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          // Respect prefers-reduced-motion
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (reduced) { setCount(target); }
          else { requestAnimationFrame(tick); }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref} className="stat-animate">{count.toLocaleString()}</span>;
}
```

**Replace static number displays** — for each stat value that shows agent count or calls-routed count (currently rendered as a plain number or string), wrap the numeric value with `<CountUp target={numericValue} />`.

Example pattern to replace:
```tsx
<span>{agentCount}</span>
```
Replace with:
```tsx
<CountUp target={agentCount} />
```

Only apply `CountUp` to the primary hero/landing stats. Do not apply to table cells, pagination counts, or dashboard data tables.

---

### 1d — `src/components/AgentCTA.tsx` and `src/components/RouterCTA.tsx`

**Read both files first.** For each:

Find the primary "Get API Key" (or equivalent primary action) `<button>` or `<a>` element. Add class `cta-glow` to it. Do not remove existing classes.

Example:
```tsx
// Before
<button className="bg-indigo-600 text-white px-6 py-3 rounded-lg">
  Get API Key
</button>

// After
<button className="bg-indigo-600 text-white px-6 py-3 rounded-lg cta-glow">
  Get API Key
</button>
```

---

### 1e — `src/app/connect/page.tsx`

**Read the file first.** Find the feature grid cards (typically rendered with `bg-card`, `rounded-xl`, `border`, or similar). Replace their background/border classes with `glass-card`. Keep padding, gap, and layout classes.

---

### 1f — `src/app/dashboard/page.tsx`

**Read the file first.** Find the stat panels (cards showing usage numbers, call counts, plan info). Replace their solid background classes with `glass-card`. Keep layout and text classes.

---

## Task 2 — Must-Have #3 Frontend: Shareable Benchmark Permalink Page

**NEXT_VERSION.md ref:** Must-Have #3 — `/b/[runId]` ISR page
**File:** `src/app/b/[runId]/page.tsx` (CREATE — does not exist)

### Context
- `src/app/b/[runId]/opengraph-image.tsx` already exists (OG image generation)
- `src/app/b/[runId]/badge.svg/route.ts` already exists (SVG badge)
- `src/app/api/v1/benchmarks/[runId]/public/route.ts` already exists (API, owned by TASK_CLAUDE_CODE.md)

### File to Create

The page must:
- Use Next.js ISR with `revalidate: 3600`
- Fetch from `/api/v1/benchmarks/{runId}/public` (no auth, GET)
- Show: query used, tools compared (side-by-side latency/relevance table), winning tool callout
- Show "Run this benchmark" CTA with pre-filled Python / JS / curl snippets (use `<pre>` / `<code>` blocks)
- Be a **server component** (no `'use client'`)
- Return 404 via `notFound()` if the API returns 404

```typescript
import { notFound } from 'next/navigation';

export const revalidate = 3600;

interface Tool {
  name: string | null;
  latencyMs: number | null;
  resultCount: number | null;
  relevanceScore: number | null;
  success: boolean;
}

interface BenchmarkData {
  id: string;
  query: string;
  domain: string | null;
  tools: Tool[];
  winningTool: string | null;
  createdAt: string;
}

async function getBenchmarkRun(runId: string): Promise<BenchmarkData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agentpick.dev';
  try {
    const res = await fetch(`${baseUrl}/api/v1/benchmarks/${runId}/public`, {
      next: { revalidate: 3600 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const data = await getBenchmarkRun(runId);
  if (!data) return { title: 'Benchmark Not Found — AgentPick' };
  return {
    title: `Benchmark: "${data.query}" — AgentPick`,
    description: `${data.tools.length} tools compared. Winner: ${data.winningTool ?? 'N/A'}. AgentPick benchmark result.`,
    openGraph: { title: `AgentPick Benchmark`, description: data.query },
  };
}

export default async function BenchmarkPermalinkPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const data = await getBenchmarkRun(runId);
  if (!data) notFound();

  const curlSnippet = `curl https://agentpick.dev/api/v1/benchmarks/${data.id}/public`;
  const pySnippet = `import requests
result = requests.get("https://agentpick.dev/api/v1/benchmarks/${data.id}/public")
print(result.json())`;
  const jsSnippet = `const res = await fetch("https://agentpick.dev/api/v1/benchmarks/${data.id}/public");
const data = await res.json();
console.log(data);`;

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-8">
        <p className="category-label mb-2">AgentPick Benchmark</p>
        <h1 className="text-2xl font-semibold text-white mb-1">
          &ldquo;{data.query}&rdquo;
        </h1>
        {data.domain && (
          <p className="text-sm text-white/50">Domain: {data.domain}</p>
        )}
      </div>

      {/* Winning tool callout */}
      {data.winningTool && (
        <div className="glass-card p-4 mb-8 flex items-center gap-3">
          <span className="text-indigo-400 font-mono text-sm">Winner</span>
          <span className="text-white font-semibold">{data.winningTool}</span>
        </div>
      )}

      {/* Tools comparison table */}
      <div className="glass-card overflow-x-auto mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-left">
              <th className="px-4 py-3 font-normal">Tool</th>
              <th className="px-4 py-3 font-normal">Latency (ms)</th>
              <th className="px-4 py-3 font-normal">Results</th>
              <th className="px-4 py-3 font-normal">Relevance</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.tools.map((tool, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-white font-medium">
                  {tool.name ?? '—'}
                  {tool.name === data.winningTool && (
                    <span className="ml-2 text-indigo-400 text-xs">★</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/80 font-mono">
                  {tool.latencyMs != null ? tool.latencyMs : '—'}
                </td>
                <td className="px-4 py-3 text-white/80">
                  {tool.resultCount != null ? tool.resultCount : '—'}
                </td>
                <td className="px-4 py-3 text-white/80">
                  {tool.relevanceScore != null
                    ? `${(tool.relevanceScore * 100).toFixed(0)}%`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      tool.success
                        ? 'text-green-400 text-xs font-mono'
                        : 'text-red-400 text-xs font-mono'
                    }
                  >
                    {tool.success ? 'OK' : 'FAIL'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Badge embed */}
      <div className="mb-10">
        <p className="category-label mb-3">Embed this benchmark</p>
        <div className="glass-card p-4">
          <p className="text-white/60 text-xs mb-2">Markdown badge:</p>
          <pre className="text-xs text-white/80 font-mono overflow-x-auto whitespace-pre-wrap break-all">
            {`![AgentPick Benchmark](https://agentpick.dev/b/${data.id}/badge.svg)`}
          </pre>
        </div>
      </div>

      {/* Reproduce section */}
      <div>
        <p className="category-label mb-4">Run this benchmark</p>
        <div className="space-y-4">
          <div className="glass-card p-4">
            <p className="text-white/40 text-xs mb-2 font-mono">curl</p>
            <pre className="text-xs text-white/80 font-mono overflow-x-auto">{curlSnippet}</pre>
          </div>
          <div className="glass-card p-4">
            <p className="text-white/40 text-xs mb-2 font-mono">Python</p>
            <pre className="text-xs text-white/80 font-mono overflow-x-auto">{pySnippet}</pre>
          </div>
          <div className="glass-card p-4">
            <p className="text-white/40 text-xs mb-2 font-mono">JavaScript</p>
            <pre className="text-xs text-white/80 font-mono overflow-x-auto">{jsSnippet}</pre>
          </div>
        </div>
      </div>
    </main>
  );
}
```

### Acceptance Criteria
- `GET /b/{runId}` returns HTTP 200 for a valid runId
- `GET /b/nonexistent-id` returns HTTP 404
- ISR revalidation every 3600s
- OG metadata populated for Twitter/LinkedIn previews
- No `'use client'` (server component)
- Displays multi-tool table when `tools.length > 1`

---

## Final Verification

- [ ] All 8 files addressed (7 modified, 1 created)
- [ ] No changes to CLAUDE_CODE-owned files
- [ ] `@media (prefers-reduced-motion: no-preference)` wraps ALL animation/transition rules
- [ ] No new npm dependencies (no animation library, no canvas)
- [ ] Lighthouse Performance ≥ 90 mobile not regressed (avoid adding render-blocking resources)
- [ ] Write progress log entry to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`
