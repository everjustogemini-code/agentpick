# TASK_CLAUDE_CODE.md — cycle 14

**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-18
**QA baseline:** 50/51 — P1-1 open
**Scope:** Backend: registration endpoint update + quickstart API + DB schema (Must-Have #1 partial + Must-Have #3 backend)
**Do NOT touch:** Any file owned by Codex (see list at bottom)

---

## Task A — Registration endpoint: accept and store `source` (Must-Have #3 backend, step 1)

**File:** `src/app/api/v1/router/register/route.ts`

### What to do

1. **Extract `source` from request body** — alongside the existing `email`, `name`, `skillUrl` fields:
   ```ts
   const { email, name, skillUrl, source } = body;
   ```

2. **Store on `Agent.registrationSource`** — when calling `prisma.agent.create(...)`, add:
   ```ts
   registrationSource: typeof source === 'string' ? source : 'direct',
   ```
   Do the same in the `prisma.agent.update(...)` path (re-key for existing accounts) — only overwrite if `source` is provided.

3. **Return `registrationSource` in the response JSON** so callers can confirm it was stored:
   ```ts
   return NextResponse.json({ apiKey, plan, monthlyLimit, registrationSource: agent.registrationSource });
   ```

No rate-limit changes. No email confirmation changes. No other behavioural changes.

---

## Task B — New database field: `Agent.registrationSource` (Must-Have #3 backend, step 2)

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

## Task C — New endpoint: `POST /api/v1/quickstart/issue` (Must-Have #3 backend, step 3)

**File to create:** `src/app/api/v1/quickstart/issue/route.ts`

This is a thin, dedicated endpoint for the `/quickstart` page so the frontend can:
1. Issue a trial API key without any email confirmation gate (same behaviour as register — no confirmation is already the case).
2. Always tag issued keys with `registrationSource = "quickstart"`.

**Contract:**
- Method: `POST`
- Auth: None (public)
- Body: `{ email: string }`
- Response (success): `{ apiKey: string, plan: string, monthlyLimit: number }`
- Response (error): `{ error: { code: string, message: string } }`

**Implementation guidance:**
- Reuse the same Prisma logic as `register/route.ts` (copy the minimal create/lookup path — do NOT add a shared helper; this is a single new file).
- Hard-code `source = "quickstart"` — ignore any `source` from the request body.
- Reuse the same IP-based `rateLimit` call already used in `register/route.ts`.
- Return HTTP 400 for missing/invalid email.
- Return HTTP 429 (pass-through from rate limiter) for abuse.

**Do NOT** create any UI, page, or component file — those are owned by Codex.

---

## Task D — If `/connect` page or docs copy still references `voyage-ai` as an embed slug

After the Codex cycle-13 QA fix, check if any backend API response, skill.md route, or server-side copy still returns the `voyage-ai` slug:

```bash
grep -rn "voyage-ai" src/ --include="*.ts" --include="*.tsx"
```

If any hits come back in backend/API files (not frontend), fix them in the relevant file. Frontend occurrences are Codex's responsibility.

---

## Files owned by CLAUDE CODE this cycle

| Action | File |
|--------|------|
| Modify | `src/app/api/v1/router/register/route.ts` |
| Modify | `prisma/schema.prisma` |
| Create | `prisma/migrations/20260318_add_agent_registration_source/migration.sql` |
| Create | `src/app/api/v1/quickstart/issue/route.ts` |
| Conditionally modify | Any `src/` backend file flagged by the `voyage-ai` grep (Task D) |

**DO NOT touch** (Codex-owned):
- `agentpick-router-qa.py`
- `src/app/page.tsx`
- `src/app/quickstart/page.tsx` (new file — Codex creates it)
- `src/components/HeroCodeBlock.tsx`
- `src/components/PricingSection.tsx`
- `src/components/PricingPageClient.tsx`
- `src/app/pricing/page.tsx`
- `src/components/StatsBar.tsx`
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
