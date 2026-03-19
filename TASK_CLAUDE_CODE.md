# TASK_CLAUDE_CODE.md — v-next (2026-03-18)

**Agent:** Claude Code
**Source:** NEXT_VERSION.md — Must-Have #1 (Bug A, Bug C) + Must-Have #3 backend (skillUrl)
**QA baseline:** 50/51 — 2 open P1s + 1 live-site P1. Bugs ship first.

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `next.config.ts` | **MODIFY** | Add 2 redirects: `/router` → `/connect` and `/api/v1/register` → `/api/v1/router/register` |
| `src/app/api/v1/router/register/route.ts` | **MODIFY** | Accept optional `skillUrl` param, fetch remote skill.md, auto-register |

> **DO NOT touch** any file in TASK_CODEX.md. Zero file overlap is required.

---

## Bug A — `/router` page returns 404 (Live-site P1)

**File:** `next.config.ts`

Every user who clicks "Router" in the top nav hits a 404. The fix is one entry in the
existing `redirects()` array (currently lines 5–16 have 2 entries).

Append to the array:
```ts
{
  source: '/router',
  destination: '/connect',
  permanent: true,   // HTTP 308
},
```

**Acceptance:** `curl -I https://agentpick.dev/router` → `308` (no `404`).

---

## Bug C — `POST /api/v1/register` returns 404 (QA P1)

**File:** `next.config.ts` (same change, same array)

The correct endpoint is `/api/v1/router/register`. Any SDK/docs reference to the shorter
path silently 404s. Add a permanent redirect:

```ts
{
  source: '/api/v1/register',
  destination: '/api/v1/router/register',
  permanent: true,   // HTTP 308
},
```

After both Bug A and Bug C, `next.config.ts` `redirects()` will contain **4 entries total**.

**Acceptance:** `POST /api/v1/register` → `308` redirect to `/api/v1/router/register`, not `404`.

---

## Must-Have #3 — `POST /api/v1/router/register` accepts `skillUrl` (Backend)

**File:** `src/app/api/v1/router/register/route.ts`

The agent-native self-registration flow requires `POST /api/v1/router/register` to accept
an optional `skillUrl` field. When provided, AgentPick fetches the remote `skill.md`,
validates the schema, and stores the URL — no dashboard required.

### 3a — Extend body type (line 23)

Change:
```ts
let body: { email?: string; name?: string };
```
To:
```ts
let body: { email?: string; name?: string; skillUrl?: string };
```

### 3b — Add skillUrl URL validation (after name validation, ~line 39)

```ts
const skillUrl = body.skillUrl?.trim() ?? undefined;
if (skillUrl) {
  try { new URL(skillUrl); }
  catch { return apiError('VALIDATION_ERROR', 'skillUrl must be a valid URL.', 400); }
}
```

### 3c — Add fetchAndRegisterSkillMd helper (above the POST handler)

```ts
async function fetchAndRegisterSkillMd(
  skillUrl: string,
  agentId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(skillUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ok: false, error: `Remote skill.md returned ${res.status}` };
    const text = await res.text();
    // Minimal validation: must declare a name field (YAML frontmatter or JSON)
    if (!text.includes('name:') && !text.includes('"name"')) {
      return { ok: false, error: 'skill.md missing required "name" field.' };
    }
    // Persist skillUrl in agent description for future reference
    await withRetry(() =>
      db.agent.update({ where: { id: agentId }, data: { description: `skill.md: ${skillUrl}` } })
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
```

### 3d — Call helper in all three response paths

In each of the three `return Response.json(...)` blocks (existing account, agent-only
account, new account), add before the return:

```ts
let skillReg: { ok: boolean; error?: string } | undefined;
if (skillUrl) skillReg = await fetchAndRegisterSkillMd(skillUrl, /* agentId variable */);
```

Include in response body:
```ts
...(skillReg !== undefined ? { skillRegistration: skillReg } : {}),
```

**Rule:** A skill fetch failure MUST NOT block API key issuance. Always return the key.

### 3e — Expected response shape (new account, with skillUrl)

```json
{
  "apiKey": "ah_live_sk_...",
  "plan": "FREE",
  "monthlyLimit": 500,
  "skillRegistration": { "ok": true }
}
```

**Acceptance criteria:**
- `POST /api/v1/router/register { email, skillUrl }` → 201 + `skillRegistration.ok = true`
- `POST /api/v1/router/register { email, skillUrl: "not-a-url" }` → 400 VALIDATION_ERROR
- Unreachable skillUrl → 201 (key issued) + `skillRegistration.ok = false`

---

## Verification Checklist

- [ ] `next.config.ts` has exactly 4 redirects after this change
- [ ] `GET /router` → 308 to `/connect`
- [ ] `POST /api/v1/register` → 308 to `/api/v1/router/register`
- [ ] `POST /api/v1/router/register { email, skillUrl }` → 201 + skillRegistration field
- [ ] Invalid `skillUrl` format → 400 validation error
- [ ] Unreachable `skillUrl` does not break registration (returns key + ok:false)
- [ ] No file listed in TASK_CODEX.md was modified

---

## DO NOT TOUCH (owned by Codex)

- `agentpick-router-qa.py`
- `src/app/globals.css`
- `src/components/ConnectTabs.tsx`
- `src/app/connect/page.tsx`
- Any page files under `src/app/benchmarks/`, `src/app/rankings/`, `src/app/agents/`, `src/app/dashboard/`
