# TASK_CODEX.md — v-next Cycle 2
**Agent:** Codex (frontend components + connect page)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md v-next

---

## Status Check

All backend API routes are **already implemented** from Cycle 1:
- `src/app/api/v1/account/route.ts` — ✅ done
- `src/app/api/v1/leaderboard/route.ts` — ✅ done
- `src/app/api/v1/leaderboard/badge/[slug]/route.ts` — ✅ done

Your job is **component styling**, **ScrollReveal wiring in components**, and **connect page additions**.

---

## Coverage

| NEXT_VERSION.md Item | This agent's scope |
|---|---|
| Item 1 — `/connect` API reference update | `src/app/connect/page.tsx`: add deprecation note for `/api/v1/account` |
| Item 2 — Feature cards glass-card styling | `src/components/StrategyCards.tsx` (or equivalent feature card component) |
| Item 2 — Pricing cards glass-card + glow styling | `src/components/PricingSection.tsx` |
| Item 2 — ScrollReveal for feature + pricing | Wrap inside `StrategyCards.tsx` and `PricingSection.tsx` |
| Item 2 — Typography data-value class | `src/components/StatsBar.tsx` and `src/components/AnimatedCounter.tsx` |
| Item 3 — Leaderboard API section on `/connect` | `src/app/connect/page.tsx` |

---

## Files Owned — Claude Code MUST NOT touch these

| Action | File |
|---|---|
| **MODIFY** | `src/app/connect/page.tsx` |
| **MODIFY** | `src/components/StrategyCards.tsx` |
| **MODIFY** | `src/components/PricingSection.tsx` |
| **MODIFY** | `src/components/StatsBar.tsx` |
| **MODIFY** | `src/components/AnimatedCounter.tsx` |

> **DO NOT TOUCH:** `src/app/globals.css`, `src/app/page.tsx`, or any file under `src/app/api/`.
> Note: `globals.css` and `page.tsx` are owned by Claude Code this cycle — conflicts would break the build.

---

## Task 1 — Feature Cards: glass-card styling (`src/components/StrategyCards.tsx`)

Read the file. For each rendered card `<div>`:

1. Add classes `glass-card gradient-border-card` to the root card element.
2. Replace any explicit `bg-white`, `bg-bg-card`, or light-background classes on that element — the `glass-card` class handles background.
3. Styling only. Do not change component logic, props, or data.
4. If the component renders 3 cards, all 3 must get these classes.

**Done when:** All feature cards have `glass-card gradient-border-card` on their root element.

---

## Task 2 — Pricing Cards: glass-card + glow styling (`src/components/PricingSection.tsx`)

Read the file. For each pricing tier card:

1. Add classes `glass-card gradient-border-card` to the root card element.
2. For the **primary/highlighted tier** (usually "Pro" or the middle tier with a CTA): also add `hover:shadow-glow-orange`.
3. For the **secondary tier** (free or lower tier): also add `hover:shadow-glow-cyan`.
4. Replace any explicit light-background classes on those elements.
5. Styling only. Do not change pricing data, logic, or CTAs.

**Done when:** All pricing cards have `glass-card gradient-border-card`; primary has `hover:shadow-glow-orange`, secondary has `hover:shadow-glow-cyan`.

---

## Task 3 — ScrollReveal wiring in components

### 3a — Feature cards (`src/components/StrategyCards.tsx`)

After the glass-card styling edits:

1. Import `ScrollReveal` from `@/components/ScrollReveal`.
2. Wrap each individual card in `<ScrollReveal delay={n}>` where `n` is staggered: `0`, `100`, `200` ms.
   ```tsx
   <ScrollReveal delay={0}><CardComponent ... /></ScrollReveal>
   <ScrollReveal delay={100}><CardComponent ... /></ScrollReveal>
   <ScrollReveal delay={200}><CardComponent ... /></ScrollReveal>
   ```
