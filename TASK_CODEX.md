# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-15
**Cycle:** 79
**Source:** NEXT_VERSION.md v0.79 — QA Round 13, score 58/58 (no bugs)

---

## Bug Fixes

None. QA 58/58 clean. No P0/P1/P2 issues.

---

## Must-Have #1 — Glassmorphism + Motion Design Upgrade

**Scope owned by CODEX:** All visual/CSS/component changes. Pages: `/` (homepage), `/connect`, `/dashboard`, `/products/tavily`.

**DO NOT TOUCH (owned by TASK_CLAUDE_CODE):**
- `sdk/` directory (all files)
- `src/app/api/v1/router/calls/route.ts`

---

### Task 1A — Global CSS (`src/app/globals.css`)

Read the file first. The dark glass design system variables already exist (e.g., `--bg-base: #0a0a0f`). Make these additions/updates:

1. **Animated radial mesh gradient keyframe** (add if `@keyframes mesh-shift` is not already defined or lacks the right motion):
   ```css
   @keyframes mesh-shift {
     0%   { background-position: 0% 50%; }
     50%  { background-position: 100% 50%; }
     100% { background-position: 0% 50%; }
   }
   .hero-mesh {
     background: radial-gradient(ellipse at 30% 40%, rgba(107,33,168,0.35) 0%, transparent 60%),
                 radial-gradient(ellipse at 70% 60%, rgba(29,78,216,0.35) 0%, transparent 60%);
     background-size: 200% 200%;
     animation: mesh-shift 8s ease infinite;
   }
   @media (prefers-reduced-motion: reduce) {
     .hero-mesh { animation: none; }
   }
   ```

2. **Headline stagger-in** (add if `@keyframes stagger-word` not present):
   ```css
   @keyframes stagger-word {
     from { opacity: 0; transform: translateY(12px); }
     to   { opacity: 1; transform: translateY(0); }
   }
   .stagger-word {
     display: inline-block;
     opacity: 0;
     animation: stagger-word 0.4s ease forwards;
   }
   @media (prefers-reduced-motion: reduce) {
     .stagger-word { opacity: 1; animation: none; }
   }
   ```

3. **Glassmorphism card class** — update `.glass-card` or add `.glass-panel`:
   ```css
   .glass-panel {
     backdrop-filter: blur(12px);
     -webkit-backdrop-filter: blur(12px);
     background: rgba(255, 255, 255, 0.04);
     border: 1px solid rgba(255, 255, 255, 0.08);
   }
   .glass-panel:hover {
     box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 8px 32px rgba(139,92,246,0.12);
   }
   ```

4. **Frosted nav** — add `.nav-frosted` class:
   ```css
   .nav-frosted {
     backdrop-filter: blur(20px);
     -webkit-backdrop-filter: blur(20px);
     border-bottom: 1px solid rgba(255, 255, 255, 0.06);
     background: rgba(10, 10, 15, 0.8);
   }
   ```

5. **Score bar scroll animation** (for benchmark table):
   ```css
   @keyframes score-bar-scroll-fill {
     from { width: 0%; }
     to   { width: var(--bar-width); }
   }
   .score-bar-animated {
     width: 0%;
     animation: score-bar-scroll-fill 600ms ease-out forwards;
   }
   @media (prefers-reduced-motion: reduce) {
     .score-bar-animated { width: var(--bar-width); animation: none; }
   }
   ```

6. **Gold shimmer border for rank #1** (benchmark table row):
   ```css
   @keyframes gold-shimmer {
     from { --shimmer-angle: 0deg; }
     to   { --shimmer-angle: 360deg; }
   }
   .rank-first-border {
     border: 1px solid transparent;
     background-image: conic-gradient(from var(--shimmer-angle, 0deg),
       rgba(234,179,8,0.6), rgba(234,179,8,0.1), rgba(234,179,8,0.6));
     background-origin: border-box;
     animation: gold-shimmer 4s linear infinite;
   }
   @media (prefers-reduced-motion: reduce) {
     .rank-first-border { animation: none; }
   }
   ```

