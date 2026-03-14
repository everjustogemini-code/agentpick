# TASK_CLAUDE_CODE.md — v0.4 Cycle

> Agent: Claude Code | Date: 2026-03-14 | Difficulty: Hard
> Features: F1 (glassmorphic design system) + F3 (interactive code generator)

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |
| MODIFY | `src/app/dashboard/router/page.tsx` |
| MODIFY | `src/app/page.tsx` |
| MODIFY | `src/app/connect/page.tsx` |
| CREATE | `src/components/CodeGeneratorWidget.tsx` |

**DO NOT TOUCH:** Any file under `src/app/api/`, `src/lib/router/`, `src/components/SiteHeader.tsx`

---

## Feature 1 — Glassmorphic Design System

### 1A. `src/app/globals.css` — Add Dark Tokens + Glass Utilities + Animations

This project uses **Tailwind v4** (`@import "tailwindcss"` in globals.css; no `tailwind.config.ts`). Theme extensions go in the existing `@theme inline {}` block and a separate `@theme {}` block.

**Step 1 — Add to the existing `:root` block** (after the last existing variable):

```css
/* === Dark Glass Design System (v0.4) === */
--bg-base:           #0a0a0f;
--bg-surface:        rgba(255,255,255,0.04);
--bg-surface-hover:  rgba(255,255,255,0.07);
--border-subtle:     rgba(255,255,255,0.08);
--border-active:     rgba(249,115,22,0.45);

--gradient-mesh: radial-gradient(ellipse 80% 60% at 50% -10%,
                   rgba(249,115,22,0.15) 0%, transparent 70%),
                 radial-gradient(ellipse 60% 40% at 80% 80%,
                   rgba(99,102,241,0.08) 0%, transparent 60%);
```

**Step 2 — Add inside the existing `@theme inline {}` block** (after the last `--color-*` token):

```css
--color-bg-base: var(--bg-base);
--color-bg-surface: var(--bg-surface);
--color-bg-surface-hover: var(--bg-surface-hover);
--color-border-subtle: var(--border-subtle);
--color-border-active: var(--border-active);
```

**Step 3 — Append a new `@theme {}` block** at the end of the file (for shadow + blur Tailwind v4 utilities):

```css
@theme {
  --shadow-glass: 0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4);
  --shadow-glow-orange: 0 0 12px rgba(249,115,22,0.35);
  --shadow-glow-cyan:   0 0 12px rgba(14,165,233,0.3);
  --backdrop-blur-xs: 4px;
}
```

**Step 4 — Append `hero-mesh` class + `mesh-shift` keyframe** after the existing `@keyframes` section:

```css
@keyframes mesh-shift {
  0%   { background-position: 0% 50%, 0 0, 0 0; }
  50%  { background-position: 100% 50%, 0 0, 0 0; }
  100% { background-position: 0% 50%, 0 0, 0 0; }
}

.hero-mesh {
  background:
    var(--gradient-mesh),
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 200% 200%, 64px 64px, 64px 64px;
}

@media (prefers-reduced-motion: no-preference) {
  .hero-mesh { animation: mesh-shift 20s ease infinite; }
}
```

---

### 1B–1F. `src/app/dashboard/router/page.tsx` — Full Glass Redesign

Read the file first. It is a large `'use client'` component with a login screen and a dashboard view.

#### Page background wrapper

The dashboard return block starts with `<div className="mx-auto max-w-4xl px-4 py-8">`. Wrap it:

```tsx
// Before:
<div className="mx-auto max-w-4xl px-4 py-8">
  ...content...
</div>

// After:
<div className="min-h-screen bg-[#0a0a0f]">
  <div className="mx-auto max-w-4xl px-4 py-8">
    ...content...
  </div>
</div>
```

#### Login screen — dark glass

The login screen renders when `!apiKey || !account`. Its outer wrapper `<div className="mx-auto max-w-md px-4 py-20">` becomes:

```tsx
<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
  <div className="w-full max-w-md px-4 py-12">
```

