# TASK_CODEX.md — Cycle 11
**Agent:** Codex (frontend / components / styling)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md Cycle 11 — Must-Have Items 2 & 3 (frontend portion)

---

## Coverage Summary

| Item | Task | Owner |
|------|------|-------|
| Must-Have Item 2 | Glassmorphism UI overhaul (hero, nav, cards, typography, animations) | **CODEX** |
| Must-Have Item 3 | New `/quickstart` page + homepage logo strip | **CODEX** |

---

## Files Owned by This Agent

| Action | File |
|--------|------|
| **MODIFY** | `src/app/page.tsx` |
| **MODIFY** | `src/app/globals.css` |
| **MODIFY** | `src/app/layout.tsx` |
| **MODIFY** | Arena result tile component (find under `src/components/`) |
| **MODIFY** | Pricing card component (find under `src/components/`) |
| **CREATE** | `src/app/quickstart/page.tsx` |

> **DO NOT TOUCH** any file listed in TASK_CLAUDE_CODE.md.
> Specifically: `src/app/api/v1/quickstart/[framework]/route.ts` and any
> file under `src/app/api/`.

---

## Task 1 — Glassmorphism UI Overhaul (`src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`)

### 1A — Hero section (`src/app/page.tsx`)

- Replace flat dark background with animated gradient mesh using CSS `@keyframes`.
  Gradient: indigo → violet → slate.
- Add subtle dot/grid overlay via:
  `background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`
- Hero headline: `text-[72px] font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent`
- Subheadline: `text-[20px] font-normal text-slate-300`
- Load `Inter` via `next/font/google` in `src/app/layout.tsx` (add if not present).

### 1B — CTA buttons (`src/app/page.tsx`)

Replace all flat primary buttons with:
```
bg-gradient-to-r from-indigo-500 to-violet-600
hover:shadow-lg hover:shadow-indigo-500/40
transition-all
```

### 1C — Homepage code block (`src/app/page.tsx`)

- Replace bare `<pre>` with a `shiki`-highlighted block.
  - Add `shiki` dependency if absent (`npm install shiki`).
  - Use `createHighlighter` (shiki v1 API) with `github-dark` theme.
- Add a copy-button next to the code block:
  - On click: scale up briefly (CSS transform scale) + swap icon to checkmark for 1.5 s.
  - No external animation library — pure CSS transitions + `setTimeout`.

### 1D — Scroll animations (`src/app/globals.css` + `src/app/page.tsx`)

In `globals.css`, add:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
}
```

In `page.tsx`, add an `IntersectionObserver` (vanilla JS via `useEffect`) that
adds the `fade-in-up` class to each homepage section element as it enters the viewport.
Stagger delay: `0.1s * sectionIndex`.

### 1E — Frosted nav (`src/app/layout.tsx`)

Apply to the `<nav>` (or equivalent top-bar element):
```
backdrop-blur-md bg-black/30 border-b border-white/10 fixed w-full top-0 z-50
```
Add fade-in-on-scroll via `IntersectionObserver` (or detect scroll offset ≥ 10px
with a `scroll` event listener in a `useEffect`).

---

## Task 2 — Glassmorphism Cards (Arena tiles + Pricing cards)

Find the arena result tile component and the pricing card component under `src/components/`.

Apply to **both** component root elements:
```
backdrop-filter: blur(12px)   /* via Tailwind: backdrop-blur-xl */
bg-white/5 border border-white/10 rounded-2xl
```

No logic changes — styling only.

---

## Task 3 — Quickstart Page (`src/app/quickstart/page.tsx`) — NEW FILE

Create a new Next.js page at `/quickstart`.

### Layout

Three tab-panels: **LangChain** | **CrewAI** | **AutoGen**

Use client-side tab state (`useState`). No router push needed.

### Each tab panel contains

1. **Install command** (copyable `<pre>` block with copy button — reuse copy-button pattern from Task 1C)
   - LangChain: `pip install langchain agentpick`
   - CrewAI: `pip install crewai agentpick`
   - AutoGen: `pip install pyautogen agentpick`

2. **Code snippet** — shiki-highlighted, ≤15 lines of Python showing `AGENTPICK_API_KEY` usage.
   Fetch the snippet from `GET /api/v1/quickstart/<framework>` (the route Claude Code creates)
   using `useEffect` + `fetch`, or inline the same strings statically.

3. **Two buttons:**
   - "Copy" — copies the code snippet to clipboard.
   - "Run in Playground" — links to the `playgroundUrl` from the API response:
     - LangChain: `/playground?framework=langchain&query=search+the+web+for+AI+news`
     - CrewAI: `/playground?framework=crewai&query=research+latest+LLM+benchmarks`
     - AutoGen: `/playground?framework=autogen&query=find+top+AI+tools+2025`

### Styling

Apply glassmorphism card style to each tab panel container (consistent with Task 2).
Tab buttons: active tab → `bg-indigo-500/30 border border-indigo-400/40`, inactive → `bg-white/5`.

---

## Task 4 — Homepage "Works with your stack" logo strip (`src/app/page.tsx`)

Below the hero code block, add a horizontal logo strip with four items:
**LangChain** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK**

- Use text badges (or simple SVG/PNG if assets exist in `public/`; otherwise text is fine).
- Each badge links to `/quickstart#langchain`, `/quickstart#crewai`, `/quickstart#autogen`,
  and `/quickstart#openai-agents` respectively.
- No new backend logic. Section label: `Works with your stack` in `text-slate-400 text-sm uppercase tracking-widest`.

---

## Acceptance criteria

- [ ] Hero gradient animates on load (CSS `@keyframes` running).
- [ ] Hero headline is 72px / weight 800 / gradient text clip visible.
- [ ] All feature cards, pricing cards, and arena tiles show `backdrop-blur` + `bg-white/5 border border-white/10 rounded-2xl`.
- [ ] Fixed nav is frosted (`backdrop-blur-md bg-black/30`).
- [ ] Homepage code block is shiki-highlighted; copy button works with checkmark swap.
- [ ] Homepage sections stagger-reveal on scroll via `IntersectionObserver`.
- [ ] `/quickstart` renders all three framework tabs with correct install commands and code snippets.
- [ ] "Run in Playground" buttons deep-link to `/playground?framework=<name>&query=<example>`.
- [ ] Logo strip appears below hero code block; each logo links to the correct `/quickstart#` anchor.
- [ ] Lighthouse performance ≥ 90 on mobile and desktop.
- [ ] All 51 existing QA checks remain green.

---

## Progress log

After completing these tasks, append one line to
`/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:

```
[<ISO timestamp>] [CODEX] [done] Cycle 11: glassmorphism UI overhaul + /quickstart page + logo strip
```
