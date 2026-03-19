# TASK_CODEX.md — v-next (2026-03-18)

**Agent:** Codex
**Source:** NEXT_VERSION.md — Must-Have #1 (Bug B) + Must-Have #2 (dark-glass design) + Must-Have #3 frontend (/connect Agent-Native tab)
**QA baseline:** 50/51 — fix the one failing test first, then design polish.

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `agentpick-router-qa.py` | **MODIFY** | Add voyage-embed to valid embed tools list (Bug B) |
| `src/app/globals.css` | **MODIFY** | Dark-glass CSS tokens, body defaults, ScrollReveal, count-up, micro-interactions |
| `src/components/ConnectTabs.tsx` | **MODIFY** | Add "Agent-Native" tab (Must-Have #3 frontend) |
| `src/app/connect/page.tsx` | **MODIFY** | Wire Agent-Native tab data; fix any `/api/v1/register` copy → `/api/v1/router/register` |
| `src/app/benchmarks/[task]/page.tsx` | **MODIFY** | Apply glass-card + dark-glass tokens |
| `src/app/rankings/[slug]/page.tsx` | **MODIFY** | Apply glass-card + dark-glass tokens |
| `src/app/agents/[agentId]/page.tsx` | **MODIFY** | Apply glass-card + dark-glass tokens |
| `src/app/dashboard/[slug]/page.tsx` | **MODIFY** | Apply glass-card + dark-glass tokens |

> **DO NOT touch** any file in TASK_CLAUDE_CODE.md. Zero file overlap is required.

---

## Bug B — QA embed test fails: `voyage-ai` vs `voyage-embed` name mismatch (QA P1)

**File:** `agentpick-router-qa.py`

The QA check `B.1-embed` fails because the test fixture expects `"voyage-ai"` but the
router correctly returns `"voyage-embed"`. The embed capability itself works fine.

Add a new test class (or extend `TestRateLimitPath`) with a `B.1-embed` case that calls
`POST /api/v1/route/embed` and asserts the returned `tool_used` is in the valid list:

```python
VALID_EMBED_TOOLS = {"openai-embed", "cohere-embed", "voyage-embed", "voyage-ai", "jina-embed", "edenai-embed"}

class TestEmbedCapability(unittest.TestCase):

    def test_b1_embed_tool_name(self):
        """B.1-embed — embed route must return a recognised tool name."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={"params": {"input": "test embedding sentence"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        tool = r.json().get("meta", {}).get("tool_used", "")
        self.assertIn(tool, VALID_EMBED_TOOLS, f"Unexpected embed tool: {tool!r}")
```

Note: `KEY_499` env var is already used in the existing test class — reuse it.

**Acceptance:** Running the QA suite → 51/51 pass (no B.1-embed failure).

---

## Must-Have #2 — Dark-Glass Design System (Site-Wide Consistency)

### 2a — CSS Tokens + Body Defaults

**File:** `src/app/globals.css`

Add/update the following CSS custom properties in `:root` (dark theme):
```css
:root {
  --bg-base:     #0a0a0f;
  --bg-card:     rgba(255, 255, 255, 0.05);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  --text-primary: #E2E8F0;
  --text-muted:   rgba(255,255,255,0.4);
  --border-glass: rgba(255,255,255,0.08);
  --accent-orange: #f97316;
}

body {
  background: var(--bg-base);
  color: var(--text-primary);
}
```

This eliminates the white flash on any page load.

### 2b — Glass card utility classes

**File:** `src/app/globals.css`

Add reusable class:
```css
.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background 0.2s ease, transform 0.2s ease;
}
.glass-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-4px);   /* card hover lift */
}
@media (prefers-reduced-motion: reduce) {
  .glass-card:hover { transform: none; }
}

.gradient-border-card {
  border-image: linear-gradient(135deg, rgba(249,115,22,0.3), rgba(255,255,255,0.08)) 1;
}
```

### 2c — Hero mesh + glassmorphism panel

**File:** `src/app/globals.css`

```css
.hero-mesh {
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.15) 0%, transparent 60%),
    var(--bg-base);
}

.hero-glass-panel {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
}

.headline-gradient {
  font-size: clamp(2.8rem, 5vw, 4.5rem);
  font-weight: 800;
  background: linear-gradient(135deg, #fff 40%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 2d — ScrollReveal animation

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
  .scroll-reveal, .scroll-reveal.visible {
    opacity: 1; transform: none; transition: none;
  }
}
```

Add a `<script>` (or use the existing IntersectionObserver in layout) to wire
`.scroll-reveal → .visible` — if the project has a `src/app/layout.tsx` client component
or `src/components/ScrollReveal.tsx`, add a call there. Otherwise add inline:

```ts
// In any client component that mounts on all pages (e.g. SiteHeader or layout)
if (typeof window !== 'undefined') {
  const io = new IntersectionObserver(
    (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
    { threshold: 0.15 }
  );
  document.querySelectorAll('.scroll-reveal').forEach(el => io.observe(el));
}
```

### 2e — Count-up stats (homepage only)

**File:** `src/app/globals.css` + wherever the homepage stat numbers are rendered
(likely `src/app/page.tsx` or a stats component — do NOT create a new file; add to the
nearest existing component).

Add a `data-countup` attribute to stat numbers and drive them from a one-shot
IntersectionObserver that increments from 0 to the target value over ~1 second.
Respect `prefers-reduced-motion` (skip animation, show final value immediately).

### 2f — CTA shimmer + strategy pill pulse

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
@media (prefers-reduced-motion: reduce) { .btn-shimmer::after { display: none; } }

/* Strategy pill active-state pulse */
@keyframes pill-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(249,115,22,0); }
}
.strategy-pill-active {
  animation: pill-pulse 2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) { .strategy-pill-active { animation: none; } }
