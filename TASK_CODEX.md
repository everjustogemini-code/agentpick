# TASK_CODEX.md — cycle 15

**Agent:** Codex
**Date:** 2026-03-18
**QA baseline:** 50/51 — fixes below bring score to 51/51
**Scope:** Must-Have #1 QA fix + Must-Have #2 UI upgrade + Must-Have #3 frontend
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## Task 1 — Fix P1-1: Add B.1 embed test with `voyage-embed` allowlist (Must-Have #1)

**File:** `agentpick-router-qa.py`

The file currently has no B.1 embed test. Add a new `TestEmbedRouter` class before the `if __name__ == "__main__":` block:

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

Also scan the entire file for any existing references to `voyage-ai`, `cohere-embed`, or `jina-embeddings` as expected embed slugs and remove/replace them.

**Verification:**
```bash
grep "voyage-ai" agentpick-router-qa.py   # must return zero hits
```

**Acceptance:** `grep "voyage-ai" agentpick-router-qa.py` → 0 results. QA reports **51/51**.

---

## Task 2 — Audit `/connect` page for `voyage-ai` copy (Must-Have #1 partial)

**File:** `src/app/connect/page.tsx`

Search the file for any occurrence of the string `voyage-ai` used as a slug or display name in page copy, code examples, or tool tables. Replace each with `voyage-embed`.

```bash
grep -n "voyage-ai" src/app/connect/page.tsx
```

This is a copy-only change — no logic modifications.

---

## Task 3 — Glassmorphism Design System + Micro-animations (Must-Have #2)

### 3a — Global glass-card utility

