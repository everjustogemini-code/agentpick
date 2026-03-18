# TASK_CODEX.md — Cycle 3
**Agent:** Codex (frontend / components / styling / docs)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md Cycle 3

---

## Coverage Summary

| NEXT_VERSION.md Item | Task | Files |
|---|---|---|
| P1-A — Update API reference on `/connect` | Show canonical `calls`/`cost_usd` field names in reference table | `src/app/connect/page.tsx` |
| P1-B — Document `ai_classification` null behavior | Add callout on strategy selector + API reference | `src/app/connect/page.tsx` |
| Item 2 — Glassmorphism + Motion UI overhaul | Hero gradient, typography, glassmorphism cards, frosted nav, shiki code blocks, CTA buttons, scroll animations, mobile marquee fix | `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, arena tile component, pricing card component |
| Item 3 — `/quickstart` page + logo strip | New quickstart page with three tabs; logo strip on homepage | `src/app/quickstart/page.tsx` (new), `src/app/page.tsx` |

---

## Files Owned by This Agent (Claude Code must NOT touch these)

| Action | File |
|---|---|
| **MODIFY** | `src/app/connect/page.tsx` |
| **MODIFY** | `src/app/page.tsx` |
| **MODIFY** | `src/app/globals.css` |
| **MODIFY** | `src/app/layout.tsx` |
| **MODIFY** | Arena result tile component (find under `src/components/` — grep for "arena" or "ArenaResult") |
| **MODIFY** | Pricing card component (find under `src/components/` — grep for "PricingCard" or "pricing") |
| **CREATE** | `src/app/quickstart/page.tsx` |

> **DO NOT TOUCH** any file listed in TASK_CLAUDE_CODE.md:
> `src/app/api/v1/router/usage/route.ts`, `agentpick-router-qa.py`,
> `src/app/api/v1/account/route.ts`, `src/app/api/v1/quickstart/[framework]/route.ts`,
> or any other file under `src/app/api/`.

---

## Task 1 — P1-A (Frontend): Update API reference table on `/connect` to show `calls` and `cost_usd`

**File:** `src/app/connect/page.tsx`

**Problem:** The API reference table on `/connect` shows the old field names. The documented contract now exposes top-level `calls` and `cost_usd` as canonical fields.

**Actions:**
1. Read the file. Find the API reference table in the usage/response section.
2. Ensure the table lists `calls` and `cost_usd` as the **canonical** (primary) field names. Example rows to add or update:

```
| calls        | integer | Total calls made this period (canonical) |
| cost_usd     | float   | Total cost in USD this period (canonical) |
```

3. If the table only shows `callsThisMonth` / `stats.totalCostUsd`, add `calls` and `cost_usd` rows above them with a note that the others are kept for backwards compatibility.
4. Do not remove any existing documentation rows.

**Done when:** `/connect` API reference table clearly shows `calls` (int) and `cost_usd` (float) as top-level fields.

---

## Task 2 — P1-B: Document `ai_classification` null behavior on `/connect`

**File:** `src/app/connect/page.tsx` (coordinate edits with Task 1 — same file)

**Problem:** `meta.ai_classification` is `null` when strategy is `balanced`, `best_performance`, or `cheapest`. This is undocumented. Clients calling `.toLowerCase()` on the value crash.

**Actions:**
1. Find the strategy selector section (where `auto`, `balanced`, `best_performance`, `cheapest` are described).
2. Add an inline callout immediately below the strategy options list:

```
> **Note:** `meta.ai_classification` is only populated when `strategy=auto`.
> For all other strategies (`balanced`, `best_performance`, `cheapest`) the field is `null`.
```

3. Also add this callout near the response schema / API reference table (near the `meta.ai_classification` row if one exists, or add a row for it).

**Done when:** Both the strategy selector UI section and the API reference table on `/connect` explicitly document that `ai_classification` is `null` for non-`auto` strategies.

---

## Task 3 — Item 2: Glassmorphism + Motion Design System

### 3A — Animated hero gradient (`src/app/globals.css` + `src/app/page.tsx`)

In `src/app/globals.css`, add:

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

In `src/app/page.tsx`:
- Apply `hero-gradient` and `hero-dot-overlay` CSS classes to the hero section wrapper `<div>`.
- Add a `useEffect` with `IntersectionObserver` that, on entry, adds `fade-in-up` class to each `<section>` element, with a stagger delay of `0.1s * index` applied via `style.animationDelay`.

### 3B — Hero typography (`src/app/page.tsx`)

- Hero headline element: add Tailwind classes `text-[72px] font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent leading-none`.
- Subheadline element: add `text-[20px] font-normal text-slate-300 leading-[1.65]`.

### 3C — Load Inter font (`src/app/layout.tsx`)

Read the file first. If `Inter` from `next/font/google` is not already imported:

```ts
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```

Apply `inter.className` to the `<html>` or `<body>` element.

### 3D — Frosted glass fixed nav (`src/app/layout.tsx`)

Find the `<nav>` or top navigation bar element. Replace or extend its className:

```
backdrop-blur-md bg-black/30 border-b border-white/10 fixed w-full top-0 z-50
```

Add scroll-based fade-in via `useEffect`:
- Set initial style `opacity: 0` on the nav (or a wrapper).
- Listen for `window` `scroll` event; once `window.scrollY >= 40`, set `opacity: 1` (CSS transition `transition-opacity duration-300`).
- Add `'use client'` directive to `layout.tsx` if not already present, or extract the nav into a separate `'use client'` component.

### 3E — CTA button gradient (`src/app/page.tsx`)

Find all primary CTA `<button>` or `<a>` elements with a solid dark/green background. Replace their bg classes with:

```
bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/40 transition-all
```

### 3F — Shiki code blocks + copy button (`src/app/page.tsx`)

1. Check if `shiki` is already a dependency. If not, add it: the implementation should use dynamic `import('shiki')` or a server component to avoid bundle bloat.
2. For each bare `<pre>` tag in the hero/homepage code examples, replace with a shiki-highlighted block using the `github-dark` theme.
3. Add a copy button next to each highlighted block:
   - On click: `navigator.clipboard.writeText(codeString)`.
   - For 1.5s after click: scale button with `transform scale-110` (CSS transition) and swap icon to a checkmark via `useState`. Revert after `setTimeout(reset, 1500)`.
   - No external animation library.

### 3G — Glassmorphism cards (arena tile + pricing card components)

1. Grep `src/components/` for the arena result tile component (likely named `ArenaResult`, `ArenaTile`, or similar).
2. Grep `src/components/` for the pricing card component (likely named `PricingCard`, `PriceCard`, or similar).
3. On the root card `<div>` of each component, replace solid background classes with:

```
backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl
```

Styling only — no logic changes.

### 3H — Mobile marquee fix (`src/app/page.tsx` or relevant marquee component)

The marquee overflows on viewports < 640px. Find the marquee item elements and add:

```
whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis sm:max-w-none
```

This constrains items to 160px with ellipsis on mobile, removes the constraint on `sm` (≥640px) and above.

---

## Task 4 — Item 3: New `/quickstart` Page

**New file:** `src/app/quickstart/page.tsx`

### Structure

```tsx
'use client';
import { useState } from 'react';