Close the extra div. Also close the API-key-display variant with the same wrapper.

Inside login/register form:
- `<h1 ...text-gray-900>` → `text-white`
- `<p ...text-gray-500>` (subtitle) → `text-white/40`
- `<label ...text-gray-600>` → `text-white/50`
- All `<input>` className → replace entirely with:
  ```
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:border-orange-500/60 focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
  ```
- Submit buttons: `bg-gray-900 ... hover:bg-gray-800` → `bg-orange-500 hover:bg-orange-600`
- "Create new account" link: keep `text-orange-500`
- API key display card: `border-green-200 bg-green-50` → `border-white/[0.08] bg-white/[0.04]`; code `text-gray-800` → `text-green-400`
- Copy button: `bg-gray-100 text-gray-700 hover:bg-gray-200` → `bg-white/[0.06] text-white/60 hover:bg-white/[0.09]`
- "Loading dashboard..." text: `text-gray-400` → `text-white/30`
- "Already have a key?" button: `text-gray-400` → `text-white/30`

#### Dashboard header

- `text-xl font-bold text-gray-900` → `text-xl font-bold text-white`
- `text-xs text-gray-400 font-mono` → `text-xs text-white/30 font-mono`
- Plan badge: `bg-orange-100 text-orange-700` → `bg-orange-500/15 text-orange-400 border border-orange-500/20`
- Usage counter: `text-xs text-gray-500` → `text-xs text-white/40`
- Logout: `text-xs text-gray-400 hover:text-gray-600` → `text-xs text-white/30 hover:text-white/60`

#### StatCard — animated counter (replace entire function)

The `StatCard` component at the bottom of the file parses string/number values and animates them. Replace the entire function:

```tsx
function StatCard({ label, value }: { label: string; value: string | number }) {
  const [displayed, setDisplayed] = useState<string | number>(value);

  useEffect(() => {
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(value);
      return;
    }

    const isPercent = typeof value === 'string' && value.endsWith('%');
    const isDollar = typeof value === 'string' && value.startsWith('$');
    const isNum = typeof value === 'number';
    const target = isNum ? value
      : isPercent ? parseFloat(value as string)
      : isDollar ? parseFloat((value as string).slice(1))
      : null;

    if (target === null) { setDisplayed(value); return; }

    const start = performance.now();
    const duration = 600;
    const raf = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = target * eased;
      if (isNum) setDisplayed(Math.round(cur));
      else if (isPercent) setDisplayed(`${cur.toFixed(1)}%`);
      else if (isDollar) setDisplayed(`$${cur.toFixed(2)}`);
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [value]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 shadow-glass
                    backdrop-blur-sm transition-all duration-200
                    hover:border-white/[0.13] hover:bg-white/[0.06]">
      <p className="text-3xl font-bold tabular-nums bg-gradient-to-b from-white to-white/60
                    bg-clip-text text-transparent">
        {displayed}
      </p>
      <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">
        {label}
      </p>
    </div>
  );
}
```

Note: `useState` and `useEffect` are already imported. No new imports needed.

#### Tool Usage Panel — glass card + gradient bars

Replace the entire tool usage section (the `<div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">` containing `TOOL USAGE`):

```tsx
<div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5
                shadow-glass backdrop-blur-sm">
  <h2 className="mb-4 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">
    Tool Usage
  </h2>
  <div className="space-y-3">
    {Object.entries(stats.byTool)
      .sort(([, a], [, b]) => b.calls - a.calls)
      .map(([tool, data], index) => {
        const pct = stats.totalCalls > 0 ? (data.calls / stats.totalCalls) * 100 : 0;
        return (
          <div key={tool} className="flex items-center gap-3">
            <span className="w-28 truncate text-xs font-mono text-white/50">{tool}</span>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-white/[0.06]">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400
                              shadow-glow-orange transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    transitionDelay: `${index * 60}ms`,
                  }}
                />
              </div>
            </div>
            <span className="w-10 text-right text-xs text-white/40">{pct.toFixed(0)}%</span>
            <span className="w-14 text-right text-xs text-white/30">{data.avgLatency}ms</span>
          </div>
        );
      })}
  </div>
</div>
```