7. **CTA button animated border shimmer**:
   ```css
   @keyframes btn-shimmer {
     from { --btn-angle: 0deg; }
     to   { --btn-angle: 360deg; }
   }
   .btn-shimmer {
     background-image: conic-gradient(from var(--btn-angle, 0deg),
       rgba(168,85,247,0.8), rgba(59,130,246,0.8), rgba(168,85,247,0.8));
     animation: btn-shimmer 3s linear infinite;
     transition: transform 150ms ease;
   }
   .btn-shimmer:hover { transform: scale(1.02); }
   @media (prefers-reduced-motion: reduce) {
     .btn-shimmer { animation: none; }
   }
   ```

8. **Typography defaults** — add to body or `:root`:
   ```css
   body { line-height: 1.75; }
   h2, h3 { font-weight: 700; }
   ```

---

### Task 1B — Homepage hero (`src/app/page.tsx`)

Read the file first. Locate the hero section JSX (the `<section>` or `<div>` that contains the main headline and subheadline).

1. **Mesh gradient background:** Add `className="hero-mesh"` (defined in globals.css above) to the outermost hero container. Remove any `bg-[#FAFAFA]` or light background class from the hero.

2. **Headline stagger:** Wrap each word of the hero headline in a `<span className="stagger-word">` with inline style `animationDelay: "${n * 40}ms"`. Example: if headline is "Route Every Agent Call Intelligently", each of the 5 words gets delay 0ms, 40ms, 80ms, 120ms, 160ms.

3. **Accent word gradient:** Pick ONE accent word in the headline and add inline styles:
   ```jsx
   style={{
     background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
     WebkitBackgroundClip: 'text',
     WebkitTextFillColor: 'transparent',
     backgroundClip: 'text',
   }}
   ```

4. **Hero headline size:** Add `text-[72px] font-[800]` (or equivalent Tailwind `text-7xl font-extrabold`) to the `<h1>` on desktop. Use `md:text-[72px]` if responsive classes are needed.

5. **Body line-height:** Body text already handled via globals.css. Verify no inline `leading-*` class overrides it to something tighter.

6. **Pricing/feature cards:** Find all cards in the homepage (pricing section, benchmark table, feature cards). Replace their `bg-[#111]` / `bg-[#0A0A0A]` / `bg-white` solid backgrounds with `glass-panel` class (or inline equivalent). Keep existing Tailwind classes; only swap the background/border.

7. **CTA buttons:** Find the primary CTA button(s). Add `btn-shimmer` class OR apply the conic-gradient inline style. Add `transition: 150ms` and `hover:scale-[1.02]`.

8. **Node.js code tab:** Locate the `<HeroCodeBlock>` or `<HomepageWorkspace>` component usage. Add a "Node.js" tab prop alongside the Python tab. Pass this TypeScript snippet as the Node.js tab content:
   ```ts
   import { AgentPickClient } from 'agentpick';
   const client = new AgentPickClient({ apiKey: 'YOUR_KEY' });
   const result = await client.route('search', 'latest AI benchmarks 2026');
   console.log(result.tool, result.latency_ms);
   ```
   If the code block component only accepts a single snippet string, wrap it in a `useState`-based tab switcher inline or use the new `ConnectTabs` component (see Task 2A).

---

### Task 1C — Site nav (`src/components/SiteHeader.tsx`)

Read the file first. Currently has a hard border on scroll; needs frosted glass treatment.

1. Replace the nav's background class with scroll-aware frosted glass:
   - Find the `<header>` or `<nav>` element.
   - Add a `useEffect` + `useState` scroll listener: `const [scrolled, setScrolled] = useState(false)`.
   - On `window.scroll > 0`: set `scrolled = true`.
   - Apply `scrolled ? 'nav-frosted' : 'bg-transparent'` as className.
   - The `nav-frosted` class is defined in globals.css (Task 1A step 4).
