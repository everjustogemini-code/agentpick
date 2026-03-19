# TASK_CODEX.md — cycle 24
**Agent:** Codex
**Date:** 2026-03-19
**QA baseline:** 57/58 — P0: none | P1: 1 open (handled by Claude Code)
**Source:** NEXT_VERSION.md — Must-Have #1 (connect docs), Must-Have #2 (full UI overhaul), Must-Have #3 (playground frontend)
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## Task 1 — Must-Have #1: Update `/connect` API Reference Docs

**Source:** NEXT_VERSION.md Must-Have #1, bullets 2 & 3

**File:** `src/app/connect/page.tsx`

Read the file first to understand current structure.

**Changes:**
1. Find the section that documents the `POST /api/v1/router/search` response shape. Update the displayed JSON example to include `meta` at the top level:
   ```json
   {
     "meta": { "tool": "tavily", "latencyMs": 151, "resultCount": 10, "strategy": "balanced" },
     "data": { "query": "...", "answer": "...", "results": [...] }
   }
   ```
   Add an explicit note: `// meta is always at the top level — no need to drill into data`

2. Add a new code example section titled **"Reading routing metadata"** (place it after the response shape docs). Show:
   ```python
   import agentpick
   ap = agentpick.AgentPick(api_key="YOUR_API_KEY")
   result = ap.search("latest AI benchmarks 2026")

   print(result.meta.tool)        # e.g. "tavily"
   print(result.meta.latency_ms)  # e.g. 151
   print(result.data["answer"])   # the AI answer
   ```
   And a curl equivalent:
   ```sh
   # meta.tool and meta.latencyMs are top-level in the response
   curl -s -X POST https://agentpick.dev/api/v1/route/search \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{"query":"hello"}' | jq '.meta'
   ```

