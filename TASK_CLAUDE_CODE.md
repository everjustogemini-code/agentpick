# TASK_CLAUDE_CODE.md — cycle 22
**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-19
**QA baseline:** 62/62 — P0: none | P1: 2 open
**Source:** NEXT_VERSION.md — Must-Have #1 (P1-A, P1-B) + Must-Have #3 (Deliverable A backend, Deliverable B)
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Task 1 — P1-A: Add 308 redirect `/api/v1/developer/*` → `/api/v1/router/*`

**File:** `next.config.ts`

**What to do:**
In the `redirects()` array (currently lines 5–21), append a wildcard entry **after** the existing `/api/v1/developer/usage` redirect (after line 14):

```ts
{
  source: '/api/v1/developer/:path*',
  destination: '/api/v1/router/:path*',
  permanent: true,  // 308
},
```

**Also audit these files for any `/api/v1/developer/` references and replace with `/api/v1/router/`:**
- `README.md` (root)
- `sdk/README.md` (if exists)
- `sdk/src/client.ts`
- Any `.md` files under `docs/` if that directory exists

**Do NOT touch** `src/app/connect/page.tsx` for this task — that file is owned by TASK_CODEX.md.

**Acceptance:** `POST /api/v1/developer/register` returns 308 → follows to `/api/v1/router/register` → 200. No README or SDK source references the dead path.

---

## Task 2 — P1-B: Add Tavily API Pricing section to `/products/tavily`

**File:** `src/app/products/[slug]/page.tsx`

**What to do:**
Add a static pricing-comparison section that renders only when `slug === 'tavily'`. Place it after the existing benchmark data section (search for the last closing `</section>` or the footer in the JSX return, and insert before it).

Use a static data object inside the file:

```ts
const TAVILY_PRICING = [
  { tier: 'Free',       tavilyDirect: '$0',      viaAgentPick: '$0',      searches: '1,000' },
  { tier: 'Researcher', tavilyDirect: '$35/mo',  viaAgentPick: '~$38/mo', searches: '10,000' },
  { tier: 'Business',   tavilyDirect: '$200/mo', viaAgentPick: '~$212/mo', searches: '100,000' },
];
```

Render as a table with columns: **Tier | Searches/mo | Tavily Direct | Via AgentPick**.

Apply existing Tailwind classes already used in the file (glass card pattern: `rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm`).

Add a footer note inside the section:
```
* AgentPick routing fee added on top. † Estimate; data as of 2026-03-19 — verify current pricing at tavily.com.
```

**Do NOT** add this section for other slugs — guard with `{slug === 'tavily' && (…)}`.

**Acceptance:** `/products/tavily` renders pricing comparison table. QA 200 page-load test still passes.

---

## Task 3 — Must-Have #3 Deliverable A: Backend for `/quickstart` inline key generation

### 3a — New API route

**File to create:** `src/app/api/v1/quickstart/register/route.ts`

- `POST` handler accepting `{ email: string }`.
- Reuse the key-generation logic from `src/app/api/v1/router/register/route.ts` — read that file first and call the same Prisma/key-gen helper.
- Return `{ apiKey: string }` on success; `{ error: string }` with status 400/500 on failure.
- Basic email format validation (check for `@`); reject blank emails with 400.
- No rate limiting needed on this endpoint.

### 3b — Quickstart page server shell

**File to create:** `src/app/quickstart/page.tsx`

- Export `metadata` with `title: "Get started in 60 seconds · AgentPick"` and an appropriate description.
- Import `SiteHeader` from `@/components/SiteHeader`.
- Import a `QuickstartWizard` client component from `@/components/QuickstartWizard` (this component is created by Codex — just import it; do not implement it here).
- Render:
  ```tsx
  <div className="min-h-screen bg-[#0a0a0f]">
    <SiteHeader />
    <main className="mx-auto max-w-[680px] px-6 py-12">
      <h1 className="mb-2 text-[28px] font-bold text-white">Get your API key in 60 seconds</h1>
      <QuickstartWizard />
    </main>
  </div>
  ```

---

## Task 4 — Must-Have #3 Deliverable B: npm + PyPI SDK packages

### 4a — Node SDK (`sdk/` directory)

