# TASK_CODEX.md — v-next
**Agent:** Codex (frontend / components / styling)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md v-next

---

## Coverage Summary

| NEXT_VERSION.md Item | Task | Files |
|---|---|---|
| Item 1 — Fix `/api/v1/account` (frontend half) | Update `/connect` API reference table to document both paths | `src/app/connect/page.tsx` |
| Item 2 — Dark-Glass Design System | globals.css dark defaults; hero-mesh + glass-card + gradient-border-card; ScrollReveal wiring; typography | `src/app/globals.css`, `src/app/page.tsx`, feature card component(s), pricing card component(s) |
| Item 3 — Leaderboard API (frontend half) | Add Leaderboard API section to `/connect` with curl + "Try it" + badge snippet | `src/app/connect/page.tsx` |

---

## Files Owned by This Agent (Claude Code must NOT touch these)

| Action | File |
|---|---|
| **MODIFY** | `src/app/globals.css` |
| **MODIFY** | `src/app/page.tsx` |
| **MODIFY** | `src/app/connect/page.tsx` |
| **MODIFY** | Feature card component under `src/components/` (grep for "feature" or "FeatureCard") |
| **MODIFY** | Pricing card component under `src/components/` (grep for "PricingCard" or "pricing") |

> **DO NOT TOUCH** any file listed in TASK_CLAUDE_CODE.md:
> `src/app/api/v1/account/route.ts`, `src/app/api/v1/leaderboard/route.ts`,
> `src/app/api/v1/leaderboard/badge/[slug]/route.ts`, `src/lib/rate-limit.ts`,
> or any other file under `src/app/api/`.

---

## Task 1 — Update `/connect` API Reference Table (Item 1 — frontend)

**File:** `src/app/connect/page.tsx`

**Problem:** The API reference on `/connect` shows only the old path. It must document both `/api/v1/router/usage` (canonical) and `/api/v1/account` (deprecated alias).

**Actions:**
1. Read the file. Find the API reference table or endpoint listing section.
2. In the endpoint list, add a row for `GET /api/v1/account` marked as deprecated, pointing to `/api/v1/router/usage`. Example:

   | Endpoint | Auth | Notes |
   |---|---|---|
   | `GET /api/v1/router/usage` | Bearer key | Canonical — use this |
   | `GET /api/v1/account` | Bearer key | **Deprecated alias** — returns same data + `Deprecation: true` header; will be removed in v2 |

3. If there is already an `/account` row, update it to show "deprecated alias" clearly.
4. Do not remove any existing documentation rows.

**Done when:** `/connect` API reference clearly shows both paths with the alias marked deprecated.

---

## Task 2 — Dark-Glass Design System (Item 2)

### 2a — Dark by default (`src/app/globals.css`)

Read the file. Apply these changes:

1. Find `body { background: var(--bg-primary) }` (or equivalent `background-color` on `body`). Change it to `background: var(--bg-base)`.
2. Find the CSS variable declaration block (`:root` or equivalent). Update:
   - `--bg-card` → `rgba(255, 255, 255, 0.05)`
   - `--text-primary` → `#E2E8F0`
3. These variables are already defined — update their values, do not add new declarations.

### 2b — Homepage hero (`src/app/page.tsx`)

Read the file. Locate the hero section wrapper `<div>` (the outermost container for the headline + CTA):

1. Add class `hero-mesh` to the hero wrapper div. (`hero-mesh` is already defined in `globals.css`.)
2. Wrap the headline and CTA button(s) in a `<div>` with class `glass-card` if not already wrapped.
3. Update the hero headline element:
   - Replace current font-size/weight classes with: `font-size: clamp(2.8rem, 5vw, 4.5rem)` (inline style or Tailwind equivalent), `font-weight: 800`, `letter-spacing: -0.03em`.
   - Apply gradient text: add Tailwind classes `bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent`.

### 2c — Feature and pricing cards

**Feature card component** (find via `grep -r "feature" src/components/ --include="*.tsx" -l` or similar):
1. On the root card `<div>`, replace any existing background/border classes with `glass-card gradient-border-card`.
2. Styling only — no logic changes.

**Pricing card component** (find via `grep -r "PricingCard\|pricing" src/components/ --include="*.tsx" -l`):
1. On the root card `<div>`, add classes `glass-card gradient-border-card`.
2. For the **primary CTA** pricing card (e.g., the "Pro" or highlighted tier), also add class `shadow-glow-orange` on hover (Tailwind: `hover:shadow-glow-orange` — this class is already defined in `globals.css`).
3. For the **secondary** pricing card, add `hover:shadow-glow-cyan` instead.
4. Styling only — no logic changes.

