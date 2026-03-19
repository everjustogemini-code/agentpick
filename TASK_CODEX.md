# TASK_CODEX.md — cycle 22
**Agent:** Codex
**Date:** 2026-03-19
**QA baseline:** 62/62 — P0: none | P1: 2 open (handled by Claude Code)
**Source:** NEXT_VERSION.md — Must-Have #2 (full UI overhaul) + Must-Have #3 (Deliverable A frontend wizard, Deliverable C /connect tabs)
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## Task 1 — Major UI Overhaul: Glassmorphism Design System

### 1a — Global CSS design tokens and utilities

**File:** `src/app/globals.css`

Add or replace CSS custom properties in `:root`:

```css
:root {
  --bg-primary:      #0a0a0f;
  --accent-violet:   #7c3aed;
  --accent-cyan:     #06b6d4;
  --card-surface:    rgba(255,255,255,0.06);
  --card-border:     rgba(255,255,255,0.12);
}
```

Add utility classes at the end of the file:

```css
.glass-card {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: var(--card-surface);
  border: 1px solid var(--card-border);
  border-radius: 16px;
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(124,58,237,0.3);
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.5s ease forwards;
}

/* Live feed row stagger */
@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-in-left {
  animation: slide-in-left 0.4s ease forwards;
}
```

### 1b — Typography: Inter + JetBrains Mono

**File:** `src/app/layout.tsx`

Add `next/font/google` imports:

```ts
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono  = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
```

Apply both CSS variable classes to the root `<html>` element:
```tsx
<html lang="en" className={`${inter.variable} ${mono.variable}`}>
```

Add to `globals.css`:
```css
body { font-family: var(--font-inter, Inter, sans-serif); line-height: 1.6; }
code, pre, .font-mono { font-family: var(--font-mono, 'JetBrains Mono', monospace); }
```

### 1c — Homepage hero redesign

**File:** `src/app/page.tsx`

- Root wrapper: ensure `bg-[#0a0a0f]` or `bg-[var(--bg-primary)]` is set.
- Hero section: split layout — **left column**: heading (≥56px, `font-bold`, Inter) + primary CTA button; **right column**: a syntax-highlighted routing code snippet in a `<pre>` / `<code>` block styled with `font-[var(--font-mono)]` + dark background, plus a pulsing latency badge element (e.g. `<span className="animate-pulse">725ms ✓</span>`) positioned over the snippet.
  - Example heading text to preserve (or improve but keep meaning): existing hero headline from the file.
  - CTA button: apply `hover-lift` + `bg-[#7c3aed]` accent.
- Stat counter elements (any existing hero numbers): add `animate-fade-in-up` class.
- Tool/product cards on homepage: add `glass-card hover-lift` classes.
- Any `<section>` blocks below the fold: add `animate-fade-in-up` + an `IntersectionObserver` via a small inline `<script>` **or** a lightweight client component (no new npm packages). If adding a client component, name it `src/components/ScrollReveal.tsx`.

### 1d — Rankings page: sortable leaderboard table

**File:** `src/app/rankings/page.tsx`

Read the file first to understand current structure (category card grid).

Replace the category card grid with a leaderboard table:

- Table columns: **Rank** (badge: gold/silver/bronze for top 3) | **Tool** (logo + name) | **Composite Score** | **Δ vs last week** (sparkline or ±number) | **Capability** (tag).
- Filter tabs above the table: `All` | `Search` | `Embed` | `Crawl`. Clicking a tab filters rows client-side (use React state, `"use client"` directive).
- Sort: clicking **Composite Score** or **Rank** column header toggles ascending/descending. Default sort: composite score descending.
- Keep all existing data-fetching logic (Prisma queries or API calls) unchanged. Only change the rendering layer.
- Apply `glass-card` to the table wrapper. Row hover: `hover:bg-white/[0.04]`.

### 1e — Mobile responsive pass

**Files:** `src/app/page.tsx`, `src/app/rankings/page.tsx`, `src/components/SiteHeader.tsx` (read first)

For each file:
- **Nav collapse** (`SiteHeader.tsx`): at `< 768px` breakpoint, hide desktop nav links and show a hamburger toggle (use a `<details>/<summary>` pattern or a React state toggle — no new libraries). The nav links list must be accessible when open.
- **Card stacking**: any `grid-cols-2` or `grid-cols-3` layouts must stack to `grid-cols-1` below `768px`.
- **Code block overflow**: add `overflow-x-auto` to all `<pre>` wrappers.

**Acceptance for Task 1:**
- `--bg-primary: #0a0a0f` active globally.
- Glass cards visible on homepage and rankings.
- Hero shows split layout with pulsing latency badge.
- Rankings shows sortable table with filter tabs.
- Mobile nav collapses below 768px; cards stack.
- All 62 QA checks still pass. Lighthouse performance ≥85.

---

## Task 2 — Must-Have #3 Deliverable A: QuickstartWizard client component

**File to create:** `src/components/QuickstartWizard.tsx`

This component is imported by `src/app/quickstart/page.tsx` (created by Claude Code). Implement a 3-step inline wizard:

### Step 1 — Email input
- `<input type="email">` + "Get my key" button.
- On submit, call `POST /api/v1/quickstart/register` with `{ email }`.
- On success, store the returned `apiKey` in component state and advance to Step 2.
- On error, display the error message inline.

