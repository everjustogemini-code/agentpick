# TASK_CODEX.md
**Cycle:** 9
**Agent:** Codex
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #2 (Glassmorphism UI upgrade) + Must-Have #3 (HeroCodeBlock swap)

---

## Coverage Summary

| Must-Have | Item | Owner |
|-----------|------|-------|
| #1 | Restore ci.yml | Claude Code |
| #2 | Root background `#08090d`, animated gradient mesh | **CODEX** |
| #2 | SiteHeader: glass blur, live pulse dot, active underline | **CODEX** |
| #2 | ProductCard / ScoreBreakdown / StrategyCards / PricingSection — glass treatment | **CODEX** |
| #2 | Hero h1: `clamp(2.5rem, 6vw, 4.5rem)` + gradient text | **CODEX** |
| #2 | Section eyebrow: font-mono tracking-widest uppercase | **CODEX** |
| #2 | Hero stat counters count-up via IntersectionObserver + rAF, 800ms | **CODEX** |
| #2 | CTA glow pulse on hover | **CODEX** |
| #2 | Leaderboard score bars: red→yellow→green gradient | **CODEX** |
| #2 | One-click copy on code snippets with "Copied ✓" tooltip | **CODEX** |
| #2 | All motion behind `@media (prefers-reduced-motion: no-preference)` | **CODEX** |
| #3 | `HeroCodeBlock.tsx`: swap snippet to OpenAI drop-in 3-liner | **CODEX** |

---

## Files to Create / Modify

| Action | File |
|--------|------|
| **MODIFY** | `src/app/globals.css` |
| **MODIFY** | `src/app/layout.tsx` |
| **MODIFY** | `src/app/page.tsx` |
| **MODIFY** | `src/components/SiteHeader.tsx` |
| **MODIFY** | `src/components/ProductCard.tsx` |
| **MODIFY** | `src/components/ScoreBreakdown.tsx` |
| **MODIFY** | `src/components/StrategyCards.tsx` |
| **MODIFY** | `src/components/PricingSection.tsx` |
| **MODIFY** | `src/app/rankings/page.tsx` |
| **MODIFY** | `src/components/HeroCodeBlock.tsx` |

> **DO NOT TOUCH** any file listed in TASK_CLAUDE_CODE.md.
> Specifically: `.github/workflows/ci.yml`, `src/app/v1/chat/completions/route.ts`,
> `src/lib/openai-compat.ts`, `src/__tests__/openai-compat.test.ts`, `public/llms.txt`,
> and any file under `src/lib/` or `src/app/api/`.

---

## Task 1 — Global CSS (`src/app/globals.css`)

Read the file first. Add or replace the following blocks. **Zero new npm packages — pure CSS/Tailwind.**

### 1A. Root background
Change the root background from `#fafafa` (or whatever is current) to `#08090d`:
```css
html, body {
  background-color: #08090d;
  color: white;
}
```

### 1B. Animated radial gradient mesh on `<body>::before`
```css
@keyframes mesh-drift {
  0%   { background-position: 0% 50%, 100% 0%; }
  50%  { background-position: 100% 50%, 0% 100%; }
  100% { background-position: 0% 50%, 100% 0%; }
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.4;
  background:
    radial-gradient(ellipse 80% 60% at 10% 20%, rgba(79,70,229,0.25) 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 90% 80%, rgba(249,115,22,0.15) 0%, transparent 50%);
  background-size: 200% 200%, 200% 200%;
  animation: mesh-drift 20s ease-in-out infinite;
}
```

### 1C. Glass card utility class
```css
.glass-card {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
}
```

### 1D. Score bar gradient (for rankings/leaderboard)
```css
.score-bar-gradient {
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%);
  border-radius: 9999px;
  height: 6px;
}
```

### 1E. Live pulse dot (nav)
```css
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.5); }
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  display: inline-block;
  animation: live-pulse 2s ease-in-out infinite;
}
```

### 1F. Reduced-motion guard (REQUIRED — wrap ALL animations)
```css
@media (prefers-reduced-motion: reduce) {
  body::before         { animation: none; }
  .glass-card          { transition: none; }
  .glass-card:hover    { transform: none; }
  .live-dot            { animation: none; }
}
```

