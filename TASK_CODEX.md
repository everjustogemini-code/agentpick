# TASK_CODEX.md — v0.4 Cycle

> Agent: Codex | Date: 2026-03-14 | Difficulty: Medium
> Feature: F2 — Fix 4 P1 API Contract Bugs

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `src/lib/router/index.ts` |
| VERIFY (read-only check) | `src/app/api/v1/route/crawl/route.ts` |
| VERIFY (read-only check) | `src/app/api/v1/router/priority/route.ts` |
| VERIFY (read-only check) | `src/app/api/v1/router/usage/route.ts` |

**DO NOT TOUCH:** `src/app/globals.css`, `src/app/page.tsx`, `src/app/connect/page.tsx`, `src/app/dashboard/router/page.tsx`, `src/components/**`

---

## Context: What the QA Suite Checks

The QA script (`agentpick-router-qa.py`) is at 40/51 (78%). Four P1 tests are failing. Three already have code fixes in place — verify they're correct. One (Bug 2C) has NOT been fixed — that's your primary task.

---

## Bug 2A — Crawl endpoint rejects flat body (test 1.1b)

**File:** `src/app/api/v1/route/crawl/route.ts`

**Read the file.** Verify this fix is already in place:

```ts
const CrawlBody = z.union([
  z.object({ params: z.object({ url: z.string().url() }) }),
  z.object({ url: z.string().url() }),
])
```

And that the handler normalizes `{ url }` → `{ params: { url } }` before passing to `handleRouteRequest`.

If not correct, fix it. If correct, no change needed.

---

## Bug 2B — Priority field name mismatch (test 2.6)

**File:** `src/app/api/v1/router/priority/route.ts`

**Read the file.** Verify this fix is already in place:

```ts
const toolsValue = body.tools ?? body.priority_tools ?? body.search
```

And that the handler accepts any of the three field names as the priority tool list.

If not correct, fix it. If correct, no change needed.

---

## Bug 2D — Account fields sparse in usage response (test 7.1)

**File:** `src/app/api/v1/router/usage/route.ts`

**Read the file.** Verify the response includes all four required account fields:

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

Specifically check:
- `monthlyLimit` is populated from a plan→limit map (not null or undefined)
- `callsThisMonth` is a DB count for the current calendar month
- `strategy` comes from the user/account row

If not correct, fix it. If correct, no change needed.

---

## Bug 2C — `classification_ms > total_latency_ms` (test 6.4) ← PRIMARY TASK

**File:** `src/lib/router/index.ts`

**Read the full file first** (it is ~500 lines).

### The Bug

The `routeRequest` function currently returns this in the success response meta:

```ts
const meta = {
  tool_used: candidateSlug,
  latency_ms: result.latencyMs,   // ← BUG: this is the TOOL's latency only
  ...
  classification_ms: classificationMs,  // ← can be > latency_ms if AI is slow
};
```

`result.latencyMs` is the individual tool call duration (e.g. 233ms). `classificationMs` is the AI classification duration (e.g. 501ms). When AI classification takes longer than the tool call, `classification_ms > latency_ms` — which is impossible by definition and fails QA test 6.4.

### The Fix

`total_latency_ms` (or `latency_ms` — whichever the QA script uses) must be the **wall-clock elapsed time from the start of `routeRequest` to when the response is built**, not the tool call duration alone.

**Step 1 — capture request start time** at the very top of `routeRequest`, before the classification call:

```ts
// Add this as the FIRST line inside routeRequest():
const requestStartMs = Date.now();
```

Note: `routeStartTime` already exists at line ~394 (set just before the for-loop). Repurpose it OR use the new `requestStartMs` — whichever is earlier in the function. The correct anchor is **before** the `getClassification()` call (line ~339).

**Step 2 — compute total elapsed** when building the success meta:

```ts
const totalLatencyMs = Date.now() - requestStartMs;
```

**Step 3 — assert total ≥ classification** (log a warning if violated, never clamp silently):

