# NEXT_VERSION.md — Bugfix Cycle 5
**Date:** 2026-03-14
**QA Round:** 7 — Score 37/49 (~76%) FAIL
**Scope:** Bug fixes ONLY. Zero new features. Every item below maps 1:1 to a QA issue number.

---

## P0 — Blockers

### [QA P0-1] Stripe payment broken — "Stripe billing is not configured yet"

**Symptom:** `/pricing` upgrade click returns "Stripe billing is not configured yet". `/dashboard/billing` returned 404 (may be stale deployment).

**Root cause:** `src/lib/stripe.ts:8` — `getRequiredEnv()` throws when `STRIPE_SECRET_KEY` or price ID env vars are absent. The catch block in `src/app/api/v1/router/upgrade/route.ts:95` surfaces this as "Stripe billing is not configured yet."

**Fixes:**
1. **Vercel env vars** — Add to production environment (no code change needed for the logic, which is already correct):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID_PRO` (matches `UPGRADE_PLAN_CONFIG[pro].priceEnvKey`)
   - `STRIPE_PRICE_ID_GROWTH` (matches `UPGRADE_PLAN_CONFIG[growth].priceEnvKey`)
   - `STRIPE_WEBHOOK_SECRET`
2. **`/dashboard/billing` 404** — `src/app/dashboard/billing/page.tsx` exists in the repo. Verify it is committed and included in the Vercel build. No code changes needed if it is already tracked in git.

---

### [QA P0-2] `toolUsed` empty/unknown in `/api/v1/router/calls`

**Symptom:** `GET /api/v1/router/calls` returns `toolUsed: ""` or `toolUsed: "unknown"` for all records.

**Root cause:** In `src/lib/router/sdk-handler.ts`, the error-path `failureResponse` (catch block ~line 215) computes `meta.tool_used` as:
```
modifiedRequest.tool ?? modifiedRequest.priority_tools?.[0] ?? getRankedToolsForCapability(capability, 'balanced')[0] ?? `${capability}-unavailable`
```
When strategy is AUTO and no explicit tool is set, `modifiedRequest.tool` and `priority_tools` are both undefined, so the value falls to the ranked-tool list. This should return a real slug. The actual empty/unknown writes are likely caused by `.catch(() => {})` at line 186 silently swallowing DB write failures — a write error means the call is recorded with a default/empty value in Postgres.

**Fixes:**
1. `src/lib/router/sdk-handler.ts:186` — Change the silent swallow to a logged error:
   ```typescript
   // Before:
   ).catch(() => {});
   // After:
   ).catch((e) => console.error('[recordRouterCall] write failed:', e));
   ```
2. `src/lib/router/sdk-handler.ts` (error path catch block) — Ensure `resolvedToolUsed` is always a non-empty string before passing to `recordRouterCall`:
   ```typescript
   const resolvedToolUsed =
     modifiedRequest.tool ??
     modifiedRequest.priority_tools?.[0] ??
     getRankedToolsForCapability(capability, coreStrategy)[0] ??
     capability;
   // use resolvedToolUsed in failureResponse.meta.tool_used
   ```
3. `prisma/schema.prisma` — Verify `RouterCall.toolUsed` is `String` (non-nullable). If it is nullable, existing NULL rows explain the blank display. Add a migration to set `DEFAULT ''` and backfill NULLs if needed.

---

### [QA P0-3] XSS injection risk — missing effective Content-Security-Policy

**Symptom:** Injected `<script>alert(1)</script>` in query returns 200 with content reflected. QA flags missing `X-Content-Type-Options` and `Content-Security-Policy`.

**Root cause:** `src/middleware.ts:190` — Security headers ARE set for page routes, but the CSP contains `'unsafe-inline'` and `'unsafe-eval'` in `script-src`, which does not block inline script execution. The API route CSP (`default-src 'none'`) is correct. The page route CSP is the gap.

**Fixes:**
1. `src/middleware.ts:190` — Remove `'unsafe-inline'` and `'unsafe-eval'` from `script-src` in the page-route CSP:
   ```typescript
   // Change:
   "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self'"
   // To:
   "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'"
   ```
   Note: removing `'unsafe-eval'` may require verifying Next.js production build does not need eval. Test in staging first.
2. `next.config.ts` — Add a `headers()` config as a belt-and-suspenders fallback for static assets that bypass middleware:
   ```typescript
   async headers() {
     return [{
       source: '/(.*)',
       headers: [
         { key: 'X-Content-Type-Options', value: 'nosniff' },
         { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
         { key: 'X-XSS-Protection', value: '1; mode=block' },
       ],
     }];
   }
   ```

---

## P1 — High Priority

### [QA P1-1] Strategy differentiation weak — auto/balanced/cheapest all pick same tool

**Symptom:** `auto`, `balanced`, and `cheapest` all route to `brave-search`. Only `best_performance` and `most_stable` pick different tools.

**Root cause:** In `src/lib/router/sdk.ts:150`, `applyStrategy()` pre-selects a tool via `getBestToolForStrategy()`. For CHEAPEST, `sdkToRouterStrategy('CHEAPEST')` → `'cheapest'` → `getRankedToolsForCapability('search', 'cheapest')` should return `brave-search` (cost 0.0001). For BALANCED, it should return `tavily` (quality ≥ 4.0, best cost-efficiency score). If all three land on the same tool, the most likely cause is:
- The adapters for `tavily` and `exa-search` are throwing (missing API keys), causing fallback to cascade until all strategies land on the same working adapter (`brave-search`)
- OR `account.strategy` stored in DB for all dev accounts defaults to a single value

**Fixes:**
1. `src/lib/router/index.ts` — Confirm the cost/quality data in `TOOL_CHARACTERISTICS` produces distinct top picks per strategy. For `search` capability:
   - `cheapest` → should rank: `brave-search` (0.0001) → `serpapi` (0.0005) → `tavily` (0.001)
   - `balanced` → should rank: `tavily` first (quality 4.0, score ~22.0) → `exa-search`
   - `best_performance` → should rank: `exa-search` first (quality 4.6)
   No code change needed if data is correct — verify with a log or test.
2. **Vercel env vars** — Ensure all three primary tool API keys are set so fallback doesn't obscure the strategy selection:
   - `BRAVE_SEARCH_API_KEY` (cheapest)
   - `TAVILY_API_KEY` (balanced)
   - `EXA_API_KEY` (best_performance)
3. `src/lib/router/sdk.ts:150` — If the issue is that `applyStrategy` is not being called with the request-level strategy (only the account default), verify that `sdk-handler.ts:159` passes `strategy: strategyUsed` (the per-request value) not `strategy: account.strategy` (the account default) to `applyStrategy`.

---

### [QA P1-2] Playground broken — `/playground/scenarios` 404, run returns 500

**Symptom:** `/playground/scenarios` returns 404. Running a query in the playground returns 500.

**Root cause:**
- **404 on `/playground/scenarios`:** `src/app/playground/scenarios/page.tsx` exists in the repo. This is a deployment artifact — the file was not included in the last Vercel build or is being blocked by a middleware redirect.
- **500 on run:** `src/app/playground/page.tsx` renders `<PlaygroundShell />` from `src/components/PlaygroundShell.tsx`. The 500 is most likely the playground's demo API key missing from Vercel env vars (`NEXT_PUBLIC_DEMO_API_KEY`), causing all router calls to return 401, which `PlaygroundShell` may surface as a generic error.

**Fixes:**
1. `src/components/PlaygroundShell.tsx` — Read the file and audit: (a) where the demo API key comes from, (b) how errors from the router API are handled and displayed. If it swallows 401 as a generic "500" message, fix the error display to show the actual status.
2. **Vercel env vars** — Add `NEXT_PUBLIC_DEMO_API_KEY` with a valid registered API key for the playground demo account.
3. Confirm `src/app/playground/scenarios/page.tsx` is tracked in git (`git ls-files src/app/playground/scenarios/page.tsx`) and rebuild/redeploy.

---

### [QA P1-3] MCP endpoints return 404 at `/api/v1/mcp`

**Symptom:** `GET /api/v1/mcp/tools/list` returns 404. `POST /api/v1/mcp/discover_tools` returns 404.

**Root cause:** The MCP server is at `src/app/mcp/route.ts`, which serves at `/mcp` — not `/api/v1/mcp`. The server uses JSON-RPC 2.0 via POST (not REST GET). QA is testing REST-style paths that do not exist. The existing `/mcp` endpoint works correctly per JSON-RPC spec.

**Fix — add REST convenience routes (do not move or modify `/mcp`):**
1. Create `src/app/api/v1/mcp/route.ts` — a GET handler that returns the MCP server manifest (tools list):
   ```typescript
   // GET /api/v1/mcp → returns { tools: [...], name, version }
   ```
   Re-export or call the same `SERVER_INFO` from `src/app/mcp/route.ts`. Do not duplicate the tool handler logic.
2. Create `src/app/api/v1/mcp/tools/list/route.ts` — a GET handler returning just the tools array:
   ```typescript
   // GET /api/v1/mcp/tools/list → returns { tools: [...] }
   ```
3. The existing `src/app/mcp/route.ts` remains unchanged. Existing MCP clients pointing at `/mcp` continue to work.

---

## Verification

After fixes are deployed, QA should confirm:

| Issue | Pass condition |
|-------|---------------|
| P0-1 | `POST /api/v1/router/upgrade` body `{"plan":"pro"}` → `{"checkoutUrl":"https://checkout.stripe.com/..."}`. `/dashboard/billing` loads with plan info. |
| P0-2 | After 5+ router calls: `GET /api/v1/router/calls` → every record has non-empty `toolUsed` (no empty string, no "unknown"). |
| P0-3 | Response to any API request includes `X-Content-Type-Options: nosniff`. Page routes include CSP without `unsafe-eval`. |
| P1-1 | `POST /api/v1/router/search` with `{"strategy":"cheapest","params":{"query":"test"}}` picks a different tool than `{"strategy":"best_performance",...}`. |
| P1-2 | `/playground/scenarios` returns 200. Playground run with demo key returns tool result, not 500. |
| P1-3 | `GET /api/v1/mcp/tools/list` returns 200 with tools array. |

---

## Infra: Env Vars to Add on Vercel

These are not code changes — add them to the Vercel project environment:

| Variable | Required for |
|----------|-------------|
| `STRIPE_SECRET_KEY` | P0-1: Stripe checkout |
| `STRIPE_PRICE_ID_PRO` | P0-1: Pro plan price |
| `STRIPE_PRICE_ID_GROWTH` | P0-1: Growth plan price |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `NEXT_PUBLIC_DEMO_API_KEY` | P1-2: Playground demo |
| `BRAVE_SEARCH_API_KEY` | P1-1: cheapest strategy |
| `TAVILY_API_KEY` | P1-1: balanced strategy |
| `EXA_API_KEY` | P1-1: best_performance strategy |
