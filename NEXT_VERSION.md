# NEXT_VERSION.md — bugfix/cycle-21

**Date:** 2026-03-14
**Type:** BUG FIXES ONLY — QA Round 9 remediation
**Source:** QA_REPORT.md (Round 9, score 49/51)

No new features this cycle. Every change below traces directly to a QA issue number.

---

## Fix 1 — P1-1: Realtime routing inconsistency (`6.2-realtime`)

**QA issue:** Automated QA observed `serpapi-google` selected for a realtime query. Manual
retest with an equivalent "breaking news" query routed to `tavily` instead. Realtime-classified
queries (`type=realtime, freshness=realtime`) must deterministically select `tavily`.

**Root cause:** Two compounding problems:

1. **`deprioritizeUnconfiguredTools` reorders AI-ranked lists.** In `src/lib/router/index.ts`
   `routeRequest` line 425, `deprioritizeUnconfiguredTools` is applied to `aiRankedTools` before
   tool selection. If the platform API key for `tavily` is absent from the env-var snapshot at the
   time the request arrives, `tavily` is moved to the unconfigured group and a lower-quality
   configured tool (e.g. `serpapi-google`, if it was in the list at the time) jumps to position 0.
   For realtime queries the AI ranking already hardcodes `tavily` first — reordering by
   configuration state defeats the purpose of the AI ranking.

2. **Queries that miss the fast-classifier fall through to Haiku.** `fastClassify` in
   `src/lib/router/ai-classify.ts` catches most realtime/news patterns via regex, but edge-case
   phrasings (e.g. "what's happening with X right now", "live situation in Y") can reach Haiku.
   With `temperature: 0` Haiku is still non-deterministic across cold serverless instances, and a
   misclassification (e.g. `type: 'simple'`) combined with the reordering above yields a
   different primary tool selection run-to-run.

**What to change:**

1. **`src/lib/router/index.ts` — `routeRequest`, line 425.**
   Do not apply `deprioritizeUnconfiguredTools` to the first tool in an AI-ranked list when the
   classification is `type=realtime` or `freshness=realtime`. Only apply the reorder to fallback
   positions (index ≥ 1). This pins the AI-chosen primary tool while still ensuring fallbacks skip
   unconfigured tools.

   Concretely: after computing `cbRankedTools`, if `aiClassificationResult?.type === 'realtime'`
   or `aiClassificationResult?.freshness === 'realtime'`, keep `cbRankedTools[0]` in place and
   call `deprioritizeUnconfiguredTools` only on `cbRankedTools.slice(1)`, then reassemble.

2. **`src/lib/router/ai-classify.ts` — `fastClassify`, `standaloneRealtimeSignal` regex.**
   Extend the pattern to catch additional realtime phrasings that currently fall through to Haiku:
   - `"what's happening (with|in|to)"`, `"happening right now"`, `"live situation"`,
     `"live report"`, `"real-time update"`, `"current status of"`, `"as of right now"`.
   The goal is ≥99% coverage so Haiku is never reached for unambiguously realtime queries.

**Files:**
- `src/lib/router/index.ts` — `routeRequest` (line ~425)
- `src/lib/router/ai-classify.ts` — `standaloneRealtimeSignal` regex (line ~48)

**Acceptance:** Run the `6.2-realtime` QA scenario 5 times in a row. All 5 runs must return
`meta.tool_used === "tavily"` (or the first configured realtime tool if tavily is explicitly
disabled). Zero occurrences of `serpapi-google` or any tool ranked lower than `tavily` for
realtime queries.

---

## Fix 2 — P1-2: Auth-missing edge case (`7.5-auth-missing`)

**QA issue:** Automated QA observed HTTP 200 for a request with no Authorization header. Manual
retests (no header, empty header) both correctly returned HTTP 401. Intermittent — suspected race
condition or middleware ordering issue.

**Root cause:** Two potential paths to the observed bypass:

