# TASK_CODEX.md — Cycle 2

> Agent: Codex | Date: 2026-03-14 | Difficulty: Medium
> Features: F1A (Aurora hero) + F1B (Dark glassmorphic /connect) + F1C (Card micro-interactions)

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |
| MODIFY | `src/app/page.tsx` |
| MODIFY | `src/app/connect/page.tsx` |

**DO NOT TOUCH:** `src/components/SiteHeader.tsx`, `src/components/ScoreRing.tsx`, `src/components/AnimatedCounter.tsx`, `src/components/PlaygroundShell.tsx`, `src/app/playground/page.tsx`, `src/app/benchmarks/page.tsx`, `src/app/products/[slug]/page.tsx`, `src/app/api/**`

---

## Feature 1A + 1C — CSS Design System Tokens

File: `src/app/globals.css`

**Read the file first.** Append the following blocks at the end of the file (do not remove anything existing).

### Aurora blob keyframes

```css
/* ── Aurora Blob Animations ─────────────────────────────────── */
.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  pointer-events: none;
}
.aurora-blob-1 {
  width: 600px; height: 400px;
  background: #6366f1; /* indigo */
  animation: aurora-drift-1 12s ease-in-out infinite alternate;
}
.aurora-blob-2 {
  width: 500px; height: 350px;
  background: #0ea5e9; /* cyan */
  animation: aurora-drift-2 8s ease-in-out infinite alternate;
}
.aurora-blob-3 {
  width: 400px; height: 300px;
  background: #10b981; /* emerald */
  animation: aurora-drift-3 10s ease-in-out infinite alternate;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes aurora-drift-1 {
    from { transform: translate(0, 0) rotate(0deg); }
    to   { transform: translate(120px, -60px) rotate(20deg); }
  }
  @keyframes aurora-drift-2 {
    from { transform: translate(0, 0); }
    to   { transform: translate(-80px, 80px); }
  }
  @keyframes aurora-drift-3 {
    from { transform: translate(0, 0); }
    to   { transform: translate(60px, 40px) rotate(-15deg); }
  }
}

@media (prefers-reduced-motion: reduce) {
  .aurora-blob { animation: none; }
}
```

### Card lift micro-interaction

```css
/* ── Card Lift Micro-interaction ─────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  .card-lift {
    transition: transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out;
    will-change: transform;
  }
  .card-lift:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
    border-color: rgba(14, 165, 233, 0.4); /* cyan glow border */
  }
  .card-lift:active {
    transform: translateY(-1px) scale(1.005);
  }
}
```

---

## Feature 1A — Aurora Animated Hero on Homepage

File: `src/app/page.tsx`

**Read the file first.** Find the hero section (the top `<section>` or `<div>` that contains the main `<h1>` and its surrounding gradient/background). Make the following targeted changes:

### 1. Wrap existing hero background container with aurora blobs

Inside the hero's outermost container (keep existing `overflow-hidden relative` or add them), add three blob divs as the **first children** before any existing content:

```tsx
{/* Aurora blobs */}
<div className="aurora-blob aurora-blob-1" style={{ top: '-80px', left: '-100px' }} />
<div className="aurora-blob aurora-blob-2" style={{ top: '60px', right: '-60px' }} />
<div className="aurora-blob aurora-blob-3" style={{ bottom: '-40px', left: '30%' }} />

{/* Radial vignette mask over blobs */}
<div
  className="absolute inset-0 pointer-events-none"
  style={{
    background: 'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 30%, rgba(3,7,18,0.85) 80%)',
  }}
/>
```

Make sure the hero container has `position: relative` and `overflow: hidden` so blobs don't escape.

### 2. Update hero `<h1>` typography

Find the existing `<h1>` element. Replace its className with:

```tsx
className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-100 to-gray-400"
```

Keep the existing text content exactly as-is. Do not change font size classes — only add/replace the color/gradient classes listed above.

### 3. Add eyebrow label above `<h1>`

Directly above the `<h1>`, insert:

```tsx
<p className="uppercase tracking-widest text-xs text-cyan-400 mb-3">
  AI Tool Router
</p>
```

If an eyebrow label already exists, update its className to match the spec above instead of inserting a duplicate.