### 2d — ScrollReveal wiring (`src/app/page.tsx`)

`ScrollReveal` component is at `src/components/ScrollReveal.tsx` and the `.scroll-reveal` + `.visible` CSS already exists in `globals.css`. Wire it in `page.tsx`:

1. Import `ScrollReveal` from `@/components/ScrollReveal` (or the correct relative path).
2. Wrap each of these sections with `<ScrollReveal>`:
   - The **live-feed stats bar** (the row showing live call counts / scores).
   - Each of the **three feature cards**.
   - The **pricing section** container.
   - Each **"How it works" step**.
3. Pass a `delay` prop (stagger by `0`, `100`, `200`, `300` ms respectively for multi-item sections) if the component supports it; otherwise wrap each item individually.

### 2e — Typography (`src/app/page.tsx` and components)

Find every element that displays a latency value, score, or call count (look for `ms`, numeric scores, and call-count stat elements). Add class `data-value` (or `font-jetbrains-mono` if Tailwind JetBrains Mono is configured) to those elements. The `data-value` class is already defined in `globals.css` — just apply it.

**Scope:** `src/app/page.tsx` only (not other pages — those are out of scope this cycle).

---

## Task 3 — Leaderboard API Section on `/connect` (Item 3 — frontend)

**File:** `src/app/connect/page.tsx` (coordinate edits with Task 1 — same file)

Add a new **"Leaderboard API"** section to the `/connect` page. Place it after the existing endpoint reference section and before the footer.

### Section content

**Heading:** `Leaderboard API` (h2 or equivalent section heading)

**Description:** "Free, unauthenticated read access to AgentPick benchmark rankings. No API key required."

**Curl example block:**
```
curl https://agentpick.dev/api/v1/leaderboard
```
Render this in a styled `<pre>` or code block (dark background, monospace font). Include a copy button.

**"Try it" button:**
- Label: `Try it`
- On click: `window.open('https://agentpick.dev/api/v1/leaderboard', '_blank')` (or use an `<a target="_blank">` styled as a button).
- Style: `bg-gradient-to-r from-orange-500 to-orange-400` or match the site's primary CTA style.

**Badge Markdown snippet:**
Below the curl example, add a sub-section titled "README Badge". Show a copy-paste Markdown snippet for the top-ranked tool:
```markdown
[![Ranked #1 on AgentPick](https://agentpick.dev/api/v1/leaderboard/badge/tavily)](https://agentpick.dev/products/tavily)
```
Include a brief note: "Replace `tavily` with any tool slug. Badge auto-updates every 5 minutes."

Render the snippet in a `<pre>` code block with a copy button.

**Done when:** The `/connect` page has a "Leaderboard API" section with the curl one-liner, "Try it" button, and badge Markdown snippet.

---

## Acceptance Criteria

- [ ] `body` defaults to `var(--bg-base)` (dark background) — no white flash on load
- [ ] `--bg-card` → `rgba(255,255,255,0.05)`, `--text-primary` → `#E2E8F0` in `:root`
- [ ] Hero wrapper has `hero-mesh` class; headline + CTA wrapped in `glass-card`
- [ ] Hero headline: `clamp(2.8rem, 5vw, 4.5rem)`, weight 800, `letter-spacing: -0.03em`, `from-white to-orange-400` gradient text
- [ ] All three feature cards have `glass-card gradient-border-card`
- [ ] All pricing tier cards have `glass-card gradient-border-card`; primary card has `hover:shadow-glow-orange`, secondary has `hover:shadow-glow-cyan`
- [ ] `<ScrollReveal>` wraps: stats bar, feature cards (×3), pricing section, "How it works" steps
- [ ] Latency/score/call-count elements on homepage have `data-value` class (JetBrains Mono font)
- [ ] `/connect` API reference shows both `/api/v1/router/usage` (canonical) and `/api/v1/account` (deprecated alias)
- [ ] `/connect` has "Leaderboard API" section with curl one-liner, "Try it" button, and badge Markdown snippet
- [ ] Lighthouse LCP < 2.5s; consistent dark glass on `/`, `/connect`
- [ ] All 51 automated QA checks remain green
- [ ] Zero files from TASK_CLAUDE_CODE.md were modified

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] v-next: dark-glass design system, /connect deprecation docs + leaderboard section, ScrollReveal wiring
```