1. **Missing `Cache-Control: no-store` / `Vary: Authorization` on non-success responses.**
   The success path in `handleSdkRouteRequest` (`src/lib/router/sdk-handler.ts` line 273–279)
   correctly sets `Cache-Control: no-store` and `Vary: Authorization`. However, the early-exit
   401 responses returned via `apiError()` (lines 54, 57, 64, 72, 75) do not go through this
   headers block. If a Vercel Edge cache or upstream proxy cached a prior authenticated 200
   response without `Vary: Authorization`, a subsequent unauthenticated request could be served
   the cached 200.

2. **`authenticateAgent` can return a non-null agent in edge cases without a valid token.**
   If `authenticateAgent` (`src/lib/auth`) falls back to a cookie-based session or another auth
   vector when the Authorization header is absent, it may return a valid `agent` object even
   though no Bearer token was presented. The current guard `if (!agent || !agent.id)` (line 74)
   does not verify that the agent was authenticated via the expected Bearer token mechanism.

**What to change:**

1. **`src/lib/router/sdk-handler.ts` — early-exit 401 responses.**
   All calls to `apiError('UNAUTHORIZED', ...)` (lines 54, 57, 64, 72, 75) must include
   `Cache-Control: no-store` and `Vary: Authorization` in the response headers. Either add
   an overloaded `headers` argument to `apiError`, or replace the early-exit calls with
   `new Response(JSON.stringify({...}), { status: 401, headers: { 'Cache-Control': 'no-store', 'Vary': 'Authorization', ... } })`.

2. **`src/lib/router/sdk-handler.ts` — post-`authenticateAgent` guard (line 74).**
   After `authenticateAgent` returns, add an explicit check that the resolved agent was
   authenticated via the Authorization header (not a session or other vector):

   ```ts
   // Guard: ensure the agent was resolved via the Bearer token we validated above,
   // not via a session cookie or alternate auth path.
   const resolvedKey = agent.apiKey ?? '';
   if (!resolvedKey.startsWith('ah_')) {
     return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
   }
   ```

   Adjust field name (`apiKey`, `key`, `token`) to match the actual shape returned by
   `authenticateAgent`. The intent is: if the agent object does not carry an `ah_`-prefixed
   key, reject the request even if `agent.id` is present.

**Files:**
- `src/lib/router/sdk-handler.ts` — `handleSdkRouteRequest`, auth section (lines ~49–76)
- `src/lib/auth.ts` (read-only audit) — confirm whether `authenticateAgent` can return a
  non-null result when no Authorization header is present; if so, add a guard inside that
  function to return `null` immediately when `request.headers.get('authorization')` is falsy.

**Acceptance:**
- `POST /api/v1/router/search` with no Authorization header → HTTP 401, every time, across
  10 sequential requests from a cold deployment.
- Same with `Authorization: ` (empty value) → HTTP 401.
- Same with `Authorization: Bearer ` (Bearer keyword only, no token) → HTTP 401.
- Valid `Authorization: Bearer ah_live_sk_...` → HTTP 200.

---

## Files changed (summary)

| File | Issue |
|------|-------|
| `src/lib/router/index.ts` | P1-1: do not reorder AI-ranked primary tool by configuration state for realtime queries |
| `src/lib/router/ai-classify.ts` | P1-1: extend `standaloneRealtimeSignal` to cover edge-case realtime phrasings |
| `src/lib/router/sdk-handler.ts` | P1-2: add `Cache-Control: no-store` + `Vary: Authorization` to all 401 responses; add `ah_`-key guard post-auth |
| `src/lib/auth.ts` | P1-2: audit / add early-return when Authorization header is absent |

---

## What is NOT in this version

- Any new features, endpoints, or UI changes
- Benchmark runner endpoint
- Performance improvements beyond what is required to fix the above issues
- Refactoring of passing code

This cycle is done when `6.2-realtime` and `7.5-auth-missing` both pass and the score reaches
51/51.
