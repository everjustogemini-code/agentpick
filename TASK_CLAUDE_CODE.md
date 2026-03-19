# TASK_CLAUDE_CODE.md — v-next Cycle 2
**Agent:** Claude Code (CSS infrastructure + homepage page.tsx)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md v-next

---

## Status Check

All backend API routes are **already implemented** from Cycle 1:
- `src/app/api/v1/account/route.ts` — ✅ 200 + `Deprecation: true` header + `_note` field
- `src/app/api/v1/leaderboard/route.ts` — ✅ unauthenticated, rate-limited, 5-min cache, CORS
- `src/app/api/v1/leaderboard/badge/[slug]/route.ts` — ✅ SVG, ETag, CORS

Your job is **CSS global tokens** and **homepage `page.tsx`** only.

---

## Coverage

| NEXT_VERSION.md Item | This agent's scope |
|---|---|
| Item 2 — Dark-Glass Design System (global tokens) | `src/app/globals.css`: body bg, `--bg-card`, `--text-primary` |
| Item 2 — Hero section, stats ScrollReveal, headline upgrade | `src/app/page.tsx` |

---

## Files Owned — Codex MUST NOT touch these

| Action | File |
|---|---|
| **MODIFY** | `src/app/globals.css` |
| **MODIFY** | `src/app/page.tsx` |

> **DO NOT TOUCH:** `src/app/connect/page.tsx`, any file under `src/components/`, or any file under `src/app/api/`.

---

## Task 1 — `src/app/globals.css`: Activate Dark Theme as Default

**Exact changes (3 lines total):**

1. Find the `body` rule. Change the background value:
   - **Before:** `background: var(--bg-primary)` (or `background-color: var(--bg-primary)`)
   - **After:** `background: var(--bg-base)`

2. In the `:root` block, update two existing token values:
   - `--bg-card: #FFFFFF;` → `--bg-card: rgba(255, 255, 255, 0.05);`
   - `--text-primary: #0A0A0A;` → `--text-primary: #E2E8F0;`

`--bg-base: #0a0a0f` is already defined in `:root` (around line 63). Do not add a new declaration — just update the three values listed above.

---

## Task 2 — `src/app/page.tsx`: Hero Upgrade + Stats ScrollReveal

Read the file. Make these targeted changes:

### 2a — Outer wrapper background (line ~126)

```tsx
// Before:
<div className="min-h-screen bg-bg-primary">

// After:
<div className="min-h-screen bg-[#0a0a0f]">
```

### 2b — Headline upgrade (lines ~156–164)

Find the `<h1>` hero headline. Replace the current `fontSize` style and gradient span:

```tsx
// Before:
<h1
  className="mb-5 font-extrabold leading-[1.05] tracking-tight text-text-primary"
  style={{ fontSize: 'clamp(38px, 5vw, 56px)', maxWidth: 700 }}
>
  Your agent is picking tools blindly.{' '}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-purple">
    We fix that.
  </span>
</h1>

// After:
<h1
  className="mb-5 font-extrabold leading-[1.05] text-white"
  style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: 800, letterSpacing: '-0.03em', maxWidth: 700 }}
>
  Your agent is picking tools blindly.{' '}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-400">
    We fix that.
  </span>
</h1>
```

### 2c — Wrap headline + CTA in glass-card panel

Wrap the `<h1>`, the subtitle `<p>`, and the CTA `<div>` (containing the "Get API key" and "Try the router" buttons) in a glass-card div:

```tsx
<div className="glass-card rounded-2xl p-8 mb-6">
  {/* h1 here */}
  {/* subtitle p here */}
  {/* CTA buttons div here */}
</div>
```

### 2d — Stats bar: wire ScrollReveal

`ScrollReveal` is already imported at the top of the file. Locate the data-flywheel stats div (the `<div className="mb-6 rounded-xl border border-border bg-bg-card/50 ...">` block). Wrap it:

```tsx
<ScrollReveal>
  {/* existing stats div */}
</ScrollReveal>
```

### 2e — How It Works: wire ScrollReveal

Locate the `<HowItWorks />` component render (or inline "How it works" section) in `page.tsx`. Wrap it:

```tsx
<ScrollReveal>
  <HowItWorks />
</ScrollReveal>
```

---

## Acceptance Criteria

- [ ] No white flash on load — body background is `#0a0a0f` (var(--bg-base))
- [ ] `--bg-card` is `rgba(255,255,255,0.05)` and `--text-primary` is `#E2E8F0` in `:root`
- [ ] Hero outer div uses `bg-[#0a0a0f]` instead of `bg-bg-primary`
- [ ] Headline: `clamp(2.8rem, 5vw, 4.5rem)`, weight 800, `letterSpacing: '-0.03em'`
- [ ] Headline gradient: `from-white to-orange-400` (not `from-accent to-accent-purple`)
- [ ] Headline + CTA buttons wrapped in `glass-card rounded-2xl p-8` div
- [ ] Stats bar wrapped in `<ScrollReveal>`
- [ ] HowItWorks wrapped in `<ScrollReveal>`
- [ ] `src/app/connect/page.tsx` NOT modified
- [ ] No files under `src/components/` modified
- [ ] No files under `src/app/api/` modified

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] v-next cycle 2: dark-glass CSS tokens + homepage hero upgrade + ScrollReveal wiring
```
