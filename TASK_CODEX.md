# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-15
**Cycle:** 53
**Source:** NEXT_VERSION.md — v0.35, QA Round 13, score 58/58 (no bugs)

---

## Bug Fixes

None. QA 58/58 clean. No P0/P1/P2 issues.

---

## Must-Have #1 — Glassmorphism + Motion Design Upgrade

**DO NOT TOUCH:**
- `sdk/` directory (owned by TASK_CLAUDE_CODE)
- `src/app/connect/page.tsx` (owned by TASK_CLAUDE_CODE)
- `src/app/api/v1/router/calls/route.ts` (owned by TASK_CLAUDE_CODE)

All animations MUST respect `prefers-reduced-motion: reduce` — wrap every CSS animation or JS animation trigger with a `prefers-reduced-motion` check or use `@media (prefers-reduced-motion: reduce) { animation: none; }`.

---

### Task 1A — Homepage hero (`src/app/page.tsx`)

**File to MODIFY:** `src/app/page.tsx`

1. **Animated radial mesh gradient background on the hero section:**
   - Add a `<div>` absolutely positioned behind hero content with:
     ```css
     background: radial-gradient(ellipse 80% 50% at 50% -20%, #4c1d95 0%, #1e3a8a 40%, transparent 70%);
     animation: meshPulse 8s ease-in-out infinite alternate;
     opacity: 0.6;
     pointer-events: none;
     ```
   - Define `@keyframes meshPulse { from { opacity: 0.4; transform: scale(1); } to { opacity: 0.7; transform: scale(1.08); } }` in a `<style>` block or global CSS.

2. **Headline stagger-in animation per word:**
   - Split headline text into individual `<span>` elements, one per word.
   - Apply `@keyframes wordFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }` to each span.
   - Delay: `animation-delay: calc(var(--word-index) * 40ms)`, set via `style={{ '--word-index': i }}`.
   - Duration: 400ms ease-out.

3. **Headline size + accent word:**
   - Desktop: `font-size: 72px`, `font-weight: 800`
   - Pick one accent word (e.g. "best" or "fastest") and apply:
     ```css
     background: linear-gradient(135deg, #a855f7, #3b82f6);
     -webkit-background-clip: text;
     -webkit-text-fill-color: transparent;
     background-clip: text;
     ```

4. **Body/subheadline typography:**
   - Subheadline: `font-weight: 700` (Inter 700), `line-height: 1.6`
   - Body text below hero: `line-height: 1.75`

5. **Node.js tab in homepage code block (`src/components/HeroCodeBlock.tsx` or `HomepageWorkspace.tsx`):**
   - Read whichever component renders the code block on the homepage.
   - Add a "Node.js" tab alongside the existing Python tab.
   - Tab content:
     ```ts
     import { AgentPickClient } from 'agentpick';
     const client = new AgentPickClient({ apiKey: 'YOUR_KEY' });
     const result = await client.route('search', 'latest AI benchmarks 2026');
     ```
   - Active tab style: `background: rgba(139, 92, 246, 0.2)` pill, `color: #fff`.
   - Tab switching via `useState` in a `'use client'` component.

---

### Task 1B — Glassmorphism cards (pricing, benchmark rows, dashboard panels)

**File to MODIFY:** `src/components/PricingPageClient.tsx`
This file has existing unstaged changes (per git status). Read it before editing.

Replace all solid `#111`, `#0A0A0A`, `bg-zinc-900`, `bg-gray-900` card backgrounds with glassmorphism:
```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.04);
border: 1px solid rgba(255, 255, 255, 0.08);
```
On card hover, add:
```css
box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3), 0 8px 32px rgba(139, 92, 246, 0.12);
transition: box-shadow 150ms ease, transform 150ms ease;
transform: translateY(-2px);
```
Use Tailwind classes where possible: `backdrop-blur-md`, `bg-white/[.04]`, `border border-white/[.08]`.

---

### Task 1C — Frosted nav on scroll (`src/components/SiteHeader.tsx`)

**File to MODIFY:** `src/components/SiteHeader.tsx`

- Default state: transparent background, no border.
- On scroll (attach a `scroll` event listener or use IntersectionObserver on a sentinel `<div>` at top of page):
  - Add class / inline style: `backdrop-filter: blur(20px)`, `background: rgba(8, 8, 15, 0.85)`, `border-bottom: 1px solid rgba(255, 255, 255, 0.06)`
  - Use `useState(scrolled: boolean)` in `'use client'` component.
- When `scrolled === false`, remove backdrop and border.

---

### Task 1D — Benchmark table animations