```

### 2g — Monospace data typography

**File:** `src/app/globals.css`

```css
.data-mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-variant-numeric: tabular-nums;
}
```

Apply the `data-mono` class to latency values, scores, and call counts in:
- `src/app/connect/page.tsx`
- `src/app/benchmarks/[task]/page.tsx`
- `src/app/rankings/[slug]/page.tsx`
- `src/app/dashboard/[slug]/page.tsx`

### 2h — Apply glass-card + dark-glass to feature pages

For each of the following pages, replace or augment existing card/tile wrapper
`className` props to include `glass-card` (and optionally `gradient-border-card`),
and wrap stat bars / feature cards in `scroll-reveal`:

| Page file | Elements to update |
|-----------|-------------------|
| `src/app/benchmarks/[task]/page.tsx` | Domain cards, result rows |
| `src/app/rankings/[slug]/page.tsx` | Category tiles, agent cards |
| `src/app/agents/[agentId]/page.tsx` | Agent info card, stat rows |
| `src/app/dashboard/[slug]/page.tsx` | Dashboard stat cards, usage rows |

---

## Must-Have #3 — `/connect` Agent-Native Tab (Frontend)

### 3a — Add Agent-Native tab data to connect page

**File:** `src/app/connect/page.tsx`

Pass a new `agentNative` snippet to `ConnectTabs`:
```tsx
const agentNativeSnippet = `# In your agent's system prompt or config:
POST https://agentpick.dev/api/v1/router/register
Content-Type: application/json

{ "skillUrl": "https://yourtool.dev/skill.md" }`;
```

Also audit this file for any occurrences of `/api/v1/register` (without `/router/`) and
update them to `/api/v1/router/register`.

### 3b — Add Agent-Native tab to ConnectTabs component

**File:** `src/components/ConnectTabs.tsx`

The component currently has tabs (SDK / cURL / etc.). Add a new tab:

- **Tab label:** `Agent-Native`
- **Badge:** `✨ New` (orange pill, same style as the "Conversational" badge in connect page)
- **Tab content:**
  ```
  Two-line agent onboarding — no browser, no dashboard, fully automated.

  [code block with the agentNativeSnippet from above]

  When an agent POSTs { skillUrl }, AgentPick fetches the remote skill.md,
  validates the schema, auto-registers the tool, and starts routing traffic to it.
  ```

The tab should be the last tab in the list (after SDK and cURL tabs).

**Acceptance:**
- `/connect` page renders an "Agent-Native" tab
- Tab shows the two-line `POST /api/v1/router/register { skillUrl }` snippet
- No `/api/v1/register` (short path) appears in connect page copy

---

## Verification Checklist

- [ ] `agentpick-router-qa.py` has `TestEmbedCapability.test_b1_embed_tool_name` using `voyage-embed` in valid set → QA passes 51/51
- [ ] `src/app/globals.css` has `--bg-base`, `--bg-card`, `--text-primary` tokens
- [ ] `body` uses `var(--bg-base)` — no white flash on page load
- [ ] `.glass-card` utility class defined with hover lift + `prefers-reduced-motion` guard
- [ ] `.scroll-reveal → .visible` wired via IntersectionObserver
- [ ] Count-up animation on homepage stat numbers (one-shot per session)
- [ ] `.btn-shimmer` and `.strategy-pill-active` defined with motion guard
- [ ] `.data-mono` applied to latency/score/count values on benchmarks, rankings, connect, dashboard
- [ ] `glass-card` applied to cards/tiles on benchmarks, rankings, agents, dashboard pages
- [ ] `/connect` has "Agent-Native" tab with working POST snippet
- [ ] No `/api/v1/register` short-path in connect page copy
- [ ] No file listed in TASK_CLAUDE_CODE.md was modified

---

## DO NOT TOUCH (owned by Claude Code)

- `next.config.ts`
- `src/app/api/v1/router/register/route.ts`
- Any other `src/app/api/` route files
