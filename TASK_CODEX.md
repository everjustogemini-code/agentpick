# TASK_CODEX.md — cycle 17

**Agent:** Codex
**Date:** 2026-03-19
**QA baseline:** 53/54 — P1-1 open (embed B.1 test failing)
**Target:** 54/54
**Scope:** Must-Have #2 UI upgrade (remaining) + Must-Have #3 frontend (quickstart page + homepage CTA) + Must-Have #1 connect page audit
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## Context: What Is Confirmed Done (do NOT redo)

- `src/app/globals.css`: glassmorphism CSS classes already added (`glass-card`, `hero-gradient-mesh`, `neon-glow`, `reveal-hidden`, `terminal-cursor`, `reveal-visible`) ✓
- `src/app/page.tsx` line 172: `glass-card` applied to one section ✓
- `src/components/SiteHeader.tsx`: has `backdropFilter: blur(12px)` on the header ✓
- `POST /api/v1/quickstart/issue` backend endpoint exists ✓
- `src/__tests__/router-registry-sync.test.ts` CI assertion — exists and passes ✓
- `agentpick-router-qa.py` embed B.1 fix → **assigned to TASK_CLAUDE_CODE this cycle** (do not touch)

---

## Task 1 — Audit `/connect` Page for `voyage-ai` Copy (Must-Have #1)

**File:** `src/app/connect/page.tsx`

Search for any occurrence of `voyage-ai` used as a slug, display name, tool ID, or in code examples. Replace each with `voyage-embed`.

```bash
grep -n "voyage-ai" src/app/connect/page.tsx
```

Currently zero hits — verify and confirm. If any hits appear, replace them.

**Acceptance:** `grep "voyage-ai" src/app/connect/page.tsx` → 0 results.

---

## Task 2 — Complete Glassmorphism + Micro-Animations (Must-Have #2, remaining work)

CSS classes (`glass-card`, `hero-gradient-mesh`, `neon-glow`, `reveal-hidden`, `reveal-visible`, `terminal-cursor`) already exist in `src/app/globals.css`. Do NOT modify `globals.css`. Apply the classes where they are still missing.

### 2a — Pricing card glassmorphism

**File:** `src/components/PricingSection.tsx`

Find the outer `<div>` wrapper for each pricing tier card and add `glass-card` to its `className`. Same for any feature-comparison card containers.

**File:** `src/components/PricingPageClient.tsx`

Apply `glass-card` to each pricing tier box on the `/pricing` page.

**File:** `src/app/pricing/page.tsx`

If this page renders its own card wrappers, apply `glass-card` there too.

### 2b — Hero section: gradient mesh + heading style + gradient underline + cta-glow

**File:** `src/app/page.tsx`

The `glass-card` is already applied at line 172. The following are still missing:

1. **Hero background mesh**: Find the outermost hero section wrapper `<div>` and add `hero-gradient-mesh` to its `className` (or wrap the background element with it). The class animates via the `@keyframes hero-drift` already in globals.css.

2. **Hero `<h1>` size**: Find the hero heading and add inline style: `style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }}`.

3. **Gradient underline on "We fix that."**: The heading already renders "We fix that." — wrap it in `<span className="gradient-underline">We fix that.</span>` (class already in globals.css).

4. **CTA glow pulse**: Find the `btn-shimmer` primary CTA button in the hero and add `cta-glow` to its `className` alongside the existing classes.

### 2c — Section scroll reveal (IntersectionObserver)

**File:** `src/app/page.tsx`

Add a single `IntersectionObserver` (in a `useEffect`) that:
- On mount: queries section entry containers (feature cards, pricing cards, API carousel) and adds `reveal-hidden` to each.
- On each element entering the viewport: swaps `reveal-hidden` → `reveal-visible`.
- Disconnects the observer for each element after it reveals (one-shot).

The CSS transition is already in globals.css (`reveal-visible { transition: opacity 400ms ease-out, transform 400ms ease-out }`).

