# TASK_CODEX.md — cycle 14

**Agent:** Codex
**Date:** 2026-03-18
**QA baseline:** 50/51 — fixes below bring score to 51/51
**Scope:** Must-Have #1 QA fix + Must-Have #2 UI upgrade + Must-Have #3 frontend
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## Task 1 — Fix P1-1: Update QA allowlist to `voyage-embed` (Must-Have #1)

**File:** `agentpick-router-qa.py`

**Problem:** The file has no B.1 embed test at all. The QA suite has 4 tests (TestRateLimitPath × 2, TestUsageAliases × 1, TestBenchmarkPermalinks × 2) and scores 50/51. The missing B.1 test must be added with the correct allowlist.

**Exact change:** Add a new test class before the `if __name__ == "__main__":` block (line 73):

```python
KEY_EMBED = os.environ.get('QA_TEST_KEY_EMBED', KEY_499)

class TestEmbedRouter(unittest.TestCase):

    def test_b1_embed_tool_used(self):
        """B.1 — embed route must return meta.tool_used = voyage-embed."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_EMBED}"},
            json={"params": {"query": "semantic similarity for developer tools"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        valid_embed_tools = ["voyage-embed"]
        tool_used = body.get("meta", {}).get("tool_used", "")
        self.assertIn(
            tool_used,
            valid_embed_tools,
            f"Expected tool_used in {valid_embed_tools}, got: {tool_used!r}",
        )
```

**Verification:**
```bash
grep "voyage-ai" agentpick-router-qa.py   # must return zero hits
```

**Acceptance:** `grep "voyage-ai" agentpick-router-qa.py` → zero hits. QA reports **51/51**.

---

## Task 2 — Glass Design System + Micro-animations (Must-Have #2)

### 2a — Glassmorphism on cards

**Files:**
- `src/app/page.tsx` — live-stats card (homepage)
- `src/components/PricingSection.tsx` — pricing tier boxes on homepage
- `src/components/PricingPageClient.tsx` — pricing tier boxes on `/pricing` page

**Change:** Replace flat-border card containers with glassmorphism style:

```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.04);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 12px;
```

Apply to: live-stats card container, each pricing tier box, feature comparison table rows.

If using Tailwind, add a `glass-card` utility class in `src/app/globals.css` (or equivalent CSS file) and apply it via `className="glass-card"`:

```css
/* src/app/globals.css — append to existing file */
.glass-card {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
```

### 2b — Hero section upgrade

**File:** `src/app/page.tsx`

1. **Animated radial gradient background** — replace any static hero background with a slow-drifting mesh:
   ```css
   /* Add to globals.css */
   @keyframes hero-drift {
     0%, 100% { transform: translate(0, 0) rotate(0deg); }
     33%       { transform: translate(20px, -15px) rotate(3deg); }
     66%       { transform: translate(-15px, 10px) rotate(-2deg); }
   }
   .hero-gradient-mesh {
     background: conic-gradient(from 180deg at 50% 50%, #00ff6620 0deg, #0a0a0a 120deg, #00ff6610 240deg, #0a0a0a 360deg);
     animation: hero-drift 10s ease-in-out infinite;
     will-change: transform;
   }
   ```
   Wrap the hero section background `<div>` with `className="hero-gradient-mesh"`.

2. **Hero heading size** — find the `<h1>` in the hero section and set font size to **64px** at desktop, `line-height: 1.1`. In Tailwind: `text-[64px] leading-[1.1]`.

3. **Gradient underline on "We fix that"** — wrap the differentiator phrase in a `<span>` with:
   ```css
   /* globals.css */
   .gradient-underline {
     text-decoration: underline;
     text-decoration-thickness: 2px;
     text-underline-offset: 4px;
     text-decoration-color: transparent;
     background: linear-gradient(90deg, #00ff66, #00cc55);
     background-clip: text;
     -webkit-background-clip: text;
   }
   ```

4. **Terminal callout component** — upgrade the `pip install agentpick` code block to a terminal window:
   **File:** `src/components/HeroCodeBlock.tsx`
   - Add a draggable titlebar with three dot buttons (red/yellow/green, decorative only).
   - Add a monospace prompt line.
   - Add a blinking cursor CSS animation (`blink-cursor` keyframe in globals.css).
   - Add a 2-step typewriter sequence using `setTimeout`:
     - Step 1: display `$ pip install agentpick`
     - Step 2 (after 1.8s): append `↵  Successfully installed agentpick-x.x.x`

   ```css
   /* globals.css */
   @keyframes blink-cursor {
     0%, 100% { opacity: 1; }
     50%       { opacity: 0; }
   }
   .terminal-cursor {
     display: inline-block;
     width: 8px;
     height: 1em;
     background: #00ff66;
     animation: blink-cursor 1s step-end infinite;
     vertical-align: text-bottom;
   }
   ```

### 2c — Micro-animations

**File:** `src/components/StatsBar.tsx`

Add `IntersectionObserver` count-up for the live-stat counters (agents count, calls today):
- On scroll-enter: animate from 0 to the actual value over 1.2s.
- Use only `transform`/`opacity` — no layout-triggering properties.
- Example pattern (vanilla JS in a `useEffect`):
  ```ts
  useEffect(() => {
    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // count-up logic using requestAnimationFrame
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);
  ```

**File:** `src/app/page.tsx` (CTA button — see Task 3 for which button)

