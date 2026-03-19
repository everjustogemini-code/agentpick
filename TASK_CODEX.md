# TASK_CODEX.md — v-next (2026-03-18)
**Agent:** Codex
**Source:** NEXT_VERSION.md — Must-Have #2 (dark-glass pass) + Must-Have #3 (/connect leaderboard section)
**Rule:** Must-Have #1 bugs are handled by Claude Code in `src/lib/router/` and `src/app/api/v1/` — do NOT touch those.

---

## Scope Summary

Codex owns all frontend/CSS/component work. Claude Code owns all API route and lib/router changes.

**DO NOT TOUCH any of these files** (owned by Claude Code):
- `src/app/api/v1/router/register/route.ts`
- `src/app/api/v1/account/route.ts`
- `src/lib/router/index.ts`
- Any file under `src/app/api/`
- Any file under `src/lib/router/`

---

## Background — What's already done vs. what needs work

CSS tokens in `globals.css` are already correct:
- `body { background: var(--bg-base); }` ✓ (line 133)
- `--bg-card: rgba(255,255,255,0.05)` ✓ (line 10)
- `--text-primary: #E2E8F0` ✓ (line 13)
- `--bg-base: #0a0a0f` ✓ (line 63)
- `.data-value` class (JetBrains Mono) ✓ (line ~193)
- `ScrollReveal` component ✓ (`src/components/ScrollReveal.tsx`)

Leaderboard API routes are already implemented:
- `GET /api/v1/leaderboard` ✓
- `GET /api/v1/leaderboard/badge/[slug]` ✓

**What still needs to be done** (your tasks below):
- `page.tsx`: hero-mesh/glass-card, ScrollReveal wiring on stats + How-It-Works
- `PricingSection.tsx`: glass-card + glow on pricing cards, ScrollReveal
- `StrategyCards.tsx`: glass-card, ScrollReveal
- Monospace `data-value` class applied to numeric elements in stat/counter components
- `connect/page.tsx`: document `/api/v1/account` deprecation + add Leaderboard API section

---

## Task 1 — `src/app/page.tsx`: hero + stats + How-It-Works

Read the file first. Make the following targeted changes.

### 1a — Hero wrapper: apply hero-mesh
The outer hero `<div>` should have the `hero-mesh` class. Currently `page.tsx` line ~130 has a
`hero-mesh` wrapper div — verify it is the outermost hero section div and that it is present.
If it is already applied, skip. If not applied to the correct element, move it.

### 1b — Hero headline + CTA: wrap in glass-card panel
Find the `<h1>` headline, subtitle `<p>`, and the CTA buttons `<div>`. If they are NOT already
wrapped in a `glass-card rounded-2xl p-8` container, add one:
```tsx
<div className="glass-card rounded-2xl p-8 mb-6">
  {/* h1 */}
  {/* subtitle p */}
  {/* CTA div */}
</div>
```
If a `glass-card` wrapper already exists there (`page.tsx` line ~156), verify it wraps both the
headline and CTA buttons. Adjust if it only wraps a partial set.

### 1c — Headline: upgrade font sizing and gradient
Find the `<h1>` hero headline. Apply:
- `style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}`
- Gradient span: `className="text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-400"`

### 1d — Stats bar: wire ScrollReveal
Find the data-flywheel stats `<div>` (the bar showing live call counts / latency numbers near the
top of the page). Wrap it in `<ScrollReveal>`:
```tsx
<ScrollReveal>
  {/* stats div */}
</ScrollReveal>
```
`ScrollReveal` is already imported at the top of `page.tsx` — do not add a second import.

### 1e — How It Works: wire ScrollReveal
Find the `<HowItWorks />` component render (or the inline "How it works" section). Wrap it:
```tsx
<ScrollReveal>
  <HowItWorks />
</ScrollReveal>
```

---

## Task 2 — `src/components/StrategyCards.tsx`: glass-card + ScrollReveal

Read the file first.

1. Add `glass-card gradient-border-card` classes to the root element of **each** card rendered.
   Remove any explicit `bg-white`, `bg-bg-card`, or similar light-background classes on those
   elements (glass-card handles the background).
2. Import `ScrollReveal` from `@/components/ScrollReveal`.
3. Wrap each individual card in a staggered `<ScrollReveal>`:
   ```tsx
   <ScrollReveal delay={0}><Card1 ... /></ScrollReveal>
   <ScrollReveal delay={100}><Card2 ... /></ScrollReveal>
   <ScrollReveal delay={200}><Card3 ... /></ScrollReveal>
   ```
   If `ScrollReveal` does not accept a `delay` prop, omit it and wrap without.

**Styling only. Do not change component logic, props, or data.**

---

## Task 3 — `src/components/PricingSection.tsx`: glass-card + glow + ScrollReveal

Read the file first.

1. Add `glass-card gradient-border-card` to the root element of **each** pricing tier card.
   Remove any explicit light-background classes on those elements.
2. For the **primary/highlighted tier** (highest price or "most popular" CTA card): also add
   `hover:shadow-glow-orange` to the card root.
