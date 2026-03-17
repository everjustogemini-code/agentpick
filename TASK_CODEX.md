# TASK_CODEX.md
**Agent:** Codex (frontend / UI / components)
**Cycle:** 2
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #2 (UI Upgrade) + Must-Have #3 (permalink page)

---

## Files to Modify / Create

| File | Action |
|------|--------|
| `src/app/globals.css` | Modify — add missing animation keyframes/utilities (mesh-drift ✓ done, glass-card ✓ done; add: cta-glow, hero-gradient-text, category-label, stat-animate) |
| `src/app/page.tsx` | Modify — swap static stat spans for `<AnimatedCounter>`, add `cta-glow` to "Get API key" CTA |
| `src/components/AnimatedCounter.tsx` | Modify — add IntersectionObserver so count-up triggers on scroll-into-view, not on mount |
| `src/components/HeroCodeBlock.tsx` | Modify — add one-click copy button with "Copied! ✓" fade tooltip |
| `src/components/AgentCTA.tsx` | Modify — add `cta-glow` class to primary CTA button |
| `src/components/RouterCTA.tsx` | Modify — add `cta-glow` class to primary CTA button |
| `src/app/connect/page.tsx` | Modify — apply `glass-card` to feature grid cards |
| `src/app/dashboard/page.tsx` | Modify — apply `glass-card` to stat panels |
| `src/app/rankings/[slug]/page.tsx` | Modify — add visual score bar with red→yellow→green gradient |
| `src/app/b/[runId]/page.tsx` | **CREATE** — ISR benchmark permalink page (does not exist) |

**DO NOT touch any files owned by TASK_CLAUDE_CODE.md:**
`src/__tests__/rate-limit-429.test.ts`,
`src/app/b/[runId]/badge.svg/route.ts`,
`src/app/api/v1/benchmarks/[runId]/public/route.ts`,
`src/app/b/[runId]/opengraph-image.tsx`

---

## Constraint: Zero new npm packages. All CSS/Tailwind only.

All animations/transitions MUST be wrapped in `@media (prefers-reduced-motion: no-preference)`.
No CLS on 375px viewport. Lighthouse Performance ≥ 90 mobile (no render-blocking additions).

---

## Task 1 — Must-Have #2: UI Upgrade

---

### 1a — `src/app/globals.css`

**Read the file first.** Already present: `hero-mesh` animation, `.glass-card` utility (line 519, but minimal — only has backdrop-filter blur).

**Step 1 — Extend the existing `.glass-card` rule** (find it at line ~519, currently only has `backdrop-filter`). Add the missing glassmorphism properties by replacing it with:

```css
.glass-card {
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
}
@media (prefers-reduced-motion: no-preference) {
  .glass-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .glass-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
}
```

**Step 2 — Add the following new utilities** (after the updated `.glass-card` block):

```css
/* ── CTA glow pulse ─────────────────────────────── */
.cta-glow {
  transition: box-shadow 0.3s ease;
}
@media (prefers-reduced-motion: no-preference) {
  .cta-glow:hover {
    box-shadow: 0 0 32px rgba(99, 102, 241, 0.6), 0 0 64px rgba(99, 102, 241, 0.2);
  }
}

/* ── Hero gradient text ─────────────────────────── */
.hero-gradient-text {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* ── Hero h1 fluid size ─────────────────────────── */
.hero-h1 {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  line-height: 1.1;
}

/* ── Section / category label ───────────────────── */
.category-label {
  font-family: var(--font-jetbrains-mono, 'JetBrains Mono', monospace);
  letter-spacing: 0.15em;
  font-size: 0.75rem;
  text-transform: uppercase;
  opacity: 0.6;
}

/* ── Score bar (leaderboard) ────────────────────── */
.score-bar-track {
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}
.score-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%);
  transform-origin: left;
}
@media (prefers-reduced-motion: no-preference) {
  .score-bar-fill {
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* ── Stat counter entrance animation ────────────── */
@keyframes stat-enter {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: no-preference) {
  .stat-animate {
    animation: stat-enter 0.8s ease-out both;
  }
}
```

---

### 1b — `src/app/page.tsx`

**Read the file first.**

**Change 1 — Hero stat counters (IntersectionObserver count-up):**

Find the hero stats panel (lines ~169–191). There are two `<span>` elements showing plain numbers:
- `<span>{stats.totalAgents.toLocaleString()}</span>` — agents count
- `<span>{stats.todayBenchmarks.toLocaleString()}</span>` — calls today

Replace each with `<AnimatedCounter value={<the_number>} />`.