**File:** `src/app/globals.css` (or the project's equivalent global CSS file)

Append at the end:

```css
/* === Glassmorphism === */
.glass-card {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

/* === Animated hero gradient mesh === */
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

/* === Gradient underline === */
.gradient-underline {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  text-decoration-color: transparent;
  background: linear-gradient(90deg, #00ff66, #00cc55);
  background-clip: text;
  -webkit-background-clip: text;
}

/* === Neon glow CTA === */
@keyframes neon-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(0, 255, 102, 0.4); }
  50%       { box-shadow: 0 0 20px rgba(0, 255, 102, 0.8), 0 0 40px rgba(0, 255, 102, 0.3); }
}
.cta-glow {
  animation: neon-glow 2s ease-in-out infinite;
}

/* === Blinking terminal cursor === */
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

/* === Scroll reveal (JS sets initial state) === */
.reveal-hidden {
  opacity: 0;
  transform: translateY(20px);
}
.reveal-visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease-out, transform 400ms ease-out;
}

/* === View transitions === */
::view-transition-old(root) { animation: 150ms ease-out fade-out; }
::view-transition-new(root) { animation: 150ms ease-in  fade-in; }
@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }
```

### 3b — Apply glassmorphism to pricing cards

**File:** `src/components/PricingSection.tsx`

Find the outer `<div>` wrapper of each pricing tier card and add `className="glass-card"` (or merge into existing `className`). Do the same for any feature-comparison row containers.

**File:** `src/components/PricingPageClient.tsx`

Same change — apply `glass-card` to each pricing tier box on the `/pricing` page.

**File:** `src/app/pricing/page.tsx`

If the page has its own card wrappers, apply `glass-card` there too.

### 3c — Sticky nav frosted glass

**File:** `src/components/SiteHeader.tsx`

Add scroll-listener (or CSS `sticky` + backdrop-filter) so the nav gains a frosted glass style after scrolling past 60px:

- In Tailwind: add `backdrop-blur-md bg-[var(--bg-primary)]/80` classes on scroll trigger.
- Or via CSS: when JS adds a `scrolled` class to the `<header>`, apply:
  ```css
  header.scrolled {
    backdrop-filter: blur(12px);
    background: rgba(10, 10, 10, 0.8);
  }
  ```

### 3d — Hero section upgrades

**File:** `src/app/page.tsx`

1. Wrap the hero section's background `<div>` with `className="hero-gradient-mesh"` (uses the keyframe added in 3a).
2. Find the hero `<h1>` and set `style={{ fontSize: "clamp(3rem, 6vw, 5rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}` (or equivalent Tailwind).
3. Wrap the "We fix that." phrase in `<span className="gradient-underline">We fix that.</span>`.
4. Find the shimmer CTA button and replace its animation class with `cta-glow`.

### 3e — Terminal callout component

**File:** `src/components/HeroCodeBlock.tsx`

Upgrade the `pip install agentpick` block to a terminal window:
- Add a decorative titlebar with three colored dot buttons (red `#ff5f57`, yellow `#febc2e`, green `#28c840`).
- Add a monospace prompt line with a `.terminal-cursor` span.
- Typewriter effect via `useEffect` + `setTimeout`:
  - Step 1 (on mount): display `$ pip install agentpick` character by character (~50ms/char).
  - Step 2 (after 1.8s): append a second line `Successfully installed agentpick-x.x.x`.
- No third-party libraries.

### 3f — Live-stat count-up animation

**File:** `src/components/StatsBar.tsx`

Wrap each stat counter with `IntersectionObserver` count-up:
- On scroll-enter: animate from 0 to the actual value over 1.2s using `requestAnimationFrame`.
- Disconnect observer after first trigger.
- Use `opacity`/`transform` only — no layout-triggering properties.

### 3g — IntersectionObserver fade-up for section entries

**Files:** `src/app/page.tsx` (feature cards, pricing cards, API carousel sections)

Add `reveal-hidden` class to each section container on mount. Use a single shared `IntersectionObserver` to swap `reveal-hidden` → `reveal-visible` (defined in globals.css in 3a) when each section enters the viewport.

**Constraint:** Vanilla CSS + minimal JS only. No animation libraries. Lighthouse perf ≥ 90. CLS < 0.1.

---

## Task 4 — New `/quickstart` page (Must-Have #3 frontend)

**File to create:** `src/app/quickstart/page.tsx`

A single scrollable page with 3 inline steps. No page reloads between steps.

### Step 1 — Get a key

```tsx
// Email input + "Generate free key" button
// On submit: POST /api/v1/quickstart/issue with { email }
// Display returned apiKey in a copy-to-clipboard <code> block
// navigator.clipboard.writeText(apiKey) on click
```

- Store `apiKey` in React state.
- Read `?source=quickstart_homepage` from URL and pass as `source` param to the POST body.

### Step 2 — Pick a capability

- Three large pill `<button>` elements: **Search** / **Crawl** / **Embed**.
- Selecting one updates the curl snippet in Step 3 in real time (React state, no reload).
- Default: Search selected.
- Store `selectedCapability` in React state.

### Step 3 — Run it in the browser

- Pre-filled `<pre>` code block showing a `curl` snippet with:
  - `YOUR_KEY` placeholder until key is issued; replaced with actual `apiKey` once available.
  - Endpoint mapped from capability: Search → `/api/v1/route/search`, Crawl → `/api/v1/route/crawl`, Embed → `/api/v1/route/embed`.
- "Run in browser" button — fires `fetch()` to the selected endpoint with the issued key.
- JSON response rendered in a `<pre>` output panel using `JSON.stringify(data, null, 2)` (no third-party syntax highlighter).
- On success (HTTP 200): green `"✓ It works!"` banner + link to `/connect`.
- On error: red banner with the HTTP status code.

### Homepage CTA wiring

**File:** `src/app/page.tsx`

- Find the secondary CTA (currently "View Docs") and change its label to **"Get API Key →"**.
- Change its `href` to `/quickstart?source=quickstart_homepage`.

---

## Files owned by CODEX this cycle

| Action | File |
|--------|------|
| Modify | `agentpick-router-qa.py` |
| Modify | `src/app/connect/page.tsx` |
| Modify | `src/app/globals.css` |
| Modify | `src/components/SiteHeader.tsx` |
| Modify | `src/app/page.tsx` |
| Modify | `src/components/HeroCodeBlock.tsx` |
| Modify | `src/components/PricingSection.tsx` |
| Modify | `src/components/PricingPageClient.tsx` |
| Modify | `src/app/pricing/page.tsx` |
| Modify | `src/components/StatsBar.tsx` |
| Create | `src/app/quickstart/page.tsx` |
| Conditionally modify | `src/app/layout.tsx` (View Transitions wiring only) |

**DO NOT touch** (Claude Code-owned):
- `src/app/api/v1/router/register/route.ts`
- `src/app/api/v1/quickstart/issue/route.ts`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/lib/router/**`
- `src/lib/benchmark/**`
- `src/lib/ops/**`

---

## Coverage verification — every NEXT_VERSION.md item assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1 — QA B.1 embed test; `valid_embed_tools = ["voyage-embed"]`; 51/51 | **Task 1 (this file)** |
| Must-Have #1 — `/connect` page copy: `voyage-ai` → `voyage-embed` | **Task 2 (this file)** |
| Must-Have #1 — Backend `src/` files: `voyage-ai` → `voyage-embed` | TASK_CLAUDE_CODE Task D |
| Must-Have #2 — Glassmorphism cards (pricing, stats, feature) | **Task 3b (this file)** |
| Must-Have #2 — Sticky nav frosted glass | **Task 3c (this file)** |
| Must-Have #2 — Hero animated gradient mesh | **Task 3d (this file)** |
| Must-Have #2 — Hero heading size + gradient underline | **Task 3d (this file)** |
| Must-Have #2 — Terminal callout with typewriter | **Task 3e (this file)** |
| Must-Have #2 — Live-stat count-up micro-animation | **Task 3f (this file)** |
| Must-Have #2 — Scroll fade-up reveal on section entries | **Task 3g (this file)** |
| Must-Have #2 — Neon glow CTA pulse | **Task 3a + 3d (this file)** |
| Must-Have #3 — `/quickstart` page (Step 1/2/3 UI) | **Task 4 (this file)** |
| Must-Have #3 — Homepage secondary CTA → "Get API Key →" → `/quickstart` | **Task 4 (this file)** |
| Must-Have #3 — Register endpoint stores `source` field | TASK_CLAUDE_CODE Task B |
| Must-Have #3 — New `POST /api/v1/quickstart/issue` endpoint | TASK_CLAUDE_CODE Task C |
| Must-Have #3 — DB schema: `Agent.registrationSource` | TASK_CLAUDE_CODE Task A |

All 3 Must-Haves from NEXT_VERSION.md are fully covered. No item left behind.

---

## Acceptance criteria

- [ ] `grep "voyage-ai" agentpick-router-qa.py` → zero hits; QA reports **51/51**
- [ ] `grep -n "voyage-ai" src/app/connect/page.tsx` → zero hits
- [ ] PM screenshot review: glassmorphism visible on homepage stats panel, pricing tier cards, feature rows
- [ ] PM screenshot review: sticky nav shows frosted glass on scroll past 60px
- [ ] Hero heading ≥ 3rem, animated gradient mesh drifting, "We fix that." has gradient underline
- [ ] Terminal callout shows typewriter effect: `pip install agentpick` → success line
- [ ] Live-stat counters count up on first scroll-enter
- [ ] Section cards fade up on scroll-enter
- [ ] Lighthouse performance ≥ 90; CLS < 0.1
- [ ] `/quickstart` page: email → key issued in-page → capability pill selected → curl snippet updates → "Run" fires real request → "It works!" banner
- [ ] Homepage secondary CTA reads **"Get API Key →"** and links to `/quickstart?source=quickstart_homepage`

---

## Progress log

After each task, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] <brief description>
```