3. If `ScrollReveal` does not accept a `delay` prop, wrap without it.

### 3b — Pricing section (`src/components/PricingSection.tsx`)

1. Import `ScrollReveal` from `@/components/ScrollReveal`.
2. Wrap the outermost pricing container div in `<ScrollReveal>`.

**Done when:** Feature cards and pricing section animate in on scroll.

---

## Task 4 — Typography: data-value class

The `data-value` CSS class (JetBrains Mono font) is already defined in `globals.css`. Apply it to numeric display elements.

### `src/components/StatsBar.tsx`

Read the file. Find every element that renders a numeric value (latency in ms, score numbers, call counts). Add class `data-value` to those `<span>` or `<p>` elements.

### `src/components/AnimatedCounter.tsx`

Read the file. The component renders an animated number. Add class `data-value` to the element that renders the counter value.

**Scope:** Only these two files. Do not touch other component files.

---

## Task 5 — `/connect` Page: API Reference Table + Leaderboard Section (`src/app/connect/page.tsx`)

Read the file. Make two additions:

### 5a — API reference: document `/api/v1/account` alias

Find the existing API endpoint reference section or table. Add a row or entry for `GET /api/v1/account` as a deprecated alias:

```
GET /api/v1/account   →  Bearer key required
Deprecated alias for /api/v1/router/usage.
Returns same fields + Deprecation: true header.
Will be removed in v2 — prefer /api/v1/router/usage.
```

If the section is prose (not a table), add an inline note. If it is a table, add a table row. Match the visual style of existing entries.

### 5b — Leaderboard API section

Add a new section below the existing endpoint documentation. Use the same styling as other sections on the page (dark panel, monospace font).

**Section heading:** `Leaderboard API`

**Description text:** `Free, unauthenticated read access to AgentPick benchmark rankings. No API key required.`

**Curl block** (render in a styled `<pre>` or `<code>` with dark background + copy button):
```
curl https://agentpick.dev/api/v1/leaderboard
```

**"Try it" button:**
- An `<a href="https://agentpick.dev/api/v1/leaderboard" target="_blank" rel="noopener noreferrer">` styled as a primary button.
- Label: `Try it`
- Use the site's existing button style (match the orange CTA on the page).

**Badge Markdown subsection:**
- Sub-heading or label: `README Badge`
- A `<pre>` block (copy button) containing:
  ```
  [![Ranked #1 on AgentPick](https://agentpick.dev/api/v1/leaderboard/badge/tavily)](https://agentpick.dev/products/tavily)
  ```
- Below the block, add note text: `Replace tavily with any tool slug. Badge auto-updates every 5 minutes.`

**Done when:** `/connect` shows the Leaderboard API section with curl one-liner, "Try it" button, and badge Markdown snippet with copy button.

---

## Acceptance Criteria

- [ ] All three feature cards in `StrategyCards.tsx` have `glass-card gradient-border-card`
- [ ] All pricing cards in `PricingSection.tsx` have `glass-card gradient-border-card`
- [ ] Primary pricing card has `hover:shadow-glow-orange`, secondary has `hover:shadow-glow-cyan`
- [ ] Feature cards wrapped in `<ScrollReveal>` with staggered delay
- [ ] Pricing section container wrapped in `<ScrollReveal>`
- [ ] `StatsBar.tsx` numeric elements have `data-value` class
- [ ] `AnimatedCounter.tsx` counter element has `data-value` class
- [ ] `/connect` API reference documents `GET /api/v1/account` as deprecated alias
- [ ] `/connect` has "Leaderboard API" section with curl, "Try it" button, and badge Markdown snippet
- [ ] `src/app/globals.css` NOT modified
- [ ] `src/app/page.tsx` NOT modified
- [ ] No files under `src/app/api/` modified

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] v-next cycle 2: feature+pricing glass-card, ScrollReveal in components, /connect leaderboard section + deprecation docs
```
