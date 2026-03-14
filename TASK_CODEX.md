# TASK_CODEX.md — v0.next (2026-03-14)

**Agent:** Codex
**Theme:** CSS design system, hero upgrade, micro-interactions, two API bug fixes
**Do NOT touch:** `src/app/playground/page.tsx`, `src/components/PlaygroundRequestBuilder.tsx`, `src/components/PlaygroundResponsePanel.tsx`, `src/components/ScoreRing.tsx`, `src/components/AnimatedCounter.tsx`, `src/components/SiteHeader.tsx`, `src/app/api/v1/router/usage/route.ts`, `src/app/benchmarks/page.tsx`, `src/app/benchmarks/[task]/page.tsx`, `src/app/dashboard/[slug]/page.tsx`

---

## Task 1 — Design System: `src/app/globals.css`

Add the following CSS at the end of `globals.css`. Do NOT remove or modify any existing rules.

### A. Glassmorphism card

```css
.card-glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
```

### B. Interactive card micro-interactions

```css
.card-interactive {
  position: relative;
  overflow: hidden;
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
}
.card-interactive:active {
  transform: translateY(-1px);
}
.card-interactive::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: #2563EB;
  transition: width 200ms ease;
}
.card-interactive:hover::after {
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .card-interactive {
    transition: none;
  }
  .card-interactive:hover {
    transform: none;
  }
  .card-interactive::after {
    transition: none;
  }
}
```

### C. CSS custom properties for shadows

```css
:root {
  --shadow-hover: 0 16px 48px rgba(0, 0, 0, 0.12);
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.08);
}
```

### D. Fade-in animation (used by PlaygroundResponsePanel)

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 250ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .animate-fadeIn {
    animation: none;
  }
}
```

### E. Gradient mesh background utility

```css
.bg-gradient-mesh {
  background:
    radial-gradient(ellipse 80% 50% at 20% -10%, rgba(37, 99, 235, 0.12) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99, 102, 241, 0.10) 0%, transparent 55%),
    #FAFAFA;
}
```

---

## Task 2 — Hero upgrade: `src/app/page.tsx`

Read the file first. Make these changes only — do not alter any other sections.

### 2a. Hero background

Find the hero section's outermost wrapper div (look for `bg-\[#FAFAFA\]` or a plain light background class on the hero).

Replace that background with `bg-gradient-mesh` (the utility class added in globals.css above). If the element uses inline Tailwind arbitrary bg values, switch to the class.

If the hero wrapper has `className="... bg-[#FAFAFA] ..."`, change it to `className="... bg-gradient-mesh ..."`.

### 2b. Hero headline typography

Find the `<h1>` inside the hero section. Apply:
- `style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}`
- Remove any conflicting Tailwind text-size classes (`text-4xl`, `text-5xl`, `text-6xl`, etc.) from the h1's className. Keep all other classes.

### 2c. Hero subheadline typography

Find the `<p>` or subtitle element directly below the `<h1>` in the hero.
- Ensure it has: `text-[#525252]` (or `text-neutral-600`), `text-xl` (≈1.25rem), `leading-relaxed` (line-height 1.6)
- Font weight: 400 (remove any `font-medium` or `font-semibold` if present on this element)

---

## Task 3 — Apply `.card-glass` to pricing, strategy, and competitive position cards

You need to find and update 3 sets of card components. Read each file before editing.

### 3a. Pricing cards

Grep for "pricing" in `src/components/` and `src/app/` to find the pricing card component.
- Likely file: `src/components/PricingCard.tsx` or similar.
- Find the root card `<div>` with its border/background classes.
- Add `card-glass` to its className. Keep all existing classes.
- Also add `card-interactive` to the same element for hover lift.

### 3b. Strategy cards

Grep for "strategy" in `src/components/` to find the strategy card component.
- Likely file: `src/components/StrategyCard.tsx` or similar.
- Find the root card `<div>`.
- Add `card-glass card-interactive` to its className.

### 3c. Competitive position card on `/dashboard/[slug]`

This card was recently added (part of feat/competitive-snapshot merge). Do NOT modify `src/app/dashboard/[slug]/page.tsx` — that file is owned by Claude Code.

Instead, look for a dedicated component: `src/components/CompetitivePositionCard.tsx` or similar.
- Add `card-glass card-interactive` to the root card div's className.

### 3d. Benchmark score cards

Grep for benchmark-related card components in `src/components/`.
- Likely file: `src/components/BenchmarkCard.tsx` or `src/components/BenchmarkResultCard.tsx`.
- Add `card-glass card-interactive` to the root card div's className.

---

## Task 4 — Bug Fix A: Crawl endpoint accepts flat `{url}` shape

Modify: `src/app/api/v1/route/crawl/route.ts`

Read the file first. Find the Zod schema that validates the request body.

**Current:** requires `{ params: { url: "..." } }` — flat `{ url: "..." }` returns 400.

**Fix:** Replace the current body schema with a union that accepts both shapes, then normalize:

```ts
import { z } from 'zod'

const CrawlBody = z.union([
  z.object({ params: z.object({ url: z.string().url() }) }),
  z.object({ url: z.string().url() })
])

// After parsing:
const parsed = CrawlBody.parse(body)
const url = 'params' in parsed ? parsed.params.url : parsed.url
```

- Do not change any other logic in the handler — only the schema definition and the URL extraction line.
- If the file already has `const url = body.params.url` or similar, replace it with the normalized form above.

---

## Task 5 — Bug Fix B: Priority endpoint normalizes `tools`/`priority_tools`/`search`

Modify: `src/app/api/v1/router/priority/route.ts`

Read the file first. Find where `tools` or `priority_tools` is read from the request body.

**Current:** Only reads `body.tools` or `body.priority_tools`, so `{ "search": [...] }` returns 400.

**Fix:** At the entry of the handler (before any validation of the tools array), add:

```ts
const tools = body.tools ?? body.priority_tools ?? body.search
if (!tools?.length) {
  return NextResponse.json(
    { error: 'VALIDATION_ERROR', message: 'Provide tools or priority_tools' },
    { status: 400 }
  )
}
```

Then use `tools` everywhere the handler previously used `body.tools` or `body.priority_tools`.

- Do not change any other logic — only the field normalization at the top of the handler.
- Match the existing error response format (check how other validation errors are returned in this file).

---

## Acceptance Criteria

- `globals.css` compiles without errors — no broken CSS syntax
- `.card-glass` produces visible blur/glass effect against a gradient background
- `.card-interactive` produces a 4px lift on hover with blue underline sweep
- All animations include `prefers-reduced-motion: reduce` override (no motion)
- Hero headline renders at ≥ 48px on desktop, responsive via clamp
- `POST /api/v1/route/crawl` with `{ "url": "https://example.com" }` returns 200 (no 400)
- `POST /api/v1/router/priority` with `{ "search": [...] }` routes correctly (no 400)
- No existing passing tests regress
