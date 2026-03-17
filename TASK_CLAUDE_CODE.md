# TASK_CLAUDE_CODE.md
**Agent:** Claude Code (backend)
**Branch:** feat/cycle-2-codex
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #1 (P1 rate limit CI) + Must-Have #3 (QA extension)

---

## Must-Have #1 — Automate Rate Limit 429 Regression Test

### Context
`src/__tests__/rate-limit-429.test.ts` already exists with Vitest unit + HTTP-layer assertions for the 429 path. The P1 gap is:
1. No `"test"` script in `package.json` — tests never run in CI.
2. No GitHub Actions CI workflow — nothing runs automatically on push to `main`.
3. `agentpick-router-qa.py` (Python integration suite referenced in `QA_REPORT.md`) has no `test_rate_limit_429` entry; test 7.3 is listed as manual-only.

### Files to Modify / Create

#### 1. `package.json` — MODIFY
- **Change:** Add `"test": "vitest run"` to the `"scripts"` block (after `"lint"`).
- No other changes to this file.

#### 2. `.github/workflows/ci.yml` — CREATE NEW FILE
- **Action:** Create the directory `.github/workflows/` and the file `ci.yml`.
- Runs on `push` to `main` and on `pull_request`.
- Steps: `actions/checkout@v4` → `actions/setup-node@v4` (node 20, cache npm) → `npm ci` → `npm test`.
- Job fails if any Vitest test fails.

Exact content:
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

#### 3. `agentpick-router-qa.py` — CREATE NEW FILE (project root)
- **Action:** Create the Python integration QA script.
- Structure mirrors the existing 51-test suite described in `QA_REPORT.md`.
- Add **Part 9: Rate Limit Regression** with class `TestRateLimitPath`:
  - `test_rate_limit_429_200`: POST to `/api/v1/route/search` with a key pre-seeded at 499 monthly calls. Assert HTTP 200.
  - `test_rate_limit_429_429`: POST with a key pre-seeded at 500 monthly calls. Assert HTTP 429, `body["error"]["code"] == "RATE_LIMITED"`, and `"Retry-After"` header present.
- Add `/b/{runId}` page-load checks inline (see Must-Have #3 section below).
- Use env vars `QA_BASE_URL`, `QA_TEST_KEY_499`, `QA_TEST_KEY_500`, `QA_BENCHMARK_RUN_ID`.
- Total assertions: ≥ 55 (51 existing + 2 rate-limit + 2 permalink = 55).

Key test structure:
```python
class TestRateLimitPath(unittest.TestCase):
    def test_rate_limit_429_200(self):
        r = requests.post(f"{BASE_URL}/api/v1/route/search",
                          headers={"Authorization": f"Bearer {TEST_KEY_499}"},
                          json={"params": {"query": "rate limit regression"}},
                          timeout=15)
        self.assertEqual(r.status_code, 200)               # 7.3a: 500th call allowed

    def test_rate_limit_429_429(self):
        r = requests.post(f"{BASE_URL}/api/v1/route/search",
                          headers={"Authorization": f"Bearer {TEST_KEY_500}"},
                          json={"params": {"query": "rate limit regression"}},
                          timeout=15)
        self.assertEqual(r.status_code, 429)               # 7.3b: 501st call blocked
        body = r.json()
        self.assertEqual(body["error"]["code"], "RATE_LIMITED")
        self.assertIn("Retry-After", r.headers)
```

---

## Must-Have #3 — QA Extension: /b/{runId} Page-Load Check

### Context
`/b/[runId]/page.tsx` will be created by Codex (see TASK_CODEX.md). Once live, it must be in the automated QA page-load check so the suite reaches ≥ 54 tests.

### Files to Modify

#### `agentpick-router-qa.py` (same new file as above)
Add class `TestBenchmarkPermalinks`:
- `test_permalink_page`: `GET /b/{QA_BENCHMARK_RUN_ID}` → assert HTTP 200.
- `test_badge_svg`: `GET /b/{QA_BENCHMARK_RUN_ID}/badge.svg` → assert HTTP 200 and `Content-Type` starts with `image/svg+xml`.

---

## Files — CLAUDE CODE Exclusively (Codex must NOT touch these)

| File | Action |
|------|--------|
| `package.json` | Modify — add `"test": "vitest run"` |
| `.github/workflows/ci.yml` | **CREATE** |
| `agentpick-router-qa.py` | **CREATE** |

**Forbidden:** Do NOT edit any file under `src/app/`, `src/components/`, `src/app/globals.css`, or `src/app/layout.tsx`.

---

## Acceptance Criteria
- `npm test` runs Vitest and passes all existing tests.
- `.github/workflows/ci.yml` runs on push to `main`; job fails on test failure.
- `agentpick-router-qa.py` contains `TestRateLimitPath` with 2 assertions (7.3a, 7.3b) and `TestBenchmarkPermalinks` with 2 assertions.
- QA suite total: ≥ 55/55 when run against production.
- All 51 existing Vitest tests in `src/__tests__/` continue to pass.
