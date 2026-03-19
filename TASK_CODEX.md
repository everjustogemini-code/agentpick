# TASK_CODEX.md — cycle 21
**Agent:** Codex
**Date:** 2026-03-19
**QA baseline:** 55/56 — P1 open (handled by Claude Code)
**Source:** NEXT_VERSION.md Must-Have #2 + Must-Have #3 (frontend portion)
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## Task 1 — Major UI Upgrade: Glassmorphism design system

**Scope:** `globals.css`, homepage, `/connect`, `/dashboard`, `/products/[slug]` pages.

### 1a — Update Design Tokens

**File:** `src/app/globals.css`

Replace/extend CSS variables in `:root` with the new palette:

```css
:root {
  /* New glassmorphism palette */
  --bg-primary: #0A0E1A;          /* deep navy */
  --accent: #6366F1;              /* electric indigo */
  --accent-cyan: #22D3EE;         /* cyan highlight */

  /* Glass card recipe */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.15);
  --glass-blur: blur(12px);
  --glass-radius: 16px;
}
```

Add utility classes at the end of the file:

```css
.glass-card {
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.25);
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.5s ease forwards;
}

@keyframes hero-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.hero-shimmer {
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-cyan) 50%, var(--accent) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: hero-shimmer 3s linear infinite;
}
```

### 1b — Homepage

**File:** `src/app/page.tsx`

- Set `<body>` / root wrapper background to `var(--bg-primary)`.
- Hero heading: apply `hero-shimmer` class, font size ≥56px desktop (`text-[56px]` or `text-7xl`), `font-bold`, `font-[Inter]`.
- Any code snippets on the page: wrap in `<pre>` with `font-[JetBrains_Mono]` class and dark-theme background (`var(--bg-code)`), add a one-click copy `<button>` (use existing `CopyButton` component from `src/components/CopyButton.tsx` if present).
- Tool cards: add `glass-card` and `hover-lift` classes.
- Scroll-reveal sections: add `animate-fade-in-up` class.

### 1c — /connect page

**File:** `src/app/connect/page.tsx`

- Page background: `var(--bg-primary)`.
- Section headings: `font-bold`, Inter, ≥36px.
- Any cards or panels: add `glass-card` class.
- CTA buttons: `hover-lift` class + accent color `var(--accent)`.
- Note: the "Try it live" panel is added in Task 2 below — coordinate placement but do NOT duplicate the panel here.

### 1d — /dashboard page

**File:** `src/app/dashboard/page.tsx`

- Page background: `var(--bg-primary)`.
- Stat cards / metric cards: add `glass-card` + `hover-lift`.
- Section headings: Inter bold, appropriate sizing.

### 1e — /products/[slug] page

**File:** `src/app/products/[slug]/page.tsx`

- Page background: `var(--bg-primary)`.
- Product card / detail panel: `glass-card`.
- CTAs and action buttons: `hover-lift`.
- Any code examples: `font-[JetBrains_Mono]`, dark background, copy button via `CopyButton` component.

### Typography font loading

**File:** `src/app/layout.tsx` (or wherever `<head>` / `<font>` config lives)

Add Google Fonts link for Inter + JetBrains Mono (self-hosted via `next/font` preferred):
```typescript
import { Inter, JetBrains_Mono } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
```
Apply `inter.variable` and `jetbrainsMono.variable` to the root `<html>` element.

### Acceptance
- `--bg-primary: #0A0E1A` active across all four pages
- Glass cards visible on homepage, /connect, /dashboard, /products/[slug]
- Hero shimmer animation plays on homepage
- All existing QA page/content checks pass (no content removed)
- Lighthouse perf ≥85

---

## Task 2 — New Feature Frontend: "Try it live" console on /connect

**File:** `src/app/connect/page.tsx`

Add the following UI below the existing code snippet section. Use vanilla fetch only — no new libraries.

### 2a — Tabbed language snippet block

Three tabs: **Python**, **Node.js**, **cURL**. Each tab shows a pre-filled one-liner calling `POST /api/v1/router/search` with `YOUR_API_KEY` placeholder. Add a `CopyButton` (from `src/components/CopyButton.tsx`) per tab.

Example Python snippet content:
```python
import anthropic_agentpick as ap
result = ap.router.search("YOUR_API_KEY", query="best embedding model", capability="embed")
```
(Adjust to match actual SDK/curl patterns documented in the codebase.)

### 2b — "Try it live" inline panel

Below the tabs, render a panel (apply `glass-card` class) containing:

1. **Text input** — placeholder `"Ask anything, e.g. best embedding model 2025"`
2. **Capability dropdown** — options: `search`, `embed`, `crawl`
3. **"Run" button** — on click, call `POST /api/v1/router/search` with:
   ```json
   {
     "query": "<user input>",
     "capability": "<selected>",
     "api_key": "<value of NEXT_PUBLIC_DEMO_API_KEY env var>"
   }
   ```
   Use `process.env.NEXT_PUBLIC_DEMO_API_KEY` as the key value (read from env at build time).
4. **Response panel** — render the returned JSON pretty-printed inside a `<pre>` block with `font-[JetBrains_Mono]`.
5. **Error handling** — if the API returns 429, display: `"Demo limit reached — get your own key to continue"` (do NOT show the raw JSON error).
6. **Inline CTA** — after any successful response, show: `"Get your own key →"` linking to `/connect#register`.

### Acceptance
- All three language tabs render correct, copyable code
- "Try it live" panel returns real API JSON within 5 s on a typical connection
- Demo key rate limit (enforced by Claude Code's backend task) returns friendly message on exceed
- /connect QA suite 7/7 still passes

---

## Files This Task Owns (exhaustive)

| File | Action |
|------|--------|
| `src/app/globals.css` | Add glass-card, hover-lift, animation utilities + new CSS vars |
| `src/app/layout.tsx` | Add Inter + JetBrains Mono font loading |
| `src/app/page.tsx` | Apply glassmorphism classes, hero shimmer |
| `src/app/connect/page.tsx` | Apply glassmorphism + add "Try it live" panel + tabbed snippets |
| `src/app/dashboard/page.tsx` | Apply glassmorphism classes |
| `src/app/products/[slug]/page.tsx` | Apply glassmorphism classes |

**Do NOT touch:** `src/lib/router/index.ts`, `src/app/api/v1/router/route.ts`, `/Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py`, or any file under `src/app/api/`.

---

## Coverage: Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1a — Router `best_performance` branch capability filter | **TASK_CLAUDE_CODE.md** |
| Must-Have #1b — QA script `voyage-ai` → `voyage-embed` | **TASK_CLAUDE_CODE.md** |
| Must-Have #2 — Glassmorphism UI upgrade | **This file** |
| Must-Have #3 backend — Demo key + IP rate limiting | **TASK_CLAUDE_CODE.md** |
| Must-Have #3 frontend — "Try it live" panel on /connect | **This file** |

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] Cycle 21: glassmorphism design system + Try it live console on /connect
```
