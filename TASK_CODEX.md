# TASK_CODEX.md — Cycle 11 (Frontend / QA)

**Agent:** Codex
**Cycle:** 11
**Date:** 2026-03-18
**QA baseline:** 62/63 — P1-2 slug fix below + embed chain fix (TASK_CLAUDE_CODE) together bring QA to 63/63
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## Must-Have #1 — Fix P1-2: QA script embed slug (`voyage-ai` → `voyage-embed`)

**Bug:** `agentpick-router-qa.py` line B.1 checks `tool in ["cohere-embed", "voyage-ai", "jina-embeddings"]` — `"voyage-ai"` is the wrong slug; the live slug is `"voyage-embed"`. This causes a false-negative on every QA run, keeping score at 62/63.

**Acceptance:** QA suite reports **63/63**. No reference to `"voyage-ai"` slug remains in the QA script.

### File: `agentpick-router-qa.py`

Find the line B.1 valid-list check (searches for `tool in [...]` containing `"voyage-ai"`).

**Required change:** Update the valid-list from:
```python
tool in ["cohere-embed", "voyage-ai", "jina-embeddings"]
```
to:
```python
tool in ["cohere-embed", "voyage-embed", "jina-embeddings", "jina-embed", "edenai-embed"]
```

If line B.1 does not exist yet, add a new test class `TestEmbedRouting` before the final `if __name__ == "__main__":` block:

```python
class TestEmbedRouting(unittest.TestCase):

    def test_embed_tool_slug(self):
        """B.1 — /api/v1/route/embed must use a known embed slug, not stale voyage-ai."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={"params": {"text": "embed slug regression test"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        tool = body.get("meta", {}).get("tool_used", "")
        valid_embed_tools = ["cohere-embed", "voyage-embed", "jina-embeddings", "jina-embed", "edenai-embed"]
        self.assertIn(tool, valid_embed_tools, f"Unexpected embed tool slug: {tool!r}. Valid: {valid_embed_tools}")
```

**Key constraint:** The valid list uses `"voyage-embed"` (NOT `"voyage-ai"`). The test ID comment `B.1` must be present in the docstring for traceability to QA_REPORT.md.

---

## Must-Have #2 — Site-Wide Dark-Glass Design System

Apply the existing homepage dark-glass tokens (`--bg-base`, `--bg-surface`, `--border-subtle`, `.glass-card`) to all other pages. The homepage (`src/app/page.tsx`) already has the pattern — replicate it everywhere else.

### File 1: `src/app/globals.css`

1. **ScrollReveal stagger** — Add 60 ms stagger delays to sibling `.scroll-reveal` elements. After the existing `.scroll-reveal.visible` rule, add:
   ```css
   .scroll-reveal:nth-child(2) { transition-delay: 60ms; }
   .scroll-reveal:nth-child(3) { transition-delay: 120ms; }
   .scroll-reveal:nth-child(4) { transition-delay: 180ms; }
   .scroll-reveal:nth-child(5) { transition-delay: 240ms; }
   ```

2. **Monospace tabular nums** — Add a utility class:
   ```css
   .tabular-data {
     font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
     font-variant-numeric: tabular-nums;
   }
   ```

3. **Micro-interaction: card hover lift** — Add:
   ```css
   @media (prefers-reduced-motion: no-preference) {
     .glass-card-interactive {
       transition: transform 0.2s ease, box-shadow 0.2s ease;
     }
     .glass-card-interactive:hover {
       transform: translateY(-4px);
       box-shadow: 0 12px 40px rgba(0,0,0,0.4);
     }
   }
   ```

4. **CTA shimmer sweep** — Add shimmer animation for primary buttons:
   ```css
   @media (prefers-reduced-motion: no-preference) {
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
       animation: shimmer 2.4s infinite;
     }
     @keyframes shimmer {
       0%   { transform: translateX(-100%); }
       60%  { transform: translateX(100%); }
       100% { transform: translateX(100%); }
     }
   }
   ```

5. **No white flash** — Verify `body` has `background-color: var(--bg-base);`. Add if missing.

---

### File 2: `src/app/benchmarks/page.tsx`

- Apply `bg-[var(--bg-base)]` or `style={{ background: 'var(--bg-base)' }}` to page root.
- Apply `.glass-card` class to each benchmark domain tile.
- Add `.glass-card-interactive` class to clickable tiles (hover lift).
- Wrap card groups in `<ScrollReveal>` (import from `@/components/ScrollReveal`) so stagger CSS applies.
- Apply `tabular-data` class to latency and score numeric values.

---

### File 3: `src/app/rankings/page.tsx`

- Apply dark background (`var(--bg-base)`) to page root.
- Apply `.glass-card` + `bg-[var(--bg-surface)]` + `border border-[var(--border-subtle)]` to each ranking row container.
- Add `.glass-card-interactive` to clickable rows.
- Wrap rows/sections in `<ScrollReveal>` with stagger.
- Apply `tabular-data` class to score and latency columns.

---

### File 4: `src/app/agents/page.tsx`

- Apply dark background to page root.
- Wrap each agent directory card in `.glass-card` + `.glass-card-interactive`.
- Wrap card grid in `<ScrollReveal>` with stagger.
- Apply `tabular-data` to numeric stats on cards.

---

### File 5: `src/app/connect/page.tsx`

- Apply dark background to page root.
- Wrap strategy blocks / feature cards in `.glass-card` + `.glass-card-interactive`.
- Wrap sections in `<ScrollReveal>`.
- **Add "Try it live →" CTA** linking to `/playground`. Place it prominently in the hero or after the code snippet section:
  ```tsx
  <a href="/playground" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors">
    Try it live →
  </a>
  ```