const FRAMEWORKS = ['langchain', 'crewai', 'autogen'] as const;

// Hard-code the same payload as the API route (no fetch needed, avoids loading state)
const SNIPPETS = {
  langchain: {
    installCmd: 'pip install langchain agentpick',
    codeSnippet: `import os\nfrom langchain_openai import ChatOpenAI\n\nllm = ChatOpenAI(\n    base_url="https://agentpick.dev/v1",\n    api_key=os.environ["AGENTPICK_API_KEY"],\n    model="auto",\n)\nresponse = llm.invoke("Search the web for AI news")\nprint(response.content)`,
    playgroundUrl: '/playground?framework=langchain&query=search+the+web+for+AI+news',
  },
  crewai: {
    installCmd: 'pip install crewai agentpick',
    codeSnippet: `import os\nfrom crewai import Agent, Task, Crew, LLM\n\nllm = LLM(\n    model="openai/auto",\n    base_url="https://agentpick.dev/v1",\n    api_key=os.environ["AGENTPICK_API_KEY"],\n)\nresearcher = Agent(role="Researcher", goal="Find information",\n                   llm=llm, backstory="Expert researcher")\ntask = Task(description="Research latest LLM benchmarks",\n            agent=researcher, expected_output="Summary")\ncrew = Crew(agents=[researcher], tasks=[task])\nresult = crew.kickoff()`,
    playgroundUrl: '/playground?framework=crewai&query=research+latest+LLM+benchmarks',
  },
  autogen: {
    installCmd: 'pip install pyautogen agentpick',
    codeSnippet: `import os\nfrom autogen import AssistantAgent\n\nconfig_list = [{\n    "model": "auto",\n    "base_url": "https://agentpick.dev/v1",\n    "api_key": os.environ["AGENTPICK_API_KEY"],\n}]\nassistant = AssistantAgent(\n    name="assistant",\n    llm_config={"config_list": config_list},\n)\nassistant.initiate_chat(assistant,\n    message="Find top AI tools 2025", max_turns=1)`,
    playgroundUrl: '/playground?framework=autogen&query=find+top+AI+tools+2025',
  },
};
```

### Tab layout

- Three tab buttons: **LangChain** | **CrewAI** | **AutoGen**
- Active tab: `bg-indigo-500/30 border border-indigo-400/40`
- Inactive tab: `bg-white/5 border border-white/10`

### Per-tab panel content

1. **Install command** — styled `<pre>` with a copy button (same scale+checkmark micro-animation: `useState`, `setTimeout(reset, 1500)`).
2. **Code snippet** — `<pre>` with syntax-highlighted code (shiki or `<code className="language-python">` styled block). Copy button.
3. **Two action buttons:**
   - "Copy" — copies full code snippet.
   - "Run in Playground" — `<a href={snippet.playgroundUrl}>` styled as a button.
     `bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/40 transition-all`

### Panel container styling

```
backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6
```

### Page title

```tsx
<h1 className="text-4xl font-bold text-white mb-2">Framework Quickstart</h1>
<p className="text-slate-400 mb-8">30-second integration with LangChain, CrewAI, and AutoGen</p>
```

---

## Task 5 — Item 3: "Works with your stack" Logo Strip (`src/app/page.tsx`)

Below the hero code block, add a static section — no backend logic required:

```tsx
<section className="flex flex-col items-center gap-4 py-8">
  <p className="text-slate-400 text-sm uppercase tracking-widest">Works with your stack</p>
  <div className="flex flex-wrap justify-center gap-6">
    {[
      { label: 'LangChain',        href: '/quickstart#langchain' },
      { label: 'CrewAI',           href: '/quickstart#crewai' },
      { label: 'AutoGen',          href: '/quickstart#autogen' },
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

Place it immediately after the hero code block, before the features section.

---

## Acceptance Criteria

- [ ] `/connect` — API reference table shows `calls` (int) and `cost_usd` (float) as canonical top-level fields
- [ ] `/connect` — `ai_classification` null callout present in strategy selector section
- [ ] `/connect` — `ai_classification` null callout present near API reference table
- [ ] `src/app/page.tsx` — hero section has animated indigo→violet→slate gradient (`gradientShift` keyframes)
- [ ] `src/app/page.tsx` — hero headline is 72px / weight 800 / gradient clip text (indigo-400 → violet-400)
- [ ] `src/app/page.tsx` — subheadline is 20px / `text-slate-300` / line-height 1.65
- [ ] `src/app/layout.tsx` — Inter font loaded via `next/font`
- [ ] `src/app/layout.tsx` — nav has `backdrop-blur-md bg-black/30`; fades in at scroll offset 40px
- [ ] `src/app/page.tsx` — primary CTA buttons use indigo→violet gradient with glow on hover
- [ ] `src/app/page.tsx` — homepage code examples are shiki-highlighted; copy button shows checkmark for 1.5s
- [ ] `src/app/page.tsx` — sections stagger-reveal on scroll via `IntersectionObserver`
- [ ] Arena tile component — root card has `backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl`
- [ ] Pricing card component — root card has `backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl`
- [ ] Marquee items: `max-w-[160px]` with ellipsis on mobile; unconstrained on sm+
- [ ] `/quickstart` renders all three tabs with correct install commands, code snippets, and "Run in Playground" deep-links
- [ ] "Works with your stack" strip with four badges appears below hero code block
- [ ] Lighthouse performance ≥ 90 on mobile and desktop
- [ ] All 51 existing QA checks remain green
- [ ] Zero files from TASK_CLAUDE_CODE.md were modified

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] Cycle 3: /connect P1-A/P1-B docs, glassmorphism UI overhaul, mobile marquee fix, /quickstart page + logo strip
```
