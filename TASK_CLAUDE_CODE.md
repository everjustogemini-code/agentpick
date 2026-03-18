# TASK_CLAUDE_CODE.md — Cycle 3
**Agent:** Claude Code (API / backend / QA script)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md Cycle 3

---

## Coverage Summary

| NEXT_VERSION.md Item | Task | Files |
|---|---|---|
| P1-A — Flatten `calls`/`cost_usd` in usage response | Add top-level aliases to usage route | `src/app/api/v1/router/usage/route.ts` |
| P1-A — Fix QA stub assertion | Replace hard-coded `True` with real assertion | `agentpick-router-qa.py` |
| P2 — 301 redirect `/api/v1/account` → `/api/v1/router/usage` | Create redirect route handler | `src/app/api/v1/account/route.ts` (new) |
| Item 3 — Quickstart API endpoint | Create `GET /api/v1/quickstart/[framework]` | `src/app/api/v1/quickstart/[framework]/route.ts` (new) |

---

## Files Owned by This Agent (Codex must NOT touch these)

| Action | File |
|---|---|
| **MODIFY** | `src/app/api/v1/router/usage/route.ts` |
| **MODIFY** | `agentpick-router-qa.py` |
| **CREATE** | `src/app/api/v1/account/route.ts` |
| **CREATE** | `src/app/api/v1/quickstart/[framework]/route.ts` |

> **DO NOT TOUCH** any file in Codex's list:
> `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`,
> `src/app/connect/page.tsx`, `src/app/quickstart/page.tsx`,
> arena/pricing component files under `src/components/`.

---

## Task 1 — P1-A (Backend): Add `calls` and `cost_usd` top-level aliases to usage response

**File:** `src/app/api/v1/router/usage/route.ts`

**Problem:** `GET /api/v1/router/usage` returns `callsThisMonth` and `stats.totalCostUsd` but the documented API contract requires top-level `calls` (int) and `cost_usd` (float). Client code using `data['calls']` or `data['cost_usd']` gets `undefined`.

**Actions:**
1. Read the file. Find the `NextResponse.json(...)` call that builds the response body.
2. Identify the variable holding the call count (likely `callsThisMonth` or similar) and the variable holding total cost (likely `stats.totalCostUsd` or similar).
3. Add two top-level alias fields **without removing** any existing fields (backwards-compatible):

```ts
return NextResponse.json({
  calls: callsThisMonth,          // NEW — integer, canonical field name
  cost_usd: stats.totalCostUsd,   // NEW — float, canonical field name
  callsThisMonth,                 // KEEP existing
  stats,                          // KEEP existing
  // ...all other existing fields unchanged
});
```

**Done when:** `GET /api/v1/router/usage` JSON body contains top-level `calls` (integer) and `cost_usd` (float) alongside all existing fields.

---

## Task 2 — P1-A (QA): Fix stub assertion in QA script

**File:** `agentpick-router-qa.py`

**Problem:** The QA script hard-codes `True` for the `calls`/`cost_usd` top-level check, so broken API responses silently pass the suite. The score shows 59/60 but this check is a lie.

**Actions:**
1. Read the file. Search for the test block that checks `/api/v1/router/usage` for `calls` and `cost_usd`.
2. Find the line(s) that unconditionally assign `result = True` or `passed = True` (or equivalent) instead of actually inspecting the response JSON.
3. Replace with a real assertion:

```python
data = response.json()
result = (
    isinstance(data.get('calls'), int) and
    isinstance(data.get('cost_usd'), (int, float))
)
```

4. Do not change any other QA checks.

**Done when:** The QA script actually validates `data['calls']` (int) and `data['cost_usd']` (float) exist at top-level. Running against the fixed backend → PASS; running against the old backend (without Task 1) → FAIL.

---

## Task 3 — P2: Add 301 redirect from `/api/v1/account` to `/api/v1/router/usage`

**File:** `src/app/api/v1/account/route.ts` **(new file — create the directory and file)**

**Problem:** Any docs or third-party guides referencing `/api/v1/account` return 404. The correct path is `/api/v1/router/usage`.

**Actions:**
1. Create directory `src/app/api/v1/account/` if it does not exist.
2. Create `route.ts` with a permanent redirect that also preserves query parameters:

```ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);
  return NextResponse.redirect(
    new URL('/api/v1/router/usage' + search, request.url),
    { status: 301 }
  );
}
```

