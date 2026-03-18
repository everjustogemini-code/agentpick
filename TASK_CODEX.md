# TASK_CODEX.md — Cycle 2
**Agent:** Codex (frontend / components / styling / docs)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md Cycle 2

---

## Coverage Summary

| NEXT_VERSION.md Item | Task | Owner |
|---|---|---|
| P1-A — Flat key refs in docs/frontend | Fix `response.tool` → `response.meta.tool_used`, add schema table on `/connect` | **CODEX** |
| P1-B — `ai_classification` null undocumented | Add callout on `/connect` and API reference docs | **CODEX** |
| P2 — Frontend doc refs to dead endpoints | Replace `/account/usage` and `/developer/usage` mentions in frontend/docs | **CODEX** |
| Item 2 — Glassmorphism UI overhaul | `page.tsx`, `globals.css`, `layout.tsx`, arena/pricing components | **CODEX** |
| Item 3 — `/quickstart` page + logo strip | `src/app/quickstart/page.tsx` (new), `src/app/page.tsx` logo strip | **CODEX** |

---

## Files Owned by This Agent

| Action | File |
|---|---|
| **MODIFY** | `src/components/Playground.tsx` |
| **MODIFY** | `src/app/connect/page.tsx` (or equivalent connect/docs page) |
| **MODIFY** | `src/app/page.tsx` |
| **MODIFY** | `src/app/globals.css` |
| **MODIFY** | `src/app/layout.tsx` |
| **MODIFY** | Arena result tile component (find under `src/components/`) |
| **MODIFY** | Pricing card component (find under `src/components/`) |
| **CREATE** | `src/app/quickstart/page.tsx` |

> **DO NOT TOUCH** any file listed in TASK_CLAUDE_CODE.md.
> Specifically: `next.config.ts`, `src/lib/router/sdk.ts`,
> `src/app/api/v1/quickstart/[framework]/route.ts`, and any file under `src/app/api/`.

---

## Task 1 — P1-A: Fix Flat Key References in Frontend/Docs

**Bug:** Frontend code and doc pages reference `response.tool`, `response.results` at the top level. Actual shape is `response.meta.tool_used` and `response.data.results`.

### 1A — Fix `src/components/Playground.tsx`

1. Read the file and locate the `PlaygroundResponse` interface (around the `tool?: string | null` and `results?:` lines).
2. Replace the flat interface with the correct nested shape:

```ts
// BEFORE (wrong — flat)
interface PlaygroundResponse {
  tool?: string | null;
  results?: PlaygroundResult[];
  // ...
}

// AFTER (correct)
interface PlaygroundResponseMeta {
  tool_used: string;
  latency_ms: number;
  cost_usd: number;
  ai_classification: string | null;
  calls_remaining: number;
}
interface PlaygroundResponse {
  meta: PlaygroundResponseMeta;
  data: {
    results: PlaygroundResult[];
  };
}
```

3. Update all usages in `Playground.tsx` that read `response.tool` → `response.meta.tool_used`, and `response.results` → `response.data.results`.

### 1B — Add Response Schema Table on `/connect` Page

Find the `/connect` page file (likely `src/app/connect/page.tsx`). In the API reference section:

1. Grep the file for `response.tool`, `response.results`, `.tool_used` at root level — fix every occurrence.
2. Add an explicit **Response Schema** table showing the full two-level shape:

```
| Field | Type | Description |
|---|---|---|
| meta.tool_used | string | Which search tool was selected |
| meta.latency_ms | number | Round-trip latency in ms |
| meta.cost_usd | number | Cost of this call |
| meta.ai_classification | string \| null | Query classification — null when strategy ≠ auto |
| meta.calls_remaining | number | Remaining calls in quota |
| data.results | array | Array of search result objects |
```

Place this table directly after the first code example showing an API response.

---

## Task 2 — P1-B: Document `ai_classification` Null Behavior

**Bug:** No documentation that `meta.ai_classification` is `null` when strategy is not `auto`.

**File:** `src/app/connect/page.tsx` (same file as Task 1B — coordinate edits, do not create conflicts within the file)

Find the strategy selector section (where `balanced`, `best_performance`, `cheapest`, `auto` are described). Add an inline callout immediately below the strategy options list:

```
> **Note:** `meta.ai_classification` is only populated when `strategy=auto`.
> For all other strategies (`balanced`, `best_performance`, `cheapest`) it is `null`.
```

Also add this callout in the API reference section near the response schema table added in Task 1B.

---

## Task 3 — P2: Fix Frontend Doc References to Dead Endpoints

**Bug:** Any frontend page or component that shows example URLs `/api/v1/account/usage` or `/api/v1/developer/usage` points to dead paths.

**Action:**
1. Grep `src/app/` and `src/components/` for `/account/usage` and `/developer/usage`.
2. For each occurrence in a frontend file (NOT in `src/app/api/` — those are for Claude Code):
   - Replace `/api/v1/account/usage` with `/api/v1/router/usage`
   - Replace `/api/v1/developer/usage` with `/api/v1/router/usage`

**Note:** The server-side 301 redirects are handled by Claude Code in `next.config.ts`. This task only fixes hardcoded strings in frontend/doc files.

---

## Task 4 — Item 2: Glassmorphism UI Overhaul

### 4A — Animated gradient hero (`src/app/page.tsx` + `src/app/globals.css`)

In `globals.css`, add the animated gradient keyframes and dot overlay:
```css
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.hero-gradient {
  background: linear-gradient(-45deg, #312e81, #4c1d95, #1e1b4b, #0f172a);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
}
.hero-dot-overlay {
  background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 24px 24px;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
}
```