**Files to read then modify:**
- `sdk/package.json` — verify `"name": "agentpick"` is set; add `"publishConfig": { "access": "public" }` if missing; ensure `"main"`, `"module"`, and `"types"` fields point to `dist/` outputs.
- `sdk/src/index.ts` — read existing exports first. Ensure a top-level convenience function `search(query, options)` is exported that wraps `AgentPickClient.route('search', query, options)`. Add only if not already exported.

**File to create:** `sdk/README.md`
```markdown
# agentpick

Official Node.js SDK for [AgentPick](https://agentpick.dev).

## Install
\`\`\`
npm i agentpick
\`\`\`

## Usage
\`\`\`ts
import { AgentPickClient } from 'agentpick';
const client = new AgentPickClient({ apiKey: 'ah_live_sk_...' });
const result = await client.route('search', 'latest AI benchmarks 2026');
console.log(result.tool, result.latency_ms);
\`\`\`

See [agentpick.dev/quickstart](https://agentpick.dev/quickstart) for a full walkthrough.
```

### 4b — Python SDK (new package)

**Directory to create:** `sdk-python/`

Create these four files:

**`sdk-python/pyproject.toml`**
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "agentpick"
version = "0.1.0"
description = "Python SDK for AgentPick — AI-powered API routing"
readme = "README.md"
requires-python = ">=3.9"
dependencies = ["httpx>=0.27"]

[project.urls]
Homepage = "https://agentpick.dev/quickstart"
```

**`sdk-python/agentpick/__init__.py`**
```python
from .client import AgentPick

__all__ = ["AgentPick"]
```

**`sdk-python/agentpick/client.py`**
```python
import httpx

BASE_URL = "https://agentpick.dev"

class AgentPick:
    def __init__(self, api_key: str, base_url: str = BASE_URL):
        self.api_key = api_key
        self.base_url = base_url

    def search(self, query: str, **kwargs) -> dict:
        response = httpx.post(
            f"{self.base_url}/api/v1/route/search",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"query": query, **kwargs},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
```

**`sdk-python/README.md`**
```markdown
# agentpick (Python)

Official Python SDK for [AgentPick](https://agentpick.dev).

## Install
\`\`\`
pip install agentpick
\`\`\`

## Usage
\`\`\`python
from agentpick import AgentPick
ap = AgentPick(api_key="ah_live_sk_...")
result = ap.search("latest AI benchmarks 2026")
print(result)
\`\`\`

See [agentpick.dev/quickstart](https://agentpick.dev/quickstart) for a full walkthrough.
```

---

## Files This Task Owns (exhaustive)

| File | Action |
|------|--------|
| `next.config.ts` | Add `/api/v1/developer/:path*` → `/api/v1/router/:path*` 308 redirect |
| `README.md` | Audit + replace any `/api/v1/developer/` references |
| `src/app/products/[slug]/page.tsx` | Add TAVILY_PRICING table section (slug === 'tavily' guard) |
| `src/app/quickstart/page.tsx` | **CREATE** — page shell with metadata + QuickstartWizard import |
| `src/app/api/v1/quickstart/register/route.ts` | **CREATE** — POST handler for inline key generation |
| `sdk/package.json` | Verify/add publishConfig + dist field pointers |
| `sdk/src/index.ts` | Add top-level `search()` export if missing |
| `sdk/README.md` | **CREATE** — install + usage + quickstart link |
| `sdk-python/pyproject.toml` | **CREATE** |
| `sdk-python/agentpick/__init__.py` | **CREATE** |
| `sdk-python/agentpick/client.py` | **CREATE** |
| `sdk-python/README.md` | **CREATE** |

**Do NOT touch:** `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/connect/page.tsx`, `src/app/rankings/page.tsx`, or any component file under `src/components/`.

---

## Coverage: Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1 P1-A — `/api/v1/developer/*` 308 redirect | **This file** |
| Must-Have #1 P1-B — Tavily pricing table on `/products/tavily` | **This file** |
| Must-Have #2 — Glassmorphism UI overhaul | **TASK_CODEX.md** |
| Must-Have #3 Deliverable A — `/quickstart` page backend + shell | **This file** |
| Must-Have #3 Deliverable B — npm + PyPI packages | **This file** |
| Must-Have #3 Deliverable C — `/connect` tab upgrade | **TASK_CODEX.md** |

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] Cycle 22: P1-A redirect + P1-B Tavily pricing + quickstart backend + Python/Node SDK packages
```
