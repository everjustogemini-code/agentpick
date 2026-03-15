# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-14
**Cycle:** 34
**Source:** NEXT_VERSION.md — QA Round 12, score 57/57 (no bugs)

---

## Bug Fixes

None. QA 57/57 clean. No P0/P1/P2 issues.

---

## Must-Have #1 — Homepage Dark-Mode Overhaul with Glassmorphism + Motion

**DO NOT TOUCH:**
- `src/app/connect/page.tsx` (owned by TASK_CLAUDE_CODE)
- `sdk/` directory (owned by TASK_CLAUDE_CODE)

---

### Task 1A — Homepage (`src/app/page.tsx`)

**File to MODIFY:** `src/app/page.tsx`

Changes required:

1. **Background:** Replace `#FAFAFA` or any light hero background with `#08080f` base. Add an animated radial-gradient mesh overlay (purple `#6b21a8` + blue `#1d4ed8` glow, slow CSS keyframe animation ~12s loop, `opacity: 0.35`).

2. **Glassmorphism cards:** For every card/panel element in the homepage, apply:
   - `backdrop-filter: blur(12px)` (`backdrop-blur-md`)
   - Background: `rgba(255, 255, 255, 0.04)`
   - Border: `1px solid rgba(255, 255, 255, 0.08)`
   - On hover: `box-shadow: 0 8px 32px rgba(139, 92, 246, 0.15)` + `transform: translateY(-4px)` transition 200ms

3. **Typography:**
   - Hero headline: `font-size: 72px`, `font-weight: 800`
   - Pick one accent word in the headline and apply a gradient: `background: linear-gradient(135deg, #a855f7, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent`
   - Subheadline: `font-size: 20px`, `font-weight: 400`, `line-height: 1.6`

4. **Scroll-reveal animations:** Wrap hero text lines in the existing `<ScrollReveal>` component (`src/components/ScrollReveal.tsx`) with staggered `delay` props (0ms, 100ms, 200ms for each line). If ScrollReveal doesn't support `delay`, add the prop.

5. **Live stats counters:** Wrap the "calls routed", "tools integrated", and "uptime %" stat numbers in the existing `<AnimatedCounter>` component (`src/components/AnimatedCounter.tsx`).

6. **Node.js code tab:** The homepage has Python code examples (likely in `<HeroCodeBlock>` or `<HomepageWorkspace>`). Add a "Node.js" tab alongside the Python tab. The TypeScript snippet content comes from the `tsExamples` prop that will be passed down from the server component (set by CLAUDE_CODE in `connect/page.tsx` pattern — replicate the same pattern here). Use the snippet:
   ```ts
   import { AgentPickClient } from 'agentpick';
   const client = new AgentPickClient({ apiKey: 'YOUR_KEY' });
   const result = await client.route('search', 'latest AI benchmarks 2025');
   ```

---

### Task 1B — Rankings page (`src/app/rankings/page.tsx`)

**File to MODIFY:** `src/app/rankings/page.tsx`

Apply dark glass treatment matching the homepage:
- Page background: `#08080f`
- All ranking-row cards: glassmorphism (`backdrop-blur-md`, `rgba(255,255,255,0.04)` fill, `rgba(255,255,255,0.08)` border, hover lift)
- Remove any `bg-white` or `bg-gray-50` / light background classes

---

### Task 1C — Benchmarks page (`src/app/benchmarks/page.tsx`)

**File to MODIFY:** `src/app/benchmarks/page.tsx`

Apply dark glass treatment:
- Page background: `#08080f`
- Benchmark result cards: glassmorphism with hover glow
- Score/stat cells: consistent dark treatment, no light backgrounds

---

### Task 1D — Agents page (`src/app/agents/page.tsx`)

**File to MODIFY:** `src/app/agents/page.tsx`

Apply dark glass treatment:
- Page background: `#08080f`
- Agent cards (`<ProductCard>` or equivalent): glassmorphism with hover lift
- Remove all `bg-white`, `bg-gray-100`, `border-gray-200` light-mode classes

