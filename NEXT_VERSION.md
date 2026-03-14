# NEXT_VERSION.md — AgentPick Bugfix Cycle 24

**Date:** 2026-03-14
**QA Round:** 11
**QA Score entering cycle:** 56/57
**P0 blockers:** None
**Scope:** Bug fixes only. Zero new features.

---

## Fix #1 — Deep-research routing misclassification (QA Issue: P1-1, `6.1-deep-research`)

**Symptom:** Query `"state of large language models 2025 comprehensive analysis"` with `best_performance` strategy
(or `auto`) classifies as `type=news, depth=shallow` and routes to `tavily` instead of `exa-search` or `perplexity`.

**Root cause:** `fastClassify` in `ai-classify.ts` checks `explicitRecencySignal` (which catches year patterns like
`in 2024`) before `researchTerms`. Queries containing analytical keywords (`comprehensive`, `analysis`) alongside
a bare year (`2025`) can fall into the news/recency path before the research path fires. Additionally, the
`analyticalKeywords && multifactorDomains` guard that was added for supply-chain queries requires a narrow domain
list (`supply chain`, `geopolit`, `policy`, etc.) that misses broader research framing like "state of [field]
comprehensive analysis".

**File:** `src/lib/router/ai-classify.ts`

**What to change:**
1. In `fastClassify`, broaden the analytical-research guard (currently lines 95–102) so that a query containing
   `analyticalKeywords` (`analysis`, `causes`, `implications`, `impact of`, `effects of`, `why did`, `comprehensive`)
   combined with ANY depth/quality signal (`state of`, `overview of`, `survey of`, `in-depth`, `deep dive`,
   `comprehensive`) classifies as `type=research, depth=deep` — without requiring the narrow `multifactorDomains`
   list. Only skip this rule when `genuineNewsSignals` are present (`today`, `right now`, `just happened`,
   `breaking`, `latest`, `this week`, `yesterday`, `last night`).
2. Add `"state of"` as a standalone analytical signal in `analyticalKeywords` regex (covers "state of the art",
   "state of large language models", etc.).
3. Confirm: `researchTerms` (line 115) already includes `comprehensive` and `analysis`; verify the regex fires
   before `newsTerms`/`strongNewsTerms` for this query, or move the research check earlier in the function.
4. Add the specific query as a regression test case in `CLASSIFY_SYSTEM` examples (line ~209):
   `"state of large language models 2025 comprehensive analysis"` → `{"type":"research","domain":"tech","depth":"deep","freshness":"any"}`

**Acceptance criteria:**
- Query `"state of large language models 2025 comprehensive analysis"` + `strategy: auto` → `type=research,
  depth=deep` in `ai_classification`, `tool_used: exa-search` or `perplexity-search`.
- Existing passing tests (`6.2-realtime`, `6.3-simple`, `6.5-ai-insights`) remain green.
- `6.1-deep-research` passes 5/5 consecutive runs (no Haiku non-determinism).

---

## Fix #2 — Latency metadata inversion in `/router/search` response (QA Issue: P1-2, `6.4-latency`)

**Symptom:** Response meta contains `classification_ms=500` and `latency_ms=65`, which is logically impossible:
classification cannot take longer than the total observed request latency. Dashboards and alerting built on these
fields will produce incorrect measurements.

**Root cause:** `latency_ms` in the response (field `result.latencyMs`) reflects only the tool call latency, not
the end-to-end request time. `classification_ms` reflects the Haiku classification attempt including the 500ms
timeout. There is no `total_ms` field that represents true end-to-end time. When Haiku times out,
`classification_ms ≈ 500` while `latency_ms` for a fast tool call can be 65ms — making `classification_ms >
latency_ms` appear to violate causality.

**Files:**
- `src/lib/router/index.ts` — where the `meta` object is assembled and returned
- `src/lib/router/index.ts:488` — `routeStartTime` is set after classification; move it before classification
  call so `latency_ms` captures total routing time, OR add a separate `total_ms` field

**What to change:**
1. In `routeRequest` (`index.ts`), record `const requestStartTime = Date.now()` at the top of the function,
   before the `if (strategy === 'auto')` classification block (currently ~line 400).
2. In the success meta assembly (~line 539), add:
   ```ts
   total_ms: Date.now() - requestStartTime,
   ```
   so consumers have an unambiguous end-to-end latency field that always satisfies
   `total_ms >= classification_ms` and `total_ms >= latency_ms`.
3. Add `total_ms?: number` to the `RouterResponse['meta']` interface (~line 105 in `index.ts`).
4. Do NOT rename or remove `latency_ms` (breaking change) — leave it as tool-call latency for backward compat
   and document the distinction via the new `total_ms` field presence.

**Acceptance criteria:**
- `total_ms >= classification_ms` always holds in the response.
- `total_ms >= latency_ms` always holds.
- When Haiku times out (500ms), `total_ms ≈ 500 + tool_latency`, not 65.
- Existing tests that check `classification_ms` field exists continue to pass.
