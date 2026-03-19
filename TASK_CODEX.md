# TASK_CODEX.md — Cycle 7 (Frontend / UI + QA fix)
**Agent:** Codex
**Source:** NEXT_VERSION.md (2026-03-18, cycle 7)
**QA baseline:** 50/51 — P1 fix here (Task 1) brings it to 51/51
**Must NOT touch:** `src/app/page.tsx`, `src/app/api/`, `src/components/AnimatedCounter.tsx`, `src/components/OnceAnimatedCounter.tsx`

---

## Task 1 — Fix P1: QA Script `voyage-ai` → `voyage-embed` (Must-Have #1)

**File:** `agentpick-router-qa.py`

The script currently has 4 test methods across 3 classes (`TestRateLimitPath`, `TestUsageAliases`, `TestBenchmarkPermalinks`). The `TestEmbedRoute` class was never written. Add it now.

Append the following class **before** the `if __name__ == "__main__":` block (line 73):

```python
class TestEmbedRoute(unittest.TestCase):

    def test_embed_route_valid_tool(self):
        """B.1-embed — POST /api/v1/route/embed must return a known embed tool name."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={"params": {"input": "embedding regression test"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        valid = ["cohere-embed", "voyage-embed", "jina-embeddings"]   # voyage-embed (not voyage-ai)
        self.assertIn(
            body.get("tool_used"),
            valid,
            f"Expected one of {valid}, got: {body.get('tool_used')!r}",
        )
```

**Key change:** the valid list uses `"voyage-embed"` (not `"voyage-ai"`). The backend was renamed in a prior cycle; this test was never written. After this change the suite reports **51/51**.

**Acceptance:** `python agentpick-router-qa.py` reports 5 tests, all pass.

---

## Task 2 — Dark-Glass Design System: CSS Tokens & Global Styles (Must-Have #2)

**File:** `src/app/globals.css`

### 2a — Add/update CSS custom properties (add inside `:root { }` block)

```css
/* Glass system */
--glass-bg: rgba(255, 255, 255, 0.04);
--glass-border: rgba(255, 255, 255, 0.12);
--glass-blur: 16px;
```

### 2b — Update `.glass-card` class (currently lines 519–522)

Replace existing:
```css
.glass-card {
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
```

With full spec implementation:
```css
.glass-card {
  -webkit-backdrop-filter: blur(var(--glass-blur, 16px));
  backdrop-filter: blur(var(--glass-blur, 16px));
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}
```

### 2c — Add monospace data class

Append after `.glass-card`:
```css
/* Monospace numeric data (latency, scores, call counts) */
.data-mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
```

### 2d — Add micro-interaction classes (gated on prefers-reduced-motion)

Append to end of file:
```css
/* === Micro-interactions (prefers-reduced-motion safe) === */
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

  @keyframes strategy-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.65; }
  }
  .strategy-pulse:hover {
    animation: strategy-pulse 1.2s ease-in-out infinite;
  }
}
```

### 2e — Ensure body uses `var(--bg-base)` (no white flash)

Find the `body` rule in globals.css. Ensure it contains:
```css
body {
  background: var(--bg-base);
  color: var(--text-primary);
  /* existing properties ... */
}
```

---

## Task 3 — Glass Cards + ScrollReveal: Benchmarks Page (Must-Have #2)

**File:** `src/app/benchmarks/page.tsx`

1. Import `ScrollReveal` at top: `import ScrollReveal from '@/components/ScrollReveal';`
2. Find the benchmark domain tile elements (cards rendered per domain/task). Apply:
   - Add `glass-card card-hover-lift` to the card container's `className`
   - Wrap each sibling group in `<ScrollReveal staggerMs={60}>` (check if `ScrollReveal` accepts a stagger prop; if not, add `style={{ transitionDelay: \`${index * 60}ms\`` }} className="scroll-reveal"` to each card directly)
3. Find any latency or score numbers inside cards → add `className="data-mono"` to their wrapper `<span>` or `<td>`.

---

## Task 4 — Glass Cards + ScrollReveal: Rankings Page (Must-Have #2)

**File:** `src/app/rankings/page.tsx`

1. Import `ScrollReveal` at top.
2. Find the rankings row elements. Apply `glass-card card-hover-lift` to each row container.
3. Wrap the rows list in a ScrollReveal parent or add `scroll-reveal` class + `transitionDelay` to each row (60ms stagger).
4. Add `data-mono` to score/latency numeric cells.

---

## Task 5 — Glass Cards + ScrollReveal: Agents Directory (Must-Have #2)

**File:** `src/app/agents/page.tsx`

1. Import `ScrollReveal` at top.
2. Find the agent directory card elements. Apply `glass-card card-hover-lift` to each card container's `className`.
3. Add `scroll-reveal` + `transitionDelay: \`${index * 60}ms\`` on each card (or wrap in ScrollReveal if it accepts stagger).