**Constraint:** No animation libraries. Vanilla JS only. Lighthouse perf ≥ 90. CLS < 0.1.

### 2d — Terminal callout upgrade

**File:** `src/components/HeroCodeBlock.tsx`

Upgrade the existing `pip install agentpick` block to a minimal terminal window:

1. Add a decorative titlebar row with three colored dot buttons:
   - Red `#ff5f57`, yellow `#febc2e`, green `#28c840` (each 12×12px circle, no functionality).
2. Add a monospace prompt line: `$ pip install agentpick` followed by `<span className="terminal-cursor" />` (class already in globals.css — blinking green cursor).
3. Add typewriter effect via `useEffect` + `setTimeout` (no libraries):
   - Step 1 (on mount): reveal `$ pip install agentpick` character by character at ~50ms/char.
   - Step 2 (1.8s after step 1 completes): append a second line `Successfully installed agentpick-x.x.x` with the cursor moving to end.
4. No third-party libraries.

### 2e — Live-stat count-up animation

**File:** `src/components/StatsBar.tsx`

Wrap each stat counter with an `IntersectionObserver` count-up effect:
- On scroll-enter: animate from 0 to the actual value over 1.2s using `requestAnimationFrame`.
- Disconnect observer after first trigger (one-shot).
- Only animate `opacity` / `transform` — no layout-triggering properties (CLS constraint).

---

## Task 3 — New `/quickstart` Page + Homepage CTA (Must-Have #3 frontend)

### 3a — Create `/quickstart` page

**File to CREATE:** `src/app/quickstart/page.tsx`

A single `'use client'` page with 3 inline steps. No page reloads between steps. The backend endpoint `POST /api/v1/quickstart/issue` already exists and accepts `{ email, source }`.

**Step 1 — Get a key:**
```tsx
// Email <input> + "Generate free key" <button>
// On submit: POST /api/v1/quickstart/issue with { email, source }
//   - Read ?source from useSearchParams() (default: "quickstart")
// Display returned apiKey in a <code> block with a copy-to-clipboard button
//   (navigator.clipboard.writeText(apiKey))
// Store apiKey in React state
```

**Step 2 — Pick a capability:**
- Three large pill `<button>` elements: **Search** / **Crawl** / **Embed**.
- Clicking one updates `selectedCapability` in React state. Default: `"search"`.
- Updates the curl snippet in Step 3 in real time (no reload).

**Step 3 — Run it in the browser:**
- `<pre>` code block showing a curl snippet:
  - Shows `YOUR_KEY` placeholder until key is issued; replaced with actual `apiKey` once available.
  - Endpoint mapped from capability: `search` → `/api/v1/route/search`, `crawl` → `/api/v1/route/crawl`, `embed` → `/api/v1/route/embed`.
- **"Run in browser"** button: fires `fetch()` to the selected endpoint with the issued key.
- JSON response rendered in a `<pre>` output panel using `JSON.stringify(data, null, 2)` (no third-party syntax highlighter).
- On HTTP 200: green `"✓ It works!"` banner + `<Link href="/connect">View full docs →</Link>`.
- On error: red banner with the HTTP status + error message.

### 3b — Homepage CTA wiring

**File:** `src/app/page.tsx`

1. Find the secondary CTA button/link in the hero section (currently labeled "Try the router" or "View Docs" pointing to `/connect`).
2. Change its label to **"Get started free →"**.
3. Change its `href` to `/quickstart?source=quickstart_homepage`.

The `/quickstart` page reads `?source` from search params and passes it to `POST /api/v1/quickstart/issue`. The backend (TASK_CLAUDE_CODE Task 2) already supports `source=quickstart_homepage` as a valid value.

---

## Files Owned by CODEX This Cycle

