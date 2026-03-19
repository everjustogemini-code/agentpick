# TASK_CODEX.md — v-next (2026-03-18)
**Agent:** Codex
**Source:** NEXT_VERSION.md — Must-Have #1 (dark-glass design system) + Must-Have #2 (scroll animations + micro-interactions) + Must-Have #3 frontend (/connect Leaderboard API section)
**QA baseline:** 57/57 — no bugs. This cycle is UI polish + developer adoption.

---

## Scope Summary

Codex owns all frontend/CSS/animation/component work. Claude Code owns the two leaderboard API
route files.

**DO NOT TOUCH any of these files** (owned by Claude Code):
- `src/app/api/v1/leaderboard/route.ts`
- `src/app/api/v1/leaderboard/badge/[slug]/route.ts`
- Any file under `src/app/api/`
- Any file under `src/lib/router/`

---

## Background — what's already wired vs. what's missing

Per QA and the existing codebase:
- CSS tokens (`--bg-base`, `--bg-card`, `.glass-card`, `.hero-mesh`, `gradient-border-card`,
  `.data-value` JetBrains Mono) are defined in `globals.css` ✓
- `ScrollReveal` component (`src/components/ScrollReveal.tsx`) is built and imported in `page.tsx` ✓
- `AnimatedCounter` component exists ✓
- `HeroCodeBlock` component exists ✓

**What still needs doing:**
- Hero/cards/pricing not consistently using `glass-card gradient-border-card`
- `ScrollReveal` not wired to stats bar, HowItWorks, feature cards, pricing section
- No count-up animation on scroll entry (homepage stat counters)
- No pricing card stagger delay
- No strategy card hover interactions (pulse + active ring)
- No CTA button shimmer
- No typed code block on homepage
- No `prefers-reduced-motion` compliance for new animations
- `/connect` missing Leaderboard API section

---

## Must-Have #1 — Dark-Glass Design System

### Task 1 — `src/app/globals.css`

Read the file first. Make these targeted changes only:

1. **Body background:** Confirm `body` uses `background: var(--bg-base)` (should be line ~133).
   If it uses a literal hex or any other value, replace with `var(--bg-base)`.

2. **`--bg-card` value:** Confirm `--bg-card` is `rgba(255,255,255,0.05)`. If it differs, update it.

3. **`--text-primary` value:** Confirm it is `#E2E8F0`. Update if different.

4. **Add CTA shimmer keyframe** (needed for Task 4 below — add if not already present):
```css
@keyframes shimmer-sweep {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.btn-shimmer {
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.15) 40%,
    rgba(255,255,255,0.15) 60%,
    transparent 100%
  );
  background-size: 200% auto;
}
.btn-shimmer:hover {
  animation: shimmer-sweep 1s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .btn-shimmer:hover { animation: none; }
}
```

5. **Add stagger delay utilities** (needed for Task 3 pricing stagger — add if not present):
```css
.delay-100 { transition-delay: 100ms; animation-delay: 100ms; }
.delay-200 { transition-delay: 200ms; animation-delay: 200ms; }
@media (prefers-reduced-motion: reduce) {
  .delay-100, .delay-200 { transition-delay: 0ms; animation-delay: 0ms; }
}
```

6. **`prefers-reduced-motion` block for ScrollReveal:** Add after the existing `.scroll-reveal`
   block (if not present):
```css
@media (prefers-reduced-motion: reduce) {
  .scroll-reveal { opacity: 1; transform: none; transition: none; }
}
```

### Task 2 — `src/app/page.tsx`: hero + stats + HowItWorks

Read the file first. Make these targeted changes:

#### 2a — Hero wrapper: `hero-mesh` class
Find the outermost hero section `<div>`. If it doesn't have the `hero-mesh` class, add it. If it
already has it, skip.

#### 2b — Headline + CTA: wrap in `glass-card`
Find the `<h1>` headline, subtitle `<p>`, and CTA `<div>`. If they are NOT already wrapped in a
`glass-card` container, add:
```tsx
<div className="glass-card rounded-2xl p-8 mb-6">
  {/* h1, subtitle, CTAs */}
</div>
```
If a `glass-card` div already exists wrapping these elements, verify it wraps all three and skip.

#### 2c — Hero headline: font size + gradient text
Find the `<h1>`. Apply:
- `style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}`
- Wrap the key phrase in a gradient span:
  ```tsx
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-400">
    {phrase}
  </span>
  ```

#### 2d — Stats bar: wrap in `<ScrollReveal>`
Find the stats `<div>` showing live call counts / latency numbers (likely contains `StatsBar` or
inline stat values). Wrap it with `<ScrollReveal>`. `ScrollReveal` is already imported — do NOT
add a second import.

#### 2e — HowItWorks: wrap in `<ScrollReveal>`
Find `<HowItWorks />` (or the inline "How it works" section). Wrap:
```tsx
<ScrollReveal>
  <HowItWorks />
</ScrollReveal>
```

#### 2f — CTA buttons: add `btn-shimmer` class
Find the primary CTA buttons ("Get API Key", "Start Free"). Add `btn-shimmer` to their className.

