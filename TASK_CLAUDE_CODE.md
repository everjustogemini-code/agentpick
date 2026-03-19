# TASK_CLAUDE_CODE.md — v-next (2026-03-18)
**Agent:** Claude Code
**Source:** NEXT_VERSION.md — Must-Have #1 (all three P1/P2 API bugs)
**Rule:** Bugs first. No features while P1/P2 remain.

---

## Scope Summary

Claude Code owns all three API contract bugs. Codex owns all frontend/CSS work.

**DO NOT TOUCH any of these files** (owned by Codex):
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/components/PricingSection.tsx`
- `src/components/StrategyCards.tsx`
- Any other `src/components/**/*.tsx`

---

## Bug Fix A — P1: Add `key` deprecation alias in registration response

**File to modify:** `src/app/api/v1/router/register/route.ts`

**Problem:** The route returns `apiKey` (correct canonical name). Some external SDK consumers may
have been using the old `key` field. Per spec: add `key` alias + `_note` in every response so
consumers can migrate without breaking. (No rename — `apiKey` stays as the primary field.)

There are **three** `Response.json(...)` return points. Add `key` and `_note` to all three:

### Return 1 — Existing account re-key (around line 65)
```ts
// BEFORE
return Response.json({
  apiKey,
  plan,
  monthlyLimit,
  message: 'Existing account found. New API key issued.',
}, { status: 200 });

// AFTER
return Response.json({
  apiKey,
  key: apiKey,
  _note: 'key is deprecated, use apiKey',
  plan,
  monthlyLimit,
  message: 'Existing account found. New API key issued.',
}, { status: 200 });
```

### Return 2 — Agent-without-DeveloperAccount path (around line 94)
```ts
// BEFORE
return Response.json({
  apiKey,
  plan: 'FREE',
  monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
}, { status: 201 });

// AFTER
return Response.json({
  apiKey,
  key: apiKey,
  _note: 'key is deprecated, use apiKey',
  plan: 'FREE',
  monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
}, { status: 201 });
```

### Return 3 — New agent+account creation path (around line 125)
```ts
// BEFORE
return Response.json({
  apiKey,
  plan: 'FREE',
  monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
}, { status: 201 });

// AFTER
return Response.json({
  apiKey,
  key: apiKey,
  _note: 'key is deprecated, use apiKey',
  plan: 'FREE',
  monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
}, { status: 201 });
```

### Also: read-audit the SDK directory
- Read files under `sdk/` (if present) for any `.key` or `response.key` field access on the
  register response. Add a comment noting deprecation. Do NOT change SDK behavior.

---

## Bug Fix B — P2: Align `/api/v1/account` payload with `/api/v1/router/usage`

**File to modify:** `src/app/api/v1/account/route.ts`

**Current state:** The route exists and correctly returns `Deprecation: true` header. However it
returns a minimal payload `{ plan, monthlyLimit, callsThisMonth, strategy, _note }` — it does NOT
include `cost_usd`, `daily_limit`, `daily_used`, `daily_remaining`, `stats`, `ai_routing_summary`,
or the full `account` sub-object that `/router/usage` returns.

**Fix:** Rewrite the handler body to mirror `src/app/api/v1/router/usage/route.ts` exactly, then
append the `_note` deprecation field to the response body.

Steps:
1. Import `getUsageStats` and `getRouterPlanLabel` (already used in `router/usage/route.ts`).
2. Replicate the `days` param parsing logic from `router/usage/route.ts` (lines 29–39).
3. Call `getUsageStats(account.id, days)` in the `Promise.all`.
4. Build the same response body as `router/usage/route.ts` (lines 59–84), then add `_note` and
   `billingCycleStart` to the `account` sub-object.

Target response shape (must match `GET /api/v1/router/usage` payload exactly, plus `_note`):
```json
{
  "calls": 42,
  "cost_usd": 0.084,
  "plan": "FREE",
  "plan_label": "Free",
  "daily_limit": 200,
  "daily_used": 5,
  "daily_remaining": 195,
  "monthlyLimit": 500,
  "callsThisMonth": 42,
  "strategy": "AUTO",
  "stats": { "...": "..." },
  "ai_routing_summary": { "...": "..." },
  "account": {
    "plan": "FREE",
    "monthlyLimit": 500,
    "callsThisMonth": 42,
    "billingCycleStart": "2026-03-01T00:00:00.000Z",
    "strategy": "AUTO"
  },
  "_note": "Prefer /api/v1/router/usage — this alias will be removed in v2"
}
```

Keep the response headers exactly as-is:
```ts
headers: {
  'Deprecation': 'true',
  'Cache-Control': 'no-store',
  'Vary': 'Authorization',
}
```

---

## Bug Fix C — P2: Always populate `meta.ai_classification` for all routing strategies

**File to modify:** `src/lib/router/index.ts`

**Problem:** `aiClassificationResult` is only set when `strategy === 'auto'` (line 452) or when
`strategy === 'best_performance'` AND the query matches research/deep pattern (lines 457–468).
For `balanced`, `cheapest`, and non-deep `best_performance` queries the variable stays `undefined`,
so `meta.ai_classification` is absent/null in the router response envelope. SDK consumers must never
null-check this field.

**Fix:** Replace the conditional `if (aiClassificationResult)` blocks with unconditional assignments
that fall back to a structured override object for non-AUTO strategies.

### Block 1 — success path (lines ~647–653)

```ts
// BEFORE
if (aiClassificationResult) {
  meta.ai_classification = {
    ...aiClassificationResult,
    reasoning: buildAiReasoning(aiClassificationResult, candidateSlug),
  };
  meta.classification_ms = classificationMs;
}

