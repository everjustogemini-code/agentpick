# TASK_CODEX.md — cycle 18
**Agent:** Codex
**Date:** 2026-03-19
**QA baseline:** 50/51 — P1 open (embed B.1 failing)
**Target:** 51/51
**Scope:** Must-Have #1 connect-page audit + Must-Have #2 UI upgrade + Must-Have #3 frontend (/connect section + nav callout)
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## Context: What Is Confirmed Done (do NOT redo)

- `src/app/globals.css` — glassmorphism CSS classes exist (`glass-card`, `hero-gradient-mesh`, `neon-glow`, `reveal-hidden`, `reveal-visible`, `terminal-cursor`, `gradient-underline`) ✓
- `src/app/page.tsx` line 172: `glass-card` applied to one section ✓
- `src/components/SiteHeader.tsx` — has `backdropFilter: blur(12px)` on scroll ✓
- `agentpick-router-qa.py` embed B.1 fix → **TASK_CLAUDE_CODE** (do not touch)
- `src/app/api/v1/chat/completions/route.ts` → **TASK_CLAUDE_CODE** (do not touch)

---

## Task 1 — Audit `/connect` Page for Stale Tool IDs (Must-Have #1)

**File:** `src/app/connect/page.tsx`

1. Search for any occurrence of `voyage-ai` (as slug, display name, tool ID, or in code examples):
   ```bash
   grep -n "voyage-ai" src/app/connect/page.tsx
   ```
2. Replace each with `voyage-embed`.
3. Also scan `src/components/ConnectTabs.tsx` (same search + replace).

**Acceptance:** `grep "voyage-ai" src/app/connect/page.tsx src/components/ConnectTabs.tsx` → 0 hits.

---

## Task 2 — Complete Glassmorphism + Micro-Animations (Must-Have #2)

CSS classes already exist in `globals.css`. **Do NOT modify `globals.css`.** Apply classes where still missing.

### 2a — Pricing card glassmorphism

**File:** `src/components/PricingSection.tsx`
- Find the outer `<div>` wrapper for each pricing tier card. Add `glass-card` to its `className`.
- Same for any feature-comparison card containers in the same file.

**File:** `src/components/PricingPageClient.tsx`
- Apply `glass-card` to each pricing tier box on the `/pricing` page.

**File:** `src/app/pricing/page.tsx`
- If this file renders its own card wrappers (not delegating entirely to PricingPageClient), apply `glass-card` there too.

### 2b — Hero section: gradient mesh + heading size + gradient underline + CTA glow

**File:** `src/app/page.tsx`

The `glass-card` is already applied at line 172. The following are still missing:

1. **Hero background mesh:** Find the outermost hero section `<div>` and add `hero-gradient-mesh` to its `className`. The class uses `@keyframes hero-drift` (already in globals.css).

2. **Hero `<h1>` size:** Find the hero heading and add inline style:
   ```tsx
   style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }}
   ```

3. **Gradient underline on key phrase:** Identify the key value phrase in the hero heading (e.g., "We fix that." or the product tagline). Wrap it:
   ```tsx
   <span className="gradient-underline">key phrase here</span>
   ```
   (`gradient-underline` class is in globals.css.)

4. **CTA glow pulse:** Find the primary CTA button/link in the hero. Add `neon-glow` (or `cta-glow` if present) to its `className` alongside existing classes.

### 2c — Section scroll reveal (IntersectionObserver)

**File:** `src/app/page.tsx`

Add a single `useEffect` that wires `IntersectionObserver` fade-up reveals:

```tsx
useEffect(() => {
  const targets = document.querySelectorAll<HTMLElement>(
    ".feature-card, .pricing-card, .api-carousel-item"
  );
  targets.forEach(el => el.classList.add("reveal-hidden"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-hidden");
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach(el => observer.observe(el));
  return () => observer.disconnect();
}, []);
```

**Constraints:** No animation libraries. Vanilla JS only. Respect `prefers-reduced-motion`. Lighthouse perf ≥ 90. CLS < 0.1.

### 2d — Terminal callout upgrade

**File:** `src/components/HeroCodeBlock.tsx`

Upgrade the existing `pip install agentpick` block to a minimal terminal window:

1. **Titlebar row** with three colored dot buttons (no functionality):
   - Red `#ff5f57`, yellow `#febc2e`, green `#28c840` (each `12×12px` circle via `border-radius: 50%`).

2. **Monospace prompt line:** `$ pip install agentpick` followed by `<span className="terminal-cursor" />` (class already in globals.css — blinking green cursor).

3. **Typewriter effect via `useEffect` + `setTimeout` (no libraries):**
   - Step 1 (on mount): reveal `$ pip install agentpick` character-by-character at ~50ms/char.
   - Step 2 (1.8s after step 1 completes): append `Successfully installed agentpick-x.x.x` with cursor at end.

### 2e — Live-stat count-up animation

**File:** `src/components/StatsBar.tsx`

Wrap each stat counter with an `IntersectionObserver` count-up:
- On first scroll-enter: animate from `0` to actual value over `1.2s` using `requestAnimationFrame`.
- One-shot (disconnect after first trigger).
- Only animate numeric text value — no layout-triggering property changes (CLS constraint).

---

## Task 3 — OpenAI-Compatible Drop-In: Frontend Section + Nav Callout (Must-Have #3)

The backend endpoint `POST /v1/chat/completions` is being built by **TASK_CLAUDE_CODE**. Your job is the frontend surface.

### 3a — Add "Drop-in for OpenAI SDK" section to /connect page

**File:** `src/app/connect/page.tsx` (and/or `src/components/ConnectTabs.tsx` if tabs are managed there)

