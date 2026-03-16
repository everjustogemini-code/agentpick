# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-16
**Source:** NEXT_VERSION.md — Must-Have #2 (UI Upgrade) + Must-Have #3 (frontend page)

---

## Overview

This file covers:
- **Must-Have #2:** Major UI Upgrade — Glassmorphism + Micro-animations + Typography Overhaul
- **Must-Have #3 (frontend):** Shareable Benchmark Permalinks — `/b/[runId]` Next.js ISR page

TASK_CLAUDE_CODE.md owns all API routes and backend files. No file overlap.

---

## Must-Have #2 — Major UI Upgrade

**Priority:** High — parallel track, no API surface changes required.

---

### 2.1 — Glassmorphism Cards

**Files to MODIFY:**
- `src/app/page.tsx` — homepage stat cards, feature cards section
- `src/app/connect/page.tsx` — all info/feature cards
- `src/app/dashboard/page.tsx` — stat cards, agent-counter widget
- `src/components/ProductCard.tsx` — card root element
- `src/components/PricingSection.tsx` — all pricing tier cards

**Change:** Replace flat `bg-card` / solid background classes on cards with:

```
Tailwind: bg-white/5 backdrop-blur-[12px] border border-white/10
```

Raw CSS equivalent:
```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.10);
```

Apply this to every stat card, feature card, pricing tier card, and agent-counter widget on those three pages and two components.

---

### 2.2 — Hero Stat Counter Animation

**File to MODIFY:** `src/app/page.tsx`

**Change:** Animate the live network stats in the hero ("413 agents / 125 calls routed today") from 0 → final value on `IntersectionObserver` trigger.

1. Locate the hero stat numbers (elements like "413", "125", etc.)
2. Wrap each in a `<span>` with `data-target="{finalValue}"` and a `count-up` class identifier
3. Add a `useEffect` (this is a Client Component section — add `'use client'` if needed, or extract a `<StatCounter>` client component):
   - Use `IntersectionObserver` to detect when hero enters viewport
   - On trigger: animate 0 → `data-target` over **800ms ease-out** using `requestAnimationFrame` (no `setInterval`)
   - Under `prefers-reduced-motion: reduce`: skip animation, snap to final value immediately
4. No external animation library

---

### 2.3 — Typography Overhaul

**File to MODIFY:** `src/app/page.tsx`

**Changes:**

1. **Hero `<h1>` font size:** Set to `clamp(2.5rem, 6vw, 4.5rem)` via inline style or Tailwind `text-[clamp(2.5rem,6vw,4.5rem)]`

2. **Hero `<h1>` gradient text:**
   ```
   Tailwind: text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-500
   ```
   (gradient: accent-blue → accent-purple, matching `background-clip: text`)

3. **JetBrains Mono on code snippets:** Ensure all `<code>` and `<pre>` elements use `font-family: 'JetBrains Mono', monospace`. Check `src/app/layout.tsx` and `src/app/globals.css` — if the font is not already imported, add the import there. Only touch `layout.tsx` / `globals.css` for the font import if it is missing.

4. **Section header labels:** Add `font-mono tracking-widest text-xs uppercase` to all section category labels (e.g., "Features", "Pricing", "How it works" overline text above section headings).

---

### 2.4 — Animated Gradient Mesh Background

**File to MODIFY:** `src/app/globals.css` (or inline in `src/app/page.tsx` via `<style jsx global>` / Tailwind `@layer`)

**Change:** Replace the flat dark background on the homepage with a slow-drifting radial gradient mesh using CSS `@keyframes` only — **no canvas, no WebGL, no JS**.

```css
@keyframes mesh-drift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.bg-mesh {
  background: radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.10) 0%, transparent 60%),
              #0a0a0f;
  background-size: 200% 200%;
  animation: mesh-drift 18s ease infinite;
}
```

Apply the `bg-mesh` class (or equivalent inline styles) to the `<main>` or outermost layout wrapper on `src/app/page.tsx`.

**Accessibility:** Under `prefers-reduced-motion: reduce`, set `animation: none` on `.bg-mesh`.

---

### 2.5 — CTA Glow Effect

**Files to MODIFY:**
- `src/app/page.tsx` — "Get API Key" and "Install AgentPick" buttons
- `src/app/connect/page.tsx` — primary CTA buttons
- `src/components/AgentCTA.tsx` — CTA button element
- `src/components/RouterCTA.tsx` — CTA button element