3. Wrap the outermost pricing grid/container in `<ScrollReveal>` (one wrapper, not individual cards).
   Import `ScrollReveal` from `@/components/ScrollReveal`.

**Styling only. Do not change pricing data, amounts, or CTA logic.**

---

## Task 4 — Monospace typography: apply `data-value` to numeric elements

The `.data-value` class (JetBrains Mono, 1.25em, weight 600) is defined in `globals.css`.

### 4a — Find stat/counter components
Search for components that render numeric values like latency (ms), score numbers, call counts.
Likely candidates: any component with "Stats", "Counter", "Metric", "AnimatedCounter" in the name,
or any `<span>` / `<p>` element in `page.tsx` or components that contains a numeric data value.

### 4b — Apply `data-value` class
For each element that displays a latency, score, or call-count value, add the `data-value` class:
```tsx
// Before
<span>{latency}ms</span>
// After
<span className="data-value">{latency}ms</span>
```

**Scope:** Limit to components/files you read as part of this task. Do not make sweeping
changes across the codebase — if unsure, apply to the most visible stats bar and homepage metrics.

---

## Task 5 — `src/app/connect/page.tsx`: account alias note + Leaderboard API section

Read the file first. Make two additions.

### 5a — API reference: document `/api/v1/account` as deprecated alias
Find the existing endpoint reference section or table on the `/connect` page.
Add an entry for `GET /api/v1/account`:
```
GET /api/v1/account
Deprecated alias for GET /api/v1/router/usage.
Returns the same payload + Deprecation: true response header.
Will be removed in v2 — use /api/v1/router/usage going forward.
```
Match the visual style of other endpoint entries on the page (code block, table row, or prose note).

### 5b — New "Leaderboard API" section
Add a new section after the existing endpoint documentation. Style it to match other sections
(dark panel, heading, description). Content:

**Heading:** `Leaderboard API`

**Description:** `Zero-auth read access to AgentPick benchmark rankings. No API key needed.`

**Curl block** (dark `<pre>` or `<code>` with copy button, matching other code blocks on the page):
```
curl https://agentpick.dev/api/v1/leaderboard
```

**Optional query params note** (plain text below the curl block):
```
?domain=finance|devtools|news|general   (optional)
?task=research|realtime|simple          (optional)
?limit=10                               (default 10, max 50)
```

**"Try it" link button:**
```tsx
<a
  href="https://agentpick.dev/api/v1/leaderboard"
  target="_blank"
  rel="noopener noreferrer"
  className="btn-primary"   // or whatever the orange CTA class is on this page
>
  Try it
</a>
```

**README Badge subsection:**
- Sub-heading: `README Badge`
- `<pre>` block with copy button:
  ```
  [![Ranked #1 on AgentPick](https://agentpick.dev/api/v1/leaderboard/badge/tavily)](https://agentpick.dev/products/tavily)
  ```
- Below block: `Replace tavily with any tool slug. Badge auto-updates every 5 minutes.`

---

## Files to Create / Modify

| Action | File                                   | Reason                                            |
|--------|----------------------------------------|---------------------------------------------------|
| MODIFY | `src/app/page.tsx`                     | Hero glass-card, ScrollReveal on stats + HowItWorks (Tasks 1a–1e) |
| MODIFY | `src/components/StrategyCards.tsx`     | glass-card + ScrollReveal (Task 2)                |
| MODIFY | `src/components/PricingSection.tsx`    | glass-card + glow + ScrollReveal (Task 3)         |
| MODIFY | `src/app/connect/page.tsx`             | Account alias note + Leaderboard API section (Task 5) |
| READ   | stat/counter components (to identify) | Apply data-value class to numeric elements (Task 4) |

---

## Acceptance Criteria

- [ ] Hero `hero-mesh` wrapper present on homepage hero section
- [ ] Hero headline uses `clamp(2.8rem, 5vw, 4.5rem)`, weight 800, white-to-orange gradient
- [ ] Headline + CTA wrapped in `glass-card rounded-2xl p-8`
- [ ] Stats bar wrapped in `<ScrollReveal>`
- [ ] HowItWorks wrapped in `<ScrollReveal>`
- [ ] All feature cards in `StrategyCards.tsx` have `glass-card gradient-border-card`
- [ ] Feature cards wrapped in staggered `<ScrollReveal>`
- [ ] All pricing cards in `PricingSection.tsx` have `glass-card gradient-border-card`
- [ ] Primary pricing card has `hover:shadow-glow-orange`
- [ ] Pricing section container wrapped in `<ScrollReveal>`
- [ ] Numeric stat values have `data-value` class (JetBrains Mono)
- [ ] `/connect` documents `GET /api/v1/account` as deprecated alias
- [ ] `/connect` has Leaderboard API section with curl, Try it button, badge Markdown
- [ ] No white flash on load (body background stays `#0a0a0f` — do NOT modify `globals.css`)
- [ ] No files under `src/app/api/` or `src/lib/router/` modified
- [ ] All 51 automated QA checks remain green

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] v-next: dark-glass hero/cards/pricing, ScrollReveal wiring, data-value typography, /connect leaderboard section
```
