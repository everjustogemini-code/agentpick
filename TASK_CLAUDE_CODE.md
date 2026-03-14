# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md — Bugfix Cycle 24 (QA Round 11, score 56/57)

---

## Files to Modify

| Action | File |
|--------|------|
| MODIFY | `src/lib/router/ai-classify.ts` |

**DO NOT TOUCH:** `src/lib/router/index.ts` (owned by TASK_CODEX). No frontend files.

---

## Bug P1-1 — Deep-research routing misclassification (`6.1-deep-research`)

**Symptom:** Query `"state of large language models 2025 comprehensive analysis"` with `best_performance` or `auto` strategy classifies as `type=news, depth=shallow`, routing to `tavily` instead of `exa-search` or `perplexity`.

**Root cause:** `fastClassify` checks `explicitRecencySignal` (catches bare year patterns like `2025`) **before** `researchTerms`. The existing `analyticalKeywords && multifactorDomains` guard requires a narrow domain list (`supply chain`, `geopolit`, `policy`, etc.) that misses broad research framing like "state of [field] comprehensive analysis".

**File:** `src/lib/router/ai-classify.ts`

---

### Fix 1a — Broaden the analytical-research guard (lines ~95–102)

Replace the existing guard that requires `multifactorDomains` with a broader rule that fires without requiring a narrow domain list:

```ts
// Broad analytical/research framing — fires before recency check
const analyticalKeywords = /\b(analysis|causes|implications|impact of|effects of|why did|comprehensive|state of|overview of|survey of|in-depth|deep dive)\b/i;
const depthQualitySignals = /\b(state of|overview of|survey of|in-depth|deep dive|comprehensive)\b/i;
const genuineNewsSignals = /\b(today|right now|just happened|breaking|latest|this week|yesterday|last night)\b/i;

if (analyticalKeywords.test(query) && depthQualitySignals.test(query) && !genuineNewsSignals.test(query)) {
  return { type: 'research', depth: 'deep' };
}
```

- Remove the requirement for `multifactorDomains` in this guard — broad analytical framing alone is sufficient
- Place this block **before** any `explicitRecencySignal` / news fast-path so bare years like `2025` don't short-circuit it

---

### Fix 1b — Add `"state of"` to `analyticalKeywords` regex

`"state of"` must be a standalone analytical signal covering:
- `"state of the art"`
- `"state of large language models"`
- `"state of [any field]"`

Confirm it is included in the updated `analyticalKeywords` regex (see Fix 1a above).

---

### Fix 1c — Verify check ordering

Confirm that `researchTerms` (line ~115) fires **before** `newsTerms`/`strongNewsTerms` for the target query. If not, move the research check earlier in `fastClassify`. The existing `researchTerms` already includes `comprehensive` and `analysis` — ensure they are not being short-circuited by the recency/year check.

---

### Fix 1d — Add regression example in `CLASSIFY_SYSTEM` prompt (line ~209)

Add to the few-shot examples block in the Haiku classifier prompt:

```
Q: "state of large language models 2025 comprehensive analysis"
A: {"type":"research","domain":"tech","depth":"deep","freshness":"any"}

Q: "what's happening with LLMs today"
A: {"type":"news","domain":"tech","depth":"shallow","freshness":"recent"}
```

---

### Acceptance criteria

- [ ] `"state of large language models 2025 comprehensive analysis"` + `strategy: auto` → `type=research, depth=deep`, `tool_used: exa-search` or `perplexity-search`
- [ ] `6.1-deep-research` passes 5/5 consecutive runs (no Haiku non-determinism)
- [ ] Existing passing tests (`6.2-realtime`, `6.3-simple`, `6.5-ai-insights`) remain green
- [ ] Realtime queries (`"what's happening with X right now"`) still route correctly with `type=realtime`

---

## Verification Checklist

- [ ] `src/lib/router/ai-classify.ts` — analytical guard broadened (no longer requires `multifactorDomains`)
- [ ] `src/lib/router/ai-classify.ts` — `"state of"` included in `analyticalKeywords`
- [ ] `src/lib/router/ai-classify.ts` — research check fires before recency/news check
- [ ] `src/lib/router/ai-classify.ts` — regression example added to `CLASSIFY_SYSTEM` prompt
- [ ] `src/lib/router/index.ts` NOT touched
- [ ] No frontend files touched
