# TASK_CODEX.md
**Agent:** Codex (frontend)
**Branch:** feat/cycle-2-codex
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #2 (UI Upgrade) + Must-Have #3 (permalink page)

---

## Must-Have #2 — Major UI Upgrade: Glassmorphism, Motion, Typography

**Constraint:** Zero new npm packages. Pure CSS / Tailwind / `next/font/google` only. All motion gated behind `@media (prefers-reduced-motion: no-preference)`.

---

### File 1: `src/app/layout.tsx` — MODIFY
- Import `JetBrains_Mono` from `next/font/google` alongside the existing Inter import.
- Apply `jetbrainsMono.variable` as a CSS variable (e.g., `--font-mono`) on the `<body>` or `<html>` tag.
- This is the single source of truth for `font-mono` across all pages.

---

### File 2: `src/app/globals.css` — MODIFY
Add the following CSS to the existing file (do not remove existing rules):

**Animated radial gradient mesh background:**
```css
@keyframes mesh-drift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.mesh-bg {
  background: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.10) 0%, transparent 60%);
  background-size: 200% 200%;
  animation: mesh-drift 20s ease infinite;
}
@media (prefers-reduced-motion: reduce) {
  .mesh-bg { animation: none; }
}
```

**Glass card mixin:**
```css
.glass-card {
  backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.20);
}
```

**CTA glow pulse:**
```css
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 16px rgba(99,102,241,0.3); }
  50%       { box-shadow: 0 0 32px rgba(99,102,241,0.6); }
}
.btn-glow:hover {
  animation: glow-pulse 1.5s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .btn-glow:hover { animation: none; }
}
```

**Live pulse dot (nav):**
```css
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(1.4); }
}
.live-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: live-pulse 2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .live-dot { animation: none; }
}
```

**Gradient score bars:**
```css
.score-bar-fill {
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%);
}
```

**Section gradient divider:**
```css
.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  border: none;
  margin: 0;
}
```

**font-mono enforcement:**
```css
code, pre, .font-mono {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}
```

---

### File 3: `src/components/SiteHeader.tsx` — MODIFY
- Add `backdrop-filter: blur(12px)` + `background: rgba(10,10,10,0.75)` to the nav bar (apply via inline style or a Tailwind utility class when scrolled — use a `useEffect` + `scroll` listener to toggle a class).
- Add `.live-dot` span immediately after the logo text/image.
- For each nav link, detect if `pathname === href` (use `usePathname` from `next/navigation`) and add a `border-b-2 border-accent` underline when active.
- Mobile hamburger: add `transition-transform rotate-90` class when menu is open.

---

### File 4: `src/app/page.tsx` — MODIFY

**Hero h1 gradient:**
- Wrap h1 content in a `<span>` with `style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}`.
- Apply `clamp(2.5rem, 6vw, 4.5rem)` font size.

**Animated mesh background:**
- Add `className="mesh-bg"` to the outermost page wrapper `<div>`.

**Hero stat counters (count-up animation):**
- Locate the agent count and "calls routed" stat elements (currently static numbers in the StatsBar or hero section).
- Import the existing `src/components/AnimatedCounter.tsx` component (it already exists) and replace the static numbers with `<AnimatedCounter target={N} duration={800} />`.
- The component should trigger only when the element enters the viewport using `IntersectionObserver`.
  - Check `src/components/AnimatedCounter.tsx` first — if it already uses `IntersectionObserver`, just swap in the component. If not, add `IntersectionObserver` logic to `AnimatedCounter.tsx` (see File 5).

**CTA "Get API Key" button:**
- Add `btn-glow` class to the primary CTA button.

**`pip install` snippet one-click copy:**
- Locate the `pip install agentpick` code block in the CTA section.
- Import the existing `src/components/CopyButton.tsx` and wrap or place it adjacent to the code block.
- Verify `CopyButton.tsx` shows "Copied! ✓" fade tooltip (see File 6 if not).

**Section dividers:**
- Add `<hr className="section-divider" />` between major sections (hero → features → leaderboard → CTA).

---

### File 5: `src/components/AnimatedCounter.tsx` — MODIFY (if needed)
- Read the file first. If `IntersectionObserver` is already implemented, no change needed.
- If not: wrap the count-up in a `useEffect` that starts only when the element is visible:
```tsx
const ref = useRef<HTMLSpanElement>(null)
useEffect(() => {
  const el = ref.current
  if (!el) return
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { /* start count-up */ observer.disconnect() }
  }, { threshold: 0.5 })
  observer.observe(el)
  return () => observer.disconnect()
}, [])
```

---

### File 6: `src/components/CopyButton.tsx` — MODIFY (if needed)
- Read the file first. If it already shows a "Copied! ✓" fade tooltip, no change needed.
- If not: add state `copied` that sets to `true` on click, resets after 2000ms. Render a `<span>` tooltip with `opacity-0 transition-opacity` that becomes `opacity-100` when `copied === true`.

---