2. Remove any hard `border-b border-white/10` that was applied unconditionally — it now comes from `nav-frosted`.
3. Text: Ensure nav link text is `text-white/80` on dark background.

---

### Task 1D — Pricing cards (`src/components/PricingSection.tsx` or `src/components/PricingPageClient.tsx`)

Read both files. Identify which one renders the actual pricing card `<div>` elements.

For each pricing card `<div>`:
1. Remove solid `bg-[#111]` / `bg-[#0A0A0A]` background class.
2. Add `glass-panel` class (backdrop-blur-md + rgba fill + border).
3. Add hover inner glow via the `.glass-panel:hover` CSS from globals.css.

**Only modify the file that renders the card elements** — do not touch the other one.

---

### Task 1E — Benchmark table + `/products/tavily` score bars (`src/app/products/[slug]/page.tsx` or a benchmark table component)

Read `src/app/products/[slug]/page.tsx`. Locate the benchmark score bar elements (the `<div>` progress bars that show scores as widths).

1. **IntersectionObserver scroll animation:**
   - Add a `useEffect` in the component (or a small hook) that creates an `IntersectionObserver`.
   - On intersection, set `style={{ '--bar-width': `${score}%` }}` as a CSS variable and add `score-bar-animated` class to each bar element.
   - Remove any static `width: N%` inline style; replace with CSS variable + class.

2. **Rank #1 row gold shimmer:** Find the row for the top-ranked tool. Add `rank-first-border` class to that row's container element.

3. **Glass panel for benchmark rows:** Apply `glass-panel` class (or inline equivalent) to benchmark result row cards. Replace any solid backgrounds.

---

### Task 1F — Dashboard panels (`src/app/dashboard/page.tsx`)

Read the file. Find the dashboard card/panel elements (API key panel, usage stats panel, etc.).

1. Replace solid `bg-[#111]` / `bg-zinc-900` / `bg-gray-900` card backgrounds with `glass-panel` class.
2. Verify the page renders correctly (no layout shifts from removing solid backgrounds).
3. Do not touch `RouterAnalyticsDashboard.tsx` from this task — that component is handled in Task 3B below.

---

## Must-Have #2 — Node.js SDK UI: `/connect` page tab

**Scope owned by CODEX:** Frontend tab UI for npm install on the connect page.

### Task 2A — New component `src/components/ConnectTabs.tsx`

**Create this new file.** Client component (`'use client'`). Two-tab code block switcher:
- Tab 1: "Python" — existing pip install + Python quick-start code
- Tab 2: "Node.js / TypeScript" — `npm install agentpick` + TypeScript quick-start

```tsx
'use client';
interface ConnectTabsProps {
  pyInstall: string;
  pySnippet: string;
  tsInstall: string;
  tsSnippet: string;
}
```

- Tab switching: `useState('python')`
- Active tab: highlight pill with `rgba(139, 92, 246, 0.25)` background + `text-white`
- Inactive tab: `text-white/50`
- Code blocks: dark bg `rgba(0,0,0,0.4)`, monospace font, include `<CopyButton>` from `src/components/CopyButton.tsx`
- Node.js install command: `npm install agentpick`
- TypeScript snippet:
  ```ts
  import { AgentPickClient } from 'agentpick';
  const client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY! });
  const result = await client.route('search', 'latest AI benchmarks 2026');
  console.log(result.tool, result.latency_ms);
  ```

### Task 2B — Connect page (`src/app/connect/page.tsx`)

Read the file first. Find where the Python quick-start code block is currently rendered (look for `pip install` string or a `<pre>` / inline code block).

1. Import `ConnectTabs` from `@/components/ConnectTabs`.
2. Replace the static Python code block with `<ConnectTabs>` passing the Python and Node.js content as props.
3. The existing Python code strings should be extracted into constants and passed as `pyInstall` and `pySnippet` props.
4. TypeScript tab content:
   - `tsInstall`: `"npm install agentpick"`
   - `tsSnippet`: the TypeScript snippet above

---

