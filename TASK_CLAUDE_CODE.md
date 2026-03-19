# TASK_CLAUDE_CODE.md — cycle 15

**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-18
**QA baseline:** 50/51 — P1-1 open
**Scope:** Backend — register endpoint `source` field, new `/quickstart/issue` endpoint, DB schema, backend `voyage-ai` grep fix
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Task A — New DB field: `Agent.registrationSource` (Must-Have #3 backend, step 1)

### Schema change

**File:** `prisma/schema.prisma`

Locate the `Agent` model. Add one field after `ownerEmail`:

```prisma
registrationSource  String  @default("direct")
```

Valid values: `"direct"`, `"quickstart"`, `"quickstart_homepage"`.

### Migration file

**File to create:** `prisma/migrations/20260318_add_agent_registration_source/migration.sql`

```sql
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "registrationSource" TEXT NOT NULL DEFAULT 'direct';
```

Run `npx prisma generate` after editing the schema.

---

## Task B — Registration endpoint: accept and store `source` (Must-Have #3 backend, step 2)

**File:** `src/app/api/v1/router/register/route.ts`

1. **Extract `source` from request body** alongside existing fields:
   ```ts
   const { email, name, skillUrl, source } = body;
   ```

2. **Store on `Agent.registrationSource`** in the `prisma.agent.create(...)` call:
   ```ts
   registrationSource: typeof source === 'string' ? source : 'direct',
   ```
   Also update the `prisma.agent.update(...)` path (re-key for existing accounts) — only overwrite if `source` is provided.

3. **Return `registrationSource` in the response JSON:**
   ```ts
   return NextResponse.json({ apiKey, plan, monthlyLimit, registrationSource: agent.registrationSource });
   ```

No rate-limit changes. No email confirmation changes. No other behavioural changes.

---

## Task C — New endpoint: `POST /api/v1/quickstart/issue` (Must-Have #3 backend, step 3)

**File to create:** `src/app/api/v1/quickstart/issue/route.ts`

This endpoint lets the `/quickstart` page issue a trial key without an email-confirmation gate, and always tags keys `registrationSource = "quickstart"`.

**Contract:**
- Method: `POST`
- Auth: None (public)
- Body: `{ email: string }`
- Response (200): `{ apiKey: string, plan: string, monthlyLimit: number }`
- Response (400): `{ error: { code: string, message: string } }` — missing/invalid email
- Response (429): pass-through from rate limiter

**Implementation:**
- Reuse the same Prisma create/lookup logic as `src/app/api/v1/router/register/route.ts`.
- Hard-code `registrationSource = "quickstart"` — ignore any `source` in the request body.
- Reuse the same IP-based `rateLimit` call from the register route.
- Do NOT create any UI, page, or component file.

---

## Task D — Backend `voyage-ai` grep fix (Must-Have #1 partial)

Run:
```bash
grep -rn "voyage-ai" src/ --include="*.ts" --include="*.tsx"
```

For any hits in backend/API files (routes, lib, etc. — NOT frontend page/component files), replace `voyage-ai` with `voyage-embed`. Frontend occurrences are Codex's responsibility.

---

## Files owned by CLAUDE CODE this cycle

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` |
| Create | `prisma/migrations/20260318_add_agent_registration_source/migration.sql` |
| Modify | `src/app/api/v1/router/register/route.ts` |
| Create | `src/app/api/v1/quickstart/issue/route.ts` |
| Conditionally modify | Any `src/` backend file flagged by the `voyage-ai` grep (Task D) |

**DO NOT touch** (Codex-owned):
- `agentpick-router-qa.py`
- `src/app/page.tsx`
- `src/app/quickstart/page.tsx`
- `src/components/HeroCodeBlock.tsx`
- `src/components/PricingSection.tsx`
- `src/components/PricingPageClient.tsx`
- `src/app/pricing/page.tsx`
- `src/components/StatsBar.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- Any `*.css` or `*.module.css` file

---

## Acceptance criteria

- [ ] `POST /api/v1/quickstart/issue` with `{ "email": "test@example.com" }` → 200, returns `{ apiKey, plan, monthlyLimit }`
- [ ] `Agent.registrationSource` in DB equals `"quickstart"` for keys issued via the new endpoint
- [ ] `POST /api/v1/router/register` with `{ "email": "...", "source": "quickstart_homepage" }` → `registrationSource = "quickstart_homepage"` in DB
- [ ] `npx prisma migrate deploy` succeeds cleanly
- [ ] `grep -rn "voyage-ai" src/ --include="*.ts"` → zero hits in backend files

---

## Progress log

After each task, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] <brief description>
```