### Task 3 — `src/components/PricingSection.tsx`: glass-card + stagger + glow

Read the file first.

1. Add `glass-card gradient-border-card` to the root element of **each** pricing tier card.
   Remove any explicit `bg-white`, `bg-gray-*`, or light-background class on those elements.
2. Add stagger delays to the three cards using the `delay-100` / `delay-200` utilities added in
   Task 1:
   - Card 1: no delay class
   - Card 2: add `delay-100`
   - Card 3: add `delay-200`
3. For the "most popular" / primary CTA card: also add `hover:shadow-glow-orange`.
4. Wrap the outermost pricing grid container in `<ScrollReveal>`. Import `ScrollReveal` from
   `@/components/ScrollReveal`.

### Task 4 — `src/components/StrategyCards.tsx`: glass-card + hover interactions + ScrollReveal

Read the file first.

1. Add `glass-card gradient-border-card` to the root element of each strategy card.
   Remove any conflicting light-background class.
2. Add hover interactions to each card:
   - Icon element: add `transition-transform group-hover:scale-110 group-hover:animate-pulse`
   - Card root: add `group` class (enables group-hover)
   - Active/highlighted card: add a ring using `ring-2 ring-orange-500` (or apply
     `--accent-gradient` border if a utility class exists for it in `globals.css`)
3. Import `ScrollReveal` from `@/components/ScrollReveal`. Wrap each card in a staggered reveal:
   ```tsx
   <ScrollReveal delay={0}>  <Card1 /></ScrollReveal>
   <ScrollReveal delay={100}><Card2 /></ScrollReveal>
   <ScrollReveal delay={200}><Card3 /></ScrollReveal>
   ```
   If `ScrollReveal` doesn't accept `delay`, omit the prop.

### Task 4b — Apply `data-value` / `font-jetbrains-mono` to all numeric data site-wide

The `.data-value` class (JetBrains Mono, weight 600) is already defined in `globals.css`. Apply it
to every element that renders a latency, score, success rate, or call-count value across:

- `src/components/StatsBar.tsx` — all numeric span/p elements showing call counts, agent counts
- `src/components/AnimatedCounter.tsx` — the `<span>` rendering the counter value (add `data-value` class to the element)
- `src/components/ScoreRing.tsx` — the score number rendered inside the ring
- `src/app/products/[slug]/page.tsx` — latency, success rate, benchmark count, score values
- `src/app/connect/page.tsx` — any inline latency/score values shown in code examples or stats
- `src/app/dashboard/page.tsx` — call counts, usage numbers in the usage panel

For each element:
```tsx
// Before
<span>{latency}ms</span>
// After
<span className="data-value">{latency}ms</span>
```

Scope: only elements that display numeric telemetry data (latency ms, score out of 10, %, call
counts). Do not apply to non-numeric text, labels, or headings.

---

## Must-Have #2 — Scroll Animations + Micro-Interactions

### Task 5 — `src/components/AnimatedCounter.tsx`: count-up on scroll entry

Read the file first.

The component currently likely renders a static number. Convert it to animate from 0 to the target
value on `IntersectionObserver` entry (fires once per session using a `useRef` flag).

```ts
// Key logic to add (adjust to match existing component shape):
const [displayed, setDisplayed] = useState(0);
const hasRun = useRef(false);
const ref = useRef<HTMLElement>(null);

useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !hasRun.current) {
      hasRun.current = true;
      // Animate from 0 to `value` over ~1200ms
      const duration = 1200;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setDisplayed(Math.round(progress * value));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.3 });
  observer.observe(el);
  return () => observer.disconnect();
}, [value]);
```

Add `prefers-reduced-motion` compliance: if the user prefers reduced motion, skip the animation
and show the final value immediately.
```ts
const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// If prefersReduced: setDisplayed(value) immediately, skip requestAnimationFrame
```

### Task 6 — `src/components/HeroCodeBlock.tsx`: typed animation on viewport entry

Read the file first.

The component shows a code block (pip install / curl command). Add a typed reveal effect that plays
once when the block enters the viewport:

1. Use a native CSS `steps()` animation (no external library):
```css
/* In globals.css — add to Task 1's globals changes: */
@keyframes type-reveal {
  from { width: 0; }
  to   { width: 100%; }
}
.typed-line {
  overflow: hidden;
  white-space: nowrap;
  animation: type-reveal 1.2s steps(40, end) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .typed-line { animation: none; width: 100%; }
}
```

2. In `HeroCodeBlock.tsx`, wrap the code text in a `<span className="typed-line">`. Use an
   `IntersectionObserver` (same pattern as Task 5) to add the class only after the block enters
   the viewport, so the animation fires on scroll rather than on page load.

3. If the component uses multiple lines, add staggered delays (`animation-delay: 0.4s`,
   `animation-delay: 0.8s` etc.) to each subsequent line.

---

## Must-Have #3 Frontend — `src/app/connect/page.tsx`: Leaderboard API section

Read the file first. Add one new section after the existing endpoint documentation.