#### Strategy Selector Panel — glass + pill glow

Replace outer div `rounded-xl border border-gray-100 bg-white p-5` → `rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm`

Section heading: `text-sm font-semibold text-gray-700` → `text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30`

Strategy button className — replace entirely:
```tsx
className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150
  disabled:opacity-50 border ${
  account.strategy === s
    ? 'bg-orange-500/15 text-orange-400 border-orange-500/50 ring-1 ring-orange-500/50 shadow-glow-orange'
    : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.07] hover:text-white/70'
}`}
```

Strategy error: keep `text-xs text-red-500`
Strategy description: `text-xs text-gray-400` → `text-xs text-white/40`

#### Strategy Comparison Panel — glass card

- Outer div: same glass card pattern
- `text-gray-500` headers → `text-white/30`
- `border-gray-100` / `border-gray-50` → `border-white/[0.06]` / `border-white/[0.04]`
- `text-gray-700` → `text-white/70`; `text-gray-600` → `text-white/60`; `text-gray-500` → `text-white/40`

#### Recent Calls Panel — glass + hover rows

- Outer div: same glass card pattern
- Section heading → `text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30`
- "auto-refresh 10s": `text-gray-400` → `text-white/20`
- Empty state: `text-gray-400` → `text-white/30`
- Call row div: remove `bg-gray-50` → `hover:bg-white/[0.04] transition-colors duration-150`
- Timestamp `text-gray-400` → `text-white/30`
- Capability `text-gray-500` → `text-white/40`
- Query `text-gray-600` → `text-white/50`
- Tool `text-gray-500` → `text-white/50`
- Success `text-green-600` → `text-green-400`; fail `text-red-500` → keep
- Latency `text-gray-400` → `text-white/25`
- Fallback badge: `bg-yellow-100 text-yellow-700` → `bg-yellow-500/10 text-yellow-400`

#### Fallback Log Panel — glass card

Same glass card treatment. Same text color mapping pattern.

#### Settings Panel — glass card

Same glass card treatment. `font-mono text-gray-700` for values → `font-mono text-orange-400`

#### Upgrade CTA — dark gradient

Replace entirely:
```tsx
<div className="rounded-2xl border border-orange-500/20 bg-gradient-to-r
                from-orange-500/10 to-amber-500/10 p-5 text-center backdrop-blur-sm">
  <p className="text-sm font-medium text-white">Upgrade to Pro — 10K calls/month</p>
  <p className="mt-1 text-xs text-white/40">
    Unlock BYOK, higher limits, and priority support.
  </p>
  <Link
    href="/connect"
    className="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium
               text-white hover:bg-orange-600 transition-colors shadow-glow-orange"
  >
    View Plans →
  </Link>
</div>
```

---

### 1E. `src/app/page.tsx` — Hero Animated Gradient Mesh

Read the file. The hero section is a `<section className="mx-auto max-w-[1200px] px-6 pb-4 pt-16 md:pt-20">`. Wrap it:

```tsx
// Before:
<section className="mx-auto max-w-[1200px] px-6 pb-4 pt-16 md:pt-20">
  ...
</section>

// After:
<div className="hero-mesh relative overflow-hidden">
  <section className="mx-auto max-w-[1200px] px-6 pb-4 pt-16 md:pt-20 relative z-10">
    ...
  </section>
</div>
```

Update the `<h1>` className (preserve font-size classes, only replace color/weight):
```tsx
className="mb-4 text-[40px] font-extrabold leading-[1.1] tracking-tight
           text-transparent bg-clip-text bg-gradient-to-br
           from-white via-gray-100 to-gray-400 md:text-[56px]"
