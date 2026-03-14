# TASK_CODEX.md
**Agent:** Codex
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md — Bugfix Cycle 5 (QA Round 7, score 37/49)

---

## Files to Modify / Verify

| Action | File |
|--------|------|
| MODIFY | `src/components/PlaygroundShell.tsx` |
| VERIFY (no code change expected) | `src/app/dashboard/billing/page.tsx` |

**DO NOT TOUCH:** `src/lib/router/**`, `src/app/api/**`, `src/middleware.ts`, `next.config.ts`, `prisma/**`, `src/app/mcp/**`, or any file not listed above.

---

## Bug P0-1 — `/dashboard/billing` 404 + Stripe env vars

### Fix 1 — Verify `src/app/dashboard/billing/page.tsx` is tracked in git

Run: `git ls-files src/app/dashboard/billing/page.tsx`

- If the output is empty (file not tracked), **add and commit it**: `git add src/app/dashboard/billing/page.tsx`
- If the file doesn't exist at all, read `src/app/dashboard/page.tsx` for the billing section structure, then create a minimal `billing/page.tsx` that renders the billing info from `/api/v1/router/usage`.

**No other code changes.** The Stripe logic in `src/app/api/v1/router/upgrade/route.ts` is already correct — it only needs the env vars below (add to Vercel, not code):
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_GROWTH`
- `STRIPE_WEBHOOK_SECRET`

---

## Bug P1-2 — Playground broken: run returns 500, errors swallowed

### Fix — `src/components/PlaygroundShell.tsx`

**Current behavior:** The component only handles `status === 429` (line ~39 sets `error429`). All other non-2xx statuses (401, 500, etc.) fall through without user-visible feedback — the result panel stays blank or shows stale data.

**Read the file first**, then apply these changes:

#### Change 1 — Add a generic `errorMessage` state alongside `error429`

```typescript
// Add near existing useState calls:
const [errorMessage, setErrorMessage] = useState<string | null>(null)
```

#### Change 2 — Expand the fetch error handling block (around line ~35–50)

Find the block that sets `error429`. Extend it to handle all non-ok responses:

```typescript
// BEFORE (approximate):
if (res.status === 429) {
  setError429(true)
  return
}

// AFTER:
if (res.status === 429) {
  setError429(true)
  setErrorMessage(null)
  return
}
if (!res.ok) {
  const body = await res.json().catch(() => ({}))
  setErrorMessage(
    body?.error?.message ??
    body?.message ??
    `Request failed (${res.status})`
  )
  return
}
setErrorMessage(null)
```

#### Change 3 — Display `errorMessage` in the result area

Find the 429 error banner (around line ~204–215). Add a sibling banner directly after it for `errorMessage`:

```tsx
{errorMessage && (
  <div className="mb-3 p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm">
    {errorMessage}
  </div>
)}
```

#### Change 4 — Clear errors on new submission

At the start of the submit handler (before the fetch call), reset both error states:
```typescript
setError429(false)
setErrorMessage(null)
```

---

## Verification Checklist

- [ ] `src/app/dashboard/billing/page.tsx` confirmed tracked in git (`git ls-files` returns the path)
- [ ] `/dashboard/billing` loads without 404 after redeploy
- [ ] Playground: submitting a query with no valid API key shows a human-readable error message (not blank, not "500")
- [ ] Playground: 429 response still shows the existing rate-limit message (regression test)
- [ ] Playground: successful query clears any previous error message
- [ ] No changes made to any file outside the 2 listed above
