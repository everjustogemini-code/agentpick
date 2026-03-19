# TASK_CODEX.md — Cycle 5 (Frontend / UI)

**Agent:** Codex
**Source:** NEXT_VERSION.md (2026-03-18)
**QA baseline:** 51/52 (P1 handled by Claude Code)
**Do NOT touch any file listed in TASK_CLAUDE_CODE.md**

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |
| MODIFY | `src/app/page.tsx` |
| MODIFY | `src/app/connect/page.tsx` |
| MODIFY | `src/app/benchmarks/page.tsx` |
| MODIFY | `src/app/rankings/page.tsx` |
| MODIFY | `src/app/agents/page.tsx` |
| MODIFY | `src/components/dashboard/RouterAnalyticsDashboard.tsx` |
| MODIFY | `src/components/dashboard/UsagePanel.tsx` |

---

## Task 1 — Complete Dark-Glass Design System (Must-Have #2)

### 1a — CSS tokens and body defaults

**File:** `src/app/globals.css`

Add/update these custom properties in `:root`:

```css
:root {
  --bg-base:         #0a0a0f;
  --bg-card:         rgba(255, 255, 255, 0.05);
  --bg-card-hover:   rgba(255, 255, 255, 0.08);
  --text-primary:    #E2E8F0;
  --text-muted:      rgba(255, 255, 255, 0.4);
  --border-glass:    rgba(255, 255, 255, 0.08);
}

body {
  background: var(--bg-base);
  color: var(--text-primary);
}
```

This eliminates the white flash on every page. `--bg-card` replaces the previous value.

### 1b — Glass-card utility class

**File:** `src/app/globals.css`

```css
.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.glass-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
@media (prefers-reduced-motion: reduce) {
  .glass-card:hover { transform: none; }
}

.gradient-border-card {
  border-image: linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(255, 255, 255, 0.08)) 1;
}
```

### 1c — Hero glassmorphism panel + headline

**File:** `src/app/globals.css`

