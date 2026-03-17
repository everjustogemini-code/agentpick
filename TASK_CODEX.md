# TASK_CODEX.md — 2026-03-16
**Agent:** Codex
**Source:** NEXT_VERSION.md — Must-Have #2 (UI Upgrade) + Must-Have #3 (frontend page)

---

## Overview

This task covers:
- **#2:** Major UI Upgrade — glassmorphism cards, hero stat counter animation, typography overhaul, animated gradient mesh background, CTA glow pulse
- **#3 frontend:** Create `/b/[runId]/page.tsx` — the shareable benchmark permalink ISR page

TASK_CLAUDE_CODE.md owns all API routes and backend files. **Zero file overlap.**

Ship order: #2 is a parallel track (no API dependency). #3 page depends on the public API endpoint in TASK_CLAUDE_CODE.md — fetch it but do not create it.

---

## Must-Have #2 — Major UI Upgrade

### 2.1 — Glassmorphism Cards

Replace solid `bg-card` / solid background utility classes on stat cards, feature cards, pricing tiers, and agent-counter widgets with:

```
Tailwind: bg-white/5 backdrop-blur-[12px] border border-white/10 rounded-xl
```

CSS equivalent:
```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.10);
border-radius: 0.75rem;
```

**Files to MODIFY:**

| File | What to change |
|------|---------------|
| `src/app/page.tsx` | Homepage hero stat cards + feature cards section |
| `src/app/connect/page.tsx` | All info/feature cards in the feature grid |
| `src/app/dashboard/page.tsx` | Stat panels + agent-counter widget |
| `src/components/ProductCard.tsx` | Card root element |
| `src/components/StatsBar.tsx` | Stat bar cards/panels |

Look for: `className="... bg-card ..."`, `style={{ background: '#...' }}`, or similar solid background patterns. Replace only the background + border — preserve all other styling.

---

### 2.2 — Hero Stat Counter Animation

**File to MODIFY:** `src/app/page.tsx`

Animate the live network stats in the hero section (agent count, calls routed) from `0` → final value on `IntersectionObserver` trigger.

Implementation:
1. Locate the hero stat number elements (the numeric values in the stats row)
2. Extract or add a `<StatCounter>` client component (add `'use client'` to a small sub-component if the page is a Server Component):
   ```tsx
   'use client';
   export function StatCounter({ target }: { target: number }) {
     // useRef for the element, useEffect for IntersectionObserver + rAF count-up
   }
   ```
3. Animation logic inside `useEffect`:
   - Create `IntersectionObserver` targeting the stat element
   - On intersection: count from `0` to `target` over **800ms ease-out** using `requestAnimationFrame`
   - Easing: `easeOut(t) = 1 - Math.pow(1 - t, 3)` (cubic ease-out)
   - Under `prefers-reduced-motion: reduce` (`window.matchMedia('(prefers-reduced-motion: reduce)').matches`): skip animation, set value directly to `target`
4. No external animation library (no framer-motion, no GSAP)
5. Disconnect the observer after the first trigger (one-shot animation)

---

### 2.3 — Typography Overhaul

**File to MODIFY:** `src/app/page.tsx`

1. **Hero `<h1>` font size:** `clamp(2.5rem, 6vw, 4.5rem)` via inline style or Tailwind `text-[clamp(2.5rem,6vw,4.5rem)]`

2. **Hero `<h1>` gradient text:**
   ```
   Tailwind: text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-500
   ```

3. **JetBrains Mono on all code snippets:**
   - Check `src/app/layout.tsx` — if `JetBrains_Mono` is not imported from `next/font/google`, add it and apply to `<body>` as a CSS variable (`variable="--font-mono"`)
   - Check `src/app/globals.css` — ensure `code, pre, .font-mono { font-family: 'JetBrains Mono', monospace; }` is present
   - Only touch `layout.tsx` or `globals.css` if the font is genuinely missing or not applied to `<code>`/`<pre>`

4. **Section category labels:** Find all overline/category label elements (e.g., small uppercase labels above section headings like "Features", "Pricing", "How it works"). Apply:
   ```
   Tailwind: font-mono tracking-widest text-xs uppercase opacity-60
   ```

---

### 2.4 — Animated Gradient Mesh Background

**File to MODIFY:** `src/app/globals.css`

Add the following CSS (no canvas, no WebGL, no JS):

```css
@keyframes mesh-drift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.bg-mesh {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse at 50% 80%, rgba(99, 102, 241, 0.10) 0%, transparent 60%),
    #0a0a0f;
  background-size: 200% 200%;
  animation: mesh-drift 20s ease infinite;
}

@media (prefers-reduced-motion: reduce) {
  .bg-mesh {
    animation: none;
  }
}
```

**File to MODIFY:** `src/app/page.tsx`

Apply `bg-mesh` to the `<main>` or outermost wrapper element of the homepage. Remove the existing flat dark background class/style from that element.

---

### 2.5 — CTA Glow Pulse

**Files to MODIFY:**

| File | Element to change |
|------|------------------|
| `src/app/page.tsx` | "Get API Key" and "Install AgentPick" primary CTA buttons |
| `src/app/connect/page.tsx` | Primary CTA buttons |
| `src/components/RouterCTA.tsx` | CTA button element |