---

### File 6: `src/app/dashboard/page.tsx`

- Apply dark background to page root.
- Wrap stat tiles / metric cards in `.glass-card`.
- Wrap dashboard sections in `<ScrollReveal>`.
- Apply `tabular-data` to call counts, cost figures, and latency values.

---

### File 7: `src/app/page.tsx` (Homepage)

**Count-up hero stats** — `OnceAnimatedCounter` (`src/components/OnceAnimatedCounter.tsx`) uses `sessionStorage` for one-shot animation. Verify the "X agents ranked" and "Y calls routed" stats in the hero use `<OnceAnimatedCounter>`. If any stat still uses a bare number, wrap it.

**"Try it live →" CTA** — Add link to `/playground` in the hero section near existing CTA buttons:
```tsx
<a href="/playground" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors mt-2">
  Try it live →
</a>
```

**Monospace stats** — Add `tabular-data` class to `<OnceAnimatedCounter>` wrappers or their parent `<span>` for agents-count and calls-routed numbers.

---

## Must-Have #3 — Live API Playground page (`/playground`)

The page shell exists at `src/app/playground/page.tsx` and renders `<PlaygroundShell />`. Components exist (`src/components/PlaygroundShell.tsx`, `src/components/PlaygroundRequestBuilder.tsx`, `src/components/PlaygroundResponsePanel.tsx`). Verify and ensure they match spec:

### File 8: `src/app/playground/page.tsx`

- Replace any `bg-gray-950` with `bg-[var(--bg-base)]` for dark-glass consistency.
- Keep `<PlaygroundShell />` as the main content component.

### File 9: `src/components/PlaygroundShell.tsx`

Ensure (or implement) the following:

1. **Query input** — text field for the query string.
2. **Capability selector** — `<select>` with options: `search`, `embed`, `crawl`. Default: `search`.
3. **Strategy dropdown** — `<select>` with options: `balanced`, `best_performance`, `cheapest`, `most_stable`. Default: `balanced`.
4. **API key input** — text field labeled "API key (optional — demo key used if blank)". Placeholder/hint text only — never a real key in source.
5. **Run button** — on click, fires `POST /api/v1/route/{capability}` with:
   ```json
   { "params": { "query": "<input value>" }, "strategy": "<selected strategy>" }
   ```
   Uses `Authorization: Bearer <key>` header. If key blank, use the existing `DEMO_KEY` constant (find it in `src/app/connect/page.tsx` or `src/components/PlaygroundClient.tsx` — reuse, do not define a second one).
6. **Spinner** — visible during fetch.
7. **Result pane** — on success, render in `.glass-card`:
   - `tool_used`, `latency_ms`, `cost_usd`, `fallback_used`, `ai_classification` from `response.meta`
   - First 3 results: title + URL + snippet (from `response.data.results` or `response.data`)
   - Raw JSON toggle (collapsed by default, expandable `<pre>` block)
8. **Copy-as-curl button** — generates and copies to clipboard:
   ```
   curl -X POST https://agentpick.com/api/v1/route/<capability> \
     -H "Authorization: Bearer <key>" \
     -H "Content-Type: application/json" \
     -d '{"params":{"query":"<query>"},"strategy":"<strategy>"}'
   ```
9. **Styling** — all cards use `.glass-card`; page background uses `var(--bg-base)`; numeric values in result pane use `tabular-data` class.

### File 10: `src/components/PlaygroundRequestBuilder.tsx`

If this component handles the input form, ensure it matches the field spec above and uses dark-glass styling (no `bg-gray-*` or white backgrounds).

### File 11: `src/components/PlaygroundResponsePanel.tsx`

Ensure it:
- Uses `.glass-card` wrapper.
- Renders `tool_used`, `latency_ms`, `cost_usd`, `fallback_used`, `ai_classification`.
- Shows first 3 results (title + URL + snippet).
- Has a raw JSON toggle.
- Uses `tabular-data` on numeric values.

---

## Coverage Verification — Every NEXT_VERSION.md DoD item is assigned

| DoD Item | Assigned to |
|---|---|
| `POST /api/v1/route/embed` returns `fallback_used: false`, `tried_chain` length 1 | TASK_CLAUDE_CODE |
| QA script line B.1 slug updated; suite reports **63/63** | **This file — `agentpick-router-qa.py`** |
| Glass cards on benchmarks, rankings, agents, connect, dashboard | **This file — Files 2–6** |
| No white flash; all pages use `var(--bg-base)` body background | **This file — Files 1–6** |
| ScrollReveal active on all pages (not homepage-only); 60 ms stagger | **This file — Files 1–6** |
| Count-up stat animations on homepage hero (sessionStorage one-shot) | **This file — File 7** |
| Card hover lift + CTA shimmer (respects `prefers-reduced-motion`) | **This file — File 1** |
| Lighthouse Performance ≥ 90; LCP < 2.5 s; CLS < 0.1 | **This file — no new blocking resources added** |
| `/playground` loads 200; demo key returns results; copy-as-curl works | **This file — Files 8–11** |
| "Try it live →" CTA on homepage and `/connect` | **This file — Files 5 and 7** |

---

## Out of Scope for This Agent

- `src/lib/router/index.ts` — assigned to Claude Code (embed chain fix)
- `src/lib/ops/constants.ts` — assigned to Claude Code
- `src/lib/ops/service-probes.ts` — assigned to Claude Code
- `src/lib/router/handler.ts` — assigned to Claude Code
- `src/app/api/v1/router/skill.md/route.ts` — assigned to Claude Code
- Any new API routes or database schema changes
- Benchmark runner endpoint (`POST /api/v1/benchmark/run`) — out of scope this cycle