3. The `/connect` QA suite currently passes 7/7 — ensure all 7 checks still pass after your edits (don't remove any existing content, only add).

---

## Task 2 — Major UI Overhaul: Glassmorphism Design System

**Source:** NEXT_VERSION.md Must-Have #2

All existing QA checks must pass unchanged. CSS-only animations — no new JS bundle weight beyond what is specified.

### 2a — Global CSS design tokens and utilities

**File:** `src/app/globals.css`

Add or replace CSS custom properties in `:root`:

```css
:root {
  --bg-primary:    #0a0a0f;
  --accent-violet: #7c3aed;
  --accent-cyan:   #06b6d4;
  --card-surface:  rgba(255,255,255,0.06);
  --card-border:   rgba(255,255,255,0.12);
}
```

Add at end of file:

```css
body { line-height: 1.6; }

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
.animate-fade-in-up { animation: fade-in-up 0.5s ease forwards; }

/* Hero gradient mesh — slow-moving, no JS */
@keyframes gradient-drift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.hero-gradient-mesh {
  background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 40%, #0a1a2f 70%, #0a0a0f 100%);
  background-size: 300% 300%;
  animation: gradient-drift 16s ease infinite;
}

/* Typewriter cycling tool names */
@keyframes typewriter-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
.typewriter-cursor::after {
  content: "|";
  animation: typewriter-blink 0.8s step-end infinite;
}

code, pre, .font-mono { font-family: var(--font-mono, 'JetBrains Mono', monospace); }
```

### 2b — Typography: Geist/Inter + JetBrains Mono

**File:** `src/app/layout.tsx`

Read the file first. Add `next/font/google` imports (or `next/font/local` for Geist if already bundled):

```ts
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono  = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
```

Apply both CSS variable classes to the root `<html>` element:
```tsx
<html lang="en" className={`${inter.variable} ${mono.variable}`}>
```

Ensure `body` in `globals.css` picks up `font-family: var(--font-inter, Inter, sans-serif)`.

### 2c — Homepage hero: split layout + animations

**File:** `src/app/page.tsx`

Read the file first. Make the following changes:

1. **Root background:** ensure root wrapper has `bg-[#0a0a0f]` (or `className="hero-gradient-mesh"`).
2. **Hero section split layout:**
   - Wrap hero content in a two-column grid: `grid grid-cols-1 md:grid-cols-2 gap-12 items-center`
   - **Left column:** headline (≥56px, `font-bold text-white`) + `pip install agentpick` CTA block
     - Headline must include a typewriter element cycling tool names (Tavily → Exa → Perplexity → Polygon → Voyage). Implement with a small `"use client"` component `src/components/TypewriterName.tsx` that uses `useState`/`useEffect` to rotate through the names with a 2s interval. Apply `typewriter-cursor` class.
   - **Right column:** syntax-highlighted routing code snippet in a `<pre>` / `<code>` block with `font-[var(--font-mono)] text-sm`, dark `bg-black/40 rounded-xl p-4` wrapper. Overlay a pulsing latency badge: `<span className="animate-pulse text-green-400 text-xs font-mono">151ms ✓</span>` positioned absolute top-right of the code block.
3. **Stat counter elements:** add `animate-fade-in-up` class to any hero stat numbers.
4. **Tool/product cards:** add `glass-card hover-lift` classes to any card elements.
5. **Below-fold sections:** add `animate-fade-in-up` via `IntersectionObserver`. Create `src/components/ScrollReveal.tsx` — a lightweight client component:
   ```tsx
   "use client";
   import { useEffect, useRef } from "react";
   export function ScrollReveal({ children }: { children: React.ReactNode }) {
     const ref = useRef<HTMLDivElement>(null);
     useEffect(() => {
       const el = ref.current; if (!el) return;
       const obs = new IntersectionObserver(([e]) => {
         if (e.isIntersecting) { el.classList.add("animate-fade-in-up"); obs.disconnect(); }
       }, { threshold: 0.1 });
       obs.observe(el);
       return () => obs.disconnect();
     }, []);
     return <div ref={ref} style={{ opacity: 0 }}>{children}</div>;
   }
   ```
   Wrap below-fold sections in `<ScrollReveal>`.

### 2d — Rankings page: sortable leaderboard table

**File:** `src/app/rankings/page.tsx`

Read the file first to understand current data-fetching and rendering.

Add `"use client"` directive (if not already present). Keep all existing data-fetching logic (Prisma queries / API calls / props) unchanged — only change the rendering layer.

Replace the current card grid with:

1. **Filter tabs** above the table: `All` | `Search` | `Embed` | `Crawl`. Use `useState<string>` for active tab. Filter displayed rows client-side.
2. **Sort state:** `useState<{ col: 'rank'|'score', dir: 'asc'|'desc' }>` defaulting to `{ col: 'score', dir: 'desc' }`. Column headers for **Rank** and **Composite Score** are clickable to toggle sort.
3. **Table columns:** Rank (badge: gold/silver/bronze for top 3, else number) | Tool (logo + name) | Composite Score | Δ vs last week (±number with color: green positive, red negative) | Capability (tag pill).
4. **Styling:**
   - Table wrapper: `glass-card p-0 overflow-hidden`
   - Table rows: `hover:bg-white/[0.04] transition-colors`
   - Filter tabs: active tab `bg-[#7c3aed] text-white`, inactive `text-white/60 hover:text-white`
   - Rank badges 1-3: `bg-yellow-400/20 text-yellow-300` / `bg-gray-400/20 text-gray-300` / `bg-orange-400/20 text-orange-300`

### 2e — Mobile responsive pass

**Files:** `src/app/page.tsx`, `src/app/rankings/page.tsx`, `src/components/SiteHeader.tsx`

Read `src/components/SiteHeader.tsx` first.

For each file:
- **SiteHeader.tsx:** At `< 768px`, hide desktop nav links and show a hamburger toggle. Use a `useState<boolean>` for open/closed. The nav links list must be accessible when open. Example: `<button aria-label="Menu" onClick={() => setOpen(o => !o)}>☰</button>` and a `{open && <nav>...</nav>}` block.
- **`page.tsx` + `rankings/page.tsx`:** Any `grid-cols-2` or `grid-cols-3` layouts must include `grid-cols-1 sm:grid-cols-2` or similar breakpoints to stack on mobile.
- **Code blocks:** Add `overflow-x-auto` to all `<pre>` wrappers.

---

## Task 3 — No-Auth Live Playground: Frontend

**Source:** NEXT_VERSION.md Must-Have #3

**Goal:** Anonymous user types a query, clicks Run, sees real JSON. Zero sign-up required.

### 3a — Playground page

**File:** `src/app/playground/page.tsx`

Read the file first to understand current structure.

Implement (or replace with) the following UI:

1. **Monaco editor or `<textarea>`:** Pre-loaded with a Python snippet:
   ```python
   from agentpick import AgentPick
   ap = AgentPick(api_key="demo")  # no key needed for playground
   result = ap.search("YOUR_QUERY_HERE")
   print(result)
   ```
   Use Monaco if already a dependency; otherwise use a styled `<textarea className="font-mono w-full bg-black/40 rounded-xl p-4 text-sm text-white border border-white/10">`.

2. **Query input:** A separate `<input type="text">` field labeled "Query" pre-populated from the `?q=` URL parameter (`useSearchParams()`). When `?q=` is present, auto-run on mount.

3. **Run button:** calls `POST /api/v1/playground/run` with `{ query }` (no Authorization header for anonymous). Show loading spinner during request.

4. **Response panel:** On success, render:
   - `meta.tool` — styled as `<span className="text-cyan-400 font-mono">`
   - `meta.latencyMs` — styled as `<span className="text-green-400 font-mono">`
   - `data.answer` — prose text
   - Top 3 results from `data.results` — title + URL + relevance score
   - Full raw JSON in a collapsible `<details>` block with `<pre>`

5. **Rate limit (429) handling:** Show a friendly message: "You've used all 10 free daily runs. [Get your own API key →](/connect) for unlimited access."

6. **"Get your own key →" CTA:** A sticky banner that appears after the **first successful run** (use `useState<boolean>` tracking `hasRun`). Link to `/connect`.

7. **Shareable URL:** After a run, update the URL with `router.replace('/playground?q=' + encodeURIComponent(query))` (use Next.js `useRouter`). Include a "Share this query" copy button.

8. **Styling:** root wrapper `bg-[#0a0a0f]`. Query input + response panel: `glass-card` class. Page title: "Live Playground — Try AgentPick instantly".

**Files to create if needed:**
- `src/components/TypewriterName.tsx` — typewriter cycling component (if not already created in Task 2c above)

---

## Acceptance Criteria

- Anonymous user can run a search and see real results in under 60s with no sign-up.
- `?q=<query>` links pre-populate query and auto-run.
- 429 response shows friendly rate-limit message.
- Sticky "Get your own key →" CTA fires after first successful run.
- Lighthouse performance ≥85 on homepage.
- All 57 existing QA checks still pass unchanged.
- `/connect` QA suite 7/7 still passes.

---

## Files This Task Owns (exhaustive)

| File | Action |
|------|--------|
| `src/app/globals.css` | Add glass-card, hover-lift, animations, CSS vars, typography |
| `src/app/layout.tsx` | Add Inter + JetBrains Mono `next/font` loading |
| `src/app/page.tsx` | Split-layout hero, typewriter, scroll-reveal, glass cards, mobile |
| `src/app/rankings/page.tsx` | Replace card grid with sortable leaderboard table + filter tabs |
| `src/app/playground/page.tsx` | Anonymous playground UI (Monaco/textarea, response panel, shareable URL) |
| `src/app/connect/page.tsx` | Update API reference docs with `meta` shape + "Reading routing metadata" example |
| `src/components/SiteHeader.tsx` | Mobile nav collapse below 768px |
| `src/components/ScrollReveal.tsx` | **CREATE** — IntersectionObserver scroll-reveal client component |
| `src/components/TypewriterName.tsx` | **CREATE** — typewriter cycling tool names component |

**Do NOT touch:** `src/app/api/` (any route), `prisma/schema.prisma`, `sdk-python/`, `sdk/`, `next.config.ts`, or any file under `src/lib/`.

---

## Coverage Verification: Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1 — Add `meta` to search API response | **TASK_CLAUDE_CODE.md** |
| Must-Have #1 — Update Python SDK with `response.meta` | **TASK_CLAUDE_CODE.md** |
| Must-Have #1 — Update `/connect` API reference docs + code example | **This file** |
| Must-Have #2 — Glassmorphism color palette + CSS tokens | **This file** |
| Must-Have #2 — Typography (Geist/Inter + JetBrains Mono) | **This file** |
| Must-Have #2 — Homepage hero split layout + typewriter + counters | **This file** |
| Must-Have #2 — Rankings sortable leaderboard table + filter tabs | **This file** |
| Must-Have #2 — Mobile responsive pass | **This file** |
| Must-Have #3 — Anonymous rate-limited playground API (backend) | **TASK_CLAUDE_CODE.md** |
| Must-Have #3 — Playground frontend (editor, response panel, `?q=`, sticky CTA) | **This file** |

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] Cycle 24: /connect meta docs + glassmorphism UI overhaul + rankings leaderboard + playground frontend
```