| Action | File |
|--------|------|
| Verify/modify | `src/app/connect/page.tsx` |
| Modify | `src/components/PricingSection.tsx` |
| Modify | `src/components/PricingPageClient.tsx` |
| Modify | `src/app/pricing/page.tsx` |
| Modify | `src/app/page.tsx` |
| Modify | `src/components/HeroCodeBlock.tsx` |
| Modify | `src/components/StatsBar.tsx` |
| Create | `src/app/quickstart/page.tsx` |

**DO NOT touch** (Claude Code-owned this cycle):
- `agentpick-router-qa.py` ← Claude Code Task 1 this cycle
- `src/app/api/v1/quickstart/issue/route.ts` ← Claude Code Task 2 this cycle
- `src/__tests__/router-registry-sync.test.ts` (complete, do not modify)
- `src/app/globals.css` (complete, do not modify)
- `src/app/api/**` (all other API routes)
- `prisma/schema.prisma`
- `src/lib/router/**`

---

## Coverage Verification — Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1 — QA B.1 embed test; `valid_embed_tools = ["voyage-embed"]`; 54/54 | TASK_CLAUDE_CODE Task 1 |
| Must-Have #1 — `/connect` page copy: audit `voyage-ai` references | **Task 1 (this file)** |
| Must-Have #1 — CI assertion: `CAPABILITY_TOOLS.embed[0]` pinned to QA allowlist | Done in cycle 16 ✓ |
| Must-Have #2 — Glassmorphism pricing cards + feature cards | **Task 2a (this file)** |
| Must-Have #2 — Hero animated gradient mesh | **Task 2b (this file)** |
| Must-Have #2 — Hero heading size + line-height + `letter-spacing` | **Task 2b (this file)** |
| Must-Have #2 — Gradient underline on "We fix that." | **Task 2b (this file)** |
| Must-Have #2 — Neon glow CTA pulse (replace shimmer) | **Task 2b (this file)** |
| Must-Have #2 — Sticky nav frosted glass on scroll | already done in SiteHeader ✓ |
| Must-Have #2 — Terminal callout typewriter effect | **Task 2d (this file)** |
| Must-Have #2 — Live-stat count-up on scroll-enter | **Task 2e (this file)** |
| Must-Have #2 — IntersectionObserver fade-up section reveals | **Task 2c (this file)** |
| Must-Have #3 — `/quickstart` page (Step 1 key issue, Step 2 capability pill, Step 3 run) | **Task 3a (this file)** |
| Must-Have #3 — Homepage secondary CTA → "Get started free →" → `/quickstart` | **Task 3b (this file)** |
| Must-Have #3 — Keys tagged `source=quickstart` in DB | backend already implemented ✓ |
| Must-Have #3 — Keys tagged `source=quickstart_homepage` for homepage funnel | TASK_CLAUDE_CODE Task 2 |
| Must-Have #3 — `POST /api/v1/quickstart/issue` endpoint | backend already implemented ✓ |

All 3 Must-Haves from NEXT_VERSION.md are fully covered. No item left behind.

---

## Acceptance Criteria

- [ ] `grep -n "voyage-ai" src/app/connect/page.tsx` → zero hits
- [ ] PM screenshot review: `glass-card` visible on pricing tier cards
- [ ] Hero heading uses `clamp(3rem, 6vw, 5rem)`, gradient mesh animating, "We fix that." has gradient underline
- [ ] Hero primary CTA has `cta-glow` pulse (no shimmer)
- [ ] Terminal callout shows titlebar dots + typewriter: `$ pip install agentpick` → success line
- [ ] Live-stat counters count up on first scroll-enter (1.2s)
- [ ] Feature/pricing section cards fade up on scroll-enter (400ms)
- [ ] Lighthouse performance ≥ 90; CLS < 0.1
- [ ] `/quickstart` page: email → key issued in-page → capability pill selected → curl snippet updates → "Run" fires real request → "✓ It works!" banner
- [ ] Homepage secondary CTA reads **"Get started free →"** and links to `/quickstart?source=quickstart_homepage`

---

## Progress Log

After each task, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] <brief description>
```