### File 7: `src/components/HowItWorks.tsx` — MODIFY
- Each step card: add `hover:scale-[1.02] transition-transform` and a brighter border on hover.
- Step number badges: step 1 → blue (`#3b82f6`), step 2 → purple (`#8b5cf6`), step 3 → green (`#22c55e`) — apply via inline `style` or per-index Tailwind classes.
- Add CSS `border-left: 2px dotted rgba(255,255,255,0.2)` connecting steps vertically (add a wrapper `<div>` with `relative` and pseudo-element, or a simple `<div className="border-l-2 border-dashed border-white/20 ml-4">` between steps).

---

### File 8: `src/components/PricingSection.tsx` — MODIFY
- All pricing tier cards: add `glass-card` className (defined in `globals.css`).
- Ensure `transition-transform` and hover lift are active.

---

### File 9: `src/app/benchmarks/page.tsx` — MODIFY
- Domain cards: add relevant emoji prefix per domain category (e.g., finance → 💹, news → 📰, code → 💻, general → 🔍).
- Score bars: replace any solid-color progress bar fills with `score-bar-fill` class (gradient defined in `globals.css`).
- Latency values: apply color coding — `< 500ms` → green, `500–1500ms` → yellow, `> 1500ms` → red — via conditional Tailwind classes.

---

## Must-Have #3 — Shareable Benchmark Permalink Page

### File 10: `src/app/b/[runId]/page.tsx` — CREATE NEW FILE

**What already exists (do NOT recreate):**
- `src/app/b/[runId]/badge.svg/route.ts` — badge SVG endpoint ✅
- `src/app/b/[runId]/opengraph-image.tsx` — OG card ✅
- `src/app/api/v1/benchmarks/[runId]/public/route.ts` — sanitized JSON API ✅

**What to build:** The ISR permalink page at `/b/[runId]`.

**Requirements:**
- `export const revalidate = 3600` (ISR, 1-hour revalidation).
- Server component: fetch `GET /api/v1/benchmarks/${runId}/public` at build/revalidate time.
- If run not found: render a "Benchmark not found" page (HTTP 404 via `notFound()`).
- Page sections:
  1. **Header:** "AgentPick Benchmark" title + query string displayed prominently.
  2. **Results table:** side-by-side columns per tool showing: tool name, latency (ms), result count, relevance score (%), success badge.
  3. **Winner callout:** highlight the winning tool with a green border / badge.
  4. **"Reproduce this benchmark" CTA:** pre-filled Python snippet and curl command using the run's domain + query.
  5. **Badge copy section:** show the markdown badge embed code in a copyable code block using `src/components/CopyButton.tsx`.
  6. **Footer link:** "Run your own benchmark →" linking to `/playground`.
- Apply `glass-card` class to result cards.
- Add `<title>` and `<meta>` via `generateMetadata` — title: `"Benchmark: {query} — AgentPick"`.

**Data shape from `/api/v1/benchmarks/[runId]/public`:**
```ts
{
  id: string
  query: string
  domain: string
  tools: { name: string|null, latencyMs: number|null, resultCount: number|null, relevanceScore: number|null, success: boolean }[]
  winningTool: string|null
  createdAt: string
}
```

---

## Files — CODEX Exclusively (Claude Code must NOT touch these)

| File | Action |
|------|--------|
| `src/app/layout.tsx` | Modify — add JetBrains Mono font |
| `src/app/globals.css` | Modify — add keyframes, glass-card, glow, live-dot, score-bar, divider, font-mono |
| `src/components/SiteHeader.tsx` | Modify — glass nav, scroll listener, pulse dot, active underline, hamburger animation |
| `src/app/page.tsx` | Modify — hero gradient, mesh bg, stat counters, CTA glow, pip-install copy, section dividers |
| `src/components/AnimatedCounter.tsx` | Modify if needed — add IntersectionObserver |
| `src/components/CopyButton.tsx` | Modify if needed — add "Copied! ✓" tooltip |
| `src/components/HowItWorks.tsx` | Modify — step gradients, hover scale, dotted connector |
| `src/components/PricingSection.tsx` | Modify — glass-card class on tier cards |
| `src/app/benchmarks/page.tsx` | Modify — emoji domains, gradient score bars, latency color coding |
| `src/app/b/[runId]/page.tsx` | **CREATE** — ISR permalink page |

**Forbidden:** Do NOT edit `package.json`, `.github/workflows/ci.yml`, `agentpick-router-qa.py`, any API route under `src/app/api/`, any file in `src/lib/`, or any `prisma/` file.

---

## Acceptance Criteria
- Lighthouse Performance ≥ 90 mobile (no regression from UI changes).
- All 51+ Vitest tests continue to pass (`npm test` green).
- No CLS on 375px viewport.
- All motion gated behind `@media (prefers-reduced-motion: no-preference)`.
- `/b/{runId}` page renders without auth, shows query + tool comparison + badge embed code.
- OG card at `/b/{runId}/opengraph-image` renders correctly (already implemented, do not break).
- Badge SVG at `/b/{runId}/badge.svg` loads under 200ms (already implemented, do not break).
