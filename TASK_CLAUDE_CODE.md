# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md — bugfix/cycle-21 (QA Round 9, score 49/51)

---

## Files to Modify

| Action | File |
|--------|------|
| MODIFY | `src/lib/router/index.ts` |
| MODIFY | `src/lib/router/ai-classify.ts` |

**DO NOT TOUCH:** `src/lib/router/sdk-handler.ts`, `src/lib/auth.ts`, or any frontend file. Those are owned by TASK_CODEX.

---

## Bug P1-1 — Realtime routing inconsistency (`6.2-realtime`)

**Root cause:**
1. `deprioritizeUnconfiguredTools` reorders AI-ranked lists, pushing `tavily` down if its API key is absent from the env-var snapshot at request time — even though the AI ranking already hardcoded it first.
2. Edge-case realtime phrasings fall through `fastClassify` to Haiku, which is non-deterministic across cold serverless instances.

---

### Fix 1a — `src/lib/router/index.ts` — `routeRequest` (line ~425)

**What to change:** Do not apply `deprioritizeUnconfiguredTools` to the primary tool (index 0) when the classification is realtime.

Find the call site that looks like:
```ts
const finalRankedTools = deprioritizeUnconfiguredTools(cbRankedTools);
```

Replace it with:
```ts
let finalRankedTools: string[];
if (
  aiClassificationResult?.type === 'realtime' ||
  aiClassificationResult?.freshness === 'realtime'
) {
  // Pin the AI-chosen primary tool; only reorder fallbacks (index >= 1).
  const [primary, ...rest] = cbRankedTools;
  finalRankedTools = [primary, ...deprioritizeUnconfiguredTools(rest)];
} else {
  finalRankedTools = deprioritizeUnconfiguredTools(cbRankedTools);
}
```

Then use `finalRankedTools` wherever `cbRankedTools` was used for tool selection downstream in that function.

---

### Fix 1b — `src/lib/router/ai-classify.ts` — `standaloneRealtimeSignal` regex (line ~48)

**What to change:** Extend the regex to catch additional realtime phrasings that currently fall through to Haiku.

Add these alternatives to the existing `standaloneRealtimeSignal` pattern:
- `what's happening (with|in|to)`
- `happening right now`
- `live situation`
- `live report`
- `real-time update` / `realtime update`
- `current status of`
- `as of right now`

Example updated regex (adjust to match existing style in the file):
```ts
const standaloneRealtimeSignal =
  /breaking news|just happened|happening right now|what's happening (?:with|in|to)|live situation|live report|real-?time update|current status of|as of right now/i;
```

Goal: ≥99% of unambiguously realtime queries are caught by `fastClassify` without reaching Haiku.

---

## Verification Checklist

- [ ] Run `6.2-realtime` QA scenario 5× in a row — all 5 return `meta.tool_used === "tavily"`
- [ ] Zero occurrences of `serpapi-google` or any tool ranked lower than `tavily` for realtime queries
- [ ] Edge-case phrasings ("what's happening with X right now", "live situation in Y") → classified as realtime by `fastClassify` without reaching Haiku
- [ ] No changes made to files owned by TASK_CODEX.md (`sdk-handler.ts`, `auth.ts`)