---

## Task 6 — Glass Cards + ScrollReveal: Dashboard (Must-Have #2)

**File:** `src/app/dashboard/page.tsx`

1. Import `ScrollReveal` at top.
2. Find stat tiles (call count, cost, usage cards). Apply `glass-card` to each tile.
3. Add `data-mono` class to all numeric stat values (call counts, costs, latencies).
4. Wrap stat tile groups in ScrollReveal with 60ms stagger.

---

## Task 7 — Glass Cards + ScrollReveal + Code Switcher: `/connect` Page (Must-Have #2 + #3)

**File:** `src/app/connect/page.tsx`

### 7a — Apply glass cards to strategy blocks

Find the "Strategies" section (around line 140–167). The outer `<div>` already has `rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm`. Update it to use the new tokens:

```tsx
<div className="mb-8 rounded-xl glass-card card-hover-lift p-6">
```

Apply similarly to the "Two Ways to Start" section (line 58–99), "Quick Start" (line 102–127), "What you get" (line 170–181), and "Pricing" (line 184–211) blocks — replace `border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm` with `glass-card`.

### 7b — Wire ScrollReveal

Import `ScrollReveal` at top and wrap each major `<div className="mb-8 ...">` section in a `<div className="scroll-reveal">` wrapper (or use ScrollReveal component). Add inline `transitionDelay` to stagger sections at 60ms each.

### 7c — Pass full 4-language data to ConnectTabs

The `tsExamples` object (lines 13–25) currently only has TypeScript examples. Expand it to include all 4 languages OR create a new `codeExamples` object and pass it to `<ConnectTabs>`. Update the `ConnectTabs` import to use the new prop shape.

Example new prop object to pass:
```tsx
const codeExamples = {
  python: {
    install: 'pip install agentpick',
    example: `from agentpick import AgentPick\n\nap = AgentPick(api_key="YOUR_KEY", strategy="auto")\nresults = ap.search("SEC filings NVDA 2025")\nprint(results)`,
  },
  typescript: {
    install: 'npm install agentpick',
    example: `import { AgentPickClient } from 'agentpick';\n\nconst client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY! });\nconst result = await client.route('search', 'latest AI benchmarks 2026');\nconsole.log(result.tool_used, result.latency_ms);`,
  },
  curl: {
    install: '',
    example: `curl -X POST https://agentpick.dev/api/v1/route/search \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query": "latest AI benchmarks 2026", "strategy": "auto"}'`,
  },
  go: {
    install: '# stdlib only',
    example: `req, _ := http.NewRequest("POST", "https://agentpick.dev/api/v1/route/search", body)\nreq.Header.Set("Authorization", "Bearer YOUR_KEY")`,
  },
};
```

Update `<ConnectTabs tsExamples={tsExamples} />` → `<ConnectTabs examples={codeExamples} />` (align with whatever prop name you use in Task 8 below).

---

## Task 8 — Implement 4-Tab Code Switcher Component (Must-Have #3)

**File:** `src/components/ConnectTabs.tsx`

Current state: placeholder that renders `null` (line 17). Implement the full tab switcher.

### Requirements:
- Tabs: `Python` | `TypeScript` | `cURL` | `Go`
- Keyboard navigable: `←` / `→` arrow keys move focus between tabs
- ARIA roles: `role="tablist"` on container, `role="tab"` on each tab, `role="tabpanel"` on content area
- `aria-selected`, `aria-controls`, `tabIndex` wired correctly
- Last selected tab persisted in `localStorage` key `'ap_code_tab'`; restored on mount
- Each tab shows: install command block + example code block

### Implementation:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Lang = 'python' | 'typescript' | 'curl' | 'go';

interface LangSnippet {
  install: string;
  example: string;
}

interface ConnectTabsProps {
  examples: Record<Lang, LangSnippet>;
}

const LANGS: { id: Lang; label: string }[] = [
  { id: 'python',     label: 'Python'     },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'curl',       label: 'cURL'       },
  { id: 'go',         label: 'Go'         },
];

const LS_KEY = 'ap_code_tab';

export default function ConnectTabs({ examples }: ConnectTabsProps) {
  const [active, setActive] = useState<Lang>('python');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as Lang | null;
    if (saved && LANGS.some((l) => l.id === saved)) setActive(saved);
  }, []);

  function select(lang: Lang) {
    setActive(lang);
    localStorage.setItem(LS_KEY, lang);
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowRight') {
      const next = (idx + 1) % LANGS.length;
      tabRefs.current[next]?.focus();
      select(LANGS[next].id);
    } else if (e.key === 'ArrowLeft') {
      const prev = (idx - 1 + LANGS.length) % LANGS.length;
      tabRefs.current[prev]?.focus();
      select(LANGS[prev].id);
    }
  }

  const snippet = examples[active];

  return (
    <div className="mb-6">
      {/* Tab list */}
      <div role="tablist" aria-label="Code language" className="flex gap-1 mb-3 border-b border-white/[0.08]">
        {LANGS.map(({ id, label }, idx) => (
          <button
            key={id}
            ref={(el) => { tabRefs.current[idx] = el; }}
            role="tab"
            id={`tab-${id}`}
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            tabIndex={active === id ? 0 : -1}
            onClick={() => select(id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={[
              'px-4 py-2 text-[12px] font-semibold font-mono rounded-t transition-colors',
              active === id
                ? 'bg-white/[0.08] text-white border-b-2 border-orange-400'
                : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="rounded-lg bg-black/40 p-4 font-mono text-[13px] text-green-400 overflow-x-auto"
      >
        {snippet.install && (
          <div className="mb-3 text-white/50">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Install</div>
            <pre className="whitespace-pre-wrap">{snippet.install}</pre>
          </div>
        )}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Example</div>
          <pre className="whitespace-pre-wrap">{snippet.example}</pre>
        </div>
      </div>
    </div>
  );
}
```