```css
.hero-mesh {
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249, 115, 22, 0.15) 0%, transparent 60%),
    var(--bg-base);
}

.hero-glass-panel {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.headline-gradient {
  font-size: clamp(2.8rem, 5vw, 4.5rem);
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 40%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

Apply `.hero-mesh` to the homepage hero section wrapper and `.hero-glass-panel` to the
frosted panel around the headline + CTA in `src/app/page.tsx`. Apply `.headline-gradient`
to the `<h1>` element.

### 1d — ScrollReveal animation

**File:** `src/app/globals.css`

```css
.scroll-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.scroll-reveal.visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .scroll-reveal,
  .scroll-reveal.visible {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

Wire the IntersectionObserver in the nearest existing client component that loads on every
page (e.g., a site header component or `src/app/layout.tsx` if it already has a `'use client'`
section). Pattern:

```ts
if (typeof window !== 'undefined') {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
    { threshold: 0.15 },
  )
  document.querySelectorAll('.scroll-reveal').forEach(el => io.observe(el))
}
```

Add `scroll-reveal` class to: stat bars, feature cards, and "How it works" steps on every
page (benchmarks, rankings, agents, dashboard, homepage). Previously only homepage had it.

### 1e — Count-up stat animations (homepage only)

**File:** `src/app/page.tsx`

Find the agent-count and calls-routed numeric display elements. Add `data-countup="<final_value>"`
attribute and drive them from a one-shot IntersectionObserver that increments from 0 to the
target value over ~1 second using `requestAnimationFrame`. Skip animation and show final
value immediately when `prefers-reduced-motion` is set. Each counter fires only once per
session (guard with a `data-counted` attribute after first run).

### 1f — CTA shimmer and strategy pill pulse

**File:** `src/app/globals.css`

```css
/* CTA button shimmer sweep */
.btn-shimmer {
  position: relative;
  overflow: hidden;
}
.btn-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.4s ease;
}
.btn-shimmer:hover::after { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .btn-shimmer::after { display: none; }
}

/* Strategy pill pulse */
@keyframes pill-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(249, 115, 22, 0); }
}
.strategy-pill-active {
  animation: pill-pulse 2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .strategy-pill-active { animation: none; }
}
```

Apply `.btn-shimmer` to primary CTA buttons in `src/app/page.tsx`.
Apply `.strategy-pill-active` to the currently selected strategy pill in
`src/app/page.tsx` (or wherever strategy pills are rendered).

Also add gradient fill + glow to the primary CTA:
```css
.btn-primary-gradient {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
}
.btn-primary-gradient:hover {
  transform: scale(1.03);
  box-shadow: 0 0 32px rgba(249, 115, 22, 0.5);
}
@media (prefers-reduced-motion: reduce) {
  .btn-primary-gradient:hover { transform: none; }
}
```

### 1g — Monospace data typography

**File:** `src/app/globals.css`

```css
.data-mono {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
```

Apply the `data-mono` class to latency values, scores, and call counts in:
- `src/app/page.tsx` (homepage stats)
- `src/app/connect/page.tsx` (latency/result counts in playground response panel)
- `src/app/benchmarks/page.tsx` (latency and result-count columns)
- `src/app/rankings/page.tsx` (score columns)
- `src/components/dashboard/RouterAnalyticsDashboard.tsx` (stat tiles)
- `src/components/dashboard/UsagePanel.tsx` (usage numbers)

### 1h — Apply glass-card to feature pages

For each page below, replace or augment existing card/tile wrapper `className` to include
`glass-card` (and optionally `gradient-border-card`). Wrap stat bars and feature cards in
`scroll-reveal`:

| File | Elements to update |
|------|--------------------|
| `src/app/benchmarks/page.tsx` | Domain tiles, benchmark result rows |
| `src/app/rankings/page.tsx` | Category tiles, agent ranking rows |
| `src/app/agents/page.tsx` | Agent directory cards |
| `src/components/dashboard/RouterAnalyticsDashboard.tsx` | Stat tiles |
| `src/components/dashboard/UsagePanel.tsx` | Usage summary rows |

---

## Task 2 — In-Page SDK Playground on /connect (Must-Have #3, frontend half)

**File:** `src/app/connect/page.tsx`

The backend rate-limiting for the demo key is handled by Claude Code in
`src/app/api/v1/playground/run/route.ts`. This task is the entire client-side UI.

### 2a — Tabbed snippet UI

Add a tabbed code snippet component (inline or extracted into a new component only if the
file is already large enough to warrant it — prefer keeping it in `connect/page.tsx`).

**Tabs:** Python | Node.js | cURL (default to cURL)

Use server-side syntax highlighting via **Shiki** (already in the Next.js ecosystem; zero
runtime bundle cost). If Shiki is not yet a dependency, add it.

Snippet content per tab:

**cURL (default):**
```
curl -X POST https://agentpick.dev/api/v1/router/search \
  -H "Authorization: Bearer DEMO_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"query": "summarise a PDF", "domain": "productivity"}'
```

**Python:**
```python
import httpx

resp = httpx.post(
    "https://agentpick.dev/api/v1/router/search",
    headers={"Authorization": "Bearer DEMO_KEY_PLACEHOLDER"},
    json={"query": "summarise a PDF", "domain": "productivity"},
)
print(resp.json())
```

**Node.js:**
```js
const res = await fetch("https://agentpick.dev/api/v1/router/search", {
  method: "POST",
  headers: {
    "Authorization": "Bearer DEMO_KEY_PLACEHOLDER",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: "summarise a PDF", domain: "productivity" }),
});
console.log(await res.json());
```

`DEMO_KEY_PLACEHOLDER` is replaced server-side with the actual `process.env.DEMO_API_KEY`
value (never expose the key in the client bundle — keep it in a Server Component that
passes a sanitised version, or use a `/api/v1/playground/run` wrapper that injects it
server-side).

### 2b — "Try it" run button

Add a `<button>` labelled **"▶ Run"** below the snippet panel.

On click, fire `POST /api/v1/playground/run` with:
```json
{ "apiKey": "<DEMO_API_KEY>", "query": "summarise a PDF", "domain": "productivity" }
```

- Show a loading spinner while the request is in-flight.
- On success, reveal the response panel (see 2c).
- On `429`, show: `"Rate limit reached — try again in {Retry-After}s"`.
- On other error, show the `error.message` from the response body.

### 2c — Live response panel

When the response arrives, reveal a panel below the run button that shows:
- `tool_used` value (highlighted)
- `latency_ms` value (`.data-mono` class, orange colour)
- First 2–3 results: `results[0..2]` as formatted JSON

Simulate streaming by revealing the JSON characters at **8ms/char** using
`setInterval` + a `displayedText` state slice. The full JSON string is available
immediately; only the visual reveal is animated. Reset (collapse) the panel when a new
run starts.

### 2d — Copy-for-project button

Add a **"Copy"** button alongside the snippet. On click:
1. Replace `DEMO_KEY_PLACEHOLDER` with `YOUR_API_KEY` in the copied string.
2. Call `navigator.clipboard.writeText(...)`.
3. Track the event: call a lightweight analytics function (use whatever analytics util is
   already in the project, e.g. `window.analytics?.track('playground_copy', { tab })`).
4. Show a brief "Copied!" confirmation label for 1.5s then revert to "Copy".

---

## Verification Checklist

- [ ] `body` uses `var(--bg-base)` — no white flash on any page
- [ ] `--bg-base`, `--bg-card`, `--text-primary` tokens defined in `:root`
- [ ] `.glass-card` with hover lift and `prefers-reduced-motion` guard in globals.css
- [ ] `.hero-glass-panel` applied to homepage hero frosted panel
- [ ] `.headline-gradient` applied to homepage `<h1>`
- [ ] `.scroll-reveal → .visible` IntersectionObserver wired site-wide (not homepage-only)
- [ ] Count-up animation on homepage agent-count and calls-routed stats, one-shot per session
- [ ] `.btn-shimmer` and `.btn-primary-gradient` on primary CTAs
- [ ] `.strategy-pill-active` pulse on active strategy pill
- [ ] `.data-mono` on latency/score/count values across /, /connect, /benchmarks, /rankings, /dashboard
- [ ] `glass-card` applied to cards/tiles on benchmarks, rankings, agents, dashboard pages
- [ ] `/connect` has Python / Node.js / cURL tabbed playground
- [ ] "▶ Run" button fires real search; response panel shows within 2s
- [ ] Characters in response panel revealed at 8ms/char simulated streaming
- [ ] Copy button replaces demo key with `YOUR_API_KEY` and copies to clipboard
- [ ] 429 rate-limit error handled gracefully in UI (not a crash)
- [ ] Zero overlap with files in TASK_CLAUDE_CODE.md

---

## DO NOT TOUCH (owned by Claude Code)

- `next.config.ts`
- `src/app/api/v1/register/route.ts` (new file Claude Code creates)
- `src/app/api/v1/playground/run/route.ts`
- `src/lib/rate-limit.ts` (new file Claude Code creates)
- Any other file under `src/app/api/`
