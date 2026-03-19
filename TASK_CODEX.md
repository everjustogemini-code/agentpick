# TASK_CODEX.md — Cycle 8 (Frontend / UI + QA fix)
**Agent:** Codex
**Source:** NEXT_VERSION.md (2026-03-18, cycle 8)
**QA baseline:** 50/51 — P1 fix here (Task 1) brings it to 51/51
**Scope:** Must-Have #1 QA fix + Must-Have #2 full dark-glass design system + Must-Have #3 frontend docs
**Must NOT touch:** `src/lib/`, `src/app/api/`, `src/app/v1/`, `src/lib/benchmark/adapters/`

---

## Task 1 — Fix P1 QA Validator: Update `voyage-embed` → `voyage-ai` Valid Slug

**File:** `agentpick-router-qa.py`

The backend (Claude Code Task 1) is updating the embed adapter to emit `"voyage-ai"`. The QA validator's valid list must match the new canonical slug.

Find the `TestEmbedRoute` class (or `test_embed_route_valid_tool` method) in the file. Locate the `valid` list:

```python
# before (cycle 7)
valid = ["cohere-embed", "voyage-embed", "jina-embeddings"]

# after (cycle 8)
valid = ["cohere-embed", "voyage-ai", "jina-embeddings"]
```

Change `"voyage-embed"` → `"voyage-ai"` in the valid list. No other changes to this file.

**Acceptance:** `python agentpick-router-qa.py` reports **51/51** once Claude Code's backend fix is deployed.

---

## Task 2 — Dark-Glass Design System: CSS Tokens & Global Styles

**File:** `src/app/globals.css`

### 2a — Ensure/add CSS custom properties in `:root { }`

Add these if not already present (do not duplicate existing definitions):
```css
--glass-bg: rgba(255, 255, 255, 0.04);
--glass-border: rgba(255, 255, 255, 0.12);
--glass-blur: 16px;
```

### 2b — Update `.glass-card` to full spec

Find the existing `.glass-card` block and update it to:
```css
.glass-card {
  -webkit-backdrop-filter: blur(var(--glass-blur, 16px));
  backdrop-filter: blur(var(--glass-blur, 16px));
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}
```

### 2c — Add `.data-mono` class for monospace numeric data

Append after `.glass-card`:
```css
/* Monospace numeric data (latency, scores, call counts) */
.data-mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
```

### 2d — Add micro-interaction classes (gated on prefers-reduced-motion)

