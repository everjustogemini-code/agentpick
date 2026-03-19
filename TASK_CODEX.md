# TASK_CODEX.md — cycle 13 (post-cycle-12)

**Agent:** Codex
**Date:** 2026-03-18
**QA baseline:** 50/51 — P1-2 slug fix below brings QA to 51/51
**Scope:** Bug fixes ONLY — no new features, no UI changes, no refactors
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## P1-2 — QA script uses wrong embed slug `voyage-ai` instead of `voyage-embed`

**Priority:** P1
**File:** `agentpick-router-qa.py`

**Symptom:** QA test B.1 checks `tool in ["cohere-embed", "voyage-ai", "jina-embeddings"]`. The live tool slug is `"voyage-embed"`, not `"voyage-ai"`. This causes a false failure on every QA run.

**Fix:** Find the B.1 test class/method in `agentpick-router-qa.py` and update the valid-tool list so it uses `"voyage-embed"` instead of `"voyage-ai"`. If the class exists, update the list in-place:

```python
valid_embed_tools = ["voyage-embed", "jina-embed", "edenai-embed", "jina-embeddings"]
self.assertIn(tool, valid_embed_tools, f"Unexpected embed tool: {tool}")
```

If the B.1 test does not exist, add the following class before the final `if __name__ == "__main__":` block:

```python
class TestEmbedRoute(unittest.TestCase):

    def test_B1_embed_uses_known_slug(self):
        """B.1 — /api/v1/route/embed must use a known embed slug."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={"params": {"text": "machine learning fundamentals"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        tool = r.json().get("meta", {}).get("tool_used", "")
        valid_embed_tools = ["voyage-embed", "jina-embed", "edenai-embed", "jina-embeddings"]
        self.assertIn(tool, valid_embed_tools, f"Unexpected embed tool: {tool}")
```

**Verification after fix:**
```bash
grep "voyage-ai" agentpick-router-qa.py   # Must return zero hits
```

**Acceptance:** `grep "voyage-ai" agentpick-router-qa.py` returns zero hits. QA automated suite reports **51/51**.

---

## Files owned by CODEX

| File | Bug |
|------|-----|
| `agentpick-router-qa.py` | P1-2 |

**DO NOT touch:**
- `src/lib/benchmark/adapters/voyage-embed.ts` — owned by Claude Code (P0-1)
- `src/lib/router/index.ts` — owned by Claude Code (P1-1)
- `src/lib/ops/constants.ts` — owned by Claude Code (P1-1)
- `src/lib/ops/service-probes.ts` — owned by Claude Code (P1-1)
- `src/app/api/v1/router/skill.md/route.ts` — owned by Claude Code (P1-1)
- `src/lib/router/ai-classify.ts` — owned by Claude Code (P1-3)
- Any `src/app/` page or `src/components/` file — out of scope this cycle (bug fixes only)

---

## Coverage verification — every NEXT_VERSION.md item assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| P0-1 — `data.embeddings` present and non-empty in embed response | TASK_CLAUDE_CODE |
| P1-1 — `tried_chain` length 1, `fallback_used: false`; zero grep hits for dead slugs | TASK_CLAUDE_CODE |
| P1-2 — B.1 uses `voyage-embed`; QA reports 51/51; zero grep hits for `voyage-ai` in QA script | **This file** |
| P1-3 — `meta.ai_classification.type` is NOT `"news"` for embed queries | TASK_CLAUDE_CODE |

All 4 bugs from NEXT_VERSION.md are covered. No bug left behind.

---

## Progress log

After completing the fix, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] P1-2: updated agentpick-router-qa.py B.1 valid_embed_tools to use voyage-embed; removed voyage-ai slug
```
