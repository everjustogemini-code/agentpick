# TASK_CODEX.md — Cycle 9 (Frontend / QA fix)

**Agent:** Codex
**Source:** NEXT_VERSION.md (2026-03-18, cycle 9)
**QA baseline:** 62/63 — P1-2 fix here brings QA to 63/63
**Scope:** P1-2 QA slug fix + Must-Have #2 dark-glass design system + Must-Have #3 Playground page + CTAs
**Must NOT touch:** `src/lib/`, `src/app/api/`, `src/lib/benchmark/adapters/index.ts`, `src/lib/router/index.ts`

---

## Task 1 — P1-2: Fix stale slug in QA validation list

**File:** `agentpick-router-qa.py`

Add a new test class `TestEmbedRoute` after the existing `TestUsageAliases` class (around line 53) that validates the embed endpoint returns the canonical `voyage-embed` slug:

```python
class TestEmbedRoute(unittest.TestCase):

    def test_embed_tool_used_slug(self):
        """B.1 — embed route must return a tool_used from the valid slug list."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={"params": {"query": "test embedding"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        tool = body.get("tool_used", "")
        valid = ["cohere-embed", "voyage-embed", "jina-embeddings"]  # B.1 — canonical slugs
        self.assertIn(tool, valid, f"Unexpected tool_used slug: {tool!r}")
```

Key: the valid list uses `"voyage-embed"` (not the old `"voyage-ai"` slug from cycle 8).

**Acceptance:** `python agentpick-router-qa.py` reports **63/63**. No reference to `"voyage-ai"` remains in the QA script.

---

## Task 2 — Dark-Glass CSS Tokens & Global Styles

**File:** `src/app/globals.css`

### 2a — Add/ensure CSS custom properties in `:root { }`

Add these tokens if not already present (do not duplicate):
```css
--glass-bg: rgba(255, 255, 255, 0.04);
--glass-border: rgba(255, 255, 255, 0.12);
--glass-blur: 16px;
```

### 2b — Update `.glass-card` to full dark-glass spec

Find the existing `.glass-card` block (around line 519) and update to:
```css
.glass-card {
  -webkit-backdrop-filter: blur(var(--glass-blur, 16px));
  backdrop-filter: blur(var(--glass-blur, 16px));
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}
```

### 2c — Add `.data-mono` class for numeric data

Append after `.glass-card`:
```css
/* Monospace numeric data: latency, scores, call counts */
.data-mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
```

### 2d — Add micro-interaction classes (motion-safe)

Append near end of file:
```css
/* === Micro-interactions — respects prefers-reduced-motion === */
@media (prefers-reduced-motion: no-preference) {
  .card-hover-lift {
    transition: transform 200ms ease, box-shadow 200ms ease;
  }
  .card-hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--glass-border);
  }

  @keyframes shimmer-sweep {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .btn-shimmer {
    background-size: 200% auto;
    background-image: linear-gradient(
      90deg,
      var(--accent-orange, #f97316) 0%,
      #facc15 40%,
      var(--accent-orange, #f97316) 100%
    );
  }
  .btn-shimmer:hover {
    animation: shimmer-sweep 600ms linear;
  }
}
```

### 2e — Ensure `body` uses `var(--bg-base)` (prevent white flash)

Find the `body { }` rule and confirm `background: var(--bg-base);` is present. Add it if missing.

---

## Task 3 — Homepage: Count-Up Hero Stats + "Try it live →" CTA

**File:** `src/app/page.tsx`

### 3a — Count-up hero stats (sessionStorage one-shot)

Find the "X agents ranked" and "Y calls routed" stat figures in the hero section. Apply `OnceAnimatedCounter` with a `sessionStorage` one-shot guard (check if `sessionStorage.getItem('ap_stats_animated')` exists; if the component handles this internally, just import and use it):

```tsx
import OnceAnimatedCounter from '@/components/OnceAnimatedCounter';
// ...
<OnceAnimatedCounter value={agentCount} suffix="+" />
<OnceAnimatedCounter value={callsRouted} suffix="+" />
```

If `OnceAnimatedCounter` does not exist, inline the logic: on first viewport entry (IntersectionObserver), animate 0 → final value over 1.2 s, then set `sessionStorage.setItem('ap_stats_animated', '1')` and skip on subsequent page visits.

### 3b — Add "Try it live →" CTA linking to `/playground`

Find the main hero CTA button(s). Add a secondary CTA after the primary button:

```tsx
<a
  href="/playground"
  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
>
  Try it live →
</a>
```

Match the surrounding button styling conventions on the page (Tailwind or CSS class pattern). Apply `btn-shimmer` if the primary CTA uses it.

---