// AFTER
meta.ai_classification = aiClassificationResult
  ? { ...aiClassificationResult, reasoning: buildAiReasoning(aiClassificationResult, candidateSlug) }
  : { mode: strategy, reason: 'strategy_override', query_type: null };
if (classificationMs > 0) meta.classification_ms = classificationMs;
```

### Block 2 — all-tools-failed path (lines ~697–703)

```ts
// BEFORE
if (aiClassificationResult) {
  failureMeta.ai_classification = {
    ...aiClassificationResult,
    reasoning: buildAiReasoning(aiClassificationResult, lastTriedTool),
  };
  failureMeta.classification_ms = classificationMs;
}

// AFTER
failureMeta.ai_classification = aiClassificationResult
  ? { ...aiClassificationResult, reasoning: buildAiReasoning(aiClassificationResult, lastTriedTool) }
  : { mode: strategy, reason: 'strategy_override', query_type: null };
if (classificationMs > 0) failureMeta.classification_ms = classificationMs;
```

### Type fix — line ~107

The `ai_classification` field is typed as optional `QueryContext & { reasoning?: string }`.
Update its type to accept the fallback shape too:

```ts
// BEFORE
ai_classification?: QueryContext & { reasoning?: string };

// AFTER
ai_classification?: (QueryContext & { reasoning?: string }) | { mode: string; reason: string; query_type: null };
```

---

## Files to Create / Modify

| Action | File                                              | Reason                                     |
|--------|---------------------------------------------------|--------------------------------------------|
| MODIFY | `src/app/api/v1/router/register/route.ts`        | Add `key` deprecation alias (Fix A)        |
| MODIFY | `src/app/api/v1/account/route.ts`                | Full payload alignment with router/usage (Fix B) |
| MODIFY | `src/lib/router/index.ts`                        | Always set `ai_classification` (Fix C)     |
| READ   | `sdk/` (any files referencing register response) | Audit for `key` field usage (Fix A)        |

---

## Acceptance Criteria

- [ ] `POST /api/v1/router/register` → response includes both `apiKey` and `key` with `_note`
- [ ] `GET /api/v1/account` → 200, `Deprecation: true` header, full payload matching `/router/usage`
- [ ] `meta.ai_classification` is never null/absent for `balanced`, `cheapest`, `best_performance` strategies
- [ ] All 51 automated QA checks remain green

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] v-next: Fix A/B/C API bugs — key alias, account payload, ai_classification always set
```