The `AnimatedCounter` component is already imported. If the import is missing, add:
```tsx
import AnimatedCounter from '@/components/AnimatedCounter';
```

**Change 2 — "Get API key" CTA glow:**

Find the `<Link href="/dashboard/router" ...>Get API key</Link>` button (around line 156). Add `cta-glow` to its `className`. Do not remove existing classes.

**Change 3 — Hero h1 (if not already styled):**

The `<h1>` already has a gradient span inside (`text-transparent bg-clip-text`). If `hero-h1` class is not already on the `<h1>`, add it alongside existing classes. If the existing `fontSize` inline style (`clamp(38px, 5vw, 56px)`) conflicts, remove that inline style and use `hero-h1` class instead.

Do NOT change any data-fetching logic, server components, or routing.

---

### 1c — `src/components/AnimatedCounter.tsx`

**Read the file first.** Currently the animation starts immediately on mount (no IntersectionObserver). Fix so it only starts when the element enters the viewport.

Replace the entire `useEffect` in the component with an IntersectionObserver pattern:

```typescript
useEffect(() => {
  if (typeof window === 'undefined') return
  const el = spanRef.current
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    setDisplay(formatted)
    return
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const startTime = performance.now()
      const tick = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
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
    },
    { threshold: 0.3 }
  )
  observer.observe(el)
  return () => observer.disconnect()
}, [value, decimals, duration, formatted])
```

Also add a `ref` to the returned `<span>`:
- Add `const spanRef = useRef<HTMLSpanElement>(null)` near the top of the component (import `useRef` from react if not already imported)
- Change `return <span>{display}</span>` to `return <span ref={spanRef} className="stat-animate">{display}</span>`

---

### 1d — `src/components/HeroCodeBlock.tsx`

**Read the file first.** Currently a pure static display component with no copy functionality. Add a one-click copy button.

Changes:
1. Add `'use client'` at the top (required for `useState`)
2. Import `useState` from react
3. Add a state: `const [copied, setCopied] = useState(false)`
4. Add a copy button in the top-right corner of the code block that copies the `pip install agentpick` snippet text (or the full import block — use the text that makes most sense for "pip install snippet")
5. On click: `navigator.clipboard.writeText(...)` then `setCopied(true)`, then `setTimeout(() => setCopied(false), 2000)`
6. Display the button label as `copied ? 'Copied! ✓' : 'Copy'`
7. The button must have `transition-opacity` so the text change feels like a fade (use Tailwind `transition-all duration-200`)

The outer div (`rounded-lg bg-bg-code p-5`) should become `relative` to position the button:
```tsx
<div className="relative mt-8 overflow-x-auto rounded-lg bg-bg-code p-5 font-mono text-[13px] leading-relaxed md:p-6">
  <button
    onClick={handleCopy}
    className="absolute right-3 top-3 rounded px-2 py-1 text-[11px] font-mono text-gray-400 hover:text-white transition-all duration-200 bg-white/5 hover:bg-white/10"
    aria-label="Copy code"
  >
    {copied ? 'Copied! ✓' : 'Copy'}
  </button>
  {/* existing content unchanged */}
</div>
```

---

### 1e — `src/components/AgentCTA.tsx`

**Read the file first.** Find the primary CTA `<button>` or `<Link>` (likely "Get API Key" or "Get Started"). Add class `cta-glow` to it.

---

### 1f — `src/components/RouterCTA.tsx`

**Read the file first.** Find the primary CTA element. Add class `cta-glow` to it.

---

### 1g — `src/app/connect/page.tsx`

**Read the file first.** Find the feature grid cards (elements with `bg-card`, `bg-white/5`, or similar solid background + border + rounded classes). Apply `glass-card` class alongside existing layout/padding classes.

---

### 1h — `src/app/dashboard/page.tsx`

**Read the file first.** Find the stat panels (cards showing usage numbers, call counts, plan info). Apply `glass-card` class. Keep all layout, text, and padding classes.

---

### 1i — `src/app/rankings/[slug]/page.tsx`

**Read the file first.**

Find the score display (around lines 315–328). Currently shows a numeric `weightedScore` value. Add a visual score bar below/beside the number.

The score is in range 0–5 (from the `weightedScore.toFixed(1)` pattern). Add a score bar:

```tsx
{/* Score bar — add below the weightedScore text */}
<div className="mt-1 w-14 score-bar-track">
  <div
    className="score-bar-fill"
    style={{ width: `${Math.min((product.weightedScore / 5) * 100, 100)}%` }}
  />
</div>
```

Place this inside the existing score column div (after the `{product.weightedScore.toFixed(1)}` span). Do not remove or rearrange existing layout.

