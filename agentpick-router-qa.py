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