Append near end of file (before any existing `@media (prefers-reduced-motion)` blocks, or merge into one):
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
}
```

### 2e — Ensure `body` uses `var(--bg-base)` (prevent white flash)

Find the `body { }` rule. Confirm it includes `background: var(--bg-base);`. Add it if missing.

---

## Task 3 — Homepage: Count-Up Hero Stats + "OpenAI-compatible" Feature

**File:** `src/app/page.tsx`

### 3a — Count-up hero stats (sessionStorage one-shot)

Find the "X agents ranked" and "Y calls routed" stat figures in the hero section. If they already use `AnimatedCounter` or `OnceAnimatedCounter` from cycle 7, verify the sessionStorage one-shot guard is in place (look for `sessionStorage.getItem('ap_stats_animated')`). If not, apply the `OnceAnimatedCounter` pattern (component is at `src/components/OnceAnimatedCounter.tsx` — created in cycle 7; import and use it):

```tsx
import OnceAnimatedCounter from '@/components/OnceAnimatedCounter';
// ...
<OnceAnimatedCounter value={agentCount} suffix="+" />
<OnceAnimatedCounter value={callsRouted} suffix="+" />
```

### 3b — Add "OpenAI-compatible" to homepage feature list

Find the homepage feature/capability list (likely a grid of feature cards or bullet points). Add a new entry:

```tsx
{
  icon: '🔗',   // or whichever icon pattern the page uses
  title: 'OpenAI-compatible',
  description: 'Drop-in replacement — change only base_url, keep your existing OpenAI client.',
}
```

Match the exact JSX pattern used by the existing feature items (icon, title, description props or inline structure). Apply `glass-card card-hover-lift` to the new card container if other cards use it.

---

## Task 4 — Glass Cards + ScrollReveal: Benchmarks Page

**File:** `src/app/benchmarks/page.tsx`

1. Import `ScrollReveal` at top: `import ScrollReveal from '@/components/ScrollReveal';`
2. Find benchmark domain tile elements. Add `glass-card card-hover-lift` to each tile's `className`.
3. Add `scroll-reveal` class + `style={{ transitionDelay: \`${index * 60}ms\` }}` to each tile (or wrap sibling groups in `<ScrollReveal staggerMs={60}>` if the component supports it).
4. Find latency/score numeric values inside tiles → add `className="data-mono"` to their `<span>` or `<td>`.

---

## Task 5 — Glass Cards + ScrollReveal: Rankings Page

**File:** `src/app/rankings/page.tsx`

1. Import `ScrollReveal` at top.
2. Find ranking row elements. Add `glass-card card-hover-lift` to each row container's `className`.
3. Add scroll-reveal stagger (60ms) to rows.
4. Add `data-mono` to score/latency numeric cells.

---

## Task 6 — Glass Cards + ScrollReveal: Agents Directory

**File:** `src/app/agents/page.tsx`

1. Import `ScrollReveal` at top.
2. Find agent directory card elements. Add `glass-card card-hover-lift` to each card container's `className`.
3. Add `scroll-reveal` + `transitionDelay: \`${index * 60}ms\`` to each card.

---

## Task 7 — Glass Cards + ScrollReveal: Dashboard

**File:** `src/app/dashboard/page.tsx`

1. Import `ScrollReveal` at top.
2. Find stat tiles (call count, cost, usage, etc.). Add `glass-card` to each tile `className`.
3. Add `data-mono` class to all numeric stat values (call counts, costs, latencies).
4. Wrap stat tile groups in ScrollReveal with 60ms stagger.

---

## Task 8 — Glass Cards + ScrollReveal + Migration Snippet: `/connect` Page

**File:** `src/app/connect/page.tsx`

### 8a — Apply glass cards to major sections

Find the strategy blocks, "Quick Start", "Two Ways to Start", and pricing sections. Replace inline Tailwind glass patterns (`border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm`) with the CSS class tokens:

```tsx
// before (example)
<div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
// after
<div className="mb-8 rounded-xl glass-card card-hover-lift p-6">
```

Apply to all major section blocks on this page.

### 8b — Wire ScrollReveal

Import `ScrollReveal` at top. Wrap each major `<div className="mb-8 ...">` section with `<div className="scroll-reveal">` and add `style={{ transitionDelay: \`${sectionIndex * 60}ms\` }}`.

### 8c — Add "Migration" section (Must-Have #3 docs)

**This is the only frontend change for Must-Have #3.** Add a new section to the page (below the "Quick Start" block or at the end of the main content), showing the OpenAI → AgentPick one-line migration:

```tsx
{/* Migration section */}
<div className="mb-8 rounded-xl glass-card p-6 scroll-reveal">
  <h2 className="text-lg font-bold mb-3 text-white">Already using OpenAI? One change.</h2>
  <p className="text-white/60 mb-4 text-sm">
    AgentPick is OpenAI Responses API compatible. Change only <code>base_url</code> — keep your existing client, auth, and code.
  </p>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <div className="text-[10px] uppercase tracking-widest text-red-400/70 mb-2">Before</div>
      <pre className="rounded-lg bg-black/40 p-3 text-[12px] text-red-300 overflow-x-auto font-mono">{`from openai import OpenAI

client = OpenAI(api_key="sk-...")
response = client.responses.create(
    model="gpt-4o",
    input="search for X",
)`}</pre>
    </div>
    <div>
      <div className="text-[10px] uppercase tracking-widest text-green-400/70 mb-2">After (AgentPick)</div>
      <pre className="rounded-lg bg-black/40 p-3 text-[12px] text-green-300 overflow-x-auto font-mono">{`from openai import OpenAI

client = OpenAI(
    api_key="ah_live_sk_...",
    base_url="https://agentpick.dev",  # ← only change
)
response = client.responses.create(
    model="auto",
    input="search for X",
)`}</pre>
    </div>
  </div>
</div>
```

---

## Task 9 — Extend ScrollReveal to All Pages

**File:** `src/components/ScrollReveal.tsx`

The component currently activates only on the homepage (or has a guard that prevents it from running elsewhere). Remove any homepage-specific guard. The `IntersectionObserver` logic should work on any page that renders elements with `className="scroll-reveal"`. If the component accepts a `staggerMs` prop, ensure it applies `transitionDelay` to each child based on its index × `staggerMs`. Example:

```tsx
// If not already present, add stagger support:
interface ScrollRevealProps {
  children: React.ReactNode;
  staggerMs?: number;  // default 60
}
```

Do NOT change the observer threshold or animation keyframes — only remove the page-scope guard and add stagger prop if missing.

---

## Files to Create/Modify (summary)

| Action | File | Task |
|--------|------|------|
| MODIFY | `agentpick-router-qa.py` | 1 — `"voyage-embed"` → `"voyage-ai"` in valid list |
| MODIFY | `src/app/globals.css` | 2 — glass tokens, `.glass-card`, `.data-mono`, micro-interactions |
| MODIFY | `src/app/page.tsx` | 3 — count-up sessionStorage guard + "OpenAI-compatible" feature |
| MODIFY | `src/app/benchmarks/page.tsx` | 4 — glass cards + ScrollReveal + data-mono |
| MODIFY | `src/app/rankings/page.tsx` | 5 — glass cards + ScrollReveal + data-mono |
| MODIFY | `src/app/agents/page.tsx` | 6 — glass cards + ScrollReveal |
| MODIFY | `src/app/dashboard/page.tsx` | 7 — glass cards + data-mono + ScrollReveal |
| MODIFY | `src/app/connect/page.tsx` | 8 — glass cards + ScrollReveal + Migration snippet |
| MODIFY | `src/components/ScrollReveal.tsx` | 9 — remove homepage guard, add stagger prop |

**Do NOT touch:** `src/lib/`, `src/app/api/`, `src/app/v1/`, `src/lib/benchmark/adapters/`, `src/components/ConnectTabs.tsx` (no change needed this cycle)

---

## Verification Checklist (Codex)

- [ ] `agentpick-router-qa.py` valid list contains `"voyage-ai"` (not `"voyage-embed"`)
- [ ] `globals.css` `.glass-card` uses `blur(16px)`, `rgba(255,255,255,0.04)` bg, 1px border at `rgba(255,255,255,0.12)`
- [ ] `globals.css` has `--glass-bg`, `--glass-border` CSS vars in `:root`
- [ ] `globals.css` has `.data-mono` with `font-variant-numeric: tabular-nums` + JetBrains Mono
- [ ] `globals.css` has `.card-hover-lift` (translateY(-4px)) inside `@media (prefers-reduced-motion: no-preference)`
- [ ] `globals.css` has `.btn-shimmer` shimmer sweep, 600ms
- [ ] `body` rule uses `var(--bg-base)` — no white flash on any route
- [ ] `page.tsx`: hero stat counters use sessionStorage one-shot guard
- [ ] `page.tsx`: homepage feature list includes "OpenAI-compatible" entry with glass card
- [ ] `benchmarks/page.tsx`: domain tiles have `glass-card card-hover-lift`; latency/score values have `data-mono`; scroll-reveal stagger applied
- [ ] `rankings/page.tsx`: ranking rows have `glass-card card-hover-lift`; score cells have `data-mono`
- [ ] `agents/page.tsx`: agent cards have `glass-card card-hover-lift`; scroll-reveal stagger applied
- [ ] `dashboard/page.tsx`: stat tiles have `glass-card`; all stat numbers have `data-mono`; scroll-reveal applied
- [ ] `connect/page.tsx`: strategy/section blocks use `glass-card`; ScrollReveal wired; Migration section present with before/after code snippets
- [ ] `ScrollReveal.tsx`: activates on all pages (no homepage-only guard); supports `staggerMs` prop
- [ ] QA 51/51 after Claude Code backend fix deploys