## Task 4 — `/connect` Page: Glass Cards + ScrollReveal + "Try it live →" CTA

**File:** `src/app/connect/page.tsx`

### 4a — Apply glass-card class to strategy/section blocks

Find major section containers with inline Tailwind glass patterns like `border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm`. Replace with CSS class tokens:

```tsx
// before
<div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
// after
<div className="mb-8 rounded-xl glass-card card-hover-lift p-6">
```

Apply to all strategy blocks, "Quick Start" block, and "Two Ways to Start" block.

### 4b — Wire ScrollReveal with stagger

Import `ScrollReveal` at top. Wrap each major section `<div>` with `scroll-reveal` class and `style={{ transitionDelay: `${sectionIndex * 60}ms` }}`.

### 4c — Add "Try it live →" CTA

Find the primary CTA or hero area on the page. Add a secondary link button to `/playground`:

```tsx
<a href="/playground" className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline">
  Try it live →
</a>
```

---

## Task 5 — Benchmarks Page: Glass Cards + ScrollReveal + Data Mono

**File:** `src/app/benchmarks/page.tsx`

1. Add `glass-card card-hover-lift` classes to each benchmark domain tile element's `className`.
2. Add `scroll-reveal` class + `style={{ transitionDelay: \`${index * 60}ms\` }}` to each tile (siblings stagger 60 ms).
3. Find latency/score numeric values inside tiles → add `className="data-mono"` to their `<span>` or `<td>`.

---

## Task 6 — Rankings Page: Glass Cards + ScrollReveal + Data Mono

**File:** `src/app/rankings/page.tsx`

1. Add `glass-card card-hover-lift` classes to each ranking row container's `className`.
2. Add `scroll-reveal` + 60 ms stagger to rows.
3. Add `data-mono` to score/latency numeric cells.

---

## Task 7 — Agents Directory: Glass Cards + ScrollReveal

**File:** `src/app/agents/page.tsx`

1. Add `glass-card card-hover-lift` classes to each agent directory card container's `className`.
2. Add `scroll-reveal` + `style={{ transitionDelay: \`${index * 60}ms\` }}` to each card.

---

## Task 8 — Dashboard: Glass Cards + Data Mono + ScrollReveal

**File:** `src/app/dashboard/page.tsx`

1. Add `glass-card` class to each stat tile's `className`.
2. Add `data-mono` class to all numeric stat values (call counts, costs, latencies).
3. Wrap stat tile group(s) in `scroll-reveal` with 60 ms stagger.

---

## Task 9 — Playground Page: Make `/playground` Functional per Spec

**Files:** `src/app/playground/page.tsx`, `src/components/PlaygroundClient.tsx`, `src/components/PlaygroundRequestBuilder.tsx`, `src/components/PlaygroundResponsePanel.tsx`

The playground page and components already exist. Wire them up to match the spec:

### 9a — `src/app/playground/page.tsx`

Ensure the page:
- Returns HTTP 200 at `/playground` (no auth redirect for the demo key).
- Renders `<PlaygroundClient />` (or `<PlaygroundShell />`) as the main interactive component.
- Uses dark-glass styles: `glass-card` on the main container, `--bg-base` body background (inherits from globals.css).

### 9b — `src/components/PlaygroundClient.tsx` (or `PlaygroundShell.tsx` — whichever is the root interactive component)

Ensure the component has:
1. **Query input** — text field for the query.
2. **Capability selector** — dropdown/tabs: `search` / `embed` / `crawl`.
3. **Strategy dropdown** — `balanced` / `best_performance` / `cheapest` / `most_stable`.
4. **API key input** — text field; pre-filled with the hardcoded demo key (same key used on `/connect`). Label: "API Key (demo key pre-filled)".
5. **Run button** — fires `POST /api/v1/route/{capability}` with `Authorization: Bearer {apiKey}` header. Shows a spinner during the request.
6. **Result pane** (`PlaygroundResponsePanel`) — after a successful call, render:
   - `tool_used`, `latency_ms`, `cost_usd`, `fallback_used`, `ai_classification`
   - First 3 results (title + URL + snippet) in a `glass-card`
   - **Raw JSON toggle** — `<details><summary>Raw JSON</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>`
7. **Copy-as-curl button** — generates and copies the equivalent `curl` command:
   ```
   curl -X POST https://agentpick.dev/api/v1/route/{capability} \
     -H "Authorization: Bearer {apiKey}" \
     -H "Content-Type: application/json" \
     -d '{"params":{"query":"{query}"}}'
   ```
   Use `navigator.clipboard.writeText(curlCommand)`. Show "Copied!" feedback for 2 s.

### 9c — Styling

