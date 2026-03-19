# TASK_CLAUDE_CODE.md — cycle 16

**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-19
**QA baseline:** 50/51 — P1-1 open
**Scope:** Backend — CI assertion test pinning `CAPABILITY_TOOLS.embed` against QA allowlist
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Context: What Was Already Done in Cycle 15

The following tasks from cycle 15 are **confirmed complete** — do not redo them:
- `POST /api/v1/quickstart/issue/route.ts` — exists ✓
- `prisma/schema.prisma` `Agent.registrationSource` field — exists ✓
- `POST /api/v1/router/register/route.ts` `source` param handling — exists ✓
- `src/app/globals.css` glassmorphism CSS classes (`glass-card`, `hero-gradient-mesh`, `neon-glow`, `reveal-hidden`, `terminal-cursor`) — exists ✓

---

## Task A — CI Assertion: Pin `CAPABILITY_TOOLS.embed` Against QA Allowlist (Must-Have #1, step 3)

**Status:** Not done. `src/__tests__/router-registry-sync.test.ts` does not exist.

**File to CREATE:** `src/__tests__/router-registry-sync.test.ts`

**Why:** `CAPABILITY_TOOLS.embed[0]` in `src/lib/router/index.ts` (line 43: `embed: ['voyage-embed']`) and the QA script's embed allowlist must never drift again. This test makes drift a CI failure.

**Implementation:**

```typescript
import { describe, it, expect } from 'vitest';
import { CAPABILITY_TOOLS } from '@/lib/router/index';

/**
 * Single source of truth for the embed tool allowlist.
 * Must match agentpick-router-qa.py TestEmbedRouter.valid_embed_tools.
 * When adding a new embed adapter, update BOTH this constant AND the QA script.
 */
export const QA_EMBED_ALLOWLIST = ['voyage-embed'] as const;

describe('router-registry ↔ QA allowlist sync', () => {
  it('CAPABILITY_TOOLS.embed[0] must be voyage-embed', () => {
    expect(CAPABILITY_TOOLS.embed[0]).toBe('voyage-embed');
  });

  it('every embed tool slug in registry must appear in QA_EMBED_ALLOWLIST', () => {
    for (const slug of CAPABILITY_TOOLS.embed) {
      expect(QA_EMBED_ALLOWLIST as readonly string[]).toContain(slug);
    }
  });

  it('retired embed slugs must NOT be in QA_EMBED_ALLOWLIST', () => {
    const retired = ['voyage-ai', 'cohere-embed', 'jina-embeddings'];
    for (const slug of retired) {
      expect(QA_EMBED_ALLOWLIST as readonly string[]).not.toContain(slug);
    }
  });
});
```

**Steps:**
1. Create the file above at `src/__tests__/router-registry-sync.test.ts`.
2. Run `npx vitest run src/__tests__/router-registry-sync.test.ts` — must show 3/3 passing.
3. Verify `CAPABILITY_TOOLS` is exported from `src/lib/router/index.ts` (it is, line 40).

**Acceptance:**
- `npx vitest run src/__tests__/router-registry-sync.test.ts` → 3 tests pass
- If `voyage-ai` is ever re-added to `CAPABILITY_TOOLS.embed`, test 3 fails loudly

---

## Files Owned by CLAUDE CODE This Cycle

| Action | File |
|--------|------|
| Create | `src/__tests__/router-registry-sync.test.ts` |

**DO NOT touch** (Codex-owned):
- `agentpick-router-qa.py`
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/components/SiteHeader.tsx`
- `src/components/HeroCodeBlock.tsx`
- `src/components/PricingSection.tsx`
- `src/components/PricingPageClient.tsx`
- `src/app/pricing/page.tsx`
- `src/components/StatsBar.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/quickstart/page.tsx` (new file, Codex creates)

---

## Coverage: Must-Have #1 Step 3

| NEXT_VERSION.md requirement | This task |
|---|---|
| "Add a CI assertion that pins `CAPABILITY_TOOLS.embed[0]` (router registry) against the QA allowlist so they can never drift again." | **Task A — fully covers this** |

All other Must-Have #1, #2, #3 items are covered in TASK_CODEX.md.

---

## Acceptance Criteria

- [ ] `src/__tests__/router-registry-sync.test.ts` created
- [ ] `npx vitest run src/__tests__/router-registry-sync.test.ts` → 3/3 pass
- [ ] No other files modified

---

## Progress Log

After completing Task A, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] CI assertion test: CAPABILITY_TOOLS.embed ↔ QA allowlist sync (3/3 pass)
```
