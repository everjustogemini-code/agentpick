# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md Must-Have #2 (Playground frontend) + Must-Have #3 (Dashboard panel)

---

## Files to create / modify (ONLY these — no others)

| Action | File |
|--------|------|
| CREATE | `src/components/Playground.tsx` |
| MODIFY | `src/app/connect/page.tsx` |
| MODIFY | `src/app/dashboard/router/page.tsx` |

**DO NOT TOUCH:** `src/lib/router/**`, `src/app/api/**`, `src/app/page.tsx`, `src/components/PlaygroundClient.tsx`, `src/components/PlaygroundShell.tsx`, or any other file not listed above.

---

## Feature 1 — MH#2: Create `src/components/Playground.tsx` (new file)

A self-contained "Try It" panel that lets visitors run a live search/embed/finance query without an API key. Uses `POST /api/v1/playground/route` (already implemented by Claude Code).

### Component interface

```typescript
'use client';
// No props — fully self-contained
export default function Playground() { ... }
```

### Behavior

1. **Input row:** Text input for the query + 3 pill buttons to select type: `Search`, `Embed`, `Finance`. Default selected: `Search`.

2. **"Route it →" button:** Disabled when input is empty. On click, `POST /api/v1/playground/route` with `{ query, type }`. Show a spinner during the request.

3. **Trial counter:** Track usage in `localStorage` under key `pg_trial_count` (integer, default 0). After each successful call, increment. When count reaches 3, show an inline upsell banner below the result:
   > *"Get 3,000 free calls/month →"* linking to `/dashboard/router`
   The banner does NOT block further usage — it's informational only.

4. **Result panel:** Animate in with `opacity-0 → opacity-100` + `translateY(8px → 0)` transition over 300ms. Show:
   - **Tool used:** e.g. `exa-search` in an orange pill badge
   - **Latency:** e.g. `243ms` in monospace
   - **AI reasoning** (if `classification_reason` present): italic text
   - **Up to 2 result snippets:** render `title` + `url` from the `results` array; truncate `url` to 50 chars
   - **Copy-to-curl button:** copies the equivalent authenticated curl command to clipboard:
     ```
     curl -X POST https://agentpick.dev/api/v1/route/{type} \
       -H "Authorization: Bearer YOUR_KEY" \
       -d '{"params":{"query":"<query>"},"strategy":"auto"}'
     ```

5. **Error handling:** If the API returns an error or the fetch throws, show an inline error message inside the result panel (red text). Do NOT crash or show a blank panel.

6. **Rate limit:** If API returns 429, show: *"Slow down — 5 requests/min limit. Try again in a moment."*

### Styling

Follow the existing design system (already in `globals.css`):
- Panel: `rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm` (matches dashboard dark cards)
- Input: `rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:border-orange-500/60 focus:outline-none`
- Primary button: `rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50`
- Type pills (inactive): `rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/50`
- Type pills (active): `rounded-lg border border-orange-500/50 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400`

The panel sits on a dark (`#0a0a0f`) background (same as the rest of `/connect`).

### Result animation

Use Tailwind's `transition-all duration-300` with a controlled class toggle. Start hidden (`opacity-0 translate-y-2`) and toggle to visible (`opacity-100 translate-y-0`) after the response arrives using a `useState` + `useEffect` pattern.

---

## Feature 2 — MH#2: Embed Playground in `/connect` page

**File:** `src/app/connect/page.tsx`

**Change:** Import and render `<Playground />` directly after the hero section (after the `<h1>` and `<p>` description, before the "Quick Start" block).

```tsx
import Playground from '@/components/Playground';

// In ConnectPage JSX, after:
// <p className="mb-6 text-sm text-white/40">One key. Every tool...</p>
// Insert:
<section className="mb-10">
  <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-4">
    Live demo — no signup required
  </p>
  <Playground />
</section>
```

No other changes to `connect/page.tsx`.

---

## Feature 3 — MH#3: Dashboard usage progress bar + budget input

**File:** `src/app/dashboard/router/page.tsx`