**Note on prop compatibility:** The old `ConnectTabs` accepted `tsExamples: TsExamples`. You are replacing the entire component. Coordinate with `connect/page.tsx` (Task 7) — both files change together in this PR.

---

## Files to Create/Modify

| Action | File | Task |
|--------|------|------|
| MODIFY | `agentpick-router-qa.py` | Task 1 — add `TestEmbedRoute` class |
| MODIFY | `src/app/globals.css` | Task 2 — glass tokens, `.glass-card`, `.data-mono`, micro-interactions |
| MODIFY | `src/app/benchmarks/page.tsx` | Task 3 — glass cards + ScrollReveal |
| MODIFY | `src/app/rankings/page.tsx` | Task 4 — glass cards + ScrollReveal |
| MODIFY | `src/app/agents/page.tsx` | Task 5 — glass cards + ScrollReveal |
| MODIFY | `src/app/dashboard/page.tsx` | Task 6 — glass cards + data-mono + ScrollReveal |
| MODIFY | `src/app/connect/page.tsx` | Task 7 — glass cards + ScrollReveal + pass 4-lang data |
| MODIFY | `src/components/ConnectTabs.tsx` | Task 8 — full 4-tab switcher implementation |

**Do NOT touch:** `src/app/page.tsx`, `src/app/api/`, `src/components/AnimatedCounter.tsx`

---

## Verification Checklist (Codex)

- [ ] `agentpick-router-qa.py` has `TestEmbedRoute` class with `"voyage-embed"` in valid list (not `"voyage-ai"`)
- [ ] `python agentpick-router-qa.py` reports **51/51** (5 tests, all pass)
- [ ] `globals.css` `.glass-card` uses `blur(16px)`, `rgba(255,255,255,0.04)` bg, 1px border at `rgba(255,255,255,0.12)`
- [ ] `globals.css` has `--glass-bg`, `--glass-border` CSS custom properties defined
- [ ] `globals.css` has `.data-mono` with `font-variant-numeric: tabular-nums` + JetBrains Mono
- [ ] `globals.css` has `.card-hover-lift` (translateY(-4px)), `.btn-shimmer` shimmer, `.strategy-pulse` pulse — all inside `@media (prefers-reduced-motion: no-preference)`
- [ ] `body` uses `var(--bg-base)` background — no white flash on any route
- [ ] `benchmarks/page.tsx`: benchmark domain tiles have `glass-card card-hover-lift`; latency/score values have `data-mono`
- [ ] `rankings/page.tsx`: ranking rows have `glass-card card-hover-lift`; score cells have `data-mono`
- [ ] `agents/page.tsx`: agent directory cards have `glass-card card-hover-lift`
- [ ] `dashboard/page.tsx`: stat tiles have `glass-card`; all stat numbers have `data-mono`
- [ ] `connect/page.tsx`: strategy blocks and major sections use `glass-card`; ScrollReveal wired
- [ ] `ConnectTabs.tsx`: renders 4 tabs (Python, TypeScript, cURL, Go); keyboard `←`/`→` navigation works; `localStorage` persists selection; `role="tablist"` / `role="tab"` / `role="tabpanel"` present
- [ ] Tab switcher on `/connect` shows correct runnable snippet per language