### Step 2 — Key + copyable snippet
- Display the API key in a styled box (blur by default; reveal on hover or click).
- Three tabs: **cURL** | **Python** | **Node.js** — each shows a one-liner with the real key auto-injected:
  - cURL: `curl -X POST https://agentpick.dev/api/v1/route/search -H "Authorization: Bearer <KEY>" -d '{"query":"hello world"}'`
  - Python: `from agentpick import AgentPick; ap = AgentPick("<KEY>"); print(ap.search("hello world"))`
  - Node.js: `import { AgentPickClient } from 'agentpick'; const r = await new AgentPickClient({apiKey:"<KEY>"}).route('search','hello world'); console.log(r);`
- Each tab has a `CopyButton` (import from `@/components/CopyButton` if it exists, otherwise create a minimal inline copy button using `navigator.clipboard.writeText`).
- "Run it live" button advances to Step 3.

### Step 3 — Live response
- On mount (or button click from Step 2): execute a real search using the key from Step 1 by calling `POST /api/v1/route/search` with `{ query: "hello world", strategy: "auto" }` and `Authorization: Bearer <apiKey>`.
- Render the JSON response pretty-printed in a `<pre className="font-[var(--font-mono)]">` block.
- On success, show a "You're all set!" banner with a link to `/connect` for the full API reference.
- On error, display the raw error message.

Apply `glass-card` class to each step container.

**Acceptance:** `/quickstart` produces a working API key and shows real JSON response end-to-end.

---

## Task 3 — Must-Have #3 Deliverable C: `/connect` page tab upgrade

**File:** `src/app/connect/page.tsx`

Read the file first (it already uses `ConnectTabs` from `@/components/ConnectTabs`). The existing `tsExamples` object and `<ConnectTabs>` component are the current code-snippet block.

**What to change:**

Replace or augment the existing `ConnectTabs` usage to show three tabs: **REST API** | **Python SDK** | **Node SDK**.

Option A (preferred if `ConnectTabs` is easily extensible): Add `restExample` and `pythonExample` props to the existing `ConnectTabs` call and update `src/components/ConnectTabs.tsx` accordingly.

Option B (if ConnectTabs is hard to extend): Render a new inline tabbed block using React state (`"use client"` directive on a new wrapper component `src/components/ConnectTabsFull.tsx`) showing:

- **REST API tab:**
  ```
  POST /api/v1/route/search
  Authorization: Bearer YOUR_API_KEY
  {"query": "latest AI benchmarks 2026", "strategy": "auto"}
  ```
- **Python SDK tab:**
  ```python
  from agentpick import AgentPick
  ap = AgentPick(api_key="YOUR_API_KEY")
  result = ap.search("latest AI benchmarks 2026")
  ```
- **Node SDK tab:**
  ```ts
  import { AgentPickClient } from 'agentpick';
  const client = new AgentPickClient({ apiKey: 'YOUR_API_KEY' });
  const result = await client.route('search', 'latest AI benchmarks 2026');
  ```

Each tab: add `CopyButton` component. Placeholder `YOUR_API_KEY` is fine (no server-side key injection needed for this task).

**Acceptance:** `/connect` QA suite 7/7 still passes. Three tabs render with copyable code.

---

## Files This Task Owns (exhaustive)

| File | Action |
|------|--------|
| `src/app/globals.css` | Add glass-card, hover-lift, animation utilities + CSS vars |
| `src/app/layout.tsx` | Add Inter + JetBrains Mono `next/font` loading |
| `src/app/page.tsx` | Split-layout hero, glass cards, scroll-reveal, mobile stacking |
| `src/app/rankings/page.tsx` | Replace category card grid with sortable leaderboard table |
| `src/components/SiteHeader.tsx` | Mobile nav collapse below 768px |
| `src/components/QuickstartWizard.tsx` | **CREATE** — 3-step wizard (email → key → live run) |
| `src/app/connect/page.tsx` | Add three-tab SDK snippet block (REST / Python / Node) |
| `src/components/ConnectTabs.tsx` or `src/components/ConnectTabsFull.tsx` | Extend or create tabbed snippets component |
| `src/components/ScrollReveal.tsx` | **CREATE** if scroll-reveal client component is needed |

**Do NOT touch:** `next.config.ts`, `src/app/products/[slug]/page.tsx`, `src/app/quickstart/page.tsx`, `src/app/api/` (any route), `sdk/`, `sdk-python/`, or any file under `src/lib/`.

---

## Coverage: Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1 P1-A — `/api/v1/developer/*` 308 redirect | **TASK_CLAUDE_CODE.md** |
| Must-Have #1 P1-B — Tavily pricing table on `/products/tavily` | **TASK_CLAUDE_CODE.md** |
| Must-Have #2 — Glassmorphism UI overhaul (all pages, typography, animations) | **This file** |
| Must-Have #2 — Rankings leaderboard table | **This file** |
| Must-Have #2 — Mobile responsive pass | **This file** |
| Must-Have #3 Deliverable A — `/quickstart` wizard frontend | **This file** |
| Must-Have #3 Deliverable B — npm + PyPI packages | **TASK_CLAUDE_CODE.md** |
| Must-Have #3 Deliverable C — `/connect` three-tab SDK block | **This file** |

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] Cycle 22: glassmorphism UI overhaul + rankings leaderboard + quickstart wizard + /connect SDK tabs
```