In `page.tsx`, apply `.hero-gradient` and `.hero-dot-overlay` classes to the hero section wrapper. Add an `IntersectionObserver` in a `useEffect` that adds `fade-in-up` class to each section as it enters the viewport, with stagger delay `0.1s * index`.

### 4B — Hero typography (`src/app/page.tsx`)

- Hero headline: Tailwind classes `text-[72px] font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent leading-none`
- Subheadline: `text-[20px] font-normal text-slate-300`

### 4C — Load Inter font (`src/app/layout.tsx`)

Add `Inter` via `next/font/google` if not already present:
```ts
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
// Apply inter.className to the <html> or <body> element
```

### 4D — Frosted nav (`src/app/layout.tsx`)

Find the `<nav>` or top-bar element. Apply:
```
className="... backdrop-blur-md bg-black/30 border-b border-white/10 fixed w-full top-0 z-50"
```
Add scroll-based fade-in: in a `useEffect`, listen for `scroll` event — once `window.scrollY >= 10`, add an `opacity-100` class (remove `opacity-0` initial state).

### 4E — CTA buttons (`src/app/page.tsx`)

Replace all flat primary CTA button classes with:
```
bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/40 transition-all
```

### 4F — Shiki code blocks + copy button (`src/app/page.tsx`)

1. Install `shiki` if not present (`npm install shiki`).
2. Replace bare `<pre>` tags in the hero/homepage code examples with shiki-highlighted blocks using `createHighlighter` (shiki v1 API) with `github-dark` theme. Use a server component or `useEffect` for async highlighting.
3. Add a copy button next to each code block:
   - On click: `navigator.clipboard.writeText(code)`, then briefly scale the button (`transform scale-110`) and swap the icon to a checkmark for 1.5s via `setTimeout`.
   - No external animation library — CSS transitions + `setTimeout`.

### 4G — Glassmorphism cards (arena tile + pricing card components)

Find the arena result tile component and pricing card component under `src/components/`. Apply to each component's root card element:
```
backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl
```
No logic changes — styling only.

---

## Task 5 — Item 3: New `/quickstart` Page

**New file:** `src/app/quickstart/page.tsx`

### Layout

- Page title: "Framework Quickstart Templates"
- Three tab buttons: **LangChain** | **CrewAI** | **AutoGen**
- Use `'use client'` + `useState` for active tab. No router.push needed.

### Per-tab content

Fetch snippets from `GET /api/v1/quickstart/<framework>` via `useEffect` + `fetch`, or inline the same strings as fallback.

Each tab panel shows:
1. **Install command** — copyable `<pre>` block with copy button (same micro-animation as Task 4F).
   - LangChain: `pip install langchain agentpick`
   - CrewAI: `pip install crewai agentpick`
   - AutoGen: `pip install pyautogen agentpick`

2. **Code snippet** — shiki-highlighted Python (≤15 lines, uses `AGENTPICK_API_KEY` env var).

3. **Two buttons:**
   - "Copy" — copies the full code snippet to clipboard.
   - "Run in Playground" — `<a href="/playground?framework=<name>&query=<example>">` as a styled button link.
     - LangChain: `/playground?framework=langchain&query=search+the+web+for+AI+news`
     - CrewAI: `/playground?framework=crewai&query=research+latest+LLM+benchmarks`
     - AutoGen: `/playground?framework=autogen&query=find+top+AI+tools+2025`

### Styling

- Tab panel container: `backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6`
- Active tab button: `bg-indigo-500/30 border border-indigo-400/40`
- Inactive tab button: `bg-white/5 border border-white/10`

---

## Task 6 — Item 3: "Works with your stack" Logo Strip (`src/app/page.tsx`)

Below the hero code block, add a horizontal strip:

```tsx
<section className="flex flex-col items-center gap-4 py-8">
  <p className="text-slate-400 text-sm uppercase tracking-widest">Works with your stack</p>
  <div className="flex flex-wrap justify-center gap-6">
    {[
      { label: 'LangChain', href: '/quickstart#langchain' },
      { label: 'CrewAI',    href: '/quickstart#crewai' },
      { label: 'AutoGen',   href: '/quickstart#autogen' },
      { label: 'OpenAI Agents SDK', href: '/quickstart#openai-agents' },
    ].map(({ label, href }) => (
      <a key={label} href={href}
         className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-all">
        {label}
      </a>
    ))}
  </div>
</section>
```

No new backend logic needed.

---

## Acceptance Criteria

- [ ] `src/components/Playground.tsx` — no flat `tool`/`results` on `PlaygroundResponse`; all usages updated to `meta.tool_used` / `data.results`.
- [ ] `/connect` page — response schema table present showing full `meta`/`data` shape; no flat key examples remain.
- [ ] `/connect` page — `ai_classification` null callout present near strategy selector AND near response schema table.
- [ ] No `/account/usage` or `/developer/usage` strings remain in frontend/component files.
- [ ] Hero gradient animates on load; headline is 72px gradient clip text; subheadline is `text-slate-300`.
- [ ] Fixed nav has `backdrop-blur-md bg-black/30`.
- [ ] Homepage code block is shiki-highlighted; copy button shows checkmark for 1.5s.
- [ ] Homepage sections stagger-reveal on scroll via `IntersectionObserver`.
- [ ] All feature cards, pricing cards, arena tiles show `backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl`.
- [ ] `/quickstart` page renders all three tabs with correct install commands, code snippets, and "Run in Playground" deep-links.
- [ ] "Works with your stack" logo strip appears below hero code block with four framework badges.
- [ ] Lighthouse performance ≥ 90 on mobile and desktop.
- [ ] All 51 existing QA checks remain green.

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] Cycle 2: P1-A/P1-B/P2 doc fixes, glassmorphism UI overhaul, /quickstart page, logo strip
```