**Done when:** `GET /api/v1/account` → HTTP 301 with `Location: /api/v1/router/usage`. `GET /api/v1/account?period=7d` → 301 with `Location: /api/v1/router/usage?period=7d`. Zero 404s from the account path.

---

## Task 4 — Item 3 (API): New `GET /api/v1/quickstart/[framework]` route

**File:** `src/app/api/v1/quickstart/[framework]/route.ts` **(new file — create the directory and file)**

**Actions:**
1. Create directory `src/app/api/v1/quickstart/[framework]/`.
2. Create `route.ts` with the following content (hard-coded payload map, no DB):

```ts
import { NextRequest, NextResponse } from 'next/server';

interface SnippetPayload {
  installCmd: string;
  codeSnippet: string;
  playgroundUrl: string;
}

const SNIPPETS: Record<string, SnippetPayload> = {
  langchain: {
    installCmd: 'pip install langchain agentpick',
    codeSnippet: `import os
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="https://agentpick.dev/v1",
    api_key=os.environ["AGENTPICK_API_KEY"],
    model="auto",
)
response = llm.invoke("Search the web for AI news")
print(response.content)`,
    playgroundUrl: '/playground?framework=langchain&query=search+the+web+for+AI+news',
  },
  crewai: {
    installCmd: 'pip install crewai agentpick',
    codeSnippet: `import os
from crewai import Agent, Task, Crew, LLM

llm = LLM(
    model="openai/auto",
    base_url="https://agentpick.dev/v1",
    api_key=os.environ["AGENTPICK_API_KEY"],
)
researcher = Agent(role="Researcher", goal="Find information",
                   llm=llm, backstory="Expert researcher")
task = Task(description="Research latest LLM benchmarks",
            agent=researcher, expected_output="Summary")
crew = Crew(agents=[researcher], tasks=[task])
result = crew.kickoff()`,
    playgroundUrl: '/playground?framework=crewai&query=research+latest+LLM+benchmarks',
  },
  autogen: {
    installCmd: 'pip install pyautogen agentpick',
    codeSnippet: `import os
from autogen import AssistantAgent

config_list = [{
    "model": "auto",
    "base_url": "https://agentpick.dev/v1",
    "api_key": os.environ["AGENTPICK_API_KEY"],
}]
assistant = AssistantAgent(
    name="assistant",
    llm_config={"config_list": config_list},
)
assistant.initiate_chat(assistant,
    message="Find top AI tools 2025", max_turns=1)`,
    playgroundUrl: '/playground?framework=autogen&query=find+top+AI+tools+2025',
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { framework: string } }
) {
  const key = params.framework.toLowerCase();
  const snippet = SNIPPETS[key];
  if (!snippet) {
    return NextResponse.json(
      { error: 'Unknown framework. Valid values: langchain, crewai, autogen' },
      { status: 404 }
    );
  }
  return NextResponse.json({ framework: key, ...snippet });
}
```

**Done when:**
- `GET /api/v1/quickstart/langchain` → 200 JSON with `framework`, `installCmd`, `codeSnippet`, `playgroundUrl`.
- `GET /api/v1/quickstart/crewai` → 200 JSON.
- `GET /api/v1/quickstart/autogen` → 200 JSON.
- `GET /api/v1/quickstart/unknown` → 404 JSON `{ "error": "..." }`.
- All 51 existing QA checks remain green.

---

## Verification Checklist

- [ ] `GET /api/v1/router/usage` — response body includes top-level `calls` (int) and `cost_usd` (float); all pre-existing fields still present
- [ ] `agentpick-router-qa.py` — no hard-coded `True` for calls/cost_usd check; assertion inspects actual JSON
- [ ] `GET /api/v1/account` → HTTP 301 → `/api/v1/router/usage`
- [ ] `GET /api/v1/account?period=7d` → HTTP 301 → `/api/v1/router/usage?period=7d`
- [ ] `GET /api/v1/quickstart/langchain` → 200 with all four fields
- [ ] `GET /api/v1/quickstart/crewai` → 200
- [ ] `GET /api/v1/quickstart/autogen` → 200
- [ ] `GET /api/v1/quickstart/unknown` → 404
- [ ] Zero files from Codex's list were modified

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] Cycle 3: usage route aliases, QA stub fix, /account 301 redirect, /api/v1/quickstart/[framework] route
```