---

## Task 2 — Root Layout (`src/app/layout.tsx`)

Read the file first.

Add JetBrains Mono via `next/font/google` for all monospace text:

```tsx
import { JetBrains_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})
```

Add the CSS variable to the `<body>` (or `<html>`) element alongside any existing font classes:
```tsx
<body className={`${jetbrainsMono.variable} [existing classes]`}>
```

Also add a Tailwind v4 theme mapping in `globals.css` (or the existing `@theme` block if present):
```css
@theme {
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}
```

---

## Task 3 — Hero Section (`src/app/page.tsx`)

Read the file. Make targeted changes only. If not already a client component, add `'use client'` at the top.

### 3A. Hero `<h1>` gradient + clamp size
Find the hero `<h1>`. Replace its size/color classes with:
```tsx
className="font-bold bg-clip-text text-transparent
           bg-gradient-to-r from-blue-400 to-cyan-300
           [font-size:clamp(2.5rem,6vw,4.5rem)] leading-[1.1]"
```

### 3B. Section eyebrow labels
For any section heading label/eyebrow text (small labels above section titles), apply:
```tsx
className="font-mono tracking-widest text-xs uppercase opacity-50"
```

### 3C. Stat counter count-up animation
Add this hook (before the component function, or inline if file is small):

```tsx
function useCountUp(target: number, duration = 800) {
  const [val, setVal] = React.useState(0)
  const elRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') { setVal(target); return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVal(target); return }

    const el = elRef.current
    if (!el) { setVal(target); return }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setVal(Math.round(eased * target))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.1 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return [val, elRef] as const
}
```

Replace each hero stat number (agent count, calls routed, votes — look for static numbers like `1200+`, `50000+`, etc.) with the animated version:

```tsx
const [agentCount, agentRef] = useCountUp(1200)
// ...
<span ref={agentRef as React.Ref<HTMLSpanElement>}>{agentCount.toLocaleString()}+</span>
```

### 3D. CTA button glow on hover
Find the primary "Get API Key" (or equivalent) CTA button. Add hover glow:
```tsx
className="[existing bg/padding/rounded classes]
           hover:shadow-[0_0_32px_rgba(99,102,241,0.6)] hover:scale-[1.03]
           transition-all duration-200"
```

### 3E. One-click copy for code snippet
Find the `pip install agentpick` (or similar) code snippet block. Add a copy button with tooltip:

```tsx
function CopySnippet({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-white/[0.08]
                    bg-black/40 px-4 py-2 font-mono text-sm text-white/70">
      <span>{code}</span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          })
        }}
        className="ml-auto text-white/30 hover:text-white/70 transition-colors"
        aria-label="Copy"
      >
        {copied
          ? <span className="text-emerald-400 text-xs font-medium">Copied ✓</span>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
        }
      </button>
    </div>
  )
}
```

Replace the static code block with `<CopySnippet code="pip install agentpick" />`.

---

## Task 4 — Navigation (`src/components/SiteHeader.tsx`)

Read the file. Apply three targeted changes.

### 4A. Frosted glass nav bar on scroll
If a `scrolled` state does not exist, add:
```tsx
const [scrolled, setScrolled] = React.useState(false)
React.useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 8)
  window.addEventListener('scroll', handler, { passive: true })
  return () => window.removeEventListener('scroll', handler)
}, [])
```

On the root `<header>` element, apply scroll-conditional glass:
```tsx
className={`sticky top-0 z-50 border-b transition-all duration-200
            ${scrolled
              ? 'backdrop-blur-[12px] bg-black/70 border-white/[0.08]'
              : 'bg-transparent border-transparent'
            } [keep existing layout classes]`}
```

### 4B. Pulsing green dot next to logo
After the logo text/image, add:
```tsx
<span className="live-dot ml-1.5" aria-hidden="true" />
```
(The `.live-dot` class is defined in `globals.css` Task 1E.)