```
Remove the `style={{ letterSpacing: '-0.02em' }}` prop (tracking-tight replaces it).

The subtitle `<p>` below: keep size classes, change `text-text-secondary` → `text-white/60`.

---

## Feature 3 — Interactive Code Generator Widget

### 3A. CREATE `src/components/CodeGeneratorWidget.tsx`

Full implementation — pure client-side, no API calls:

```tsx
'use client';

import { useState } from 'react';

const LANGUAGES = ['Python', 'JavaScript', 'curl'] as const;
const CAPABILITIES = ['search', 'crawl', 'finance', 'embed'] as const;
const STRATEGIES = ['auto', 'balanced', 'best_performance', 'cheapest', 'most_stable'] as const;

type Language = typeof LANGUAGES[number];
type Capability = typeof CAPABILITIES[number];
type Strategy = typeof STRATEGIES[number];

const SAMPLE_QUERIES: Record<Capability, string> = {
  search: 'latest AI research papers',
  crawl: 'https://example.com',
  finance: 'NVDA earnings Q4 2025',
  embed: 'semantic search text',
};

function buildCode(lang: Language, cap: Capability, strat: Strategy): string {
  const q = SAMPLE_QUERIES[cap];
  if (lang === 'Python') {
    return `import agentpick\n\nclient = agentpick.Client(api_key="YOUR_KEY")\n\nresult = client.${cap}(\n    query="${q}",\n    strategy="${strat}"\n)\n\nprint(result)`;
  }
  if (lang === 'JavaScript') {
    return `import AgentPick from 'agentpick';\n\nconst client = new AgentPick({ apiKey: 'YOUR_KEY' });\n\nconst result = await client.${cap}({\n  query: '${q}',\n  strategy: '${strat}',\n});\n\nconsole.log(result);`;
  }
  // curl
  return `curl -X POST https://agentpick.dev/api/v1/route/${cap} \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "query": "${q}",\n    "strategy": "${strat}"\n  }'`;
}

function pill(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 border ${
    active
      ? 'bg-orange-500/15 text-orange-400 border-orange-500/50 ring-1 ring-orange-500/50'
      : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.07] hover:text-white/70'
  }`;
}

export default function CodeGeneratorWidget() {
  const [lang, setLang] = useState<Language>('Python');
  const [cap, setCap] = useState<Capability>('search');
  const [strat, setStrat] = useState<Strategy>('auto');
  const [copied, setCopied] = useState(false);

  const code = buildCode(lang, cap, strat);
  const filename = lang === 'Python' ? 'main.py' : lang === 'JavaScript' ? 'index.js' : 'request.sh';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
        Build your request
      </div>

      {/* Configurator */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs text-white/30">Language</span>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => setLang(l)} className={pill(lang === l)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs text-white/30">Capability</span>
          <div className="flex flex-wrap gap-1.5">
            {CAPABILITIES.map(c => (
              <button key={c} onClick={() => setCap(c)} className={pill(cap === c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs text-white/30">Strategy</span>
          <div className="flex flex-wrap gap-1.5">
            {STRATEGIES.map(s => (
              <button key={s} onClick={() => setStrat(s)} className={pill(strat === s)}>
                {s}{s === 'auto' ? ' ★' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Code block with terminal chrome */}
      <div>
        <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-white/[0.06] bg-white/[0.03] px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 font-mono text-[11px] text-white/20">{filename}</span>
          <button
            onClick={handleCopy}
            className="ml-auto flex items-center gap-1.5 rounded border border-white/[0.08]
                       bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium
                       text-white/40 transition-all duration-150 hover:text-white/70"
          >
            {copied ? <span className="text-green-400">✓ Copied</span> : 'Copy'}
          </button>
        </div>
        <div className="overflow-x-auto rounded-b-lg border border-white/[0.06] bg-[#0d0d14] p-4 font-mono text-[13px] leading-relaxed">
          <SyntaxHighlight code={code} language={lang} />
        </div>
      </div>
    </div>
  );
}

function SyntaxHighlight({ code, language }: { code: string; language: Language }) {
  return (
    <div>
      {code.split('\n').map((line, i) => (
        <div key={i} className="min-h-[1.5rem]">
          <HighlightLine line={line} language={language} />
        </div>
      ))}
    </div>
  );
}

function HighlightLine({ line }: { line: string; language: Language }) {
  if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
    return <span className="text-gray-500">{line}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  const push = (text: string, cls: string) => {
    if (text) parts.push(<span key={key++} className={cls}>{text}</span>);
  };

  const tokenRe = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:import|from|const|await|async|function|return|print|console\.log)\b|\b\w+(?=\())/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(line)) !== null) {
    push(line.slice(lastIndex, match.index), 'text-white/70');
    const token = match[0];
    if (token.startsWith('"') || token.startsWith("'")) {
      push(token, 'text-green-400');
    } else if (/^(import|from|const|await|async|function|return|print|console\.log)$/.test(token)) {
      push(token, 'text-blue-400');
    } else {
      push(token, 'text-orange-300');
    }
    lastIndex = match.index + token.length;
  }
  push(line.slice(lastIndex), 'text-white/70');
  return <>{parts}</>;
}
```