```ts
if (totalLatencyMs < classificationMs) {
  console.warn(
    `[Router] total_latency_ms (${totalLatencyMs}) < classification_ms (${classificationMs}) — clock skew?`
  );
}
```

**Step 4 — update the meta object** in the success return path. The existing meta object at line ~432 is:

```ts
// Before:
const meta: RouterResponse['meta'] = {
  tool_used: candidateSlug,
  latency_ms: result.latencyMs,
  fallback_used: isFallbackAttempt,
  fallback_from: isFallbackAttempt ? firstFailedTool : undefined,
  trace_id: traceId,
};
if (aiClassificationResult) {
  meta.ai_classification = { ... };
  meta.classification_ms = classificationMs;
}
```

Change to:
```ts
// After:
const totalLatencyMs = Date.now() - requestStartMs;

const meta: RouterResponse['meta'] = {
  tool_used: candidateSlug,
  latency_ms: totalLatencyMs,          // wall-clock total, not tool-only
  total_latency_ms: totalLatencyMs,    // explicit alias for QA test 6.4
  fallback_used: isFallbackAttempt,
  fallback_from: isFallbackAttempt ? firstFailedTool : undefined,
  trace_id: traceId,
};
if (aiClassificationResult) {
  meta.ai_classification = {
    ...aiClassificationResult,
    reasoning: buildAiReasoning(aiClassificationResult, candidateSlug),
  };
  meta.classification_ms = classificationMs;
  // Assertion: total must be >= classification
  if (totalLatencyMs < classificationMs) {
    console.warn(
      `[Router] total_latency_ms (${totalLatencyMs}) < classification_ms (${classificationMs}) — clock skew?`
    );
  }
}
```

**Step 5 — update the `RouterResponse` interface** to include `total_latency_ms`:

```ts
// In the RouterResponse interface (around line 126):
export interface RouterResponse {
  data: unknown;
  meta: {
    tool_used: string;
    latency_ms: number;
    total_latency_ms?: number;   // ← ADD THIS
    fallback_used: boolean;
    fallback_from?: string;
    trace_id: string;
    ai_classification?: QueryContext & { reasoning?: string };
    classification_ms?: number;
  };
}
```

**Step 6 — also fix the "all tools failed" return path** at the bottom of `routeRequest` (around line 461). Apply the same wall-clock total there:

```ts
// Before:
meta: {
  tool_used: toolSlug,
  latency_ms: lastResult?.latencyMs ?? 0,
  ...
}

// After:
const totalMs = Date.now() - requestStartMs;
meta: {
  tool_used: toolSlug,
  latency_ms: totalMs,
  total_latency_ms: totalMs,
  ...
}
```

### Exact placement of `requestStartMs`

The function signature is at line 325:
```ts
export async function routeRequest(
  agentId: string,
  capability: string,
  request: RouterRequest,
): Promise<{ response: RouterResponse; headers?: Record<string, string> }> {
```

Add `const requestStartMs = Date.now();` as the very first line inside the function body (before `const query = extractQuery(request.params);`).

---

## Acceptance Criteria

- [ ] `POST /api/v1/route/crawl {"url": "https://example.com"}` → 200 (not 400) — Bug 2A
- [ ] `POST /api/v1/router/priority {"search": ["exa-search"]}` → 200 (not 400) — Bug 2B
- [ ] `GET /api/v1/router/usage` → `account` has `plan`, `monthlyLimit`, `callsThisMonth`, `strategy` — Bug 2D
- [ ] Every router response has `meta.total_latency_ms >= meta.classification_ms` — Bug 2C
- [ ] `meta.latency_ms` is wall-clock total, not tool-only latency — Bug 2C
- [ ] Warning is logged if clock skew is detected (never silently clamped)
- [ ] `RouterResponse` interface includes `total_latency_ms?: number`
- [ ] No regressions on currently-passing QA tests
- [ ] QA score moves from 40/51 → 44/51 (these 4 tests now pass)
