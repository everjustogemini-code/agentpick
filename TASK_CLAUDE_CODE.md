# TASK_CLAUDE_CODE.md — cycle 17

**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-19
**QA baseline:** 53/54 — P1-1 open (embed B.1 test failing)
**Target:** 54/54
**Scope:** QA script embed fix + backend `source` param for quickstart funnel tracking
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Context: What Is Confirmed Done (do NOT redo)

- `src/__tests__/router-registry-sync.test.ts` — **exists and passes** (created cycle 16) ✓
- `src/app/api/v1/quickstart/issue/route.ts` — endpoint exists, tags `registrationSource: 'quickstart'` ✓
- `prisma/schema.prisma` `Agent.registrationSource` field — exists ✓
- `src/app/globals.css` glassmorphism CSS classes (`glass-card`, `hero-gradient-mesh`, `neon-glow`, `reveal-hidden`, `terminal-cursor`, `reveal-visible`) — exists ✓
- `src/app/page.tsx` line 172: `glass-card` applied to one section ✓
- `src/components/SiteHeader.tsx`: has `backdropFilter: blur(12px)` on scroll ✓

---

## Task 1 — Fix P1-1: Add B.1 Embed Test to QA Script (Must-Have #1)

**File:** `agentpick-router-qa.py`

**Status:** `TestEmbedRouter` class does not exist in the file. The QA automated suite is at 50/51 because this test is missing. Adding it will bring the automated suite to 51/51 and the overall score to 54/54.

Insert the following **before** the `if __name__ == "__main__":` block at the end of the file (currently line 73):

```python
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
```

**Also verify:** Scan the entire file for existing references to `voyage-ai`, `cohere-embed`, or `jina-embeddings` as embed slugs — currently zero hits, but confirm with:

```bash
grep "voyage-ai" agentpick-router-qa.py   # must return 0 hits
```

**Acceptance:** `grep "voyage-ai" agentpick-router-qa.py` → 0 hits. QA automated suite reports **51/51** (overall **54/54**).

---

## Task 2 — Backend: Support `source=quickstart_homepage` in Key Issuance (Must-Have #3)

**File:** `src/app/api/v1/quickstart/issue/route.ts`

**Why:** The `/quickstart` page (created by Codex) reads `?source` from URL search params and POSTs it to this endpoint. The homepage CTA uses `?source=quickstart_homepage`. The backend currently hard-codes `registrationSource: 'quickstart'` — keys from the homepage funnel are indistinguishable.

**Changes — 3 edits in the same file:**

1. **Line 23** — extend the body type to accept an optional `source` field:
   ```typescript
   // Before:
   let body: { email?: string };
   // After:
   let body: { email?: string; source?: string };
   ```

2. **After line 34** (`const email = ...`), add source resolution:
   ```typescript
   const VALID_SOURCES = ['quickstart', 'quickstart_homepage'] as const;
   const registrationSource: string =
     body.source && (VALID_SOURCES as readonly string[]).includes(body.source)
       ? body.source
       : 'quickstart';
   ```

3. **Lines 49, 64, 94** — replace all three hardcoded `registrationSource: 'quickstart'` string literals with the variable:
   ```typescript
   // Before (3 occurrences):
   data: { apiKeyHash, registrationSource: 'quickstart' },
   // After (all 3):
   data: { apiKeyHash, registrationSource },
   ```

**Acceptance:**
- `POST /api/v1/quickstart/issue` with `{ email, source: "quickstart_homepage" }` → DB stores `registrationSource = "quickstart_homepage"`
- `POST /api/v1/quickstart/issue` with no `source` field → DB stores `registrationSource = "quickstart"` (unchanged default)
- Unknown/arbitrary `source` values fall back to `"quickstart"` (not stored verbatim)

---

## Files Owned by CLAUDE CODE This Cycle

| Action | File |
|--------|------|
| Modify | `agentpick-router-qa.py` |
| Modify | `src/app/api/v1/quickstart/issue/route.ts` |

**DO NOT touch** (Codex-owned):
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/components/HeroCodeBlock.tsx`
- `src/components/PricingSection.tsx`
- `src/components/PricingPageClient.tsx`
- `src/app/pricing/page.tsx`
- `src/components/StatsBar.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/quickstart/page.tsx` (new file, Codex creates)
- `src/__tests__/router-registry-sync.test.ts` (already complete, do not modify)

---

## Coverage: Must-Have Items

| NEXT_VERSION.md requirement | Covered by |
|---|---|
| Must-Have #1 — QA B.1 embed test; `valid_embed_tools = ["voyage-embed"]`; 54/54 | **Task 1** |
| Must-Have #1 — CI assertion `CAPABILITY_TOOLS.embed[0]` pinned to QA allowlist | Done in cycle 16 ✓ |
| Must-Have #3 — Keys tagged `source=quickstart_homepage` from homepage funnel | **Task 2** |
| All other Must-Have #1, #2, #3 items | TASK_CODEX.md |

---

## Acceptance Criteria

- [ ] `TestEmbedRouter` class present in `agentpick-router-qa.py`
- [ ] `grep "voyage-ai" agentpick-router-qa.py` → 0 hits
- [ ] `src/app/api/v1/quickstart/issue/route.ts` body type includes `source?: string`
- [ ] `VALID_SOURCES` allowlist guards against arbitrary string injection
- [ ] All 3 `registrationSource: 'quickstart'` literals replaced with the variable
- [ ] No other files modified

---

## Progress Log

After each task, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] <brief description>
```