---

### 3B. MODIFY `src/app/connect/page.tsx` — Add Widget + Dark Theme

Read the file first. It is a server component (no `'use client'`).

**Add import at top:**
```tsx
import CodeGeneratorWidget from '@/components/CodeGeneratorWidget';
```

**Change page background:** `bg-bg-page` → `bg-[#0a0a0f]`

**Update hero typography:**
- `<h1>`: add/replace color class with `text-white`
- `<p className="mb-10 text-sm text-text-muted">` → `<p className="mb-6 text-sm text-white/40">` (note: mb-10 → mb-6 since widget follows)

**Insert widget** between the subtitle `<p>` and the `{/* Quick Start */}` comment:
```tsx
{/* Interactive Code Generator */}
<CodeGeneratorWidget />
```

**Dark theme all cards** — for each `<div>` that is a card (has `rounded-xl border`):
- `border border-border-default bg-white` → `border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm`
- `border-button-primary-bg/30 bg-button-primary-bg/5` (Quick Start card) → `border-orange-500/20 bg-orange-500/[0.05]`
- Inline `style={{ WebkitBackdropFilter: 'blur(12px)' }}` on each glass card

**Text color global replacements:**
- `text-text-primary` → `text-white`
- `text-text-secondary` → `text-white/50`
- `text-text-muted` / `text-text-dim` → `text-white/30`
- `text-button-primary-bg` (orange highlights) → `text-orange-400`
- Section label `font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim` → `... text-white/30`

**Footer:** `border-border-default` → `border-white/[0.06]`; `text-text-dim` → `text-white/20`

**HTTP method badges** — keep as-is (they already use `accent-blue/10` etc, which will look fine on dark bg)

---

## Acceptance Checklist

- [ ] No `bg-white` or `border-gray-100` on router dashboard or `/connect`
- [ ] Glass tokens live in `globals.css` `@theme` block
- [ ] Dashboard outer background is `bg-[#0a0a0f]`
- [ ] Login/register screen is dark glass
- [ ] Stat counters animate 0 → value in 600ms (cubic ease-out)
- [ ] Motion disabled when `prefers-reduced-motion: reduce`
- [ ] Tool bars use `from-orange-500 to-amber-400` gradient + stagger delay × 60ms
- [ ] Active strategy pill has `ring-1 ring-orange-500/50 shadow-glow-orange`
- [ ] Hero section has `.hero-mesh` animated mesh background
- [ ] `<h1>` on homepage uses gradient text (`from-white via-gray-100 to-gray-400`)
- [ ] `CodeGeneratorWidget` renders on `/connect` above Quick Start
- [ ] All 3 × 4 × 5 = 60 combinations render valid code (no placeholders left)
- [ ] Copy button shows `✓ Copied` for 1.5s then resets
- [ ] Zero API calls on widget interaction (pure state)
- [ ] Mobile: configurator rows flex-wrap (no horizontal scroll)