Replace the shimmer CTA button animation with a `box-shadow` glow pulse:
```css
/* globals.css */
@keyframes neon-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(0, 255, 102, 0.4); }
  50%       { box-shadow: 0 0 20px rgba(0, 255, 102, 0.8), 0 0 40px rgba(0, 255, 102, 0.3); }
}
.cta-glow {
  animation: neon-glow 2s ease-in-out infinite;
}
```

**View Transitions:** Add `View Transitions API` cross-fade (150ms) for in-page route changes. In `src/app/layout.tsx` (or the relevant layout file), inject:
```ts
// Wrap next/link navigations with startViewTransition if available
```
Add to globals.css:
```css
::view-transition-old(root) { animation: 150ms ease-out fade-out; }
::view-transition-new(root) { animation: 150ms ease-in fade-in; }
@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }
```

**Constraint:** No third-party animation libraries. Vanilla CSS + minimal JS only. Lighthouse perf ≥ 90.

---

## Task 3 — New `/quickstart` page (Must-Have #3 frontend)

**File to create:** `src/app/quickstart/page.tsx`

A single scrollable page. No page reloads between steps.

### Step 1 — Get a key

- Email `<input>` + "Generate free key" button.
- On submit: `POST /api/v1/quickstart/issue` with `{ email }` (the new endpoint Claude Code creates).
- Display the returned `apiKey` inline in a copy-to-clipboard code block (click copies to clipboard via `navigator.clipboard.writeText`).
- State: `apiKey` stored in React state, passed to Step 2/3.

### Step 2 — Pick a capability

- Three large pill `<button>` elements: **Search** / **Crawl** / **Embed**.
- Selecting one updates the curl snippet below (Step 3) in real time.
- Default selected: Search.
- State: `selectedCapability` in React state.

### Step 3 — Run it now

- Pre-filled `<pre>` block showing a `curl` snippet with:
  - The actual `apiKey` from Step 1 injected (masked as `YOUR_KEY` until key is issued).
  - The selected capability endpoint (`/api/v1/route/search`, `/api/v1/route/crawl`, or `/api/v1/route/embed`).
- "Run in browser" button — fires `fetch()` to the selected capability endpoint using the issued key; streams (or awaits) JSON response.
- Response rendered in a live output panel with `<pre>` + syntax-highlighted JSON (use `JSON.stringify(data, null, 2)` — no third-party highlighter library).
- On success: show a green `"✓ It works!"` banner with a link to full docs.
- On error: show a red error message with the status code.

### Homepage wiring

**File:** `src/app/page.tsx`

- Find the secondary CTA button (currently "View Docs") and replace its label with **"Get API Key →"** and its `href` with `/quickstart`.
- Add `source=quickstart_homepage` as a URL param if needed for funnel tracking (e.g., link to `/quickstart?source=quickstart_homepage` — the quickstart page can read this and pass it in the key-issue request).

---

## Files owned by CODEX this cycle

| Action | File |
|--------|------|
| Modify | `agentpick-router-qa.py` |
| Modify | `src/app/page.tsx` |
| Modify | `src/components/HeroCodeBlock.tsx` |
| Modify | `src/components/PricingSection.tsx` |
| Modify | `src/components/PricingPageClient.tsx` |
| Modify | `src/app/pricing/page.tsx` |
| Modify | `src/components/StatsBar.tsx` |
| Modify | `src/app/globals.css` (or equivalent CSS file) |
| Create | `src/app/quickstart/page.tsx` |
| Conditionally modify | `src/app/layout.tsx` (View Transitions only) |

**DO NOT touch** (Claude Code-owned):
- `src/app/api/v1/router/register/route.ts`
- `src/app/api/v1/quickstart/issue/route.ts` (new file — Claude Code creates it)
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/lib/router/index.ts`
- `src/lib/router/ai-classify.ts`
- `src/lib/ops/constants.ts`
- `src/lib/ops/service-probes.ts`
- `src/lib/benchmark/adapters/voyage-embed.ts`

---

## Coverage verification — every NEXT_VERSION.md item assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1 — QA allowlist updated to `voyage-embed`; 51/51; zero `voyage-ai` hits | **This file (Task 1)** |
| Must-Have #2 — Glassmorphism on cards, hero upgrade, micro-animations | **This file (Task 2)** |
| Must-Have #3 — `/quickstart` page UI (Step 1/2/3), homepage CTA change | **This file (Task 3)** |
| Must-Have #3 — Registration endpoint stores `source`, new `/quickstart/issue` endpoint, DB schema | TASK_CLAUDE_CODE |

All 3 Must-Haves from NEXT_VERSION.md are covered. No item left behind.

---

## Acceptance criteria

- [ ] `grep "voyage-ai" agentpick-router-qa.py` → zero hits; QA reports 51/51
- [ ] PM screenshot review: glassmorphism visible on homepage stats, pricing tiers, feature rows
- [ ] PM screenshot review: hero heading 64px, animated gradient mesh, terminal callout with typewriter
- [ ] Lighthouse performance score ≥ 90; CLS < 0.1
- [ ] `/quickstart` page: email input → key issued → capability selected → curl snippet updated → "Run in browser" fires real request → "It works!" banner appears
- [ ] Homepage secondary CTA reads "Get API Key →" and links to `/quickstart`

---

## Progress log

After each task, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] <brief description>
```
