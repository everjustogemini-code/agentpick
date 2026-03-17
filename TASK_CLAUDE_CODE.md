# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #1 (P1 rate limit CI) + Must-Have #3 (backend verification + test)

---

## Coverage Check — Every NEXT_VERSION.md Item

| Must-Have | Item | Owner |
|-----------|------|-------|
| #1 | Rate limit 429 regression test — CI, Retry-After header, Python QA | **CLAUDE CODE** |
| #2 | UI upgrade — glassmorphism, motion, typography | Codex |
| #3 | Benchmark permalink frontend page | Codex |
| #3 | Benchmark backend routes (badge.svg, public API, OG image) | **CLAUDE CODE** (verify + test) |

---

## Must-Have #1 — Complete Rate Limit 429 Regression Coverage

### Problem (what is still missing)
1. `src/lib/router/handler.ts` line ~244: the monthly USAGE_LIMIT 429 response lacks a `Retry-After` header. The spec requires it.
2. `src/lib/router/sdk-handler.ts` line ~117: same missing header.
3. `src/__tests__/rate-limit-429.test.ts` does not assert `Retry-After`, so CI has no contract coverage.
4. `.github/workflows/ci.yml` does not exist — tests never run automatically on push to `main`.
5. `agentpick-router-qa.py` does not exist — test 7.3 (rate limit path) is manual-only.

### Files to Modify / Create

#### `src/lib/router/handler.ts` — MODIFY (~line 244)
Add `Retry-After` to the USAGE_LIMIT 429 path.

Find this block:
```ts
return apiError('USAGE_LIMIT', `${limitLabel} call limit reached (${limitCount} calls). Upgrade plan for more.`, 429, {
  details: { plan: preAccount.plan, limit: limitCount, used: usedCount, period: isMonthly ? 'monthly' : 'daily' },
});
```

Replace with (compute seconds to next month boundary):
```ts
const now = new Date();
const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const retryAfterSecs = Math.ceil((nextReset.getTime() - now.getTime()) / 1000);
return apiError('USAGE_LIMIT', `${limitLabel} call limit reached (${limitCount} calls). Upgrade plan for more.`, 429, {
  details: { plan: preAccount.plan, limit: limitCount, used: usedCount, period: isMonthly ? 'monthly' : 'daily' },
  headers: { 'Retry-After': String(retryAfterSecs) },
});
```

Check how `apiError` passes extra headers (look at the `RATE_LIMITED` path at line ~116 for the pattern — it passes `retry_after` in the body, but confirm whether `apiError` also accepts headers). If `apiError` does not accept a `headers` param, add the header to the returned `NextResponse` directly after calling `apiError`.

#### `src/lib/router/sdk-handler.ts` — MODIFY (~line 117)
Same fix as handler.ts. Find the USAGE_LIMIT 429 path and add the `Retry-After` header with the same seconds-to-month-reset computation.

#### `src/__tests__/rate-limit-429.test.ts` — MODIFY
In the test `'HTTP 429 — 500 monthly calls (501st call, at limit)'` (currently ends around line 168), add 2 new assertions after `expect(body.error.code).toBe('USAGE_LIMIT')`:

```ts
const retryAfter = response.headers.get('Retry-After');
expect(retryAfter).not.toBeNull();                    // new assertion 1
expect(Number(retryAfter)).toBeGreaterThan(0);        // new assertion 2
```

This brings the suite to ≥ 53 assertions as required by NEXT_VERSION.md.

#### `package.json` — MODIFY (if not already present)
Check if `"scripts"."test"` exists. If not, add `"test": "vitest run"`. Read the file first.

#### `.github/workflows/ci.yml` — CREATE NEW FILE
Create directory `.github/workflows/` if it does not exist.

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      BENCHMARK_SECRET: test-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

#### `agentpick-router-qa.py` — CREATE NEW FILE (project root)
Python integration QA script. Uses env vars: `QA_BASE_URL`, `QA_TEST_KEY_499`, `QA_TEST_KEY_500`, `QA_BENCHMARK_RUN_ID`.

Structure:
- Part 9: `TestRateLimitPath`
  - `test_rate_limit_429_200`: POST `/api/v1/route/search` with `QA_TEST_KEY_499` (seeded at 499 calls). Assert HTTP 200.
  - `test_rate_limit_429_429`: POST with `QA_TEST_KEY_500` (seeded at 500 calls). Assert HTTP 429, `body["error"]["code"] == "USAGE_LIMIT"`, and `"Retry-After" in response.headers`.
