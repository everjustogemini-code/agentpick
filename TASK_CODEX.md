# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md — AgentPick v0.24 (bugfix/cycle-23, QA Round 10, score 55/57)

---

## Files to Create/Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |
| MODIFY | `src/components/SiteHeader.tsx` |
| MODIFY | `src/components/PricingSection.tsx` |
| MODIFY | `src/app/page.tsx` |
| MODIFY | `src/app/connect/page.tsx` |
| CREATE | `src/components/CopyButton.tsx` |
| CREATE | `src/app/docs/examples/page.tsx` |

**DO NOT TOUCH:** `src/lib/router/ai-classify.ts`, `agentpick-router-qa.py`, or any backend files. Those are owned by TASK_CLAUDE_CODE.

---

## Must-Have #2 — Glassmorphism design system

**Goal:** Modernize the visual design to reduce bounce rate and increase trial signups from developer audiences.

---

### Step 1 — `src/app/globals.css` — define CSS custom properties (token sheet)

Add the glass design system tokens at the `:root` level (top of file, after any existing custom properties):

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.12);
  --accent-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
  --glass-blur: blur(12px);
  --nav-blur: blur(8px);
}
```

Also add the animated gradient mesh keyframes (used by the hero background):

```css
@keyframes mesh-drift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

---

### Step 2 — `src/components/SiteHeader.tsx` — blur-backdrop sticky nav + active underline

**Lines ~16–40 (logo/header container):**
- Add `backdrop-filter: var(--nav-blur)` and `-webkit-backdrop-filter: var(--nav-blur)` to the sticky header wrapper.
- Set `background: rgba(9, 9, 11, 0.8)` (or equivalent dark semi-transparent background) so content behind is visible through the blur.
- Ensure `position: sticky; top: 0; z-index: 50` is set.

Via Tailwind classes (preferred, match existing style):
```tsx
// Change the outer header element to include:
className="sticky top-0 z-50 backdrop-blur-sm bg-zinc-950/80 border-b border-white/5"
```

**Lines ~42–74 (desktop nav items — active state):**
- Replace static underline with a thin gradient underline on the active nav item.
- For the active item, add a `::after` pseudo-element via a CSS class, OR use an inline style:

```tsx
// Active nav item — add this to the active className:
"relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-gradient-to-r after:from-indigo-500 after:to-cyan-400"
```

---

### Step 3 — `src/app/page.tsx` — hero section glassmorphism + animated gradient mesh background

**Hero container (outermost hero section element):**
- Add animated gradient mesh background using CSS keyframes defined in globals.css:

```tsx
// Hero section wrapper — add inline style or className:
style={{
  background: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #083344 100%)',
  backgroundSize: '400% 400%',
  animation: 'mesh-drift 12s ease infinite',
}}
```

**Hero cards / feature cards (the flat cards in the hero):**
- Replace flat card style with frosted-glass style:

```tsx
// Replace existing card className with:
className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
// Or using CSS vars if Tailwind doesn't support backdrop-filter directly:
style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)' }}
```

**Typography (hero heading):**
- Add `font-family: 'Inter', sans-serif` with variable font weight (`font-variation-settings: 'wght' 700`) and tighter tracking (`letter-spacing: -0.03em`) to the main H1/H2 headline.

**Hero CTA — add "See examples →" link:**
- Below or next to the existing primary CTA button, add a secondary link:
```tsx
<a href="/docs/examples" className="text-sm text-zinc-400 hover:text-white transition-colors">
  See examples →
</a>
```

---

### Step 4 — `src/components/PricingSection.tsx` — hover lift + Pro tier gradient border

**Lines ~19–76 (pricing card map):**

1. **All cards — hover lift animation:**
   Add to every card wrapper's className:
   ```tsx
   "transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
   ```

2. **Pro tier card — gradient border:**
   Identify the Pro plan card (check how plans are identified — likely by `plan.name === 'Pro'` or `plan.id`). For the Pro card, replace the plain border with a gradient border using a pseudo-element or wrapper approach:

   Option A — wrapper approach (simpler):
   ```tsx
   // Wrap Pro card in a gradient-border div:
   <div className="relative p-[1px] rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400">
     <div className="rounded-xl bg-zinc-900 p-6 h-full">
       {/* existing card content */}
     </div>
   </div>
   ```

   Apply this wrapper only when the plan is the Pro tier.

---

### Step 5 — `src/components/CopyButton.tsx` — new reusable copy-to-clipboard component (CREATE)

Create this new file. It will be reused by both the `/connect` playground and the `/docs/examples` page.

```tsx
'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors ${className}`}
      aria-label="Copy to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

---

### Step 6 — `src/app/connect/page.tsx` — syntax-highlighted code blocks + copy buttons

**Lines ~85–111 (Quick Start code examples section) and lines ~292–384 (REST API Reference):**