---

### Task 1E — Live page (`src/app/live/page.tsx`)

**File to MODIFY:** `src/app/live/page.tsx`

Apply dark glass treatment:
- Page background: `#08080f`
- Feed/activity cards: glassmorphism, `rgba(255,255,255,0.04)` fill
- Live indicator dots: keep existing color (green), but ensure contrast on dark bg

---

### Task 1F — Site nav (`src/components/SiteHeader.tsx`)

**File to MODIFY:** `src/components/SiteHeader.tsx`

Apply dark nav treatment:
- Nav background: `rgba(8, 8, 15, 0.85)` with `backdrop-filter: blur(16px)`
- Remove hard bottom border — replace with `border-bottom: 1px solid rgba(255,255,255,0.06)` or remove entirely
- Ensure nav is consistent across all 5 dark pages (homepage, rankings, benchmarks, agents, live)
- Text colors: white/`rgba(255,255,255,0.8)` on dark bg

---

### Task 1G — ScrollReveal component (`src/components/ScrollReveal.tsx`)

**File to MODIFY:** `src/components/ScrollReveal.tsx`

If `delay` prop does not exist, add it:
```ts
interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;  // ms, default 0
  className?: string;
}
```
Apply `transition-delay: ${delay}ms` to the animation. Keep existing intersection-observer logic unchanged.

---

## Must-Have #2 — Node.js SDK (UI portion only)

**Scope owned by CODEX:** Tab UI on `/connect` page for npm install.

### Task 2A — New component `src/components/ConnectTabs.tsx`

**File to CREATE:** `src/components/ConnectTabs.tsx`

Build a client component (`'use client'`) that renders a two-tab code block switcher:
- Tab 1: "Python" — `pip install agentpick` + Python quick-start
- Tab 2: "Node.js" — `npm install agentpick` + TypeScript quick-start

Props:
```ts
interface ConnectTabsProps {
  pyExamples: Record<string, string>;  // from existing connect page
  tsExamples: Record<string, string>;  // new, passed from server (CLAUDE_CODE)
}
```

Tab switching is client-side state (`useState`). Active tab highlighted with `rgba(139, 92, 246, 0.2)` pill. Code blocks use the existing `<CopyButton>` component (`src/components/CopyButton.tsx`).

**Do NOT modify `src/app/connect/page.tsx`** — that file is owned by CLAUDE_CODE. CLAUDE_CODE will import and use `ConnectTabs` from this new component file.

---

## Must-Have #3 — `/dashboard/router` Request Inspector

**Scope owned by CODEX:** All UI — drawer, filter bar, export button.

### Task 3A — Call detail drawer component

**File to CREATE:** `src/components/dashboard/CallDetailDrawer.tsx`