**Change:** On the primary CTA buttons, add a pulse glow on hover. Replace or augment any existing shimmer effect:

```css
/* On :hover */
box-shadow: 0 0 32px rgba(99, 102, 241, 0.6);
transition: box-shadow 300ms ease;
```

In Tailwind + inline style: add `hover:shadow-[0_0_32px_rgba(99,102,241,0.6)] transition-shadow duration-300` to the button element.

**Accessibility:** Under `prefers-reduced-motion: reduce`, suppress the transition (`transition: none`).

---

## Must-Have #3 — Shareable Benchmark Permalinks: Frontend Page

**Priority:** High — ships after Must-Have #1 confirmed 56/56 by QA.

---

### File to CREATE: `src/app/b/[runId]/page.tsx`

Public shareable benchmark result page at `agentpick.dev/b/{runId}`. Next.js **Server Component with ISR** (`revalidate: 3600`).

**Data fetching:**
```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/benchmarks/${runId}/public`, {
  next: { revalidate: 3600 },
})
```
(Endpoint created by CLAUDE CODE — do not create the API route yourself.)

**OG metadata export:**
```ts
export async function generateMetadata({ params }) {
  return {
    openGraph: {
      images: [`/b/${params.runId}/opengraph-image`],
    },
  }
}
```

**Page sections (top to bottom):**

1. **Header bar** — AgentPick logo + "Benchmark Result" breadcrumb
2. **Query card** — domain badge + full query text. Apply glassmorphism: `bg-white/5 backdrop-blur-[12px] border border-white/10`
3. **Tool comparison table** — columns: Tool | Latency (ms) | Results | Relevance | Status. Winning tool row highlighted (accent green background). Apply glassmorphism to the card wrapping the table.
4. **"Run this benchmark" CTA** — pre-filled Python / JS / curl code tabs. Reuse `HeroCodeBlock` or adapt inline. Apply glassmorphism to this card.
5. **Share / Embed section:**
   - "Copy link" button → copies `window.location.href`
   - "Embed" button → copies `<iframe src="https://agentpick.dev/b/{runId}" width="600" height="400"></iframe>`
   - "Copy badge" button → copies `[![AgentPick](https://agentpick.dev/b/{runId}/badge.svg)](https://agentpick.dev/b/{runId})`
6. **Not Found:** If `fetch` returns 404, render a friendly "Benchmark not found" message with a link back to `/`

**Styling:** Match existing site design. Use same color palette and component patterns as the rest of the app.

---

## Files Summary — CODEX

| Action     | File                                   |
|------------|----------------------------------------|
| **MODIFY** | `src/app/page.tsx`                     |
| **MODIFY** | `src/app/connect/page.tsx`             |
| **MODIFY** | `src/app/dashboard/page.tsx`           |
| **MODIFY** | `src/components/ProductCard.tsx`       |
| **MODIFY** | `src/components/PricingSection.tsx`    |
| **MODIFY** | `src/components/AgentCTA.tsx`          |
| **MODIFY** | `src/components/RouterCTA.tsx`         |
| **MODIFY** | `src/app/globals.css`                  |
| **CREATE** | `src/app/b/[runId]/page.tsx`           |

`src/app/layout.tsx` — read-only unless JetBrains Mono font import is genuinely missing.

**Files owned by TASK_CLAUDE_CODE.md (do NOT touch):**
- `src/app/api/v1/keys/register/route.ts`
- `src/app/api/v1/agents/register/route.ts`
- `src/app/api/v1/benchmarks/[runId]/public/route.ts`
- `src/app/b/[runId]/opengraph-image.tsx`
- `src/app/b/[runId]/badge.svg/route.ts`
- `prisma/schema.prisma`
- Any file under `src/lib/`

---

## Acceptance Criteria

- [ ] Lighthouse Performance ≥ 90 on mobile (no animation regression)
- [ ] All 4 QA page load checks return 200 OK
- [ ] No CLS on 375px viewport
- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] `/b/{runId}` page loads and shows benchmark data
- [ ] OG metadata present on `/b/{runId}` (references CLAUDE CODE's opengraph-image handler)
- [ ] Share / Embed / Badge copy buttons functional