All `<pre>` tags containing code snippets need two changes:

1. **Syntax highlighting:** Replace plain `<pre>` with Prism.js or Shiki.
   - Preferred: install `prism-react-renderer` (`npm install prism-react-renderer`) and wrap each code block.
   - Or use Shiki if already available in the project.
   - If neither is available and installation is out of scope, add `language-*` class attributes to `<code>` elements for future progressive enhancement (at minimum).

2. **Copy button:** Add the `<CopyButton>` component (from Step 5) next to each code snippet:
   ```tsx
   import { CopyButton } from '@/components/CopyButton';

   // Wrap each code block:
   <div className="relative">
     <div className="absolute top-2 right-2">
       <CopyButton text={snippetContent} />
     </div>
     <pre className="...existing classes...">
       <code>{snippetContent}</code>
     </pre>
   </div>
   ```

**Also add a link to `/docs/examples` in the sidebar or near the SDK docs section:**
```tsx
<a href="/docs/examples" className="text-indigo-400 hover:text-indigo-300 text-sm">
  View all SDK examples →
</a>
```

---

## Must-Have #3 — SDK examples page (`/docs/examples`)

**Goal:** Increase developer adoption with copy-paste ready code examples.

---

### Step 7 — `src/app/docs/examples/page.tsx` — new static route (CREATE)

Create the new file at `src/app/docs/examples/page.tsx`.

**Page metadata (for SEO):**
```tsx
export const metadata = {
  title: 'AgentPick API Examples — Python, Node.js, curl',
  description: 'Copy-paste ready code examples for the AgentPick API. Covers basic search, deep research, real-time news, embedding, finance data, and multi-tool fallback.',
  openGraph: {
    title: 'AgentPick API Examples — Python, Node.js, curl',
  },
};
```

**Page structure — tabbed layout (Python / Node.js / curl):**

Use a client component tab switcher (or a simple CSS radio-button trick for static rendering):

1. **Tabs:** Python · Node.js · curl (3 tabs, default to Python)

2. **6 examples** (show all 6 within the selected tab):
   - **Basic search** — simple query + parse response
   - **Deep research** — `strategy: best_performance`, parse `answer` field
   - **Real-time news** — `strategy: most_stable` with realtime query
   - **Embedding** — `capability: embed`, use `cohere-embed`
   - **Finance data** — `capability: finance`, use `polygon-io`
   - **Multi-tool fallback** — show how `fallback_used: true` works

3. **Each example shows the full flow:**
   - Step 1: Register → get API key (`POST /api/v1/router/register`)
   - Step 2: Call the API with that key
   - Step 3: Parse the response (show the key response fields)

4. **Each snippet has a `<CopyButton>` component** (import from `@/components/CopyButton`)

5. **Static rendering:** This page must be statically rendered — do NOT use `'use client'` at the top level. Use a client component only for the tab switcher sub-component.

**Example snippet for Python basic search:**
```python
import requests

# Step 1: Register (one-time)
res = requests.post("https://agentpick.dev/api/v1/router/register",
    json={"email": "you@example.com"})
api_key = res.json()["apiKey"]

# Step 2: Search
response = requests.post("https://agentpick.dev/api/v1/router/search",
    headers={"Authorization": f"Bearer {api_key}"},
    json={"query": "best AI coding assistants 2026", "strategy": "balanced"})

# Step 3: Parse
data = response.json()
print(data["data"]["results"])      # list of results
print(data["meta"]["tool_used"])    # e.g. "tavily"
print(data["meta"]["latency_ms"])   # e.g. 600
```

---

## Verification Checklist

- [ ] `src/app/globals.css` — `--glass-bg`, `--glass-border`, `--accent-gradient`, `--glass-blur`, `--nav-blur` custom properties defined; `mesh-drift` keyframe defined
- [ ] `src/components/SiteHeader.tsx` — sticky nav has `backdrop-filter` blur; active nav item has gradient underline
- [ ] `src/app/page.tsx` — hero has animated gradient mesh background; hero cards use frosted-glass style; "See examples →" CTA link added pointing to `/docs/examples`
- [ ] `src/components/PricingSection.tsx` — all cards have hover lift animation; Pro tier card has gradient border
- [ ] `src/components/CopyButton.tsx` — new file created, copy-to-clipboard works with 2s "Copied!" feedback
- [ ] `src/app/connect/page.tsx` — code blocks have syntax highlighting; each snippet has `<CopyButton>`; "View all SDK examples →" link added
- [ ] `src/app/docs/examples/page.tsx` — new file created; 3-tab layout (Python/Node.js/curl); 6 examples present; `og:title` correct; page is statically rendered
- [ ] No backend files touched (`src/lib/`, API routes, QA scripts)
- [ ] No files listed in TASK_CLAUDE_CODE.md touched
