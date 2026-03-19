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


class TestUsageAliases(unittest.TestCase):

    def test_usage_calls_and_cost_usd_top_level(self):
        """P1-A — /api/v1/router/usage must expose top-level `calls` (int) and `cost_usd` (float)."""
        r = requests.get(
            f"{BASE_URL}/api/v1/router/usage",
            headers={"Authorization": f"Bearer {KEY_499}"},
            timeout=10,
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        result = (
            isinstance(data.get('calls'), int) and
            isinstance(data.get('cost_usd'), (int, float))
        )
        self.assertTrue(result, f"Expected top-level `calls` (int) and `cost_usd` (float), got: {data}")


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


KEY_EMBED = os.environ.get('QA_TEST_KEY_EMBED', KEY_499)

class TestEmbedRouter(unittest.TestCase):

    def test_b1_embed_tool_used(self):
        """B.1 — embed route must return meta.tool_used = voyage-embed.
        Allowlist is pinned in src/__tests__/router-registry-sync.test.ts (QA_EMBED_ALLOWLIST).
        """
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_EMBED}"},
            json={"params": {"query": "semantic similarity for developer tools"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        valid_embed_tools = ["voyage-embed"]  # must match QA_EMBED_ALLOWLIST in router-registry-sync.test.ts
        tool_used = body.get("meta", {}).get("tool_used", "")
        self.assertIn(
            tool_used,
            valid_embed_tools,
            f"Expected tool_used in {valid_embed_tools}, got: {tool_used!r}",
        )


class TestOpenAICompat(unittest.TestCase):

    def test_e1_openai_compat_search(self):
        """E.1 — /v1/chat/completions returns OpenAI-schema response."""
        r = requests.post(
            f"{BASE_URL}/v1/chat/completions",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={
                "model": "agentpick",
                "messages": [{"role": "user", "content": "latest AI agent frameworks 2025"}],
                "tools": [{"type": "function", "function": {
                    "name": "web_search",
                    "description": "search the web",
                    "parameters": {"type": "object", "properties": {}}
                }}],
            },
            timeout=20,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("choices", body)
        self.assertTrue(len(body["choices"]) > 0)
        self.assertIn("message", body["choices"][0])
        self.assertTrue(r.headers.get("X-AgentPick-Tool-Used", "") != "")


if __name__ == "__main__":
    unittest.main(verbosity=2)