Add a new section/tab titled **"Drop-in for OpenAI SDK"** that includes:

1. **2-line diff block** showing the `baseURL` swap:
   ```diff
   - const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   + const openai = new OpenAI({ baseURL: "https://agentpick.dev", apiKey: "ap_xxx" });
   ```
   Style with a dark `<pre>` block; red line for removal, green line for addition.

2. **Short explanation text:** "No SDK migration needed — swap `baseURL` and your existing OpenAI tool calls are automatically routed to the best available agent tool."

3. **Supported frameworks pill row:** LangChain, CrewAI, AutoGen, LlamaIndex (static `<span>` badges, no links required).

### 3b — Add nav callout under developer docs

**File:** `src/components/SiteHeader.tsx`

Under the existing developer docs nav item (or in the dropdown/menu where docs are linked), add a small callout/badge:

- Text: **"OpenAI-compatible"** with an `→` or arrow icon.
- Link to: `/connect` (or the specific tab anchor if tabs are implemented with hash routing).
- Style as a subtle highlighted chip (use existing `glass-card` + small font, or an orange `bg-orange-500/10 text-orange-400` badge — match existing color scheme).
- If adding this to the sticky nav header risks breaking the backdrop blur already in place, add the callout to a dropdown/menu overlay instead.

---

## Files Owned by CODEX This Cycle

| Action | File |
|--------|------|
| Verify/modify | `src/app/connect/page.tsx` |
| Verify/modify | `src/components/ConnectTabs.tsx` |
| Modify | `src/components/PricingSection.tsx` |
| Modify | `src/components/PricingPageClient.tsx` |
| Modify (if needed) | `src/app/pricing/page.tsx` |
| Modify | `src/app/page.tsx` |
| Modify | `src/components/HeroCodeBlock.tsx` |
| Modify | `src/components/StatsBar.tsx` |
| Modify | `src/components/SiteHeader.tsx` |

**DO NOT touch** (Claude Code-owned this cycle):
- `agentpick-router-qa.py`
- `src/lib/router/index.ts`
- `src/lib/ops/service-probes.ts`
- `src/__tests__/router-registry-sync.test.ts`
- `src/app/api/v1/chat/completions/route.ts` (new file, Claude Code creates)
- `src/app/globals.css` (complete, do not modify)
- `src/app/api/**` (all other API routes)
- `prisma/schema.prisma`
- `src/lib/router/**`

---

## Coverage Verification — Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1 — QA B.1 embed test; `valid_embed_tools`; 51/51 | TASK_CLAUDE_CODE Task 1a |
| Must-Have #1 — Cohere-embed skip reason in ops logs | TASK_CLAUDE_CODE Task 1b |
| Must-Have #1 — Remove cohere-embed from registry if retired | TASK_CLAUDE_CODE Task 1c |
| Must-Have #1 — CI lint pins embed registry against QA allowlist | TASK_CLAUDE_CODE Task 1d |
| Must-Have #1 — Audit `/connect` page for `voyage-ai` copy | **Task 1 (this file)** |
| Must-Have #2 — Glassmorphism pricing + feature cards | **Task 2a (this file)** |
| Must-Have #2 — Hero animated gradient mesh | **Task 2b (this file)** |
| Must-Have #2 — Hero heading size + line-height + letter-spacing | **Task 2b (this file)** |
| Must-Have #2 — Gradient underline on key value phrase | **Task 2b (this file)** |
| Must-Have #2 — CTA glow pulse | **Task 2b (this file)** |
| Must-Have #2 — Sticky nav frosted glass on scroll | already done in SiteHeader ✓ |
| Must-Have #2 — Terminal callout typewriter effect | **Task 2d (this file)** |
| Must-Have #2 — Live-stat count-up on scroll-enter | **Task 2e (this file)** |
| Must-Have #2 — IntersectionObserver fade-up section reveals | **Task 2c (this file)** |
| Must-Have #3 — `POST /v1/chat/completions` new backend route | TASK_CLAUDE_CODE Task 2a |
| Must-Have #3 — Calls recorded in DB | TASK_CLAUDE_CODE Task 2a |
| Must-Have #3 — `/connect` page "Drop-in for OpenAI SDK" section | **Task 3a (this file)** |
| Must-Have #3 — Nav callout under developer docs | **Task 3b (this file)** |

All 3 Must-Haves from NEXT_VERSION.md are fully covered. No item left behind.

---

## Acceptance Criteria

- [ ] `grep "voyage-ai" src/app/connect/page.tsx src/components/ConnectTabs.tsx` → 0 hits
- [ ] Pricing tier cards have `glass-card` glassmorphism styling visible
- [ ] Hero section: gradient mesh animating, heading uses `clamp(3rem, 6vw, 5rem)`, key phrase has gradient underline
- [ ] Primary CTA button has glow pulse (`neon-glow` / `cta-glow`)
- [ ] Terminal callout shows titlebar dots + typewriter: `$ pip install agentpick` → success line
- [ ] Live-stat counters animate count-up on first scroll-enter (1.2s)
- [ ] Feature/pricing cards fade up on scroll-enter (400ms, `reveal-hidden` → `reveal-visible`)
- [ ] Lighthouse perf ≥ 90; CLS < 0.1
- [ ] `/connect` has "Drop-in for OpenAI SDK" section with 2-line `baseURL` diff
- [ ] SiteHeader has "OpenAI-compatible" nav callout linking to `/connect`
- [ ] PM screenshot review passes on 375px mobile and 1440px desktop

---

## Progress Log

After each task, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] <brief description>
```
