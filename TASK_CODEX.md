# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-16
**Cycle:** 129
**Source:** NEXT_VERSION.md — Bugfix Cycle 129, QA Round 15
**Cycle type:** BUG FIX ONLY — zero new features

---

## Overview

**No tasks for Codex this cycle.**

NEXT_VERSION.md contains exactly one fix (Fix #1 — P1: Calls not persisted to database after routing). All affected files are backend/API/database files fully owned by TASK_CLAUDE_CODE.md:

- `prisma/migrations/20260315_add_router_strategy_manual_auto/migration.sql`
- `src/lib/router/sdk.ts`
- `src/lib/router/handler.ts`

There are no frontend components, styling issues, or single-file UI changes in this cycle.

---

## Files to Modify

None.

**Do NOT touch:**
- `src/lib/router/sdk.ts` — owned by TASK_CLAUDE_CODE.md
- `src/lib/router/handler.ts` — owned by TASK_CLAUDE_CODE.md

---

## Acceptance Criteria

No Codex tasks. Verify TASK_CLAUDE_CODE.md is complete before closing this cycle.
