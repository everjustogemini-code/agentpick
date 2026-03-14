# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md — Bugfix Cycle 24 (QA Round 11, score 56/57)

---

## Files to Modify

| Action | File |
|--------|------|
| MODIFY | `src/lib/router/index.ts` |

**DO NOT TOUCH:** `src/lib/router/ai-classify.ts` (owned by TASK_CLAUDE_CODE). No frontend files.

---

## Bug P1-2 — Latency metadata inversion in `/router/search` response (`6.4-latency`)

**Symptom:** Response meta contains `classification_ms=500` and `latency_ms=65`, which is logically impossible — classification cannot take longer than total observed request latency. Dashboards and alerting built on these fields produce incorrect measurements.

**Root cause:** `latency_ms` in the response (`result.latencyMs`) reflects only the tool call latency, not the end-to-end request time. `classification_ms` reflects the Haiku classification attempt including the 500ms timeout. There is no `total_ms` field representing true end-to-end time. When Haiku times out, `classification_ms ≈ 500` while `latency_ms` for a fast tool call can be 65ms — making `classification_ms > latency_ms` appear to violate causality.

**File:** `src/lib/router/index.ts`

---

### Fix 2a — Record `requestStartTime` at top of `routeRequest` (~line 400)

Add a timestamp capture **before** the classification block (before the `if (strategy === 'auto')` block):

```ts
const requestStartTime = Date.now();
```

This must be the first thing in `routeRequest`, before any `await` or classification call, so it captures the true start of the request.

---

### Fix 2b — Add `total_ms` to `RouterResponse['meta']` interface (~line 105)

Add the optional field to the interface:

```ts
interface RouterResponseMeta {
  // ...existing fields...
  total_ms?: number;
}
```

---

### Fix 2c — Populate `total_ms` in the success meta assembly (~line 539)

In the meta object assembled before the response is returned, add:

```ts
total_ms: Date.now() - requestStartTime,
```

This field must satisfy:
- `total_ms >= classification_ms` always
- `total_ms >= latency_ms` always
- When Haiku times out (500ms): `total_ms ≈ 500 + tool_latency`, not 65

---

### Do NOT change

- Do **NOT** rename or remove `latency_ms` — it is used by existing consumers and its removal would be a breaking change. Leave it as tool-call latency. `total_ms` is the new unambiguous end-to-end field.
- Do **NOT** change `classification_ms` semantics.

---

### Acceptance criteria

- [ ] `total_ms >= classification_ms` always holds in the response
- [ ] `total_ms >= latency_ms` always holds
- [ ] When Haiku times out (500ms), `total_ms ≈ 500 + tool_latency`, not 65
- [ ] `latency_ms` and `classification_ms` fields still present and unchanged (no breaking change)
- [ ] `6.4-latency` QA test passes
- [ ] Existing tests that check `classification_ms` field exists continue to pass

---

## Verification Checklist

- [ ] `src/lib/router/index.ts` — `requestStartTime = Date.now()` set at top of `routeRequest`, before classification
- [ ] `src/lib/router/index.ts` — `total_ms?: number` added to `RouterResponse['meta']` interface
- [ ] `src/lib/router/index.ts` — `total_ms: Date.now() - requestStartTime` populated in success meta assembly
- [ ] `latency_ms` field preserved (no rename/removal)
- [ ] `src/lib/router/ai-classify.ts` NOT touched
- [ ] No frontend files touched
