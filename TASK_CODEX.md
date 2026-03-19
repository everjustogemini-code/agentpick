# TASK_CODEX.md — Cycle 6 (Frontend / UI + QA fix)

**Agent:** Codex
**Source:** NEXT_VERSION.md (2026-03-18)
**QA baseline:** 50/51 — P1 fix here brings it to 51/51
**Do NOT touch any file listed in TASK_CLAUDE_CODE.md**

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `agentpick-router-qa.py` |
| MODIFY | `src/app/globals.css` |
| MODIFY | `src/app/page.tsx` |
| MODIFY | `src/app/connect/page.tsx` |
| MODIFY | `src/app/benchmarks/page.tsx` |
| MODIFY | `src/app/rankings/page.tsx` |
| MODIFY | `src/app/agents/page.tsx` |
| MODIFY | `src/app/dashboard/page.tsx` |

---

## Task 1 — Fix P1: QA Script `voyage-ai` → `voyage-embed` (Must-Have #1)

**File:** `agentpick-router-qa.py`

The QA suite currently tests rate limits and permalinks but is missing an assertion for the
embed route. Add a new test class at the bottom of the file (before `if __name__ == "__main__"`)
that validates the embed endpoint returns a supported tool name:

```python
class TestEmbedRoute(unittest.TestCase):

    def test_embed_tool_name(self):
        """B.1-embed — POST /api/v1/route/embed must return a valid embed tool name."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={"params": {"query": "embed this text"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        valid = ["cohere-embed", "voyage-embed", "jina-embeddings"]   # voyage-embed (not voyage-ai)
        self.assertIn(
            body.get("tool_used"),
            valid,
            f"Expected tool_used in {valid}, got: {body.get('tool_used')}",
        )
```

**Key change:** the valid list uses `"voyage-embed"` (not `"voyage-ai"`). The backend was
renamed in a prior cycle; this test was never written. After this change the suite reports
**51/51**.

### Acceptance
```bash
python agentpick-router-qa.py
# Expected: Ran 5 tests ... OK
```

---

## Task 2 — Complete Dark-Glass Design System (Must-Have #2)

### 2a — CSS tokens, body defaults, and glass-card utility

**File:** `src/app/globals.css`

Ensure these tokens exist in `:root` (add or update — do not duplicate if already present):

```css
:root {
  --bg-base:           #0a0a0f;
  --bg-surface:        rgba(255, 255, 255, 0.04);
  --bg-surface-hover:  rgba(255, 255, 255, 0.07);
  --glass-bg:          rgba(255, 255, 255, 0.04);
  --glass-border:      rgba(255, 255, 255, 0.12);
  --glass-blur:        blur(16px);
}

body {
  background: var(--bg-base);
  color: #E2E8F0;
}
```

Add or update the `.glass-card` utility (the current definition at line ~518 only has
`blur(4px)` — upgrade to 16px and add hover lift):

```css
.glass-card {
  background:            var(--glass-bg);
  border:                1px solid var(--glass-border);
  border-radius:         12px;
  backdrop-filter:       var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.glass-card:hover {
  background:   var(--bg-surface-hover);
  transform:    translateY(-4px);
  box-shadow:   0 8px 32px rgba(0, 0, 0, 0.4);
}
@media (prefers-reduced-motion: reduce) {
  .glass-card:hover { transform: none; }
}
```

### 2b — Hero depth upgrade

**File:** `src/app/globals.css`

Add:

```css
.hero-glow-orb {
  position: absolute;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47, 233, 43, 0.08) 0%, transparent 70%);
  pointer-events: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
  z-index: 0;
}

.headline-gradient {
  font-size:      clamp(2.8rem, 5vw, 4.5rem);
  font-weight:    800;
  letter-spacing: -1.5px;
  background:     linear-gradient(135deg, #2fe92b 0%, #00d4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**File:** `src/app/page.tsx`

- Add a `<div className="hero-glow-orb" aria-hidden="true" />` inside the hero section
  container (position the container `relative` if not already).
- Apply `.headline-gradient` to the `<h1>` primary value-prop phrase.

### 2c — ScrollReveal — wire to all pages

**File:** `src/app/globals.css`

Update `.scroll-reveal` / `.scroll-reveal.visible` (currently defined at ~line 263):

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

The IntersectionObserver that adds `.visible` is currently homepage-only.
Add a `<script>` tag (or a `useEffect` in a shared layout client component) that runs it
on every page with **60 ms sibling stagger**:

```ts
// Run after DOM ready (e.g. in a useEffect in src/app/layout.tsx or a shared ClientInit component)
if (typeof window !== 'undefined' && !window.__scrollRevealInit) {
  window.__scrollRevealInit = true;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const siblings = Array.from(
            (e.target.parentElement?.querySelectorAll('.scroll-reveal') ?? [])
          );
          const idx = siblings.indexOf(e.target as Element);
          (e.target as HTMLElement).style.transitionDelay = `${idx * 60}ms`;
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.15 },
  );
  document.querySelectorAll('.scroll-reveal').forEach((el) => io.observe(el));
}
```

Add `scroll-reveal` class to stat bars, feature cards, and "How it works" step blocks in:
- `src/app/benchmarks/page.tsx` — benchmark domain tiles, result rows
- `src/app/rankings/page.tsx` — category tiles, ranking rows
- `src/app/agents/page.tsx` — agent directory cards
- `src/app/dashboard/page.tsx` — stat tiles

### 2d — Count-up stats on homepage

**File:** `src/app/page.tsx`

Find the "agent count" and "calls routed" stat display elements. Animate them from 0 to
their final value on first viewport entry using `IntersectionObserver` + `requestAnimationFrame`
(~1 second duration). Rules:

- One-shot: after the animation fires, set a `sessionStorage` flag (`countup_fired`) so
  refreshing the same tab skips the animation and shows the final value immediately.
- `prefers-reduced-motion`: skip animation entirely, show final value directly.
- Use `data-countup="<finalValue>"` on each stat element; drive the counter from a shared
  helper so the same function works for both stats.

### 2e — Micro-interactions (CTA shimmer + strategy pulse)

**File:** `src/app/globals.css`

Add:

```css
/* CTA shimmer sweep — 600ms */
.btn-shimmer {
  position: relative;
  overflow: hidden;
}
.btn-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}
@media (prefers-reduced-motion: no-preference) {
  .btn-shimmer:hover::after { transform: translateX(100%); }
}

