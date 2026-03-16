# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-16
**Source:** NEXT_VERSION.md — QA Round 16

---

## Overview

This file covers:
- **Must-Have #2:** Major UI Upgrade — Glassmorphism + Micro-animations + Typography Overhaul
- **Must-Have #3 (frontend):** Shareable Benchmark Permalinks — `/b/[runId]` page

All tasks modify **existing frontend files** or create the `/b/[runId]` page.
TASK_CLAUDE_CODE.md owns all new API routes and backend files. No file overlap.

---

## Must-Have #2 — Major UI Upgrade

**Priority:** High (parallel track with #1, no API changes required)

### 2.1 — Glassmorphism Cards

**Files to MODIFY:**
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/components/ProductCard.tsx`
- `src/components/PricingSection.tsx`

**Change:** On all stat cards, feature cards, and the agent-counter widget, replace flat card backgrounds with:
```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.05);   /* Tailwind: bg-white/5 */
border: 1px solid rgba(255, 255, 255, 0.10); /* Tailwind: border border-white/10 */
```

In Tailwind class strings, replace existing `bg-card` / `bg-gray-*` / flat background classes with:
`bg-white/5 backdrop-blur-[12px] border border-white/10`

Apply to:
- `src/app/page.tsx` — stat cards (agent count, benchmark runs, API calls), feature cards section
- `src/app/connect/page.tsx` — all info/feature cards
- `src/components/ProductCard.tsx` — the card root element
- `src/components/PricingSection.tsx` — all pricing tier cards

---

### 2.2 — Hero Stat Counter Animation

**File to MODIFY:** `src/app/page.tsx`

**Change:** Add a CSS keyframe counter animation on the three live network stats in the hero section ("402 active agents / 880+ benchmark runs / 11,500+ calls"):

1. Locate the stat numbers in the hero (look for text like "402", "880", "11500" or similar).
2. Wrap each number in a `<span>` with `data-target="{finalValue}"` and class `count-up`.
3. Add a `<style>` block (or extend `globals.css` / Tailwind `@layer`) with a `useEffect`-driven counter:
   ```ts
   // In a useEffect on mount, for each .count-up span:
   // Animate from 0 → data-target over 800ms ease-out
   // Use requestAnimationFrame, not setInterval
   ```
4. Trigger via `IntersectionObserver` (start counting when hero enters viewport).
5. Respect `prefers-reduced-motion: reduce` — if reduced motion, snap to final value immediately.

---

### 2.3 — Typography Overhaul

**File to MODIFY:** `src/app/page.tsx`

**Changes:**
1. **Homepage `<h1>`:** Change font-size to `clamp(2.5rem, 6vw, 4.5rem)`. Apply gradient text:
   ```css
   background: linear-gradient(135deg, #3b82f6, #8b5cf6);
   -webkit-background-clip: text;
   -webkit-text-fill-color: transparent;
   background-clip: text;
   ```
   In Tailwind: `text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-500`

2. **Code block backgrounds:** Find all inline code / code block elements and change their background to `#0d1117` (higher contrast). In Tailwind: `bg-[#0d1117]`.

3. **JetBrains Mono consistency:** Ensure all `<code>` and `<pre>` elements use `font-family: 'JetBrains Mono', monospace`. If the font is not already imported in `layout.tsx` or `globals.css`, add the Google Fonts import for JetBrains Mono. Do NOT modify `layout.tsx` or `globals.css` if they already have it — check first.

---

### 2.4 — Animated Routing Diagram on `/connect`

**File to MODIFY:** `src/app/connect/page.tsx`

**Change:** Above the code example section, add a CSS/SVG routing animation component inline (no external animation library):

1. Create a small inline SVG or div-based flow:
   `[Agent icon] → [AgentPick logo] → [Tool icons]`
2. Animate a "pulse dot" traveling left→right along the path using CSS `@keyframes`:
   ```css
   @keyframes travel {
     0%   { left: 0%; opacity: 0; }
     10%  { opacity: 1; }
     90%  { opacity: 1; }
     100% { left: 100%; opacity: 0; }
   }
   ```
3. Total animation cycle: 2 seconds, `animation-iteration-count: infinite`.
4. Must convey the routing concept visually in ≤ 2 seconds.
5. Respect `prefers-reduced-motion: reduce` — hide animation, show static diagram.

---

### 2.5 — CTA Button Shimmer

**Files to MODIFY:**
- `src/app/page.tsx` — "Get API Key" and "Install AgentPick" buttons
- `src/app/connect/page.tsx` — primary CTA buttons
- `src/components/AgentCTA.tsx` — CTA button element
- `src/components/RouterCTA.tsx` — CTA button element

**Change:** Add `@keyframes shimmer` on hover to primary buttons:
```css
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```
On hover, overlay a `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)` with `background-size: 200%` that animates `background-position` over 600ms.

In Tailwind + inline style, or add a `shimmer-btn` CSS class in `globals.css` (check if it exists first — do not duplicate).

**Accessibility:** Shimmer must be suppressed under `prefers-reduced-motion: reduce`.

---

## Must-Have #3 — Shareable Benchmark Permalinks: Frontend Page

**Priority:** High — ships after Must-Have #1 confirmed 57/57 by QA

### File to CREATE: `src/app/b/[runId]/page.tsx`

Public shareable benchmark result page at `agentpick.dev/b/{runId}`.

**Data fetching:**
- Use `fetch('/api/v1/benchmarks/{runId}/public', { next: { revalidate: 3600 } })` (the endpoint created by CLAUDE CODE)
- This is a Next.js Server Component with ISR revalidation

**Page sections (top to bottom):**
1. **Header bar** — AgentPick logo + "Benchmark Result" breadcrumb
2. **Query card** — domain badge + full query text
3. **Tool comparison table** — columns: Tool | Latency | Results | Relevance | Status. Winning tool row highlighted.
4. **"Run this benchmark" CTA** — pre-filled Python/JS/curl code snippets in tabs (reuse/adapt `CodeGeneratorWidget` if possible, otherwise inline)
5. **Share/Embed section:**
   - "Copy link" button for the permalink URL
   - "Embed" button that copies `<iframe src="agentpick.dev/b/{runId}" width="600" height="400"></iframe>`
   - "Copy badge" button that copies the markdown: `[![AgentPick](agentpick.dev/b/{runId}/badge.svg)](agentpick.dev/b/{runId})`
6. **OG metadata** — `export const metadata` with `openGraph.images` pointing to `/b/{runId}/opengraph-image`

**Styling:** Match existing site design. Apply glassmorphism classes (`bg-white/5 backdrop-blur-[12px] border border-white/10`) to the comparison table card and CTA card (consistent with #2.1).

---

## Files Summary — CODEX

| Action | File |
|--------|------|
| **MODIFY** | `src/app/page.tsx` |
| **MODIFY** | `src/app/connect/page.tsx` |
| **MODIFY** | `src/components/ProductCard.tsx` |
| **MODIFY** | `src/components/PricingSection.tsx` |
| **MODIFY** | `src/components/AgentCTA.tsx` |
| **MODIFY** | `src/components/RouterCTA.tsx` |
| **CREATE** | `src/app/b/[runId]/page.tsx` |

**All other files: READ-ONLY.**

**Files owned by TASK_CLAUDE_CODE.md (do NOT touch):**
- `src/app/api/v1/account/register/route.ts`
- `src/app/api/v1/benchmarks/[runId]/public/route.ts`
- `src/app/b/[runId]/opengraph-image.tsx`
- `src/app/b/[runId]/badge.svg/route.ts`
- `prisma/schema.prisma`
- Any file under `src/lib/`

---

## Acceptance Criteria

- [ ] Lighthouse Performance ≥ 90 on mobile (no animation regression)
- [ ] All 4 QA page load checks still pass 200 OK
- [ ] No CLS on 375px viewport
- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] `/b/{runId}` page loads and shows benchmark data
- [ ] OG metadata present on `/b/{runId}` (used by CLAUDE CODE's opengraph-image handler)
- [ ] Share/Embed/Badge copy buttons functional
