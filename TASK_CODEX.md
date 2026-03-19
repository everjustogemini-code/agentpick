# TASK_CODEX.md — cycle 20
**Agent:** Codex
**Date:** 2026-03-19
**QA baseline:** 50/51 — P1 open (embed B.1 failing)
**Target:** 51/51
**Policy:** BUG FIXES ONLY. No new features.
**Source:** NEXT_VERSION.md Fix #1
**Do NOT touch:** Any file listed in TASK_CLAUDE_CODE.md

---

## Fix #1 — [QA_ISSUE_1-A] QA script stale embed tool name

**QA Reference:** QA_REPORT.md P1 Issue #1 (B.1-embed) — "QA script valid-tools list is stale (`voyage-ai` → now `voyage-embed`)"

### Problem

The B.1 embed assertion in the QA script checks for `voyage-ai` or `cohere-embed`. The router now uses `voyage-embed` as the canonical tool ID. The test fails because `voyage-embed` is not in the allowlist.

### File to Modify

- `/Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py`

### Exact Change

Locate this line (search: `"voyage-ai"`):
```python
valid_embed_tools = ["cohere-embed", "voyage-ai", "jina-embeddings"]
```

Replace with:
```python
valid_embed_tools = ["voyage-embed"]
```

**Verification after edit:**
```bash
grep "voyage-ai" /Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py
```
Must return **zero hits**.

### Files Owned by CODEX This Cycle

| Action | File |
|--------|------|
| Modify | `/Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py` |

### DO NOT TOUCH (CLAUDE CODE-owned)

- `src/lib/router/index.ts`

---

## Coverage: Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Fix #1 — QA script `voyage-ai` → `voyage-embed` stale allowlist | **This file** |
| Fix #2 — Router capability constraint not re-enforced after `aiRoute()` | **TASK_CLAUDE_CODE.md** |

---

## Acceptance Criteria

- [ ] `grep "voyage-ai" agentpick-router-qa.py` → zero hits
- [ ] QA suite B.1-embed passes
- [ ] QA suite reports **51/51**

---

## Progress Log

After completing this task, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CODEX] [done] Fix #1: QA script voyage-ai → voyage-embed allowlist update
```