---

## Task 2 — Must-Have #3 Frontend: Benchmark Permalink Page

**File:** `src/app/b/[runId]/page.tsx` — **CREATE (does not exist)**

### Context
- `src/app/b/[runId]/opengraph-image.tsx` — exists (OG image)
- `src/app/b/[runId]/badge.svg/route.ts` — exists (badge)
- `src/app/api/v1/benchmarks/[runId]/public/route.ts` — exists (data API, owned by Claude Code)
- `NEXT_PUBLIC_BASE_URL` or `NEXT_PUBLIC_SITE_URL` env var — use `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agentpick.dev'`

### File to Create

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const data = await getBenchmarkRun(runId);
  if (!data) return { title: 'Benchmark Not Found — AgentPick' };
  return {
    title: `Benchmark: "${data.query}" — AgentPick`,
    description: `${data.tools.length} tools compared. Winner: ${data.winningTool ?? 'N/A'}.`,
    openGraph: {
      title: `AgentPick Benchmark`,
      description: data.query,
      images: [`/b/${runId}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/b/${runId}/opengraph-image`],
    },
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
  const pySnippet = `import requests\nresult = requests.get("https://agentpick.dev/api/v1/benchmarks/${data.id}/public")\nprint(result.json())`;
  const badgeMarkdown = `![AgentPick Benchmark](https://agentpick.dev/b/${data.id}/badge.svg)`;

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-8">
        <p className="category-label mb-3">AgentPick Benchmark</p>
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          &ldquo;{data.query}&rdquo;
        </h1>
        {data.domain && (
          <p className="text-sm text-text-secondary mt-1">Domain: {data.domain}</p>
        )}
      </div>

      {/* Winning tool callout */}
      {data.winningTool && (
        <div className="glass-card p-4 mb-8 flex items-center gap-3">
          <span className="font-mono text-xs text-text-tertiary uppercase tracking-widest">
            Winner
          </span>
          <span className="text-text-primary font-semibold">{data.winningTool}</span>
        </div>
      )}

      {/* Tools comparison table */}
      <div className="glass-card overflow-x-auto mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-left">
              <th className="px-4 py-3 font-normal">Tool</th>
              <th className="px-4 py-3 font-normal">Latency (ms)</th>
              <th className="px-4 py-3 font-normal">Results</th>
              <th className="px-4 py-3 font-normal">Relevance</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.tools.map((tool, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text-primary font-medium">
                  {tool.name ?? '—'}
                  {tool.name === data.winningTool && (
                    <span className="ml-2 text-accent text-xs">★</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary font-mono">
                  {tool.latencyMs != null ? tool.latencyMs : '—'}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {tool.resultCount != null ? tool.resultCount : '—'}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {tool.relevanceScore != null
                    ? `${(tool.relevanceScore * 100).toFixed(0)}%`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      tool.success
                        ? 'text-success text-xs font-mono'
                        : 'text-error text-xs font-mono'
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
        <p className="category-label mb-3">Embed this result</p>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-xs mb-2">Markdown badge for README:</p>
          <pre className="text-xs text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap break-all">
            {badgeMarkdown}
          </pre>
        </div>
      </div>

      {/* Reproduce section */}
      <div>
        <p className="category-label mb-4">Reproduce this benchmark</p>
        <div className="space-y-4">
          <div className="glass-card p-4">
            <p className="text-text-tertiary text-xs mb-2 font-mono">curl</p>
            <pre className="text-xs text-text-secondary font-mono overflow-x-auto">{curlSnippet}</pre>
          </div>
          <div className="glass-card p-4">
            <p className="text-text-tertiary text-xs mb-2 font-mono">Python</p>
            <pre className="text-xs text-text-secondary font-mono overflow-x-auto">{pySnippet}</pre>
          </div>
        </div>
      </div>
    </main>
  );
}
```

### Acceptance Criteria
- `GET /b/{runId}` → HTTP 200 for a valid runId
- `GET /b/nonexistent` → HTTP 404 via `notFound()`
- ISR revalidate: 3600
- OG metadata populated (Twitter card validator renders correctly)
- No `'use client'` (server component)
- Multi-tool table when `tools.length > 1`

---

## Final Verification

- [ ] All 10 files addressed (9 modified, 1 created)
- [ ] No changes to CLAUDE_CODE-owned files
- [ ] Every animation/transition wrapped in `@media (prefers-reduced-motion: no-preference)`
- [ ] No new npm packages
- [ ] `src/app/b/[runId]/page.tsx` created and renders without TypeScript errors
- [ ] Write progress log to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`