### Task 7 — New "Leaderboard API" section

Style the section to match other sections on the page (dark panel, same heading level, same code
block style). Content:

**Section heading:** `Leaderboard API`

**Description paragraph:**
```
Zero-auth read access to AgentPick benchmark rankings. No API key needed. Rate limit: 60 req/min per IP.
```

**Curl code block** (use the same `<pre>`/`<code>` component pattern already on the page):
```
curl https://agentpick.dev/api/v1/leaderboard
```

**Query params note** (plain `<p>` or `<pre>` below the code block):
```
Optional params:
  ?domain=finance|devtools|news|general
  ?task=research|realtime|simple
  ?limit=10  (default 10, max 50)
```

**"Try it" button** (use the same button/link component pattern already on the page):
```tsx
<a
  href="https://agentpick.dev/api/v1/leaderboard"
  target="_blank"
  rel="noopener noreferrer"
  className={/* same class as other external link CTAs on the page */}
>
  Try it →
</a>
```

**README Badge subsection:**
- Sub-heading: `README Badge`
- Copy-able code block:
  ```
  [![Ranked on AgentPick](https://agentpick.dev/api/v1/leaderboard/badge/tavily)](https://agentpick.dev/products/tavily)
  ```
- Caption text: `Replace tavily with any tool slug. Badge updates every 5 minutes.`

---

## Files to Create / Modify

| Action | File                                        | Reason                                               |
|--------|---------------------------------------------|------------------------------------------------------|
| MODIFY | `src/app/globals.css`                       | Shimmer keyframe, stagger delay utilities, reduced-motion ScrollReveal, type-reveal keyframe |
| MODIFY | `src/app/page.tsx`                          | hero-mesh, glass-card, headline gradient + clamp, ScrollReveal on stats + HowItWorks, btn-shimmer on CTAs |
| MODIFY | `src/components/PricingSection.tsx`         | glass-card, stagger delays, glow hover, ScrollReveal |
| MODIFY | `src/components/StrategyCards.tsx`          | glass-card, hover pulse + ring, ScrollReveal         |
| MODIFY | `src/components/AnimatedCounter.tsx`        | Count-up on IntersectionObserver entry, reduced-motion |
| MODIFY | `src/components/HeroCodeBlock.tsx`          | Typed animation on viewport entry, reduced-motion    |
| MODIFY | `src/app/connect/page.tsx`                  | Leaderboard API section with curl + Try it + badge snippet + data-value on numeric values |
| MODIFY | `src/components/StatsBar.tsx`               | `data-value` class on numeric elements (Task 4b)           |
| MODIFY | `src/components/ScoreRing.tsx`              | `data-value` class on score number (Task 4b)               |
| MODIFY | `src/app/products/[slug]/page.tsx`          | `data-value` class on latency/score/rate values (Task 4b)  |
| MODIFY | `src/app/dashboard/page.tsx`                | `data-value` class on call-count/usage values (Task 4b)    |

---

## Acceptance Criteria

**Must-Have #1:**
- [ ] `body` uses `var(--bg-base)` — no white flash on any page
- [ ] Hero section has `hero-mesh` class; headline + CTA wrapped in `glass-card rounded-2xl p-8`
- [ ] Headline uses `clamp(2.8rem, 5vw, 4.5rem)`, weight 800, white-to-orange gradient text
- [ ] All pricing cards have `glass-card gradient-border-card`; primary card has `hover:shadow-glow-orange`
- [ ] All strategy cards have `glass-card gradient-border-card`
- [ ] Stats bar wrapped in `<ScrollReveal>`
- [ ] HowItWorks wrapped in `<ScrollReveal>`
- [ ] Pricing section wrapped in `<ScrollReveal>`
- [ ] Strategy cards wrapped in staggered `<ScrollReveal>`

- [ ] `data-value` class (`font-jetbrains-mono`) applied to latency, score, success-rate, and call-count values on `/`, `/connect`, `/products/[slug]`, `/dashboard`

**Must-Have #2:**
- [ ] Homepage stat counters animate from 0 on scroll entry (once per session)
- [ ] Pricing cards stagger-fade in with 100ms/200ms delays
- [ ] Strategy card icons pulse on hover; active card has ring using `--accent-gradient` / orange ring
- [ ] Primary CTA buttons ("Get API Key", "Start Free") have shimmer sweep on hover
- [ ] HeroCodeBlock text types-on when block enters viewport
- [ ] All animations are disabled under `@media (prefers-reduced-motion: reduce)`

**Must-Have #3 frontend:**
- [ ] `/connect` has "Leaderboard API" section with curl block, "Try it →" button, README badge snippet
- [ ] Badge Markdown copy block uses correct URL format

**General:**
- [ ] No files under `src/app/api/` or `src/lib/` modified
- [ ] All 57 automated QA checks remain green
- [ ] Lighthouse Performance ≥ 90, CLS < 0.1

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] v-next: dark-glass hero/cards/pricing, ScrollReveal wiring, count-up stats, CTA shimmer, typed code block, /connect leaderboard section
```