Client component that renders a right-side slide-in drawer. Props:
```ts
interface CallDetailDrawerProps {
  call: CallRecord | null;  // null = closed
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

Drawer must render all 9 fields from the spec:
1. Raw query
2. Capability detected
3. AI classification reasoning (`ai_routing_summary`)
4. Strategy applied
5. Tool selected
6. Fallback chain (list each tool with pass ✓ / fail ✗ + latency)
7. Latency breakdown (`classification_ms` + `tool ms` + `total_ms`)
8. Cost
9. Response preview (truncated at 500 chars + `<CopyButton>` for full content)

Animation: CSS transform `translateX(100%)` → `translateX(0)` on open, 150ms ease-out. Opens within 200ms of click (client-side only, no extra fetch).

Dark glass styling: `rgba(8, 8, 15, 0.95)` background, `backdrop-blur-xl`, `1px solid rgba(255,255,255,0.08)` left border.

---

### Task 3B — Modify `RouterAnalyticsDashboard` to wire up drawer + filter bar + export

**File to MODIFY:** `src/components/dashboard/RouterAnalyticsDashboard.tsx`

Changes:

1. **Row click → drawer:** Add `onClick` handler to each row in the "Recent Calls" table. On click, set `selectedCall` state and open `<CallDetailDrawer>`. Import and render `CallDetailDrawer` at the bottom of the component.

2. **Filter bar (above calls table):** Add a `<div>` filter bar with four controls:
   - Capability: `<select>` populated from distinct capabilities in the current calls list
   - Strategy: `<select>` with options `all | MOST_ACCURATE | FASTEST | CHEAPEST | auto`
   - Tool: `<select>` populated from distinct tools in the current calls list
   - Date range: two `<input type="date">` fields (from / to)

3. **URL param persistence:** Sync filter state to/from URL search params using `useSearchParams` and `useRouter` (Next.js). On mount, read params and initialize filter state. On filter change, push updated params. This makes filters bookmarkable.

4. **Export JSON button:** Add an "Export JSON" button above the filter bar (or inline with it). On click:
   ```ts
   const blob = new Blob([JSON.stringify(filteredCalls, null, 2)], { type: 'application/json' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a'); a.href = url; a.download = 'calls.json'; a.click();
   URL.revokeObjectURL(url);
   ```
   The exported JSON must match the `/api/v1/router/calls` response schema (same field names, same structure as `CallRecord`).

5. **Filtered calls:** Apply all four active filters to the calls array before rendering rows AND before passing to the drawer. Filtering is purely client-side.

---

### Task 3C — Dashboard router page

**File to MODIFY:** `src/app/dashboard/router/page.tsx`

Verify that `RouterAnalyticsDashboard` is rendered here. If it currently receives calls data as a prop from a server fetch, ensure the prop type includes all 9 fields required by `CallDetailDrawer` (add any missing fields to the fetch/select). No new API endpoints are needed — the existing `/api/v1/router/calls` endpoint already returns these fields.

---

## Verification Checklist

### Must-Have #1
- [ ] `src/app/page.tsx` — `#08080f` bg, animated gradient mesh, glassmorphism cards, 72px/800 hero, gradient accent word, ScrollReveal stagger, AnimatedCounter on stats, Node.js code tab
- [ ] `src/app/rankings/page.tsx` — dark bg, glass cards, no light-mode classes
- [ ] `src/app/benchmarks/page.tsx` — dark bg, glass cards
- [ ] `src/app/agents/page.tsx` — dark bg, glass cards, hover lift
- [ ] `src/app/live/page.tsx` — dark bg, glass feed cards
- [ ] `src/components/SiteHeader.tsx` — dark nav, backdrop-blur, no hard border
- [ ] `src/components/ScrollReveal.tsx` — `delay` prop supported

### Must-Have #2 (UI)
- [ ] `src/components/ConnectTabs.tsx` — new file, Python + Node.js tabs, client-side switch, CopyButton integration
- [ ] `src/app/connect/page.tsx` NOT modified (owned by CLAUDE_CODE)

### Must-Have #3
- [ ] `src/components/dashboard/CallDetailDrawer.tsx` — new file, all 9 fields, opens within 200ms, dark glass style, slide-in animation
- [ ] `src/components/dashboard/RouterAnalyticsDashboard.tsx` — row click opens drawer, filter bar (capability/strategy/tool/date), URL param persistence, Export JSON button
- [ ] `src/app/dashboard/router/page.tsx` — passes required fields to dashboard component

---

## Files Exclusively Owned by CODEX

```
src/app/page.tsx
src/app/rankings/page.tsx
src/app/benchmarks/page.tsx
src/app/agents/page.tsx
src/app/live/page.tsx
src/components/SiteHeader.tsx
src/components/ScrollReveal.tsx
src/components/ConnectTabs.tsx          (new)
src/components/dashboard/CallDetailDrawer.tsx  (new)
src/components/dashboard/RouterAnalyticsDashboard.tsx
src/app/dashboard/router/page.tsx
```