/* Strategy pill subtle pulse */
@keyframes strategy-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(47, 233, 43, 0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(47, 233, 43, 0); }
}
@media (prefers-reduced-motion: no-preference) {
  .strategy-pill-active {
    animation: strategy-pulse 2.4s ease-in-out infinite;
  }
}
```

**File:** `src/app/page.tsx`

- Apply `.btn-shimmer` to the primary CTA button(s).
- Apply `.strategy-pill-active` to the currently-selected strategy pill element.

### 2f — Monospace data typography

**File:** `src/app/globals.css`

Add:

```css
.data-mono {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
```

Apply `.data-mono` to latency values, scores, and call counts in:
- `src/app/page.tsx` — homepage stat numbers
- `src/app/benchmarks/page.tsx` — latency and result-count columns
- `src/app/rankings/page.tsx` — score columns
- `src/app/dashboard/page.tsx` — stat tile numbers

### 2g — Apply `glass-card` to feature pages

Add `glass-card` to the outermost wrapper `className` of cards/tiles/rows in:

| File | Elements |
|------|----------|
| `src/app/benchmarks/page.tsx` | Benchmark domain tiles; benchmark result rows |
| `src/app/rankings/page.tsx` | Category tiles; agent ranking rows |
| `src/app/agents/page.tsx` | Agent directory cards |
| `src/app/dashboard/page.tsx` | Stat tiles; summary cards |
| `src/app/connect/page.tsx` | Strategy blocks |

---

## Task 3 — MCP Tab on `/connect` page (Must-Have #3, frontend)

**File:** `src/app/connect/page.tsx`

The current "Or add as an MCP server:" block (~lines 273–284) shows the config
**without** an Authorization header. Update it to show the full config including auth,
and wrap it in a clearly-labelled "MCP" section:

Replace the existing MCP code block content:
```json
{
  "mcpServers": {
    "agentpick": {
      "url": "https://agentpick.dev/mcp"
    }
  }
}
```

With the new format that includes the Authorization header:
```json
{
  "mcpServers": {
    "agentpick": {
      "url": "https://agentpick.dev/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

Also add an explanatory label above the block:

```tsx
<div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
  Claude Desktop / Cursor / Windsurf / Zed
</div>
<h3 className="mb-2 text-sm font-semibold text-white">
  MCP config — one-line integration
</h3>
<p className="mb-3 text-[13px] text-white/50">
  Paste into your MCP config file. Replace{' '}
  <code className="rounded bg-white/[0.06] px-1 text-accent-green">YOUR_API_KEY</code>
  {' '}with your key from{' '}
  <a href="/dashboard" className="text-accent-green underline">your dashboard</a>.
</p>
```

---

## Verification Checklist (Codex)

- [ ] `agentpick-router-qa.py` has `TestEmbedRoute` class with `"voyage-embed"` in valid list (not `"voyage-ai"`)
- [ ] `python agentpick-router-qa.py` reports **51/51** (5 tests passing including new embed test)
- [ ] `body` uses `var(--bg-base)` — no white flash on any route
- [ ] `--glass-bg` / `--glass-border` tokens in `:root`, `.glass-card` updated to `blur(16px)` with hover lift
- [ ] `.hero-glow-orb` rendered on homepage behind `<h1>`
- [ ] `.headline-gradient` applied to homepage primary `<h1>` phrase
- [ ] `.scroll-reveal → .visible` IntersectionObserver wired site-wide with 60ms sibling stagger
- [ ] `glass-card` applied to tiles on benchmarks, rankings, agents, dashboard, connect pages
- [ ] Count-up animation on homepage agent-count and calls-routed stats, one-shot per session
- [ ] `.btn-shimmer` on primary CTAs; `.strategy-pill-active` pulse on active pill
- [ ] `.data-mono` on latency/score/count values across /, /benchmarks, /rankings, /dashboard
- [ ] `/connect` MCP block updated with `"headers": { "Authorization": "Bearer YOUR_API_KEY" }`
- [ ] Zero overlap with files in TASK_CLAUDE_CODE.md

---

## DO NOT TOUCH (owned by Claude Code)

- `src/app/mcp/route.ts`
- `src/lib/router/handler.ts`
- `src/lib/router/sdk.ts`
- `prisma/schema.prisma`
- Any file under `src/app/api/`
- `src/lib/router/index.ts`