Identify the component rendering the main benchmark table. Likely candidates (read to confirm):
- `src/app/benchmarks/page.tsx`
- `src/components/dashboard/RouterAnalyticsDashboard.tsx` (DO NOT touch — owned by Must-Have #3)
- A separate benchmark results component

For the public-facing benchmark table (`src/app/benchmarks/page.tsx` or its child components):

1. **Score bars animate in on scroll:**
   - Each score bar `<div>` starts at `width: 0`.
   - Use `IntersectionObserver` (threshold 0.3) to trigger animation when the row enters viewport.
   - On intersect: set `width` to final score percentage, transition `600ms ease-out`.
   - `prefers-reduced-motion`: skip animation, render bars at full width immediately.

2. **Rank #1 row gold shimmer border:**
   - Apply to the `tr` or card with rank === 1:
     ```css
     border: 1px solid transparent;
     background-clip: padding-box;
     position: relative;
     ```
   - Add a `::before` pseudo-element with:
     ```css
     content: '';
     position: absolute; inset: -1px; border-radius: inherit; z-index: -1;
     background: conic-gradient(from var(--angle), #b45309, #fbbf24, #f59e0b, #b45309);
     animation: shimmerRotate 4s linear infinite;
     ```
   - `@keyframes shimmerRotate { to { --angle: 360deg; } }` (requires `@property --angle` CSS Houdini; add JS fallback with `requestAnimationFrame` rotating a CSS variable for Safari).
   - `prefers-reduced-motion`: replace with static gold `border: 1px solid #fbbf24`.

---

### Task 1E — CTA buttons animated shimmer

Find all primary CTA button components (likely `src/components/RouterCTA.tsx` or inline in `src/app/page.tsx`).

Replace flat gradient buttons with animated border shimmer:
- Button background: `rgba(139, 92, 246, 0.15)`
- Border shimmer: use the same `conic-gradient` rotation technique as rank #1 (3s loop).
- Hover: `transform: scale(1.02)`, `transition: transform 150ms ease`.
- `prefers-reduced-motion`: static gradient border, no scale animation.

---

## Must-Have #2 — Node.js SDK (UI portion only)

### Task 2A — `src/components/ConnectTabs.tsx`

**File to CREATE or UPDATE** (may exist from a prior cycle). This is a `'use client'` component.

Props:
```ts
interface ConnectTabsProps {
  pyExamples: Record<string, string>;
  tsExamples: Record<string, string>;
}
```

Renders a two-tab switcher:
- Tab 1: "Python" — `pip install agentpick` + Python quick-start from `pyExamples.quickstart`
- Tab 2: "Node.js / TypeScript" — `npm install agentpick` as first step, TypeScript snippet from `tsExamples.quickstart`

Tab switching: `useState`. Active tab: `background: rgba(139, 92, 246, 0.2)` pill, `color: white`.

Code blocks: use the existing `<CopyButton>` component (`src/components/CopyButton.tsx`). Monospace font (JetBrains Mono if available, else `font-mono`).

**Do NOT modify `src/app/connect/page.tsx`** — CLAUDE_CODE owns that file and will import `<ConnectTabs>` there.

---

## Must-Have #3 — `/dashboard/router` Request Inspector (UI portion)

### Task 3A — `src/components/dashboard/CallDetailDrawer.tsx`

**File to CREATE or UPDATE** (may exist from a prior cycle).

Client component (`'use client'`). Props:
```ts
interface CallDetailDrawerProps {
  call: CallRecord | null;  // null = drawer closed
  onClose: () => void;
}

interface CallRecord {
  id: string;
  query: string;
  capability: string;
  ai_routing_summary?: string;
  strategy: string;
  tool_used: string;
  fallback_chain: Array<{ tool: string; success: boolean; latency_ms: number }>;
  classification_ms: number;
  latency_ms: number;
  total_ms: number;
  cost?: number;
  response_preview?: string;
}
```

Render all 9 fields:
1. Raw query
2. Capability detected
3. AI classification reasoning (`ai_routing_summary`) — show "N/A" if absent
4. Strategy applied
5. Tool selected
6. Fallback chain — list each tool with ✓ (success) or ✗ (fail) + latency in ms
7. Latency breakdown: `classify: {classification_ms}ms · tool: {latency_ms - classification_ms}ms · total: {total_ms}ms`
8. Cost — show "—" if absent
9. Response preview — truncate at 500 chars + `<CopyButton value={call.response_preview}>Copy full</CopyButton>`

Animation: CSS transition `transform: translateX(100%) → translateX(0)` on open, `300ms ease`. Must open within 200ms of click (all data is already in the list — no extra fetch).

Styling: `position: fixed; right: 0; top: 0; height: 100vh; width: 480px;`, `background: rgba(8, 8, 15, 0.95)`, `backdrop-filter: blur(24px)`, `border-left: 1px solid rgba(255,255,255,0.08)`, `z-index: 50`.

Close on Escape key (`useEffect` with keydown listener) and on overlay click.

---

### Task 3B — `src/components/dashboard/RouterAnalyticsDashboard.tsx`

**File to MODIFY.** Read first (it is ~41KB). Add:

1. **State:**
   ```ts
   const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
   const [filters, setFilters] = useState({ capability: '', strategy: '', tool: '', dateFrom: '', dateTo: '' });
   ```

2. **Row click → drawer:** On each row in "Recent Calls" table, add `onClick={() => setSelectedCall(call)}`. Render `<CallDetailDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />` at the bottom of the component.

3. **Filter bar** (add above calls table):
   - Capability: `<select>` with "All" + distinct values from calls list
   - Strategy: `<select>` with "All | MOST_ACCURATE | FASTEST | CHEAPEST | auto"
   - Tool: `<select>` with "All" + distinct tools from calls list
   - Date from/to: `<input type="date" />`

4. **URL param persistence:** Use `useSearchParams()` and `useRouter()` from `next/navigation`.
   - On mount: read `capability`, `strategy`, `tool`, `date_from`, `date_to` from URL and initialize filter state.
   - On filter change: call `router.replace(pathname + '?' + new URLSearchParams({...activeFilters}))`.

5. **Client-side filtering:** Before rendering rows, filter the calls array:
   ```ts
   const filteredCalls = calls.filter(c =>
     (!filters.capability || c.capability === filters.capability) &&
     (!filters.strategy  || c.strategy  === filters.strategy) &&
     (!filters.tool      || c.tool_used === filters.tool) &&
     (!filters.dateFrom  || c.created_at >= filters.dateFrom) &&
     (!filters.dateTo    || c.created_at <= filters.dateTo)
   );
   ```
   Pass `filteredCalls` to both the table renderer and the export function.

6. **Export JSON button** (inline with filter bar, right-aligned):
   ```ts
   const exportCalls = () => {
     const blob = new Blob([JSON.stringify(filteredCalls, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url; a.download = 'calls-export.json'; a.click();
     URL.revokeObjectURL(url);
   };
   ```
   Button label: "Export JSON". Style: small secondary button, dark glass.

---

### Task 3C — `src/app/dashboard/router/page.tsx`

**File to MODIFY.** Read first. Verify `RouterAnalyticsDashboard` is rendered here. Ensure that the Prisma/API fetch for calls includes all 9 fields required by `CallDetailDrawer`:
`id`, `query`, `capability`, `aiRoutingSummary`/`ai_routing_summary`, `strategy`, `toolUsed`/`tool_used`, `fallbackChain`/`fallback_chain`, `classificationMs`/`classification_ms`, `latencyMs`/`latency_ms`, `totalMs`/`total_ms`, `cost`, `responsePreview`/`response_preview`.

Add any missing fields to the `select` or `include` in the existing data fetch. No new API endpoints needed.

---

## Verification Checklist

### Must-Have #1
- [ ] `src/app/page.tsx` — hero has animated radial gradient (8s loop), headline stagger 40ms/word, 72px/800 headline, gradient accent word, body line-height 1.75, subheadings Inter 700
- [ ] `src/components/HeroCodeBlock.tsx` or `HomepageWorkspace.tsx` — Node.js tab with TypeScript snippet
- [ ] `src/components/PricingPageClient.tsx` — all solid dark card backgrounds replaced with glassmorphism (`backdrop-blur-md`, `bg-white/[.04]`, `border-white/[.08]`, hover glow)
- [ ] `src/components/SiteHeader.tsx` — transparent by default, `backdrop-blur-[20px]` + `border-bottom rgba(255,255,255,0.06)` activates on scroll
- [ ] Benchmark table — score bars animate in on scroll (IntersectionObserver, 600ms), rank #1 has conic-gradient shimmer border (4s loop)
- [ ] CTA buttons — animated border shimmer (3s), `scale(1.02)` on hover
- [ ] All animations have `prefers-reduced-motion` guard
- [ ] Lighthouse Performance ≥ 85, CLS < 0.1

### Must-Have #2 (UI)
- [ ] `src/components/ConnectTabs.tsx` — Python + Node.js tabs, client-side switch, `npm install agentpick` first step, CopyButton integration
- [ ] `src/app/connect/page.tsx` NOT modified (owned by CLAUDE_CODE)

### Must-Have #3 (UI)
- [ ] `src/components/dashboard/CallDetailDrawer.tsx` — all 9 fields, 300ms slide-in, opens within 200ms, dark glass style, Escape/overlay to close
- [ ] `src/components/dashboard/RouterAnalyticsDashboard.tsx` — row click opens drawer, filter bar (4 controls), URL param persistence, Export JSON button, client-side filtering of `filteredCalls`
- [ ] `src/app/dashboard/router/page.tsx` — fetch includes all 9 CallDetailDrawer fields
- [ ] Dashboard QA Part 8 still passes 4/4

---

## Files Exclusively Owned by CODEX

```
src/app/page.tsx
src/components/HeroCodeBlock.tsx            (or HomepageWorkspace.tsx — check which one)
src/components/PricingPageClient.tsx
src/components/SiteHeader.tsx
src/app/benchmarks/page.tsx                 (score bar animations)
src/components/RouterCTA.tsx                (or CTA button inline in page.tsx)
src/components/ConnectTabs.tsx              (create/update)
src/components/dashboard/CallDetailDrawer.tsx  (create/update)
src/components/dashboard/RouterAnalyticsDashboard.tsx
src/app/dashboard/router/page.tsx
```