---

## Feature 1B — Dark Glassmorphic `/connect` Page

File: `src/app/connect/page.tsx`

**Read the file first.** Apply the following changes throughout the file. Read each section carefully before editing.

### Global page background

Find the outermost page wrapper element. Replace any `bg-white`, `bg-gray-50`, or `bg-gray-100` with `bg-gray-950`. The page should be dark throughout.

### Card elements

For every element that currently uses `bg-white` as a card background, replace with:
```
bg-white/5 border border-white/10 backdrop-blur-md rounded-xl
```
Also add `-webkit-backdrop-filter: blur(12px)` via inline `style={{ WebkitBackdropFilter: 'blur(12px)' }}` on each glass card for Safari 17+ compatibility.

### HTTP method badges

Find any HTTP method badges (e.g., `POST`, `GET`). Replace their className with:
```
bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-0.5 rounded text-xs font-mono
```

### Strategy chips / tag pills

Find strategy or tag chips (small clickable or display pills). Add the following hover class to each:
```
hover:shadow-[0_0_14px_rgba(16,185,129,0.35)]
```

### Terminal / code block

Find the code block (likely a `<pre>` or `<code>` element showing an API example). Wrap it in a terminal chrome container:

```tsx
<div className="rounded-xl overflow-hidden border border-white/10">
  {/* Terminal chrome header */}
  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/10">
    {/* Traffic light dots */}
    <span className="w-3 h-3 rounded-full bg-red-500" />
    <span className="w-3 h-3 rounded-full bg-yellow-400" />
    <span className="w-3 h-3 rounded-full bg-green-500" />
    {/* Filename tab */}
    <span className="ml-3 text-xs text-gray-400 font-mono bg-white/5 px-3 py-0.5 rounded-t">
      agentpick_example.py
    </span>
    {/* Copy button — right-aligned */}
    <CopyCodeButton code={/* the code string */} />
  </div>
  {/* Existing pre/code element goes here — keep its content unchanged */}
  {existingPreOrCodeElement}
</div>
```

Add a `CopyCodeButton` component **inline in the same file** (do not create a new file):

```tsx
"use client"
function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="ml-auto text-xs text-gray-400 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
      style={{ transition: 'opacity 200ms' }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}
```

If the file is currently a pure server component, add `"use client"` at the top of the file to support the copy button. If it already uses any client hooks, it's already a client component.

### Text color updates (dark mode)

Replace these text colors throughout the file:
- `text-gray-900` → `text-white`
- `text-gray-800` → `text-gray-100`
- `text-gray-700` → `text-gray-200`
- `text-gray-600` → `text-gray-400`
- `text-gray-500` → `text-gray-500` (keep)
- `border-gray-200` → `border-white/10`
- `border-gray-100` → `border-white/5`

### Add `.card-lift` to interactive cards

Find interactive cards on the page (tool cards, strategy cards, pricing tier cards if present). Add `card-lift` to their `className` alongside existing classes. This class is defined in `globals.css` and provides the hover lift animation.

---

## Acceptance Criteria

- [ ] Homepage hero shows animated aurora blobs with radial vignette mask
- [ ] Hero `<h1>` uses gradient text (`from-white via-gray-100 to-gray-400`)
- [ ] Eyebrow label `text-cyan-400 uppercase tracking-widest text-xs` above `<h1>`
- [ ] `/connect` page background is `bg-gray-950` (dark throughout)
- [ ] All cards on `/connect` are glass: `bg-white/5 border border-white/10 backdrop-blur-md`
- [ ] `-webkit-backdrop-filter` present on glass cards (Safari 17+ compatibility)
- [ ] Code block has terminal chrome: colored dots + filename tab + copy button
- [ ] Copy button shows `✓ Copied` for 2s then reverts
- [ ] Strategy/tool chips have emerald glow ring on hover
- [ ] `.card-lift` class in `globals.css` with `prefers-reduced-motion` guard
- [ ] Aurora blobs stop animating when `prefers-reduced-motion: reduce`
- [ ] Zero horizontal scroll introduced on any viewport
- [ ] No existing functionality broken on homepage or `/connect`