Claude Code is fixing the backend so `GET /api/v1/router/usage` now returns top-level `monthlyLimit`, `callsThisMonth`, `strategy`. Your job is to wire the dashboard UI.

### 3A. Update `UsageStats` TypeScript interface (top of file)

Add the new top-level fields to the interface:

```typescript
interface UsageStats {
  plan: string;
  monthlyLimit: number | null;      // ← ADD
  callsThisMonth: number;           // ← ADD
  strategy: string;                 // ← ADD
  daily_limit: number;
  daily_used: number;
  daily_remaining: number;
  stats: {
    period: { days: number; since: string };
    totalCalls: number;
    successRate: number;
    fallbackRate: number;
    avgLatencyMs: number;
    totalCostUsd: number;
    byCapability: Record<string, { calls: number; avgLatency: number; successRate: number }>;
    byTool: Record<string, { calls: number; avgLatency: number }>;
  };
}
```

### 3B. Add monthly usage progress bar

Find the **Stats Cards** section (the `grid grid-cols-2 gap-4 sm:grid-cols-4` div). Insert a new full-width panel **above** this grid that shows monthly usage:

```tsx
{usage && (
  <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">
        MONTHLY USAGE
      </h2>
      <span className="font-mono text-xs text-white/40">
        {usage.callsThisMonth.toLocaleString()} / {usage.monthlyLimit?.toLocaleString() ?? '∞'} calls
      </span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
        style={{
          width: usage.monthlyLimit
            ? `${Math.min((usage.callsThisMonth / usage.monthlyLimit) * 100, 100)}%`
            : '0%',
        }}
      />
    </div>
    {usage.monthlyLimit && usage.callsThisMonth / usage.monthlyLimit > 0.8 && (
      <p className="mt-2 text-[11px] text-amber-400">
        Over 80% of monthly quota used.
      </p>
    )}
  </div>
)}
```

### 3C. Add budget input to Settings panel

Find the **Settings** panel (the `rounded-2xl` div with `h2` text "SETTINGS"). Add a budget input at the end of the `space-y-3` block, after the existing rows:

```tsx
<BudgetInput apiKey={apiKey} currentBudget={account.monthlyBudgetUsd} />
```

Create this sub-component inside the same file (at the bottom, before the closing brace):

```typescript
function BudgetInput({
  apiKey,
  currentBudget,
}: {
  apiKey: string;
  currentBudget: number | null;
}) {
  const [value, setValue] = useState(currentBudget?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleBlur = async () => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed === currentBudget) return;
    setSaving(true);
    try {
      await fetch('/api/v1/router/budget', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budget: parsed }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40">Monthly budget ($)</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="Unlimited"
          className="w-24 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-right font-mono text-xs text-orange-400 placeholder-white/20 focus:border-orange-500/60 focus:outline-none"
        />
        {saving && <span className="text-[10px] text-white/30">saving…</span>}
        {saved && <span className="text-[10px] text-green-400">saved ✓</span>}
      </div>
    </div>
  );
}
```

No other changes to `dashboard/router/page.tsx`. The strategy selector already works — do NOT touch it.

---

## Verification checklist

- [ ] `/connect` page shows `<Playground />` panel above "Quick Start"
- [ ] Playground: empty input → "Route it →" button is disabled
- [ ] Playground: submit query → spinner → result animates in with opacity/translateY transition
- [ ] Playground: result shows tool badge, latency, and up to 2 result snippets
- [ ] Playground: copy-to-curl button copies correct curl string to clipboard
- [ ] Playground: after 3 successful calls, upsell banner appears (check localStorage `pg_trial_count`)
- [ ] Playground: 429 response → correct rate limit message shown
- [ ] Dashboard: monthly usage progress bar appears above stats cards when `usage` is loaded
- [ ] Dashboard: progress bar width reflects `callsThisMonth / monthlyLimit` ratio
- [ ] Dashboard: budget input in Settings panel; blur triggers `POST /api/v1/router/budget`
- [ ] No changes made to any file outside the 3 listed above