## Must-Have #3 — `/dashboard/router` Request Inspector Drawer (UI)

**Scope owned by CODEX:** All UI — drawer component, filter bar, export button, URL params, row click wiring.

### Task 3A — New component `src/components/dashboard/CallDetailDrawer.tsx`

**Create this new file.** Client component. Right-side slide-in drawer.

```tsx
'use client';
interface CallDetailDrawerProps {
  call: CallRecord | null;   // null means closed
  onClose: () => void;
}
interface CallRecord {
  id: string;
  query: string;
  capability: string;
  ai_routing_summary?: string;
  strategy: string;
  tool_used: string;
  fallback_chain: Array<{ tool: string; success: boolean; latency_ms?: number }>;
  classify_ms?: number;
  tool_ms?: number;
  latency_ms: number;
  cost_usd?: number;
  response_preview?: string;
}
```

Drawer requirements:
- Position: `fixed right-0 top-0 h-full w-[480px]` (mobile: full width)
- Animation: CSS `transform: translateX(100%)` when closed → `translateX(0)` when open, `transition: transform 300ms ease`
- Opens within 200ms of row click (client-side only, no extra fetch — data already in the list)
- Background: `rgba(8, 8, 15, 0.96)` with `backdrop-filter: blur(24px)`
- Left border: `border-l: 1px solid rgba(255, 255, 255, 0.08)`
- Close button: `×` top-right, calls `onClose()`
- Overlay backdrop: semi-transparent `rgba(0,0,0,0.4)` behind drawer, click to close

**Render all 9 fields** (show label + value for each):
1. **Raw query** — `call.query`
2. **Capability** — `call.capability`
3. **AI reasoning** — `call.ai_routing_summary` (italic, smaller text; show "—" if null)
4. **Strategy** — `call.strategy`
5. **Tool selected** — `call.tool_used`
6. **Fallback chain** — map `call.fallback_chain`: each entry shows tool name + ✓ or ✗ badge + latency if available
7. **Latency breakdown** — three rows: "Classify: Xms", "Tool: Xms", "Total: Xms"
8. **Cost** — `$${call.cost_usd?.toFixed(6)}` (show "—" if null)
9. **Response preview** — first 500 chars of `call.response_preview` in a `<pre>` block + `<CopyButton>` for full content. Label "Copy full" on the button.

`@media (prefers-reduced-motion: reduce)`: `transition: none`.

---

### Task 3B — `src/components/dashboard/RouterAnalyticsDashboard.tsx`

Read the file first (970 lines). Make targeted additions without touching existing chart/analytics code.

**Change 1 — Row click opens drawer:**
- Find the "Recent Calls" table (search for the `<tr>` or `<div>` that renders each call row).
- Add `useState<CallRecord | null>(null)` for `selectedCall`.
- Add `onClick={() => setSelectedCall(call)}` to each row container.
- Add cursor pointer style to rows: `cursor: pointer hover:bg-white/[0.03]`.
- Import and render `<CallDetailDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />` at the bottom of the JSX tree (after the table, inside the outermost container).
- Import `CallDetailDrawer` from `@/components/dashboard/CallDetailDrawer`.

**Change 2 — Filter bar above calls table:**
Add a filter bar `<div>` immediately above the calls table. Four controls:

```tsx
// Capability filter
<select value={filterCapability} onChange={e => setFilterCapability(e.target.value)}>
  <option value="">All capabilities</option>
  {distinctCapabilities.map(c => <option key={c}>{c}</option>)}
</select>

// Strategy filter
<select value={filterStrategy} onChange={e => setFilterStrategy(e.target.value)}>
  <option value="">All strategies</option>
  {['MOST_ACCURATE','FASTEST','CHEAPEST','BALANCED','AUTO','MANUAL'].map(s => <option key={s}>{s}</option>)}
</select>

// Tool filter
<select value={filterTool} onChange={e => setFilterTool(e.target.value)}>
  <option value="">All tools</option>
  {distinctTools.map(t => <option key={t}>{t}</option>)}
</select>

// Date range
<input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
<input type="date" value={filterDateTo}   onChange={e => setFilterDateTo(e.target.value)} />
```

