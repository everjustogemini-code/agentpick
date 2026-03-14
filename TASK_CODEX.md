# TASK_CODEX.md — Cycle 4

> Agent: Codex | Date: 2026-03-14 | Difficulty: Medium
> Features: Homepage hero animation (F1E) + Fix 4 P1 API bugs (F2)

---

## Files to Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/page.tsx` |
| MODIFY | `src/app/api/v1/route/crawl/route.ts` |
| MODIFY | `src/app/api/v1/router/priority/route.ts` |
| MODIFY | `src/lib/router/handler.ts` *(or wherever the cost table lives — see Task 3)* |
| MODIFY | `src/app/api/v1/router/usage/route.ts` |

**DO NOT touch:** `src/app/globals.css`, `src/app/dashboard/router/page.tsx`, `src/app/connect/page.tsx`, `src/components/` (any file)

---

## Task 1 — Homepage Hero: Animated Gradient Mesh (`src/app/page.tsx`)

Read the file. Find the `<Hero>` component or the outermost hero section element (a `<section>` or `<div>` that contains the main headline and CTA buttons).

### 1A. Add `hero-mesh` class to hero background

The `hero-mesh` CSS class is defined in `globals.css` by Claude Code (cycle 4). It provides the animated radial gradient + grid texture.

Find the hero background element. It likely has classes like `bg-gradient-to-b from-orange-50` or a dark/light background. Replace the background classes with:

```tsx
className="hero-mesh relative overflow-hidden ..."
// keep all existing positioning, padding, min-h classes intact
// only replace background-related classes (bg-*, from-*, to-*, gradient-*)
```

If the hero currently has an inline `style={{ background: '...' }}`, remove it and rely on the CSS class instead.

### 1B. Style the `<h1>` headline

Find the hero `<h1>`. Replace its text color/gradient classes with:

```tsx
className="font-extrabold tracking-tight text-transparent bg-clip-text
           bg-gradient-to-br from-white via-gray-100 to-gray-400
           [your existing text-size classes, e.g. text-4xl sm:text-6xl]"
```

Keep all existing `text-*` size classes. Only change the color/gradient classes.

### 1C. Reduced-motion safety

The `hero-mesh` animation is already guarded in CSS (`@media (prefers-reduced-motion: reduce)`). No additional JS changes needed here.

---

## Task 2 — Fix: Crawl flat body → 400 (`src/app/api/v1/route/crawl/route.ts`)

**Bug:** `POST /api/v1/route/crawl {"url": "https://example.com"}` returns 400 because the
current schema requires `{ params: { url } }`.

**Fix:** Accept both shapes and normalize to `url` before processing.

Read the file. Find the Zod schema that validates the request body. Replace it with a union:

```ts
import { z } from 'zod'

// Replace the existing body schema with:
const CrawlBody = z.union([
  z.object({ params: z.object({ url: z.string().url() }) }),
  z.object({ url: z.string().url() }),
])

// After parsing:
const parsed = CrawlBody.parse(body)
const url = 'params' in parsed ? parsed.params.url : parsed.url
```

Then use `url` everywhere the parsed URL was previously used (replace `parsed.params.url` or `body.params.url` references with the normalized `url` variable).

The canonical shape `{ params: { url } }` is kept in docs. The flat `{ url }` shape is now accepted permanently (non-breaking).

---

## Task 3 — Fix: Priority field name mismatch → 400 (`src/app/api/v1/router/priority/route.ts`)

**Bug:** `POST /api/v1/router/priority {"search": ["exa-search"]}` returns 400 with "Provide tools/priority_tools".

**Fix:** Normalize the field name before validation. Read the file, then find where `tools` or `priority_tools` is extracted from `body`. Replace that line with:

```ts
const tools = body.tools ?? body.priority_tools ?? body.search
if (!tools?.length) {
  return NextResponse.json(
    { error: 'Provide tools or priority_tools' },
    { status: 400 }
  )
}
```

Then use `tools` for the rest of the handler (replacing any `body.tools` or `body.priority_tools` references with the normalized `tools` variable).

---

## Task 4 — Fix: `cheapest` strategy routes to Tavily

**Bug:** `POST /api/v1/route/search {"strategy": "cheapest"}` returns `toolUsed: "tavily"` instead of `serper` or `brave-search`. Tavily is more expensive per call but ranked too low in the cost sort.

**Find the cost table.** Search for the word `cheapest` or a cost/price ranking object in:
- `src/lib/router/handler.ts`
- `src/lib/router/index.ts`
- `src/lib/router/sdk-handler.ts`

Look for an object or array like:
```ts
const TOOL_COSTS = {
  tavily: 0.001,
  serper: 0.002,
  'brave-search': 0.003,
  ...
}
```
or a sorted array of tools by cost.

**Fix:** Ensure `tavily`'s cost value is **higher** than `serper` and `brave-search`. The `cheapest` sort picks the lowest cost, so serper/brave must be cheaper (lower number) than tavily.

Correct relative ordering (lower = cheaper):
```
serper          ~= 0.001   (cheapest)
brave-search    ~= 0.002
tavily          ~= 0.005   (more expensive — must be HIGHER than serper/brave)
exa             ~= 0.010
perplexity      ~= 0.010
```

Do not change any other routing logic — only fix the cost values so the sort order is correct.

---

## Task 5 — Fix: Usage response missing account fields (`src/app/api/v1/router/usage/route.ts`)

**Bug:** `GET /api/v1/router/usage` returns `{ "account": { "plan": "free" } }` — missing `monthlyLimit`, `callsThisMonth`, `strategy`.

**Expected shape:**
```json
{
  "account": {
    "plan": "free",
    "monthlyLimit": 10000,
    "callsThisMonth": 247,
    "strategy": "auto"
  }
}
```

Read the file. Find where `account` is assembled in the response. Extend it:

```ts
// monthlyLimit: derive from plan config. Use a simple map:
const PLAN_LIMITS: Record<string, number> = {
  free:       10_000,
  pro:        100_000,
  enterprise: 1_000_000,
}
const monthlyLimit = PLAN_LIMITS[user.plan ?? 'free'] ?? 10_000

// callsThisMonth: count RouterCall rows for this user in the current calendar month
const now = new Date()
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const callsThisMonth = await prisma.routerCall.count({
  where: {
    userId: user.id,
    createdAt: { gte: startOfMonth },
  },
})

// strategy: read from user row (field may be named defaultStrategy, strategy, or routerStrategy)
const strategy = user.strategy ?? user.defaultStrategy ?? 'auto'

// Assemble response:
return NextResponse.json({
  account: {
    plan: user.plan ?? 'free',
    monthlyLimit,
    callsThisMonth,
    strategy,
  },
  // ... rest of existing response fields
})
```

**Note:** If `RouterCall` is not the correct Prisma model name, check `prisma/schema.prisma` for the model that stores API call history and use that model name. The count query pattern stays the same.

---

## Acceptance Checklist

- [ ] `POST /api/v1/route/crawl {"url": "https://example.com"}` → HTTP 200 (not 400)
- [ ] `POST /api/v1/router/priority {"search": ["exa-search"]}` → HTTP 200 (not 400)
- [ ] `POST /api/v1/route/search {"strategy":"cheapest"}` → `toolUsed` is `serper` or `brave-search` (not `tavily`)
- [ ] `GET /api/v1/router/usage` returns `monthlyLimit`, `callsThisMonth`, `strategy` in `account` object
- [ ] Homepage hero section has `hero-mesh` class applied (animated gradient mesh visible)
- [ ] Hero `<h1>` uses `text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-100 to-gray-400`
- [ ] No other files touched outside the 5 listed above