- Part 10: `TestBenchmarkPermalinks`
  - `test_permalink_public_api`: GET `/api/v1/benchmarks/{QA_BENCHMARK_RUN_ID}/public`. Assert HTTP 200, response JSON contains `id`, `query`, `tools`.
  - `test_badge_svg`: GET `/b/{QA_BENCHMARK_RUN_ID}/badge.svg`. Assert HTTP 200, `Content-Type` starts with `image/svg+xml`.

```python
#!/usr/bin/env python3
"""AgentPick integration QA suite — rate limit + permalink regression."""

import os, unittest, requests

BASE_URL   = os.environ.get('QA_BASE_URL', 'http://localhost:3000')
KEY_499    = os.environ.get('QA_TEST_KEY_499', '')
KEY_500    = os.environ.get('QA_TEST_KEY_500', '')
RUN_ID     = os.environ.get('QA_BENCHMARK_RUN_ID', '')

class TestRateLimitPath(unittest.TestCase):

    def test_rate_limit_429_200(self):
        """7.3a — 500th call (at 499) must return 200."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/search",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={"params": {"query": "rate limit regression test"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)

    def test_rate_limit_429_429(self):
        """7.3b — 501st call (at 500) must return 429 + Retry-After."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/search",
            headers={"Authorization": f"Bearer {KEY_500}"},
            json={"params": {"query": "rate limit regression test"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 429)                        # 7.3b-1
        body = r.json()
        self.assertEqual(body["error"]["code"], "USAGE_LIMIT")      # 7.3b-2
        self.assertIn("Retry-After", r.headers)                     # 7.3b-3


class TestBenchmarkPermalinks(unittest.TestCase):

    def test_permalink_public_api(self):
        """Must-Have #3 — public API returns sanitized benchmark data."""
        r = requests.get(f"{BASE_URL}/api/v1/benchmarks/{RUN_ID}/public", timeout=10)
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("id", body)
        self.assertIn("query", body)
        self.assertIn("tools", body)

    def test_badge_svg(self):
        """Must-Have #3 — badge SVG returns correct content type, < 200ms."""
        r = requests.get(f"{BASE_URL}/b/{RUN_ID}/badge.svg", timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.headers.get("Content-Type", "").startswith("image/svg+xml"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
```

---

## Must-Have #3 — Backend Verification

The following backend files already exist. Read each and verify the listed conditions. Fix anything that fails.

#### `src/app/b/[runId]/badge.svg/route.ts` — VERIFY (fix if needed)
- [ ] Does NOT query `agentRuns` relation (badge must stay lean for < 200ms target)
- [ ] Responds with `Cache-Control: public, s-maxage=3600`
- [ ] No auth check (public route)
- Current file at line ~28 selects only `latencyMs`, `statusCode`, `product.name` — confirm nothing else was added

#### `src/app/api/v1/benchmarks/[runId]/public/route.ts` — VERIFY (fix if needed)
- [ ] No auth check
- [ ] No `costUsd`, `apiKeyId`, or other internal billing fields in the sanitized response
- [ ] `Cache-Control: public, s-maxage=3600` header present in the response
- Current file line ~67: `sanitized` object — confirm it has only `id`, `query`, `domain`, `tools`, `winningTool`, `createdAt`

---

## Files Modified / Created by CLAUDE CODE

| File | Action |
|------|--------|
| `src/lib/router/handler.ts` | Modify — add Retry-After header to USAGE_LIMIT 429 path |
| `src/lib/router/sdk-handler.ts` | Modify — same Retry-After fix |
| `src/__tests__/rate-limit-429.test.ts` | Modify — add 2 Retry-After assertions |
| `package.json` | Modify — add `"test": "vitest run"` if missing |
| `.github/workflows/ci.yml` | **CREATE** |
| `agentpick-router-qa.py` | **CREATE** |
| `src/app/b/[runId]/badge.svg/route.ts` | Verify; fix only if conditions above fail |
| `src/app/api/v1/benchmarks/[runId]/public/route.ts` | Verify; fix only if conditions above fail |

## DO NOT TOUCH (Codex files — merge conflict risk)

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/b/[runId]/page.tsx`
- `src/app/b/[runId]/opengraph-image.tsx`
- `src/components/SiteHeader.tsx`
- `src/app/rankings/page.tsx`
- Any `*.tsx` page file under `src/app/`
- Any file under `src/components/`

---

## Acceptance Criteria

- `npm test` runs all Vitest tests and passes (≥ 53 assertions in rate-limit suite)
- Monthly 429 response includes `Retry-After` header with positive integer value
- `.github/workflows/ci.yml` runs on push to `main`
- `agentpick-router-qa.py` has `TestRateLimitPath` (2 tests) and `TestBenchmarkPermalinks` (2 tests)
- Badge route and public API verified clean (no auth, no cost fields, cache headers present)