Apply `glass-card` to the main panel container, result pane, and code blocks. Use `data-mono` for latency/cost values. Apply `card-hover-lift` to the Run button container.

---

## Task 10 — ScrollReveal: Ensure Global Activation + Stagger Prop

**File:** `src/components/ScrollReveal.tsx`

1. Remove any guard that restricts the IntersectionObserver to homepage-only (look for `pathname === '/'` or similar checks).
2. Ensure the component supports a `staggerMs` prop (default `60`) that applies `transitionDelay: index * staggerMs + 'ms'` to each child element.
3. Do NOT change the observer threshold or animation keyframes.

---

## Files to Create/Modify (summary)

| Action | File | Task |
|--------|------|------|
| MODIFY | `agentpick-router-qa.py` | 1 — add `TestEmbedRoute` with `voyage-embed` valid slug |
| MODIFY | `src/app/globals.css` | 2 — `--glass-bg/border/blur` tokens, `.glass-card`, `.data-mono`, micro-interactions |
| MODIFY | `src/app/page.tsx` | 3 — count-up sessionStorage guard + "Try it live →" CTA |
| MODIFY | `src/app/connect/page.tsx` | 4 — glass cards + ScrollReveal + "Try it live →" CTA |
| MODIFY | `src/app/benchmarks/page.tsx` | 5 — glass cards + ScrollReveal + data-mono |
| MODIFY | `src/app/rankings/page.tsx` | 6 — glass cards + ScrollReveal + data-mono |
| MODIFY | `src/app/agents/page.tsx` | 7 — glass cards + ScrollReveal |
| MODIFY | `src/app/dashboard/page.tsx` | 8 — glass cards + data-mono + ScrollReveal |
| MODIFY | `src/app/playground/page.tsx` | 9a — ensure HTTP 200, dark-glass wrapper |
| MODIFY | `src/components/PlaygroundClient.tsx` or `PlaygroundShell.tsx` | 9b — wire query/capability/strategy/key/run/result/curl UI |
| MODIFY | `src/components/PlaygroundRequestBuilder.tsx` | 9b — capability selector, strategy dropdown, key input |
| MODIFY | `src/components/PlaygroundResponsePanel.tsx` | 9b — result pane, raw JSON toggle, copy-as-curl |
| MODIFY | `src/components/ScrollReveal.tsx` | 10 — remove homepage-only guard, add staggerMs prop |

**Do NOT touch:** `src/lib/`, `src/app/api/`, `src/lib/benchmark/adapters/`, `src/lib/router/index.ts`

---

## Verification Checklist (Codex)

- [ ] `agentpick-router-qa.py` has `TestEmbedRoute.test_embed_tool_used_slug`; valid list is `["cohere-embed", "voyage-embed", "jina-embeddings"]`; no `"voyage-ai"` string in the file
- [ ] `globals.css` `:root` has `--glass-bg`, `--glass-border`, `--glass-blur`
- [ ] `globals.css` `.glass-card` uses `blur(16px)`, `rgba(255,255,255,0.04)` bg, 1px border `rgba(255,255,255,0.12)`
- [ ] `globals.css` `.data-mono` has `font-variant-numeric: tabular-nums` + JetBrains Mono
- [ ] `globals.css` `.card-hover-lift` has `translateY(-4px)` inside `@media (prefers-reduced-motion: no-preference)`
- [ ] `globals.css` `.btn-shimmer` shimmer sweep 600 ms
- [ ] `body` rule uses `var(--bg-base)` — no white flash
- [ ] `page.tsx` hero stats use sessionStorage one-shot guard
- [ ] `page.tsx` + `connect/page.tsx` both have "Try it live →" CTA linking to `/playground`
- [ ] `benchmarks/page.tsx` tiles: `glass-card card-hover-lift` + `data-mono` on latency/score + `scroll-reveal` 60 ms stagger
- [ ] `rankings/page.tsx` rows: `glass-card card-hover-lift` + `data-mono` on score cells + scroll-reveal
- [ ] `agents/page.tsx` cards: `glass-card card-hover-lift` + scroll-reveal 60 ms stagger
- [ ] `dashboard/page.tsx` stat tiles: `glass-card` + `data-mono` on all numbers + scroll-reveal
- [ ] `/playground` loads HTTP 200; demo key pre-filled; capability/strategy selectors present
- [ ] Playground Run button fires `POST /api/v1/route/{capability}`; result pane shows `tool_used`, `latency_ms`, first 3 results
- [ ] Raw JSON toggle works; copy-as-curl produces valid curl command
- [ ] `ScrollReveal.tsx` activates on all pages (no homepage-only guard); `staggerMs` prop supported
- [ ] QA 63/63 after Claude Code P1-1 backend fix also deploys
