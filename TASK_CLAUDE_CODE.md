# TASK_CLAUDE_CODE.md — Cycle 7
**Agent:** Claude Code (Sonnet 4.6)
**Source:** NEXT_VERSION.md (2026-03-18, cycle 7)
**Scope:** Homepage hero depth upgrade + new `GET /api/v1/sdk/snippets` endpoint
**Must NOT touch:** `agentpick-router-qa.py`, `src/app/globals.css`, `src/app/benchmarks/`, `src/app/rankings/`, `src/app/agents/`, `src/app/dashboard/`, `src/app/connect/`, `src/components/ConnectTabs.tsx`

---

## Task 1 — Homepage Hero Depth Upgrade (Must-Have #2, homepage only)

**File to modify:** `src/app/page.tsx`

### 1a — Radial glow orb behind hero headline

Inside the `.hero-mesh` `<div>` (line 130), **before** the `<section>` tag (line 131), insert a zero-height positioning div:

```tsx
{/* Glow orb */}
<div
  aria-hidden="true"
  style={{
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '800px',
    height: '800px',
    borderRadius: '50%',
    background: 'radial-gradient(circle 400px at 50% 30%, rgba(47,233,43,0.08), transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  }}
/>
```

### 1b — Gradient text on value-prop phrase

In `page.tsx` around line 162, the `<span>` currently renders with `from-white to-orange-400`. Change to spec (`#2fe92b → #00d4ff`):

```tsx
<span
  className="text-transparent bg-clip-text"
  style={{ backgroundImage: 'linear-gradient(90deg, #2fe92b, #00d4ff)' }}
>
  We fix that.
</span>
```

### 1c — Hero h1 letter-spacing precision

In `page.tsx` around line 158–159, the `<h1>` style has `letterSpacing: '-0.03em'`. Update to exact spec value `-1.5px`:

```tsx
style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: 800, letterSpacing: '-1.5px', maxWidth: 700 }}
```

### 1d — Count-up stats sessionStorage one-shot flag

Find the `<AnimatedCounter>` usages in `page.tsx` (search for `AnimatedCounter`). Wrap them with a sessionStorage one-shot guard so the animation fires only once per session.

If `page.tsx` is a server component (no `'use client'`), create a new file `src/components/OnceAnimatedCounter.tsx`:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import AnimatedCounter from '@/components/AnimatedCounter';

interface Props {
  value: number;
  suffix?: string;
  duration?: number;
}

export default function OnceAnimatedCounter({ value, suffix = '', duration }: Props) {
  const alreadyDone = typeof window !== 'undefined' && !!sessionStorage.getItem('ap_stats_animated');
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (alreadyDone) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShouldAnimate(true);
        sessionStorage.setItem('ap_stats_animated', '1');
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [alreadyDone]);

  return (
    <span ref={ref}>
      {(shouldAnimate || alreadyDone)
        ? <AnimatedCounter value={value} suffix={suffix} duration={duration} />
        : <>{value.toLocaleString()}{suffix}</>}
    </span>
  );
}
```

Then in `page.tsx`, import `OnceAnimatedCounter` and replace the `<AnimatedCounter>` calls for the "agent count" and "calls routed" stat figures with `<OnceAnimatedCounter>`.

---

## Task 2 — New `GET /api/v1/sdk/snippets` Endpoint (Must-Have #3)

**File to create:** `src/app/api/v1/sdk/snippets/route.ts`

No auth required. Returns JSON with 4 language snippets. The `/connect` page (Codex's task) and LLM tooling will consume this endpoint.

```typescript
import { NextResponse } from 'next/server';

const SNIPPETS = {
  python: {
    install: 'pip install agentpick',
    example: `from agentpick import AgentPick

ap = AgentPick(api_key="YOUR_KEY", strategy="auto")
results = ap.search("SEC filings NVDA 2025")
# Returns: tool_used, latency_ms, results[]
print(results)`,
  },
  typescript: {
    install: '# no install needed — uses fetch',
    example: `interface RouteResult {
  tool_used: string;
  latency_ms: number;
  results: unknown[];
}

const res = await fetch('https://agentpick.dev/api/v1/route/search', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: 'latest AI benchmarks 2026', strategy: 'auto' }),
});
const data = (await res.json()) as RouteResult;
console.log(data.tool_used, data.latency_ms);`,
  },
  curl: {
    install: '',
    example: `curl -X POST https://agentpick.dev/api/v1/route/search \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "latest AI benchmarks 2026", "strategy": "auto"}'`,
  },
  go: {
    install: '# stdlib only — no external dependencies',
    example: `package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"net/http"
)

func main() {
\tbody, _ := json.Marshal(map[string]string{
\t\t"query":    "latest AI benchmarks 2026",
\t\t"strategy": "auto",
\t})
\treq, _ := http.NewRequest("POST",
\t\t"https://agentpick.dev/api/v1/route/search",
\t\tbytes.NewBuffer(body))
\treq.Header.Set("Authorization", "Bearer YOUR_KEY")
\treq.Header.Set("Content-Type", "application/json")
\tclient := &http.Client{}
\tresp, err := client.Do(req)
\tif err != nil { panic(err) }
\tdefer resp.Body.Close()
\tvar result map[string]interface{}
\tjson.NewDecoder(resp.Body).Decode(&result)
\tfmt.Println(result["tool_used"], result["latency_ms"])
}`,
  },
} as const;

export async function GET() {
  return NextResponse.json(SNIPPETS, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
```

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `src/app/page.tsx` | Glow orb, gradient text, letter-spacing, count-up one-shot |
| CREATE | `src/app/api/v1/sdk/snippets/route.ts` | New GET endpoint for SDK snippets |
| CREATE | `src/components/OnceAnimatedCounter.tsx` | sessionStorage-gated counter (only if page.tsx is a server component) |

**Do NOT touch any other file.**

---

## Verification Checklist (Claude Code)

- [ ] `src/app/page.tsx`: `<h1>` has `letterSpacing: '-1.5px'`
- [ ] `src/app/page.tsx`: "We fix that." span uses `linear-gradient(90deg, #2fe92b, #00d4ff)`
- [ ] `src/app/page.tsx`: Radial glow orb div present in `.hero-mesh` with `rgba(47,233,43,0.08)`
- [ ] `src/app/page.tsx`: `AnimatedCounter` calls wrapped with sessionStorage one-shot guard
- [ ] `GET /api/v1/sdk/snippets` returns HTTP 200 with `python`, `typescript`, `curl`, `go` keys
- [ ] Each snippet key has `install` (string) and `example` (string)
- [ ] Zero changes to Codex-owned files