**Change:** Add on-hover glow to primary CTA buttons:

```
Tailwind: hover:shadow-[0_0_32px_rgba(99,102,241,0.6),0_0_64px_rgba(99,102,241,0.2)] transition-shadow duration-300
```

CSS equivalent:
```css
button:hover {
  box-shadow: 0 0 32px rgba(99, 102, 241, 0.6), 0 0 64px rgba(99, 102, 241, 0.2);
  transition: box-shadow 0.3s ease;
}
```

Also add to `src/app/globals.css` under a `@media (prefers-reduced-motion: reduce)` block:
```css
@media (prefers-reduced-motion: reduce) {
  .cta-glow { transition: none; }
}
```

---

## Must-Have #3 — Benchmark Permalink Frontend Page

### File to CREATE: `src/app/b/[runId]/page.tsx`

Public shareable benchmark result page at `agentpick.dev/b/{runId}`.

**Key requirements:**
- Next.js **Server Component with ISR** (`export const revalidate = 3600`)
- Fetch data from the public API endpoint (owned by CLAUDE CODE — do not create it):
  ```ts
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/benchmarks/${params.runId}/public`,
    { next: { revalidate: 3600 } }
  );
  ```
- Handle 404 gracefully: if `res.status === 404` or fetch throws, render a friendly "Benchmark not found" page with a back link to `/`

**OG metadata:**
```ts
export async function generateMetadata({ params }: { params: { runId: string } }) {
  return {
    title: `Benchmark Result — AgentPick`,
    openGraph: {
      images: [`/b/${params.runId}/opengraph-image`],
    },
  };
}
```

**Page layout (top to bottom):**

1. **Header bar** — AgentPick site header (reuse `SiteHeader` component or a simple nav) + "Benchmark Result" breadcrumb

2. **Query card** — domain badge (e.g., "tech", "finance") + full query text
   - Glassmorphism: `bg-white/5 backdrop-blur-[12px] border border-white/10 rounded-xl p-6`

3. **Tool comparison table** — columns: Tool | Latency (ms) | Results | Relevance | Status
   - Winning tool row highlighted with accent green (`bg-green-500/10 border-green-500/30`)
   - Wrap table in glassmorphism card

4. **"Run this benchmark" CTA card** — three tabs: Python, JS, curl
   - Each tab shows a pre-filled code snippet for reproducing the benchmark
   - Python: `import agentpick; agentpick.benchmark(query="...", tools=[...])`
   - JS: `await agentpick.benchmark({ query: "...", tools: [...] })`
   - curl: `curl -X POST https://agentpick.dev/api/v1/benchmark/run -d '...'`
   - Tab switching is client-side — extract a small `'use client'` component
   - Glassmorphism card wrapping

5. **Share / Embed section** (client component, `'use client'`):
   - "Copy link" button → `navigator.clipboard.writeText(window.location.href)`
   - "Copy embed" button → copies `<iframe src="https://agentpick.dev/b/{runId}" width="600" height="400" frameborder="0"></iframe>`
   - "Copy badge" button → copies `` [![AgentPick Benchmark](https://agentpick.dev/b/{runId}/badge.svg)](https://agentpick.dev/b/{runId}) ``
   - Show a brief success toast ("Copied!") after each button click

**Styling:** Match site design — dark theme, Inter for body text, JetBrains Mono for code blocks. Apply glassmorphism to all cards (consistent with #2 changes above).

---

## Files This Task Touches (exhaustive — no other files)

| Action | File |
|--------|------|
| MODIFY | `src/app/page.tsx` |
| MODIFY | `src/app/connect/page.tsx` |
| MODIFY | `src/app/dashboard/page.tsx` |
| MODIFY | `src/components/ProductCard.tsx` |
| MODIFY | `src/components/StatsBar.tsx` |
| MODIFY | `src/components/RouterCTA.tsx` |
| MODIFY | `src/app/globals.css` |
| MODIFY (if font missing) | `src/app/layout.tsx` |
| CREATE | `src/app/b/[runId]/page.tsx` |

**DO NOT touch (Claude Code owns these):**
- `src/lib/router/ai-classify.ts`
- `src/lib/router/index.ts`
- `src/__tests__/router.test.ts`
- `src/__tests__/enterprise-qa.test.ts`
- `src/app/api/v1/benchmarks/[runId]/public/route.ts`
- `src/app/b/[runId]/badge.svg/route.ts`
- `src/app/b/[runId]/opengraph-image.tsx`
- Any file under `src/lib/`
- `prisma/schema.prisma`

---

## Acceptance Criteria

- [ ] Lighthouse Performance ≥ 90 mobile (no animation regression from current baseline)
- [ ] All 51 QA tests still pass (no HTTP regressions)
- [ ] No CLS on 375px viewport
- [ ] All motion effects gated behind `@media (prefers-reduced-motion: no-preference)`
- [ ] `/b/{runId}` returns HTTP 200 in QA page load check
- [ ] OG metadata present on `/b/{runId}` (references Claude Code's opengraph-image route)
- [ ] Share / Embed / Badge copy buttons functional
- [ ] Hero stat counter animation triggers on scroll into view
- [ ] Glassmorphism cards visible on homepage, `/connect`, and `/dashboard`
