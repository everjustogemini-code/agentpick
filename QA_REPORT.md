# QA Report — Round 7 (2026-03-14)
Score: 37/49 (~76%) — FAIL (P0 blockers remain)

## P0 — MUST FIX BEFORE ANYTHING ELSE

### P0-1: Stripe payment broken
- `/pricing` page shows "Stripe billing is not configured yet" on upgrade click
- `/dashboard/billing` returns 404
- FIX: Complete Stripe Checkout integration. Needs STRIPE_SECRET_KEY + STRIPE_PRICE_ID env vars on Vercel. Create /dashboard/billing page.
- FILES: src/app/api/v1/router/upgrade/route.ts, src/app/dashboard/billing/page.tsx (create), src/lib/stripe.ts

### P0-2: toolUsed still empty/unknown in router calls
- `/router/calls` API returns toolUsed as empty or "unknown" for all records
- FIX: In src/lib/router/sdk-handler.ts or src/lib/router/index.ts, ensure routeRequest() writes the actual tool name to the RouterCall record BEFORE returning
- FILES: src/lib/router/sdk-handler.ts, src/lib/router/index.ts

### P0-3: XSS injection risk — missing security headers
- Injected `<script>alert(1)</script>` in query returns 200 with content reflected
- Missing X-Content-Type-Options: nosniff, Content-Security-Policy
- FIX: Add security headers in middleware.ts or next.config.ts headers config
- FILES: src/middleware.ts or next.config.ts

## P1

### P1-1: Strategy differentiation weak
- auto, balanced, cheapest all route to brave-search
- Only best_performance and most_stable pick different tools
- FIX: Update cost/quality ranking maps in src/lib/router/strategies.ts so cheapest picks serper (cheapest), balanced picks tavily (middle), auto uses AI classification
- FILES: src/lib/router/strategies.ts, src/lib/router/index.ts

### P1-2: Playground broken
- /playground/scenarios returns 404
- Running playground returns 500
- FILES: src/app/playground/

### P1-3: MCP endpoints 404
- /api/v1/mcp tools/list and discover_tools return 404
- FILES: src/app/mcp/route.ts

## What's Good
- pip install agentpick WORKS (v0.1.0 on PyPI)
- Dashboard is enterprise-grade (P50/P95/P99, live feed, charts)
- Router engine: 15 consecutive calls 100% success, 8 concurrent 100% success
- Priority tools: 100% hit rate (was 0%)
- Budget control: $0 budget correctly returns 402
- AI classification accuracy: 80% (up from ~60%)

FAIL