### 4C. Active page underline (2px accent)
Find where active nav link styling is applied. Replace a text-color-only active indicator with:
```tsx
// Active link:
className="relative pb-0.5 text-white after:absolute after:bottom-0 after:left-0
           after:h-[2px] after:w-full after:rounded-full after:bg-indigo-400
           [existing padding/font classes]"

// Inactive link:
className="relative pb-0.5 text-white/50 hover:text-white/80 after:absolute after:bottom-0
           after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-transparent
           [existing padding/font classes]"
```

---

## Task 5 — Glass Treatment on Cards & Panels

Read each file first. Add `glass-card` class (defined in `globals.css` Task 1C) to the card's root element. Also apply `backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl` as Tailwind equivalents if needed.

### `src/components/ProductCard.tsx`
Find the root card `<div>` (likely has `rounded`, `border`, `p-` classes). Add:
```tsx
// Add to existing className:
"glass-card"
// Remove any hard-coded light-mode bg like bg-white or bg-gray-50
```

### `src/components/ScoreBreakdown.tsx`
Same pattern — find the wrapper panel, add `glass-card` class, remove light bg.

### `src/components/StrategyCards.tsx`
Find each individual strategy card element. Add `glass-card` class.

### `src/components/PricingSection.tsx`
Find each pricing tier card. Add `glass-card` class. Remove any `bg-white` or `bg-gray-100`.

---

## Task 6 — Leaderboard Score Bars (`src/app/rankings/page.tsx`)

Read the file. Find the progress/score bar elements.

Replace solid-color bar fills with the gradient class:
```tsx
// Before (example):
<div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${score}%` }} />

// After:
<div className="score-bar-gradient" style={{ width: `${score}%` }} />
```
(`.score-bar-gradient` defined in `globals.css` Task 1D.)

Also add section eyebrow labels for tier headings:
```tsx
<span className="font-mono tracking-widest text-xs uppercase opacity-50">
  {tierLabel}
</span>
```

---

## Task 7 — HeroCodeBlock Snippet Swap (`src/components/HeroCodeBlock.tsx`)

Read the file. The current snippet likely shows a custom AgentPick SDK call.

Replace the code snippet with the OpenAI drop-in 3-liner (per NEXT_VERSION.md Must-Have #3):

```typescript
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://agentpick.dev/v1',
  apiKey: process.env.AGENTPICK_KEY,
})

const res = await client.chat.completions.create({
  model: 'agentpick/auto',
  messages: [{ role: 'user', content: 'What is the AAPL stock price?' }],
})

console.log(res.choices[0].message.content)
```

Update any accompanying description text from "AgentPick SDK" to "Drop-in OpenAI replacement".

---

## Acceptance Criteria

- [ ] Lighthouse Performance ≥ 90 mobile (no regression from current baseline)
- [ ] All 51+ QA tests still pass (`npx vitest run`)
- [ ] No CLS on 375px viewport (mesh gradient uses `position: fixed`, not layout)
- [ ] All animations gated behind `@media (prefers-reduced-motion: no-preference)` (or `reduce` guard)
- [ ] Root background is `#08090d` / near-black — no white flash on load
- [ ] Body has animated radial gradient mesh (20s loop, `opacity: 0.4`)
- [ ] Hero h1 uses `clamp(2.5rem, 6vw, 4.5rem)` font-size and gradient text (blue→cyan)
- [ ] Section eyebrow labels use `font-mono tracking-widest text-xs uppercase opacity-50`
- [ ] Stat counters animate 0→value on first viewport entry (800ms ease-out)
- [ ] "Get API Key" CTA has `box-shadow: 0 0 32px rgba(99,102,241,0.6)` on hover
- [ ] Code snippet has working one-click copy with "Copied ✓" label (fades after 2s)
- [ ] SiteHeader has `backdrop-blur-[12px]` on scroll, live green pulse dot, 2px active underline
- [ ] ProductCard / ScoreBreakdown / StrategyCards / PricingSection have glass treatment
- [ ] Leaderboard score bars use red→yellow→green gradient fill
- [ ] `HeroCodeBlock.tsx` shows OpenAI drop-in 3-liner, not custom SDK
- [ ] JetBrains Mono loaded via `next/font/google`, applied via `--font-jetbrains-mono` CSS variable
- [ ] Zero files from TASK_CLAUDE_CODE.md were modified