`distinctCapabilities` and `distinctTools` are derived from the calls list via `useMemo`.

Styling for selects/inputs: dark glass — `bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-sm text-white/80`.

**Change 3 — URL param persistence:**
- Add `'use client'` if not already present (verify).
- Import `useSearchParams`, `useRouter`, `usePathname` from `next/navigation`.
- On mount (`useEffect`), read `capability`, `strategy`, `tool`, `dateFrom`, `dateTo` from search params and set filter state.
- On any filter state change, push updated search params via `router.replace(pathname + '?' + params.toString(), { scroll: false })`.

**Change 4 — Export JSON button:**
Add an "Export JSON" button in the filter bar row (right-aligned). On click:
```ts
const blob = new Blob([JSON.stringify(filteredCalls, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = `calls-${new Date().toISOString().slice(0,10)}.json`; a.click();
URL.revokeObjectURL(url);
```
Export uses `filteredCalls` (the currently-filtered subset, not all calls).

**Change 5 — Client-side filtering:**
Add a `filteredCalls` derived value:
```ts
const filteredCalls = useMemo(() => {
  return calls.filter(call =>
    (!filterCapability || call.capability === filterCapability) &&
    (!filterStrategy  || call.strategy  === filterStrategy)   &&
    (!filterTool      || call.tool_used === filterTool)       &&
    (!filterDateFrom  || call.created_at >= filterDateFrom)   &&
    (!filterDateTo    || call.created_at <= filterDateTo)
  );
}, [calls, filterCapability, filterStrategy, filterTool, filterDateFrom, filterDateTo]);
```
Replace the existing calls list render to use `filteredCalls` instead of `calls`.

---

## Verification Checklist

### Must-Have #1
- [ ] `src/app/globals.css` — `hero-mesh`, `stagger-word`, `glass-panel`, `nav-frosted`, `score-bar-animated`, `rank-first-border`, `btn-shimmer` all defined; all respect `prefers-reduced-motion`
- [ ] `src/app/page.tsx` — hero has mesh bg, stagger headline, 72px/800 h1, accent gradient word, glassmorphism cards, CTA shimmer button, Node.js tab in code block
- [ ] `src/components/SiteHeader.tsx` — scroll-aware frosted nav, no hard unconditional border
- [ ] `src/components/PricingSection.tsx` or `PricingPageClient.tsx` — pricing cards use `glass-panel`
- [ ] `src/app/products/[slug]/page.tsx` — score bars animate via IntersectionObserver; rank #1 row has gold shimmer; rows use `glass-panel`
- [ ] `src/app/dashboard/page.tsx` — dashboard panels use `glass-panel`

### Must-Have #2 (UI)
- [ ] `src/components/ConnectTabs.tsx` — new file; Python + Node.js tabs; tab switching; `CopyButton` integrated
- [ ] `src/app/connect/page.tsx` — uses `<ConnectTabs>` with both py and ts props

### Must-Have #3
- [ ] `src/components/dashboard/CallDetailDrawer.tsx` — new file; all 9 fields; 300ms slide-in; dark glass; closes on overlay click or × button
- [ ] `src/components/dashboard/RouterAnalyticsDashboard.tsx` — row click opens drawer; filter bar with 4 controls; URL param persistence; Export JSON button; filtered list drives both table and export

---

## Files Exclusively Owned by CODEX

```
src/app/globals.css
src/app/page.tsx
src/components/SiteHeader.tsx
src/components/PricingSection.tsx
src/components/PricingPageClient.tsx
src/app/connect/page.tsx
src/app/products/[slug]/page.tsx
src/app/dashboard/page.tsx
src/components/ConnectTabs.tsx              (new)
src/components/dashboard/CallDetailDrawer.tsx  (new)
src/components/dashboard/RouterAnalyticsDashboard.tsx
```
